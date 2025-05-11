
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, ZoomIn, ZoomOut, Download, Users, Heart, Briefcase, PawPrint, Link as LinkIcon } from "lucide-react"; 
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockContacts } from "@/lib/mockData";
import type { Contact } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  contact: Contact; // Store the full contact object
  x: number;
  y: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'Family' | 'Partner' | 'Friend' | 'Pet' | 'Colleague' | 'Other';
}

const CARD_WIDTH = 160;
const CARD_HEIGHT = 190; // Adjusted for more content

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
      case 'Family': return 'default'; // Blueish in dark theme due to primary
      case 'Partner': return 'destructive'; // Reddish
      case 'Friend': return 'secondary'; // greenish/tealish with accent
      case 'Pet': return 'outline'; // orange-ish with ring/accent
      case 'Colleague': return 'secondary';
      default: return 'outline';
    }
  };
  
  // Define specific text colors for badges for better contrast on dark cards
  const getCategoryBadgeTextColor = (category?: string): string => {
     switch (category) {
      case 'Family': return 'text-primary-foreground';
      case 'Partner': return 'text-destructive-foreground';
      case 'Friend': return 'text-accent-foreground'; // Assuming accent is light
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
  const { toast } = useToast();

  const samContact = mockContacts.find(c => c.id === '4'); // Sam Hendrickson
  if (!samContact) return <p>Central contact (Sam Hendrickson) not found.</p>;

  const initialNodes: Node[] = [
    { id: samContact.id, contact: samContact, x: 400, y: 300 },
    // Partner
    ...mockContacts.filter(c => c.id === 'emily_g').map(c => ({ id: c.id, contact: c, x: 400, y: 100 })),
    // Pets
    ...mockContacts.filter(c => c.id === 'shula_d').map(c => ({ id: c.id, contact: c, x: 200, y: 500 })),
    ...mockContacts.filter(c => c.id === 'alpine_d').map(c => ({ id: c.id, contact: c, x: 380, y: 500 })),
    // Parents
    ...mockContacts.filter(c => c.id === 'sara_h').map(c => ({ id: c.id, contact: c, x: 100, y: 200 })),
    ...mockContacts.filter(c => c.id === 'john_h').map(c => ({ id: c.id, contact: c, x: 100, y: 400 })),
    // Sister
    ...mockContacts.filter(c => c.id === 'greta_h').map(c => ({ id: c.id, contact: c, x: 400, y: 500 })), // Near Pets visually
    // Grandparents
    ...mockContacts.filter(c => c.id === 'anne_e').map(c => ({ id: c.id, contact: c, x: 700, y: 100 })),
    ...mockContacts.filter(c => c.id === 'jim_e').map(c => ({ id: c.id, contact: c, x: 700, y: 300 })),
    // Uncles
    ...mockContacts.filter(c => c.id === 'philip_e').map(c => ({ id: c.id, contact: c, x: 600, y: 500 })),
    ...mockContacts.filter(c => c.id === 'ty_b').map(c => ({ id: c.id, contact: c, x: 780, y: 500 })),
    ...mockContacts.filter(c => c.id === 'ryan_h').map(c => ({ id: c.id, contact: c, x: 960, y_original_idea: 500, x: 700, y: 500 })), // Adjusted x,y for unique position
  ].filter((node, index, self) => node && self.findIndex(n => n.id === node.id) === index) // Remove undefined and duplicates
   .map((node, index, arr) => { // Ensure unique X, Y for uncles if they ended up same
      if (node.contact.category === 'Family' && node.contact.tags?.includes('Uncle')) {
          const uncleIndex = arr.filter(n => n.contact.category === 'Family' && n.contact.tags?.includes('Uncle')).findIndex(u => u.id === node.id);
          return {...node, x: 600 + uncleIndex * (CARD_WIDTH + 50) , y: 500 };
      }
      return node;
   })
   // Adjust Greta's position
    .map(node => node.id === 'greta_h' ? { ...node, x: 220, y: 300 } : node);


  const initialEdges: Edge[] = samContact.relationships
    .map(rel => {
        const targetContact = mockContacts.find(c => c.id === rel.relatedContactId);
        if (!targetContact) return null;
        
        let type: Edge['type'] = 'Other';
        if (targetContact.category === 'Family' || rel.type === 'Parent' || rel.type === 'Sibling' || rel.type === 'Grandparent' || rel.type === 'Uncle') type = 'Family';
        else if (targetContact.category === 'Partner' || rel.type === 'Partner') type = 'Partner';
        else if (targetContact.category === 'Friend' || rel.type === 'Friend') type = 'Friend';
        else if (targetContact.category === 'Pet' || rel.type === 'Pet') type = 'Pet';
        else if (targetContact.category === 'Colleague' || rel.type === 'Colleague') type = 'Colleague';

        return {
            id: `e_${samContact.id}_${rel.relatedContactId}`,
            source: samContact.id,
            target: rel.relatedContactId,
            type: type,
        };
    })
    .filter(edge => edge !== null) as Edge[];


  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const svgElement = (e.currentTarget as SVGForeignObjectElement).ownerSVGElement;
    if (node && node.x && node.y && svgElement) {
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

  const getEdgeColor = (type: Edge['type']) => {
    switch (type) {
      case 'Family': return '#3b82f6'; // Blue
      case 'Partner': return '#ef4444'; // Red
      case 'Friend': return '#22c55e'; // Green
      case 'Pet': return '#f97316'; // Orange
      case 'Colleague': return '#6b7280'; // Gray
      default: return '#a1a1aa'; // Muted
    }
  };
  
  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="100%" 
      className="border rounded-lg bg-gray-900 shadow-sm" // Dark background for SVG
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox="0 0 1200 700" // Adjusted viewBox for more space
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;
        
        return (
          <line
            key={edge.id}
            x1={sourceNode.x + CARD_WIDTH / 2}
            y1={sourceNode.y + CARD_HEIGHT / 2}
            x2={targetNode.x + CARD_WIDTH / 2}
            y2={targetNode.y + CARD_HEIGHT / 2}
            stroke={getEdgeColor(edge.type)}
            strokeWidth="2" 
          />
        );
      })}
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
                    {/* Required div for foreignObject in some browsers */}
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

