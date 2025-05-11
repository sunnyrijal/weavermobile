"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, ZoomIn, ZoomOut, Download, Users, Link as LinkIcon, UsersRound, UserSquare2, Group, Heart, Briefcase, PawPrint } from "lucide-react"; 
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

const CARD_WIDTH = 160;
const CARD_HEIGHT = 190; 
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;


const RelationshipMapCard = ({ contact, onButtonClick }: { contact: Contact; onButtonClick: (contactId: string) => void; }) => {
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
  
  const getCategoryBadgeTextColor = (category?: string): string => {
     switch (category) {
      case 'Family': return 'text-primary-foreground';
      case 'Partner': return 'text-destructive-foreground';
      case 'Friend': return 'text-accent-foreground'; 
      case 'Pet': return 'text-accent-foreground';
      case 'Colleague': return 'text-secondary-foreground';
      default: return 'text-foreground';
    }
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-xl p-3 flex flex-col items-center justify-between" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <Avatar className="w-16 h-16 mb-2 border-2 border-gray-700">
        <AvatarImage src={contact.photoURL} alt={contact.name} data-ai-hint="profile avatar"/>
        <AvatarFallback className="bg-gray-600 text-xl">{getInitials(contact.name)}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-sm text-center truncate w-full">{contact.name}</p>
      {contact.category && (
        <Badge 
            variant={getCategoryBadgeVariant(contact.category)} 
            className={`mt-1 text-xs ${getCategoryBadgeTextColor(contact.category)} 
            ${contact.category === 'Family' ? 'bg-blue-500 border-blue-500' : ''}
            ${contact.category === 'Pet' ? 'bg-orange-500 border-orange-500' : ''}
            ${contact.category === 'Friend' ? 'bg-green-500 border-green-500' : ''}
            ${contact.category === 'Partner' ? 'bg-red-500 border-red-500' : ''}
            `}
        >
            {contact.category}
        </Badge>
      )}
      <p className="text-xs text-gray-400 mt-1 text-center truncate w-full">
        {contact.occupation || contact.college || contact.locationDetails || 'N/A'}
      </p>
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-2 w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-white text-xs"
        onClick={() => onButtonClick(contact.id)}
      >
        View Profile
      </Button>
    </div>
  );
};


