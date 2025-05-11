
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, ZoomIn, ZoomOut, Users, Download, Heart } from "lucide-react"; 
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockContacts } from "@/lib/mockData"; // Import mockContacts
import type { Contact } from "@/lib/types"; // Import Contact type
import { useToast } from "@/hooks/use-toast";


// Basic Node and Edge types for the placeholder
interface Node {
  id: string;
  label: string;
  x?: number;
  y?: number;
  isGroup?: boolean; // To identify group nodes
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

// This is a VERY basic placeholder for the relationship map.
// A real implementation would use a library like React Flow, Vis.js, or D3.js.
const RelationshipMapPlaceholder = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [nodes, setNodes] = useState<Node[]>([
    // SAM - Central Node (ID matches mockContacts for Sam Hendrickson)
    { id: '4', label: 'SAM (You)', x: 400, y: 300 },

    // Direct Connections (IDs match mockContacts)
    { id: 'emily_g', label: 'Emily Grenecer', x: 400, y: 180 }, // Partner
    { id: 'greta_h', label: 'Greta Hendrikson', x: 400, y: 420 }, // Sister

    // Group Nodes
    { id: 'pets_group', label: 'Pets', x: 550, y: 250, isGroup: true },
    { id: 'parents_group', label: 'Parents', x: 250, y: 250, isGroup: true },
    { id: 'grandparents_group', label: 'Grandparents', x: 550, y: 350, isGroup: true },
    { id: 'uncles_group', label: 'Uncles', x: 250, y: 350, isGroup: true },

    // Individuals connected to Groups (IDs match mockContacts)
    // Pets
    { id: 'shula_d', label: 'Shula (dog)', x: 650, y: 230 },
    { id: 'alpine_d', label: 'Alpine (dog)', x: 650, y: 270 },
    // Parents
    { id: 'sara_h', label: 'Sara Hendrickson', x: 150, y: 230 },
    { id: 'john_h', label: 'John Hendrickson', x: 150, y: 270 },
    // Grandparents
    { id: 'anne_e', label: 'Anne Eidsvold', x: 650, y: 330 },
    { id: 'jim_e', label: 'Jim Eidsvold', x: 650, y: 370 },
    // Uncles
    { id: 'philip_e', label: 'Philip Eidsvold', x: 150, y: 330 },
    { id: 'ty_b', label: 'Ty Baucum', x: 150, y: 350 },
    { id: 'ryan_h', label: 'Ryan Hendrickson', x: 150, y: 370 },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    // SAM to Direct Connections
    { id: 'e_sam_emily', source: '4', target: 'emily_g' },
    { id: 'e_sam_greta_h', source: '4', target: 'greta_h' },

    // SAM to Groups
    { id: 'e_sam_pets_group', source: '4', target: 'pets_group' },
    { id: 'e_sam_parents_group', source: '4', target: 'parents_group' },
    { id: 'e_sam_grandparents_group', source: '4', target: 'grandparents_group' },
    { id: 'e_sam_uncles_group', source: '4', target: 'uncles_group' },

    // Groups to Individuals
    { id: 'e_pets_shula', source: 'pets_group', target: 'shula_d' },
    { id: 'e_pets_alpine', source: 'pets_group', target: 'alpine_d' },
    { id: 'e_parents_sara_h', source: 'parents_group', target: 'sara_h' },
    { id: 'e_parents_john_h', source: 'parents_group', target: 'john_h' },
    { id: 'e_grandparents_anne_e', source: 'grandparents_group', target: 'anne_e' },
    { id: 'e_grandparents_jim_e', source: 'grandparents_group', target: 'jim_e' },
    { id: 'e_uncles_philip_e', source: 'uncles_group', target: 'philip_e' },
    { id: 'e_uncles_ty_b', source: 'uncles_group', target: 'ty_b' },
    { id: 'e_uncles_ryan_h', source: 'uncles_group', target: 'ryan_h' },
  ]);


  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGGElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const svgElement = (e.currentTarget as SVGGElement).ownerSVGElement;
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

  const handleNodeClick = (nodeId: string, isGroup?: boolean) => {
    if (isGroup) return; // Do nothing for group nodes for now

    const contactExists = mockContacts.find(c => c.id === nodeId);
    if (contactExists) {
      router.push(`/contacts/${nodeId}`);
    } else {
      toast({
        title: "Contact not found",
        description: `Details for this contact (ID: ${nodeId}) are not available.`,
        variant: "destructive"
      });
      console.warn(`Contact with ID ${nodeId} not found in mockContacts. Cannot navigate.`);
    }
  };
  

  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="100%" 
      className="border rounded-lg bg-card shadow-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox="0 0 800 600" 
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode || typeof sourceNode.x !== 'number' || typeof sourceNode.y !== 'number' || typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number') return null;
        
