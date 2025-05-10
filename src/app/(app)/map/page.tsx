
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, ZoomIn, ZoomOut, Users, Download } from "lucide-react";
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
    { id: '1', label: 'You (Central Node)', x: 300, y: 200 },
    { id: '2', label: 'Chandra Oli (Friend)', x: 150, y: 100 },
    { id: '3', label: 'Ritisha KC (Partner)', x: 450, y: 100 },
    { id: '4', label: 'Abhas Oli (Friend)', x: 150, y: 300 },
    { id: '5', label: 'Sam Hendrickson (Friend)', x: 450, y: 300 },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e1-4', source: '1', target: '4' },
    { id: 'e1-5', source: '1', target: '5' },
  ]);

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.x && node.y) {
      setOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!draggingNode) return;
    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === draggingNode ? { ...n, x: e.clientX - offset.x, y: e.clientY - offset.y } : n
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };
  
  // Ensure SVG takes up available space, might need adjustments based on parent layout
  useEffect(() => {
    const svgElement = document.getElementById('relationship-map-svg');
    if (svgElement && svgElement.parentElement) {
      const { width, height } = svgElement.parentElement.getBoundingClientRect();
      // Set viewBox or width/height attributes for responsiveness
    }
  }, []);


  return (
    <svg 
      id="relationship-map-svg"
      width="100%" 
      height="600" // Adjust height as needed or make it dynamic
      className="border rounded-lg bg-card shadow-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves SVG
      viewBox="0 0 600 400" // Adjust viewBox for scaling and initial view
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
            fill={node.id === '1' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
            stroke="hsl(var(--border))"
            strokeWidth="2"
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className="cursor-grab active:cursor-grabbing"
          />
          <text
            textAnchor="middle"
            dy=".3em"
            fill={node.id === '1' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'}
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
              <CardDescription>Visualize and explore your network connections.</CardDescription>
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
              A full implementation would include features like node expansion, tooltips, custom relationship types, and more.
            </p>
            <div className="h-[calc(100%-40px)]"> {/* Adjust height calculation as needed */}
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
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary"></div> You (Central Node)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-secondary"></div> Connected Contact</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-green-500" /> Family</div>
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Partner</div>
            </div>
            <div className="md:ml-auto">
                <p className="font-medium mb-1">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>Click on a node to make it central.</li>
                    <li>Hover for quick details.</li>
                    <li>Use +/- buttons to add relationships.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
