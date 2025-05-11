
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, ZoomIn, ZoomOut, Download, Users, Link as LinkIcon, UsersRound, UserSquare2, Group, Heart, Briefcase, PawPrint, Home, Brain } from "lucide-react"; 
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockContacts } from "@/lib/mockData";
import type { Contact } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  contact: Contact; 
  x: number;
  y: number;
}

interface GroupLabel {
  text: string;
  cx: number; // center x for the label
  cy: number; // center y for the label
  originalText: string; // To match relationship type/customLabel
}

// Layout Constants
const CARD_WIDTH = 160; 
const CARD_HEIGHT = 190; 
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;

const Y_OFFSET_TOP = 50;
const V_SPACE_LABEL_CARD = 20;
const V_SPACE_CARD = 40; // Vertical space between stacked cards in the same logical group (e.g. Ryan below Philip/Ty)
const V_SPACE_BETWEEN_ROWS = 80; // Vertical space between distinct groups/rows of cards

const COL1_X = 280; 
const COL2_X = 600; 
const COL3_X = 920; 

const H_SPACING_BETWEEN_PAIRED_CARDS = 30;

const SVG_PADDING_HORIZONTAL = 50;
const SVG_PADDING_VERTICAL = 50;

// Calculate Y positions for rows
const Y_ROW1_LABEL_CY = Y_OFFSET_TOP + LABEL_HEIGHT / 2;
const Y_ROW1_CARD_Y = Y_OFFSET_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;

const Y_SAM_Y = Y_ROW1_CARD_Y + CARD_HEIGHT + V_SPACE_BETWEEN_ROWS; 

const Y_ROW2_LABEL_Y_TOP = Y_SAM_Y; 
const Y_ROW2_LABEL_CY = Y_ROW2_LABEL_Y_TOP + LABEL_HEIGHT / 2;
const Y_ROW2_CARD_Y = Y_ROW2_LABEL_Y_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;


const Y_ROW3_LABEL_Y_TOP = Math.max(Y_SAM_Y + CARD_HEIGHT, Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_CARD) + V_SPACE_BETWEEN_ROWS; 
const Y_ROW3_LABEL_CY = Y_ROW3_LABEL_Y_TOP + LABEL_HEIGHT / 2;
const Y_ROW3_CARD_Y_VAL = Y_ROW3_LABEL_Y_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;


const getPetTypeFromTags = (tags?: string[]): string => {
  if (!tags || tags.length === 0) return "Pet";
  const commonPetTypes = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster", "Guinea Pig"];
  for (const tag of tags) {
    if (commonPetTypes.includes(tag)) {
      return tag;
    }
  }
  return "Pet"; 
};

const RelationshipMapCard = React.memo(({ contact, onButtonClick }: { contact: Contact; onButtonClick: (contactId: string) => void; }) => {
  const getInitials = (name: string) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCategoryBadgeVariant = (category?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case 'Family': return 'default'; 
      case 'Partner': return 'destructive'; 
      case 'Friend': return 'secondary'; 
      case 'Pet': return 'outline'; 
      case 'Colleague': return 'secondary';
      default: return 'outline';
    }
  };
  
  const getCategoryBadgeStyle = (category?: string): React.CSSProperties => {
     switch (category) {
      case 'Family': return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' };
      case 'Partner': return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', borderColor: 'hsl(var(--destructive))' };
      case 'Friend': return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', borderColor: 'hsl(var(--secondary))' };
      case 'Pet': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', borderColor: 'hsl(var(--accent))' }; 
      default: return {};
    }
  }

  const badgeText = contact.category === 'Pet' ? getPetTypeFromTags(contact.tags) : contact.category;

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-xl p-3 flex flex-col items-center justify-between border border-border" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <Avatar className="w-16 h-16 mb-2 border-2 border-muted">
        <AvatarImage src={contact.photoURL} alt={contact.name} data-ai-hint="profile avatar"/>
        <AvatarFallback className="bg-muted text-xl">{getInitials(contact.name)}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-sm text-center truncate w-full">{contact.name}</p>
      {badgeText && (
        <Badge 
            variant={getCategoryBadgeVariant(contact.category)} 
            style={getCategoryBadgeStyle(contact.category)}
            className="mt-1 text-xs"
        >
            {badgeText}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full">
        {contact.occupation || contact.college || contact.locationDetails || 'N/A'}
      </p>
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-2 w-full text-xs"
        onClick={() => onButtonClick(contact.id)}
      >
        View Profile
      </Button>
    </div>
  );
});
RelationshipMapCard.displayName = 'RelationshipMapCard';