const RelationshipMapPlaceholder = () => {
  const router = useRouter();
  
  const samContact = mockContacts.find(c => c.id === '4'); // Sam Hendrickson
  if (!samContact) return <p>Central contact (Sam Hendrickson) not found.</p>;

  const V_SPACE_CARD = 30; 
  const V_SPACE_LABEL_CARD = 15; 
  const V_SPACE_GROUP = 50; 
  
  const X_POS_COL1 = 150;
  const X_POS_COL2 = 500;
  const X_POS_COL3 = 850;

  const initialNodes: Node[] = [
    // Sam (Central)
    { id: samContact.id, contact: samContact, x: X_POS_COL2 - CARD_WIDTH/2, y: 20 },

    // Column 1: Partner & Extended Family (Uncles)
    // Partner
    ...mockContacts.filter(c => c.id === 'emily_g').map(c => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: 150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD })),
    // Extended Family (Uncles)
    ...mockContacts.filter(c => c.id === 'philip_e').map(c => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: (150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) })),
    ...mockContacts.filter(c => c.id === 'ty_b').map(c => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: (150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD) })),
    ...mockContacts.filter(c => c.id === 'ryan_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL1 - CARD_WIDTH/2, y: (150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD)*2 })),
    
    // Column 2: Parents & Pets
    // Parents
    ...mockContacts.filter(c => c.id === 'john_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) })),
    ...mockContacts.filter(c => c.id === 'sara_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD) })),
    // Pets
    ...mockContacts.filter(c => c.id === 'alpine_d').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + (CARD_HEIGHT + V_SPACE_CARD) + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) })),
    ...mockContacts.filter(c => c.id === 'shula_d').map(c => ({ id: c.id, contact: c, x: X_POS_COL2 - CARD_WIDTH/2, y: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + (CARD_HEIGHT + V_SPACE_CARD) + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD) })),

    // Column 3: Siblings & Extended Family (Grandparents)
    // Siblings
    ...mockContacts.filter(c => c.id === 'greta_h').map(c => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: 150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD })),
    // Extended Family (Grandparents)
    ...mockContacts.filter(c => c.id === 'jim_e').map(c => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: (150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) })),
    ...mockContacts.filter(c => c.id === 'anne_e').map(c => ({ id: c.id, contact: c, x: X_POS_COL3 - CARD_WIDTH/2, y: (150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD) + (CARD_HEIGHT + V_SPACE_CARD) })),
  ].filter(Boolean) as Node[];


  const groupLabels: GroupLabel[] = [
    { text: "Partner", cx: X_POS_COL1, cy: 150 },
    { text: "Extended Family", cx: X_POS_COL1, cy: 150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
    { text: "Parents", cx: X_POS_COL2, cy: 20 + CARD_HEIGHT + V_SPACE_GROUP },
    { text: "Pets", cx: X_POS_COL2, cy: (20 + CARD_HEIGHT + V_SPACE_GROUP + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + (CARD_HEIGHT + V_SPACE_CARD) + CARD_HEIGHT + V_SPACE_GROUP) },
    { text: "Siblings", cx: X_POS_COL3, cy: 150 },
    { text: "Grandparents", cx: X_POS_COL3, cy: 150 + LABEL_HEIGHT/2 + V_SPACE_LABEL_CARD + CARD_HEIGHT + V_SPACE_GROUP },
  ];

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const svgElement = (e.currentTarget as SVGForeignObjectElement).ownerSVGElement;
    if (node && node.x != null && node.y != null && svgElement) { // Check for null/undefined
      const CTM = svgElement.getScreenCTM();
      if (CTM) {
        const svgPoint = svgElement.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const transformedPoint = svgPoint.matrixTransform(CTM.inverse());
        setOffset({ x: transformedPoint.x - node.x, y: transformedPoint.y - node.y });
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
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
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };
  
  const handleViewProfileClick = (contactId: string) => {
     router.push(`/contacts/${contactId}`);
  };
  
  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="100%" 
      className="border rounded-lg bg-muted/30 shadow-sm" 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox="0 0 1000 1250" 
      preserveAspectRatio="xMidYMid meet"
    >
      {groupLabels.map(label => (
        <g key={label.text} transform={`translate(${label.cx}, ${label.cy})`}>
            <rect 
                x={-LABEL_WIDTH/2} 
                y={-LABEL_HEIGHT/2} 
                width={LABEL_WIDTH} 
                height={LABEL_HEIGHT} 
                rx="8" // Rounded corners for label
                fill="var(--colors-accent)" // Use accent color from theme (Soft Coral)
            />
            <text 
                x="0" 
                y="5" // Adjust for vertical centering
                fontFamily="sans-serif" 
                fontSize="14" 
                fill="var(--colors-accent-foreground)" // White text
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
                    className="active:cursor-grabbing cursor-grab"
                >
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full"> 
                        <RelationshipMapCard contact={node.contact} onButtonClick={handleViewProfileClick} />
                    </div>
                </foreignObject>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-white border-gray-700">
              <p className="font-semibold">{node.contact.name}</p>
              {node.contact.occupation && <p className="text-xs">Occupation: {node.contact.occupation}</p>}
              {node.contact.category && <p className="text-xs">Category: {node.contact.category}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </svg>
  );
};


export default function RelationshipMapPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-md bg-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
                <Share2 className="text-primary" /> Interactive Relationship Map
              </CardTitle>
              <CardDescription className="text-muted-foreground">Visualize and explore your network connections. (Example: Sam Hendrickson's Network)</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon"><ZoomIn className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon"><ZoomOut className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon"><Download className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-grow shadow-md overflow-hidden bg-card">
          <CardContent className="p-4 h-full"> {/* Ensure height for SVG container */}
              <p className="text-sm text-muted-foreground mb-2">
                Hover over cards for quick info. Drag cards to reposition.
              </p>
              <div className="h-[calc(100%-30px)] w-full"> 
                  <RelationshipMapPlaceholder />
              </div>
          </CardContent>
      </div>

      <Card className="shadow-md bg-card">
        <CardHeader>
            <CardTitle className="text-lg text-foreground">Map Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="space-y-1">
                <p className="font-medium mb-1 text-foreground">Node Types:</p>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center p-1">
                        <UserSquare2 className="w-6 h-6 text-white"/>
                    </div> 
                    <span className="text-muted-foreground">Contact Card</span>
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold">Group Label</div>
                    <span className="text-muted-foreground">Relationship Group</span>
                </div>
            </div>
            <div className="md:ml-auto">
                <p className="font-medium mb-1 text-foreground">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>Drag cards to reposition them.</li>
                    <li>Hover for quick info.</li>
                    <li>Click "View Profile" on a card to see details.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

