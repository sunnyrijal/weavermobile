
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, ZoomIn, ZoomOut, Users, Download, Heart } from "lucide-react"; 
import React, { useState, useCallback, useEffect } from 'react';

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
  const [nodes, setNodes] = useState<Node[]>([
    // SAM - Central Node
    { id: 'sam', label: 'SAM', x: 400, y: 300 },

    // Direct Connections
    { id: 'emily', label: 'Emily Grenecer', x: 400, y: 180 }, // Partner
    { id: 'greta_h', label: 'Greta Hendrikson', x: 400, y: 420 }, // Sister

    // Group Nodes
    { id: 'pets_group', label: 'Pets', x: 550, y: 250, isGroup: true },
    { id: 'parents_group', label: 'Parents', x: 250, y: 250, isGroup: true },
    { id: 'grandparents_group', label: 'Grandparents', x: 550, y: 350, isGroup: true },
    { id: 'uncles_group', label: 'Uncles', x: 250, y: 350, isGroup: true },

    // Individuals connected to Groups
    // Pets
    { id: 'shula', label: 'Shula (dog)', x: 650, y: 230 },
    { id: 'alpine', label: 'Alpine (dog)', x: 650, y: 270 },
    // Parents
    { id: 'sara_h', label: 'Sara Hendrickson', x: 150, y: 230 },
    { id: 'john_h', label: 'John Hendrickson', x: 150, y: 270 },
    // Grandparents
    { id: 'anne_e', label: 'Anne Eidsvold', x: 650, y: 330 },
    { id: 'jim_e', label: 'Jim Eidsvold', x: 650, y: 370 },
    // Uncles
    { id: 'philip_e', label: 'Philip Eidsvold', x: 150, y: 330 },
    { id: 'ty_b', label: 'Ty Baucum', x: 150, y: 350 }, // Adjusted Y for spacing
    { id: 'ryan_h', label: 'Ryan Hendrickson', x: 150, y: 370 }, // Adjusted Y for spacing
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    // SAM to Direct Connections
    { id: 'e_sam_emily', source: 'sam', target: 'emily' },
    { id: 'e_sam_greta_h', source: 'sam', target: 'greta_h' },

    // SAM to Groups
    { id: 'e_sam_pets_group', source: 'sam', target: 'pets_group' },
    { id: 'e_sam_parents_group', source: 'sam', target: 'parents_group' },
    { id: 'e_sam_grandparents_group', source: 'sam', target: 'grandparents_group' },
    { id: 'e_sam_uncles_group', source: 'sam', target: 'uncles_group' },

    // Groups to Individuals
    // Pets
    { id: 'e_pets_shula', source: 'pets_group', target: 'shula' },
    { id: 'e_pets_alpine', source: 'pets_group', target: 'alpine' },
    // Parents
    { id: 'e_parents_sara_h', source: 'parents_group', target: 'sara_h' },
    { id: 'e_parents_john_h', source: 'parents_group', target: 'john_h' },
    // Grandparents
    { id: 'e_grandparents_anne_e', source: 'grandparents_group', target: 'anne_e' },
    { id: 'e_grandparents_jim_e', source: 'grandparents_group', target: 'jim_e' },
    // Uncles
    { id: 'e_uncles_philip_e', source: 'uncles_group', target: 'philip_e' },
    { id: 'e_uncles_ty_b', source: 'uncles_group', target: 'ty_b' },
    { id: 'e_uncles_ryan_h', source: 'uncles_group', target: 'ryan_h' },
  ]);


  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGGElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    // Ensure SVG element is correctly referenced for CTM
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
  

  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="100%" // Make SVG take full height of its container
      className="border rounded-lg bg-card shadow-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox="0 0 800 600" // Adjusted viewBox
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
      {nodes.map(node => (
        <g key={node.id} transform={`translate(${node.x || 0}, ${node.y || 0})`} onMouseDown={(e) => handleMouseDown(e, node.id)} className="cursor-grab active:cursor-grabbing">
          <rect 
            width="100" 
            height="40"  
            x="-50"      
            y="-20"      
            rx="5"       
            ry="5"       
            fill={
              node.id === 'sam' ? 'hsl(var(--primary))' : 
              node.isGroup ? 'hsl(var(--muted))' : 'hsl(var(--secondary))'
            }
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          <text
            textAnchor="middle"
            dy=".3em" 
            fill={
              node.id === 'sam' ? 'hsl(var(--primary-foreground))' : 
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
                  {/* Basic truncation for very long multi-line text */}
                  {arr.length > 2 && index === 1 && node.label.length > 20 ? "..." : ""}
                </tspan>
              ))
            : (node.label.length > 12 ? node.label.substring(0,10) + "..." : node.label)}
          </text>
        </g>
      ))}
    </svg>
  );
};


export default function RelationshipMapPage() {
  return (
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
      
      <Card className="flex-grow shadow-md overflow-hidden"> {/* Ensure this card can grow */}
        <CardContent className="p-4 h-full"> {/* Ensure content area takes full height */}
            <p className="text-sm text-muted-foreground mb-4">
              Drag nodes to reposition them. Lines represent connections between individuals and category hubs.
            </p>
            <div className="h-[calc(100%-40px)] w-full"> {/* Adjust height for the paragraph and ensure width */}
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
                    <li>Click on a node to view details (future).</li>
                    <li>Zoom and pan controls (future).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