interface RelationshipMapPlaceholderProps {
  viewBox: string;
  scale: number;
  currentViewBoxOrigin: { x: number; y: number };
  onViewBoxOriginChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const RelationshipMapPlaceholder: React.FC<RelationshipMapPlaceholderProps> = ({ viewBox, scale, currentViewBoxOrigin, onViewBoxOriginChange }) => {
  const router = useRouter();
  
  const samContact = mockContacts.find(c => c.id === '4'); 
  if (!samContact) return <p>Central contact (Sam Hendrickson) not found.</p>;
  
  const groupLabels: GroupLabel[] = [
    { text: "Partner", originalText: "Partner", cx: COL1_X, cy: Y_ROW1_LABEL_CY },
    { text: "Parents", originalText: "Parent", cx: COL2_X, cy: Y_ROW1_LABEL_CY },
    { text: "Sister", originalText: "Sibling", cx: COL3_X, cy: Y_ROW1_LABEL_CY },
    { text: "Grandparents", originalText: "Grandparent", cx: COL1_X, cy: Y_ROW2_LABEL_CY },
    { text: "Uncles", originalText: "Uncle", cx: COL3_X, cy: Y_ROW2_LABEL_CY },
    { text: "Pets", originalText: "Pet", cx: COL2_X, cy: Y_ROW3_LABEL_CY },
  ];

  const initialNodes: Node[] = [
    { id: samContact.id, contact: samContact, x: COL2_X - CARD_WIDTH/2, y: Y_SAM_Y }, 
    { id: 'emily_g', contact: mockContacts.find(c=>c.id==='emily_g')!, x: COL1_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },
    { id: 'john_h', contact: mockContacts.find(c=>c.id==='john_h')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },
    { id: 'sara_h', contact: mockContacts.find(c=>c.id==='sara_h')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },
    { id: 'greta_h', contact: mockContacts.find(c=>c.id==='greta_h')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },
    { id: 'anne_e', contact: mockContacts.find(c=>c.id==='anne_e')!, x: COL1_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
    { id: 'jim_e', contact: mockContacts.find(c=>c.id==='jim_e')!, x: COL1_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
    { id: 'philip_e', contact: mockContacts.find(c=>c.id==='philip_e')!, x: COL3_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
    { id: 'ty_b', contact: mockContacts.find(c=>c.id==='ty_b')!, x: COL3_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
    { id: 'ryan_h', contact: mockContacts.find(c=>c.id==='ryan_h')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_CARD }, 
    { id: 'alpine_d', contact: mockContacts.find(c=>c.id==='alpine_d')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
    { id: 'shula_d', contact: mockContacts.find(c=>c.id==='shula_d')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
  ].filter(node => node.contact) as Node[]; 


  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStartCoords, setPanStartCoords] = useState<{ clientX: number, clientY: number } | null>(null);
  const [viewBoxOriginAtPanStart, setViewBoxOriginAtPanStart] = useState<{ x: number, y: number } | null>(null);


  const handleNodeMouseDown = useCallback((e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const svgElement = svgRef.current;
    if (node && typeof node.x === 'number' && typeof node.y === 'number' && svgElement) { 
      const CTM = svgElement.getScreenCTM();
      if (CTM) {
        const svgPoint = svgElement.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const transformedPoint = svgPoint.matrixTransform(CTM.inverse());
        setOffset({ x: transformedPoint.x - node.x, y: transformedPoint.y - node.y });
      }
    }
  }, [nodes]);
  
  const handleBackgroundMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.target === svgRef.current) { 
      e.preventDefault();
      setIsPanning(true);
      setPanStartCoords({ clientX: e.clientX, clientY: e.clientY });
      setViewBoxOriginAtPanStart(currentViewBoxOrigin);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isPanning && panStartCoords && viewBoxOriginAtPanStart) {
      e.preventDefault();
      const dx = e.clientX - panStartCoords.clientX;
      const dy = e.clientY - panStartCoords.clientY;
      onViewBoxOriginChange({
        x: viewBoxOriginAtPanStart.x - (dx / scale),
        y: viewBoxOriginAtPanStart.y - (dy / scale),
      });
    } else if (draggingNode) {
      const svgElement = svgRef.current;
      if (!svgElement) return;
      const CTM = svgElement.getScreenCTM();
      if (CTM) {
          const svgPoint = svgElement.createSVGPoint();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const transformedPoint = svgPoint.matrixTransform(CTM.inverse());
          setNodes(prevNodes =>
            prevNodes.map(n =>
                n.id === draggingNode && typeof offset.x === 'number' && typeof offset.y === 'number'
                 ? { ...n, x: transformedPoint.x - offset.x, y: transformedPoint.y - offset.y } 
                 : n
            )
          );
      }
    }
  }, [isPanning, panStartCoords, viewBoxOriginAtPanStart, scale, onViewBoxOriginChange, draggingNode, offset]);


  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStartCoords(null);
      setViewBoxOriginAtPanStart(null);
    }
    if (draggingNode) {
      setDraggingNode(null);
    }
  }, [isPanning, draggingNode]);
  