const legendItems = [
  { type: 'Family', color: 'bg-blue-500', label: 'Family' },
  { type: 'Partner', color: 'bg-red-500', label: 'Partner' },
  { type: 'Friend', color: 'bg-green-500', label: 'Friend' },
  { type: 'Pet', color: 'bg-orange-500', label: 'Pet' },
  { type: 'Colleague', color: 'bg-gray-500', label: 'Colleague' },
];


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
      
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 shadow-md bg-card">
            <CardHeader>
                <CardTitle className="text-lg text-foreground">Relationship Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {legendItems.map(item => (
                    <div key={item.type} className="flex items-center gap-2">
                        <div className={cn("w-4 h-1 rounded-full", item.color)}></div>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="md:col-span-3 flex-grow shadow-md overflow-hidden bg-card">
            <CardContent className="p-4 h-[600px] md:h-full"> {/* Ensure height for SVG container */}
                <p className="text-sm text-muted-foreground mb-2">
                  Hover over cards for quick info. Drag cards to reposition.
                </p>
                <div className="h-[calc(100%-30px)] w-full"> 
                    <RelationshipMapPlaceholder />
                </div>
            </CardContent>
        </Card>
      </div>


      <Card className="shadow-md bg-card">
        <CardHeader>
            <CardTitle className="text-lg text-foreground">Map Legend & Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="space-y-1">
                <p className="font-medium mb-1 text-foreground">Node Types:</p>
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center"><Users className="w-5 h-5 text-white"/></div> <span className="text-muted-foreground">Contact Card</span></div>
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
