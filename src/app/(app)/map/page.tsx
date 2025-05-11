
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
  cx: number; // center x for the label group
  cy: number; // center y for the label group
  originalText: string; // To match relationship type/customLabel
}

// Define constants used for layout calculation here
const CARD_WIDTH = 160; 
const CARD_HEIGHT = 190; 
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;
const H_SPACE_CARD_GROUP = 30; 
const V_SPACE_CARD = 40; 
const V_SPACE_GROUP = 60; 
const V_SPACE_LABEL_CARD = 20; 


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

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-xl p-3 flex flex-col items-center justify-between border border-border" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <Avatar className="w-16 h-16 mb-2 border-2 border-muted">
        <AvatarImage src={contact.photoURL} alt={contact.name} data-ai-hint="profile avatar"/>
        <AvatarFallback className="bg-muted text-xl">{getInitials(contact.name)}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-sm text-center truncate w-full">{contact.name}</p>
      {contact.category && (
        <Badge 
            variant={getCategoryBadgeVariant(contact.category)} 
            style={getCategoryBadgeStyle(contact.category)}
            className="mt-1 text-xs"
        >
            {contact.category}
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


const RelationshipMapPlaceholder = ({ viewBox }: { viewBox: string }) => {
  const router = useRouter();
  
  const samContact = mockContacts.find(c => c.id === '4'); // Sam Hendrickson
  if (!samContact) return <p>Central contact (Sam Hendrickson) not found.</p>;
  
  const X_POS_COL1 = 150;
  const X_POS_COL2 = X_POS_COL1 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP; 
  const X_POS_COL3 = X_POS_COL2 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP; 


  const initialNodes: Node[] = [
    // Sam (Central)
    { id: samContact.id, contact: samContact, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT/2 }, 

    // Column 1: Partner & Grandparents
    { id: 'emily_g', contact: mockContacts.find(c=>c.id==='emily_g')!, x: X_POS_COL1 - CARD_WIDTH/2, y: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD },
    { id: 'jim_e', contact: mockContacts.find(c=>c.id==='jim_e')!, x: X_POS_COL1 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) },
    { id: 'anne_e', contact: mockContacts.find(c=>c.id==='anne_e')!, x: X_POS_COL1 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD)}, 
    
    // Column 2 (Central Column): Parents & Pets
    { id: 'john_h', contact: mockContacts.find(c=>c.id==='john_h')!, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + LABEL_HEIGHT + V_SPACE_LABEL_CARD },
    { id: 'sara_h', contact: mockContacts.find(c=>c.id==='sara_h')!, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + (CARD_HEIGHT + V_SPACE_CARD) },
    { id: 'alpine_d', contact: mockContacts.find(c=>c.id==='alpine_d')!, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) },
    { id: 'shula_d', contact: mockContacts.find(c=>c.id==='shula_d')!, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD)},

    // Column 3: Sister & Uncles
    { id: 'greta_h', contact: mockContacts.find(c=>c.id==='greta_h')!, x: X_POS_COL3 - CARD_WIDTH/2, y: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD },
    { id: 'philip_e', contact: mockContacts.find(c=>c.id==='philip_e')!, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) },
    { id: 'ty_b', contact: mockContacts.find(c=>c.id==='ty_b')!, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD) },
    { id: 'ryan_h', contact: mockContacts.find(c=>c.id==='ryan_h')!, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + 2 * (CARD_HEIGHT + V_SPACE_CARD) },
  ].filter(node => node.contact) as Node[]; 

  const groupLabels: GroupLabel[] = [
    { text: "Partner", originalText: "Partner (Emily Grenecer)", cx: X_POS_COL1, cy: 100 },
    { text: "Grandparents", originalText: "Grandparent", cx: X_POS_COL1, cy: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
    { text: "Parents", originalText: "Parent", cx: X_POS_COL2, cy: 20 },
    { text: "Pets", originalText: "Pet", cx: X_POS_COL2, cy: 20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP },
    { text: "Sister", originalText: "Sibling", cx: X_POS_COL3, cy: 100 },
    { text: "Uncles", originalText: "Uncle", cx: X_POS_COL3, cy: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
  ];


  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
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
  
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!draggingNode) return;
    
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
  }, [draggingNode, offset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);
  
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
      className="border rounded-lg bg-muted/20 shadow-inner" 
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

      {nodes.map(node => {
        if (node.id === samContact.id || !samNodeDetails) return null; 
        const samRelationship = samContact.relationships?.find(rel => rel.relatedContactId === node.id);
        const groupLabelText = samRelationship?.customLabel || samRelationship?.type;
        const parentGroupLabel = groupLabels.find(gl => 
          (groupLabelText && gl.originalText && groupLabelText.includes(gl.originalText)) || 
          groupLabelText === gl.text || 
          (gl.originalText === "Pet" && node.contact.category === "Pet") 
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

      {nodes.map(node => (
        <TooltipProvider key={node.id}>
          <Tooltip>
            <TooltipTrigger asChild>
                <foreignObject 
                    x={node.x} 
                    y={node.y} 
                    width={CARD_WIDTH} 
                    height={CARD_HEIGHT}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
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
              {node.contact.category && <p className="text-xs">Category: {node.contact.category}</p>}
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
    const X_POS_COL1 = 150;
    const X_POS_COL2 = X_POS_COL1 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP;
    const X_POS_COL3 = X_POS_COL2 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP;

    const width = Math.max(1000, X_POS_COL3 + CARD_WIDTH / 2 + 50);
    const height = Math.max(1250,
      (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + 3 * (CARD_HEIGHT + V_SPACE_CARD) + 50
    );
    return { width, height };
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
      
      newScale = Math.max(0.2, Math.min(newScale, 5)); // Clamp scale

      if (newScale === oldScale) return oldScale; // No change if clamped to current

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
                Hover over cards for quick info. Drag cards to reposition. Lines indicate connections.
              </p>
              <div className="h-[calc(100%-25px)] w-full"> 
                  <RelationshipMapPlaceholder viewBox={currentViewBoxString} />
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

