
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, ZoomIn, ZoomOut, Download, Users, Link as LinkIcon, UsersRound, UserSquare2, Group, Heart, Briefcase, PawPrint, Home, Brain } from "lucide-react"; 
import React, { useState, useCallback, useEffect } from 'react';
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
}

const CARD_WIDTH = 160; // Increased width for better text fit
const CARD_HEIGHT = 190; // Increased height for more content
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;


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
      case 'Pet': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', borderColor: 'hsl(var(--accent))' }; // Orange for pet
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


const RelationshipMapPlaceholder = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const samContact = mockContacts.find(c => c.id === '4'); // Sam Hendrickson
  if (!samContact) return <p>Central contact (Sam Hendrickson) not found.</p>;

  const V_SPACE_CARD = 40; // Increased vertical space between cards
  const H_SPACE_CARD_GROUP = 30; // Horizontal space between cards in a group (if side-by-side)
  const V_SPACE_LABEL_CARD = 20; // Space between label and first card
  const V_SPACE_GROUP = 60; // Space between distinct groups
  
  const X_POS_COL1 = 150;
  const X_POS_COL2 = X_POS_COL1 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP; // Adjusted X for central column
  const X_POS_COL3 = X_POS_COL2 + CARD_WIDTH + H_SPACE_CARD_GROUP + LABEL_WIDTH + H_SPACE_CARD_GROUP; // Adjusted X for right column


  const initialNodes: Node[] = [
    // Sam (Central)
    { id: samContact.id, contact: samContact, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT/2 }, // Centered more vertically

    // Column 1: Partner & Grandparents
    // Partner
    ...mockContacts.filter(c => c.id === 'emily_g').map(c => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD })),
    // Grandparents (Below Partner)
    ...mockContacts.filter(c => c.id === 'jim_e').map((c,i) => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + i * (CARD_HEIGHT + V_SPACE_CARD)})),
    ...mockContacts.filter(c => c.id === 'anne_e').map((c,i) => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (i+1) * (CARD_HEIGHT + V_SPACE_CARD)})), // i+1 to offset from Jim
    
    // Column 2 (Central Column): Parents & Pets
    // Parents (Above Sam)
    ...mockContacts.filter(c => c.id === 'john_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + LABEL_HEIGHT + V_SPACE_LABEL_CARD })),
    ...mockContacts.filter(c => c.id === 'sara_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + (CARD_HEIGHT + V_SPACE_CARD) })),
    // Pets (Below Sam)
    ...mockContacts.filter(c => c.id === 'alpine_d').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) })),
    ...mockContacts.filter(c => c.id === 'shula_d').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD)})),

    // Column 3: Sister & Uncles
    // Sister
    ...mockContacts.filter(c => c.id === 'greta_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD })),
    // Uncles (Below Sister)
    ...mockContacts.filter(c => c.id === 'philip_e').map((c,i) => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + i * (CARD_HEIGHT + V_SPACE_CARD) })),
    ...mockContacts.filter(c => c.id === 'ty_b').map((c,i) => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (i+1) * (CARD_HEIGHT + V_SPACE_CARD) })),
    ...mockContacts.filter(c => c.id === 'ryan_h').map((c,i) => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + (i+2) * (CARD_HEIGHT + V_SPACE_CARD) })),
  ].filter(Boolean) as Node[];


  const groupLabels: GroupLabel[] = [
    { text: "Partner", cx: X_POS_COL1, cy: 100 },
    { text: "Grandparents", cx: X_POS_COL1, cy: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
    
    { text: "Parents", cx: X_POS_COL2, cy: 20 },
    { text: "Pets", cx: X_POS_COL2, cy: 20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_CARD + CARD_HEIGHT + V_SPACE_GROUP },
    
    { text: "Sister", cx: X_POS_COL3, cy: 100 },
    { text: "Uncles", cx: X_POS_COL3, cy: 100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
  ];

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const svgElement = (e.currentTarget as SVGForeignObjectElement).ownerSVGElement;
    if (node && node.x != null && node.y != null && svgElement) { 
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
    
    const svgElement = e.currentTarget;
    const CTM = svgElement.getScreenCTM();
    if (CTM) {
        const svgPoint = svgElement.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const transformedPoint = svgPoint.matrixTransform(CTM.inverse());

        setNodes(prevNodes =>
        prevNodes.map(n =>
            n.id === draggingNode ? { ...n, x: transformedPoint.x - offset.x, y: transformedPoint.y - offset.y } : n
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
  
  const viewBoxWidth = Math.max(1000, X_POS_COL3 + CARD_WIDTH/2 + 50);
  const viewBoxHeight = Math.max(1250, 
    (100 + LABEL_HEIGHT + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT + V_SPACE_LABEL_CARD) + 3 * (CARD_HEIGHT + V_SPACE_CARD) + 50 // Estimate height for uncles column
  );


  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="100%" 
      className="border rounded-lg bg-muted/20 shadow-inner" 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Connection Lines */}
      {nodes.map(node => {
        if (node.id === samContact.id) return null; // Don't draw lines from Sam to himself
        
        // Find the group label this node might belong to (simplistic: based on x-coordinate)
        let parentGroupLabel: GroupLabel | undefined;
        if (Math.abs(node.x + CARD_WIDTH/2 - X_POS_COL1) < CARD_WIDTH) parentGroupLabel = groupLabels.find(gl => gl.cx === X_POS_COL1 && node.y > gl.cy);
        else if (Math.abs(node.x + CARD_WIDTH/2 - X_POS_COL2) < CARD_WIDTH && node.id !== samContact.id) parentGroupLabel = groupLabels.find(gl => gl.cx === X_POS_COL2 && node.y > gl.cy && node.y < samContact.y - CARD_HEIGHT/2 || node.y > samContact.y + CARD_HEIGHT/2); // Parents above, Pets below Sam
        else if (Math.abs(node.x + CARD_WIDTH/2 - X_POS_COL3) < CARD_WIDTH) parentGroupLabel = groupLabels.find(gl => gl.cx === X_POS_COL3 && node.y > gl.cy);

        let startX = samContact.x + CARD_WIDTH / 2;
        let startY = samContact.y + CARD_HEIGHT / 2;
        let endX = node.x + CARD_WIDTH / 2;
        let endY = node.y + CARD_HEIGHT / 2;

        // If connected to a group label, draw line from Sam to group label, then group label to node
        if (parentGroupLabel) {
          // Sam to Group Label
          const lineToLabelId = `line-sam-to-${parentGroupLabel.text.replace(/\s+/g, '-')}`;
          // Check if this line is already drawn (to avoid duplicates for multi-contact groups)
          if (!document.getElementById(lineToLabelId)) {
             // Line from Sam to the center of the group label
            const samToLabelStartX = samContact.x + CARD_WIDTH / 2;
            const samToLabelStartY = samContact.y + CARD_HEIGHT / 2;
            const samToLabelEndX = parentGroupLabel.cx;
            const samToLabelEndY = parentGroupLabel.cy;
            
            // Draw line from Sam to Group Label (only once per group)
             if (!document.getElementById(`line-sam-to-${parentGroupLabel.text.replace(/\s+/g, '-')}`)) {
              // Only draw if not already drawn for this group
              // (This simple check might not be robust enough for complex state updates)
              // A better approach might be to manage drawn lines in state.
             }
          }
          // Line from Group Label to Node
          startX = parentGroupLabel.cx;
          startY = parentGroupLabel.cy + LABEL_HEIGHT / 2; // From bottom-center of label
          endY = node.y; // To top-center of card
        }

        // Define marker for arrowhead
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--border))"/>
          </marker>
        </defs>
        
        // Line from Sam to Node (or Sam to Group, Group to Node)
         return (
          <line
            key={`line-${samContact.id}-to-${node.id}`}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="hsl(var(--border))"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        );
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
                y={LABEL_HEIGHT/2 + 5} // Adjusted for vertical centering
                fontFamily="sans-serif" 
                fontSize="13px" // Slightly smaller font for labels
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
  const [mapInstance, setMapInstance] = useState<SVGElement | null>(null);

  const handleDownloadSVG = () => {
    if (mapInstance) {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(mapInstance);
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
  
  useEffect(() => {
    const svgElement = document.getElementById('relationship-map-svg');
    if (svgElement) {
      setMapInstance(svgElement as SVGElement);
    }
  }, []);


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
                <Button variant="outline" size="icon" title="Zoom In (coming soon)" disabled><ZoomIn className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon" title="Zoom Out (coming soon)" disabled><ZoomOut className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon" title="Download SVG" onClick={handleDownloadSVG}><Download className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-grow shadow-md overflow-hidden bg-card rounded-lg border border-border">
          <CardContent className="p-4 h-full"> 
              <p className="text-xs text-muted-foreground mb-2 text-center sm:text-left">
                Hover over cards for quick info. Drag cards to reposition. Lines indicate connections to Sam.
              </p>
              <div className="h-[calc(100%-25px)] w-full"> 
                  <RelationshipMapPlaceholder />
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
                    <li>Lines connect Sam (central node) to other individuals or groups.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

