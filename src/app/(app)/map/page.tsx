
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
    { id: 'sam', label: 'Sam Hendrickson', x: 400, y: 50 },
    // Partner
    { id: 'emily', label: 'Emily Grenecer (Partner)', x: 200, y: 150 },
    // Pets
    { id: 'alpine', label: 'Alpine (Dog)', x: 350, y: 150 },
    { id: 'shula', label: 'Shula (Dog)', x: 450, y: 150 },
    // Sister
    { id: 'greta_h', label: 'Greta Hendrickson (Sister)', x: 600, y: 150 },
    // Parents
    { id: 'sara_h', label: 'Sara Hendrickson (Parent)', x: 150, y: 250 },
    { id: 'john_h', label: 'John Hendrickson (Parent)', x: 250, y: 250 },
    // Uncles
    { id: 'philip_e', label: 'Philip Eidsvold (Uncle)', x: 100, y: 350 },
    { id: 'ty_b', label: 'Ty Baucum (Uncle)', x: 200, y: 350 },
    { id: 'ryan_h', label: 'Ryan Hendrickson (Uncle)', x: 300, y: 350 },
    // Grandparents
    { id: 'jim_e', label: 'Jim Eidsvold (Grandparent)', x: 550, y: 350 },
    { id: 'anne_e', label: 'Anne Eidsvold (Grandparent)', x: 650, y: 350 },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e_sam_emily', source: 'sam', target: 'emily' },
    { id: 'e_sam_alpine', source: 'sam', target: 'alpine' },
    { id: 'e_sam_shula', source: 'sam', target: 'shula' },
    { id: 'e_sam_greta_h', source: 'sam', target: 'greta_h' },
    { id: 'e_sam_sara_h', source: 'sam', target: 'sara_h' },
    { id: 'e_sam_john_h', source: 'sam', target: 'john_h' },
    { id: 'e_sam_philip_e', source: 'sam', target: 'philip_e' },
    { id: 'e_sam_ty_b', source: 'sam', target: 'ty_b' },
    { id: 'e_sam_ryan_h', source: 'sam', target: 'ryan_h' },
    { id: 'e_sam_jim_e', source: 'sam', target: 'jim_e' },
    { id: 'e_sam_anne_e', source: 'sam', target: 'anne_e' },
  ]);

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.x && node.y) {
      // Calculate offset relative to the SVG element to handle SVG scaling/positioning
      const svgRect = (e.currentTarget as SVGSVGElement).ownerSVGElement!.getBoundingClientRect();
      const clientX = e.clientX - svgRect.left;
      const clientY = e.clientY - svgRect.top;
      // If using viewBox, clientX/Y might need transformation to SVG coordinate system.
      // For simplicity here, assuming direct mapping or that viewBox scaling handles it.
      setOffset({ x: clientX - node.x, y: clientY - node.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!draggingNode) return;
  
    const svgRect = e.currentTarget.getBoundingClientRect();
    // Transform mouse coordinates to SVG coordinate system if a viewBox is active
    // This is a simplified version. A robust solution would use CTM (Current Transformation Matrix)
    const point = e.currentTarget.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(e.currentTarget.getScreenCTM()?.inverse());

    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === draggingNode ? { ...n, x: svgPoint.x - offset.x, y: svgPoint.y - offset.y } : n
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };
  
  useEffect(() => {
    const svgElement = document.getElementById('relationship-map-svg');
    if (svgElement && svgElement.parentElement) {
      // Basic responsiveness, real libraries handle this better.
    }
  }, []);


  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="600" 
      className="border rounded-lg bg-card shadow-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
      viewBox="0 0 800 500" // Adjusted viewBox for new data
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode || !sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return null;
        return (
          <line
            key={edge.id}
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
          />
        );
      })}
      {nodes.map(node => (
        <g key={node.id} transform={`translate(${node.x || 0}, ${node.y || 0})`}>
          <circle
            r="30"
            // Highlight 'sam' node as primary
            fill={node.id === 'sam' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
            stroke="hsl(var(--border))"
            strokeWidth="2"
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className="cursor-grab active:cursor-grabbing"
          />
          <text
            textAnchor="middle"
            dy=".3em"
            fill={node.id === 'sam' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'}
            fontSize="10"
            className="pointer-events-none select-none"
          >
            {node.label.length > 15 ? node.label.substring(0,12) + "..." : node.label}
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
      
      <Card className="flex-grow shadow-md overflow-hidden">
        <CardContent className="p-4 h-full">
            <p className="text-sm text-muted-foreground mb-4">
              This is a placeholder for the interactive relationship map. Drag nodes to reposition. 
              A full implementation would include features like node expansion, tooltips, custom relationship types, and dynamic data loading.
            </p>
            <div className="h-[calc(100%-40px)]"> 
                <RelationshipMapPlaceholder />
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg">Map Legend & Controls (Example)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="space-y-1">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary"></div> Central Person</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-secondary"></div> Connected Contact</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-green-500" /> Family (Example)</div>
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Partner (Example)</div>
            </div>
            <div className="md:ml-auto">
                <p className="font-medium mb-1">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>Click on a node to view details (future).</li>
                    <li>Hover for quick info (future).</li>
                    <li>Use +/- buttons to manage relationships (future).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