  const handleViewProfileClick = useCallback((contactId: string) => {
     router.push(`/contacts/${contactId}`);
  },[router]);
  
  const samNodeDetails = nodes.find(n => n.id === samContact.id);


  return (
    <svg 
      id="relationship-map-svg"
      ref={svgRef}
      width="100%" 
      height="100%" 
      className={cn(
        "border rounded-lg bg-muted/20 shadow-inner",
        isPanning ? "cursor-grabbing" : "cursor-grab" 
      )}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" fill="hsl(var(--border))">
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>

      {/* Lines from Sam to Group Labels */}
      {samNodeDetails && groupLabels.map(label => (
        <line
          key={`line-sam-to-group-${label.text.replace(/\s+/g, '-')}`}
          x1={samNodeDetails.x + CARD_WIDTH / 2}
          y1={samNodeDetails.y + CARD_HEIGHT / 2}
          x2={label.cx}
          y2={label.cy}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      ))}

      {/* Lines from Group Labels to Nodes */}
      {nodes.map(node => {
        if (node.id === samContact.id || !samNodeDetails) return null; 
        
        const samRelationship = samContact.relationships?.find(rel => rel.relatedContactId === node.id);
        let groupLabelText = samRelationship?.customLabel || samRelationship?.type;

        if (node.contact.category === "Pet" && !groupLabelText) {
            groupLabelText = "Pet";
        }
        
        const parentGroupLabel = groupLabels.find(gl => 
          (groupLabelText && gl.originalText && groupLabelText.includes(gl.originalText)) || 
          groupLabelText === gl.text ||
          (gl.originalText === "Pet" && groupLabelText === "Pet")
        );

        if (parentGroupLabel) {
          return (
            <line
              key={`line-group-${parentGroupLabel.text.replace(/\s+/g, '-')}-to-${node.id}`}
              x1={parentGroupLabel.cx}
              y1={parentGroupLabel.cy + LABEL_HEIGHT / 2} 
              x2={node.x + CARD_WIDTH / 2}              
              y2={node.y}                                
              stroke="hsl(var(--border))"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        }
        return null;
      })}


      {/* Group Labels */}
      {groupLabels.map(label => (
        <g key={label.text} transform={`translate(${label.cx - LABEL_WIDTH/2}, ${label.cy - LABEL_HEIGHT/2})`}>
            <rect 
                x="0"
                y="0"
                width={LABEL_WIDTH} 
                height={LABEL_HEIGHT} 
                rx="8" 
                fill="hsl(var(--accent))" 
            />
            <text 
                x={LABEL_WIDTH/2} 
                y={LABEL_HEIGHT/2 + 5} 
                fontFamily="sans-serif" 
                fontSize="13px" 
                fill="hsl(var(--accent-foreground))" 
                textAnchor="middle"
                fontWeight="bold"
            >
                {label.text}
            </text>
        </g>
      ))}

      {/* Nodes (Contact Cards) */}
      {nodes.map(node => (
        <TooltipProvider key={node.id}>
          <Tooltip>
            <TooltipTrigger asChild>
                <foreignObject 
                    x={node.x} 
                    y={node.y} 
                    width={CARD_WIDTH} 
                    height={CARD_HEIGHT}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    className={cn("active:cursor-grabbing cursor-grab transition-all duration-100 ease-in-out", draggingNode === node.id ? "scale-105 shadow-2xl" : "")}
                >
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full p-1"> 
                        <RelationshipMapCard contact={node.contact} onButtonClick={handleViewProfileClick} />
                    </div>
                </foreignObject>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border shadow-lg rounded-md p-2">
              <p className="font-semibold text-sm">{node.contact.name}</p>
              {node.contact.occupation && <p className="text-xs">Occupation: {node.contact.occupation}</p>}
              {node.contact.category && <p className="text-xs">Category: {node.contact.category === 'Pet' ? getPetTypeFromTags(node.contact.tags) : node.contact.category}</p>}
              {node.contact.locationDetails && <p className="text-xs">Location: {node.contact.locationDetails}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </svg>
  );
};


export default function RelationshipMapPage() {
  const [scale, setScale] = useState(1);
  const [viewBoxOrigin, setViewBoxOrigin] = useState({ x: 0, y: 0 });
  const ZOOM_FACTOR = 1.2;

  const initialViewBoxDimensions = useMemo(() => {
    const maxX = Math.max(
      COL1_X + CARD_WIDTH/2 + H_SPACING_BETWEEN_PAIRED_CARDS/2, 
      COL2_X + CARD_WIDTH/2 + H_SPACING_BETWEEN_PAIRED_CARDS/2, 
      COL3_X + CARD_WIDTH/2 + H_SPACING_BETWEEN_PAIRED_CARDS/2,
      COL3_X - CARD_WIDTH/2 + CARD_WIDTH 
    );
    const maxY = Math.max(
        Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT, 
        Y_ROW3_CARD_Y_VAL + CARD_HEIGHT 
    ); 
    
    const width = maxX + SVG_PADDING_HORIZONTAL * 2; 
    const height = maxY + SVG_PADDING_VERTICAL * 2; 
    return { width: Math.max(1200, width), height: Math.max(1100, height) }; 
  }, []);

  const currentViewBoxString = useMemo(() => {
    const currentWidth = initialViewBoxDimensions.width / scale;
    const currentHeight = initialViewBoxDimensions.height / scale;
    return `${viewBoxOrigin.x} ${viewBoxOrigin.y} ${currentWidth} ${currentHeight}`;
  }, [scale, viewBoxOrigin, initialViewBoxDimensions]);

 const handleZoom = (direction: 'in' | 'out') => {
    setScale(prevScale => {
      const oldScale = prevScale;
      let newScale = direction === 'in' ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR;
      
      newScale = Math.max(0.1, Math.min(newScale, 5)); 

      if (newScale === oldScale) return oldScale; 

      const oldWidth = initialViewBoxDimensions.width / oldScale;
      const oldHeight = initialViewBoxDimensions.height / oldScale;
      const newWidth = initialViewBoxDimensions.width / newScale;
      const newHeight = initialViewBoxDimensions.height / newScale;

      setViewBoxOrigin(prevOrigin => ({
        x: prevOrigin.x + (oldWidth - newWidth) / 2,
        y: prevOrigin.y + (oldHeight - newHeight) / 2,
      }));
      
      return newScale;
    });
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById('relationship-map-svg');
    if (svgElement) {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgElement);
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relationship-map.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-md bg-card flex-shrink-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
                <Brain className="text-primary" /> Interactive Relationship Map
              </CardTitle>
              <CardDescription className="text-muted-foreground">Visualize and explore connections. (Example: Sam Hendrickson's Network)</CardDescription>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
                <Button variant="outline" size="icon" title="Zoom In" onClick={() => handleZoom('in')}><ZoomIn className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon" title="Zoom Out" onClick={() => handleZoom('out')}><ZoomOut className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon" title="Download SVG" onClick={handleDownloadSVG}><Download className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-grow shadow-md overflow-hidden bg-card rounded-lg border border-border">
          <CardContent className="p-4 h-full"> 
              <p className="text-xs text-muted-foreground mb-2 text-center sm:text-left">
                Hover over cards for quick info. Drag cards to reposition. Drag background to pan. Lines indicate connections.
              </p>
              <div className="h-[calc(100%-25px)] w-full"> 
                  <RelationshipMapPlaceholder 
                    viewBox={currentViewBoxString} 
                    scale={scale}
                    currentViewBoxOrigin={viewBoxOrigin}
                    onViewBoxOriginChange={setViewBoxOrigin}
                  />
              </div>
          </CardContent>
      </div>

      <Card className="shadow-md bg-card flex-shrink-0">
        <CardHeader>
            <CardTitle className="text-lg text-foreground">Map Legend & Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="space-y-2">
                <p className="font-medium mb-1 text-foreground">Node Types:</p>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center p-1 shadow-sm">
                        <UserSquare2 className="w-6 h-6 text-primary"/>
                    </div> 
                    <span className="text-muted-foreground">Contact Card</span>
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold shadow-sm">Group Label</div>
                    <span className="text-muted-foreground">Relationship Group (e.g., Parents, Pets)</span>
                </div>
            </div>
            <div className="md:ml-auto space-y-2">
                <p className="font-medium mb-1 text-foreground">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Drag cards to reposition them on the map.</li>
                    <li>Drag the background to pan the map view.</li>
                    <li>Hover over a contact card for quick information.</li>
                    <li>Click "View Profile" on a card to navigate to the contact's detail page.</li>
                    <li>Lines connect Sam (central node) to group labels, and group labels to individuals.</li>
                    <li>Use Zoom In/Out buttons to adjust map scale.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