        return (
          <line
            key={edge.id}
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5" 
          />
        );
      })}
      {nodes.map(node => {
        const contactInfo = !node.isGroup ? mockContacts.find(c => c.id === node.id) : null;
        return (
          <Tooltip key={node.id}>
            <TooltipTrigger asChild>
              <g 
                transform={`translate(${node.x || 0}, ${node.y || 0})`} 
                onMouseDown={(e) => handleMouseDown(e, node.id)} 
                onClick={() => handleNodeClick(node.id, node.isGroup)}
                className="active:cursor-grabbing"
                style={{ cursor: !node.isGroup ? 'pointer' : 'grab' }}
              >
                <rect 
                  width="100" 
                  height="40"  
                  x="-50"      
                  y="-20"      
                  rx="5"       
                  ry="5"       
                  fill={
                    node.id === '4' ? 'hsl(var(--primary))' : // Central node (SAM)
                    node.isGroup ? 'hsl(var(--muted))' : 'hsl(var(--secondary))'
                  }
                  stroke="hsl(var(--border))"
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  dy=".3em" 
                  fill={
                    node.id === '4' ? 'hsl(var(--primary-foreground))' : 
                    node.isGroup ? 'hsl(var(--muted-foreground))' : 'hsl(var(--secondary-foreground))'
                  }
                  fontSize="10"
                  fontFamily="sans-serif"
                  className="pointer-events-none select-none"
                >
                  {node.label.length > 12 && node.label.includes(" ") ? 
                    node.label.split(" ").map((part, index, arr) => (
                      <tspan key={index} x="0" dy={index === 0 ? "0" : "1.2em"}>
                        {part}
                        {arr.length > 2 && index === 1 && node.label.length > 20 ? "..." : ""}
                      </tspan>
                    ))
                  : (node.label.length > 12 ? node.label.substring(0,10) + "..." : node.label)}
                </text>
              </g>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{node.label}</p>
              {contactInfo && !node.isGroup && (
                <>
                  {contactInfo.occupation && <p className="text-xs">Occupation: {contactInfo.occupation}</p>}
                  {contactInfo.category && <p className="text-xs">Category: {contactInfo.category}</p>}
                   <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                </>
              )}
              {node.isGroup && <p className="text-xs text-muted-foreground mt-1">Group Hub</p>}
               {!node.isGroup && !contactInfo && node.id !== '4' && <p className="text-xs text-destructive mt-1">Details not available</p>}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </svg>
  );
};


export default function RelationshipMapPage() {
  return (
    // TooltipProvider is already in SidebarProvider, so not needed here explicitly
    // unless this component can be rendered outside that context.
    // For safety, adding it here doesn't hurt if SidebarProvider's one doesn't cover modals/portals from map.
    // However, current shadcn/ui Tooltip typically works well with a single root provider.
    // For now, we assume SidebarProvider's TooltipProvider is sufficient.

    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Share2 className="text-primary" /> Interactive Relationship Map
              </CardTitle>
              <CardDescription>Visualize and explore your network connections. (Example: Sam Hendrickson's Network)</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon"><ZoomIn className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon"><ZoomOut className="h-4 w-4"/></Button>
                <Button variant="outline" size="icon"><Download className="h-4 w-4"/></Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card className="flex-grow shadow-md overflow-hidden">
        <CardContent className="p-4 h-full">
            <p className="text-sm text-muted-foreground mb-4">
              Hover over nodes for quick info. Click on contacts to view details. Drag nodes to reposition.
            </p>
            <div className="h-[calc(100%-40px)] w-full"> 
                <RelationshipMapPlaceholder />
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg">Map Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="space-y-1">
                <div className="flex items-center gap-2"><div style={{width: '16px', height: '16px', borderRadius: '3px', backgroundColor: 'hsl(var(--primary))'}}></div> Central Person</div>
                <div className="flex items-center gap-2"><div style={{width: '16px', height: '16px', borderRadius: '3px', backgroundColor: 'hsl(var(--secondary))'}}></div> Connected Contact</div>
                <div className="flex items-center gap-2"><div style={{width: '16px', height: '16px', borderRadius: '3px', backgroundColor: 'hsl(var(--muted))'}}></div> Category Hub</div>
            </div>
            <div className="md:ml-auto">
                <p className="font-medium mb-1">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>Drag nodes to reposition them.</li>
                    <li>Hover for quick info.</li>
                    <li>Click on contact nodes to view details.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

