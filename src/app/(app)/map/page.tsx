
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
    { id: 'sam', label: 'SAM', x: 400, y: 250 },
    { id: 'emily', label: 'Emily Gerencer', x: 400, y: 100 },
    { id: 'shula', label: 'Shula (dog)', x: 600, y: 180 },
    { id: 'alpine', label: 'Alpine (dog)', x: 600, y: 280 },
    { id: 'anne_e', label: 'Ann Eidsvold', x: 600, y: 400 },
    { id: 'jim_e', label: 'Jim Eidsvold', x: 500, y: 400 },
    { id: 'greta_h', label: 'Greta Hendrikson', x: 400, y: 400 },
    { id: 'sara_h', label: 'Sarah Hendrikson', x: 250, y: 350 },
    { id: 'john_h', label: 'John Hendrikson', x: 150, y: 350 },
    { id: 'ryan_h', label: 'Ryan Hendrikson', x: 200, y: 100 },
    { id: 'philip_e', label: 'Philip Eidsvold', x: 100, y: 180 },
    { id: 'ty_b', label: 'Ty Baucum', x: 100, y: 80 },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e_sam_emily', source: 'sam', target: 'emily' },
    { id: 'e_sam_shula', source: 'sam', target: 'shula' },
    { id: 'e_sam_alpine', source: 'sam', target: 'alpine' },
    { id: 'e_sam_anne_e', source: 'sam', target: 'anne_e' },
    { id: 'e_sam_jim_e', source: 'sam', target: 'jim_e' },
    { id: 'e_sam_greta_h', source: 'sam', target: 'greta_h' },
    { id: 'e_sam_sara_h', source: 'sam', target: 'sara_h' },
    { id: 'e_sam_john_h', source: 'sam', target: 'john_h' },
    { id: 'e_sam_ryan_h', source: 'sam', target: 'ryan_h' },
    { id: 'e_sam_philip_e', source: 'sam', target: 'philip_e' },
    { id: 'e_philip_ty', source: 'philip_e', target: 'ty_b' },
  ]);

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.x && node.y) {
      // Calculate offset relative to the SVG element to handle SVG scaling/positioning
      const svgRect = (e.currentTarget as SVGSVGElement).ownerSVGElement!.getBoundingClientRect();
      
      // Get CTM for transforming client coordinates to SVG coordinates
      const CTM = (e.currentTarget as SVGSVGElement).ownerSVGElement!.getScreenCTM();
      if (CTM) {
        const svgPoint = (e.currentTarget as SVGSVGElement).ownerSVGElement!.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const transformedPoint = svgPoint.matrixTransform(CTM.inverse());
        setOffset({ x: transformedPoint.x - node.x, y: transformedPoint.y - node.y });
      } else {
         // Fallback if CTM is null (less accurate for scaled SVGs)
        const clientX = e.clientX - svgRect.left;
        const clientY = e.clientY - svgRect.top;
        setOffset({ x: clientX - node.x, y: clientY - node.y });
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!draggingNode) return;
  
    // Get CTM for transforming client coordinates to SVG coordinates
    const CTM = e.currentTarget.getScreenCTM();
    if (CTM) {
        const svgPoint = e.currentTarget.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const transformedPoint = svgPoint.matrixTransform(CTM.inverse());

        setNodes(prevNodes =>
        prevNodes.map(n =>
            n.id === draggingNode ? { ...n, x: transformedPoint.x - offset.x, y: transformedPoint.y - offset.y } : n
        )
        );
    } else {
        // Fallback if CTM is null (less accurate for scaled SVGs)
        const svgRect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX - svgRect.left;
        const clientY = e.clientY - svgRect.top;
        setNodes(prevNodes =>
          prevNodes.map(n =>
            n.id === draggingNode ? { ...n, x: clientX - offset.x, y: clientY - offset.y } : n
          )
        );
    }
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
      viewBox="0 0 800 500" 
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode || typeof sourceNode.x !== 'number' || typeof sourceNode.y !== 'number' || typeof targetNode.x !== 'number' || typeof targetNode.y !== 'number') return null;
        
        // Calculate curved path for specific connections if needed, e.g., parents to children
        // For now, simple lines. The image uses mostly straight lines with some gentle curves.
        // Example of a quadratic bezier for a slight curve (adjust control points as needed)
        // const midX = (sourceNode.x + targetNode.x) / 2;
        // const midY = (sourceNode.y + targetNode.y) / 2;
        // const controlX = midX; // For straight line, control point is on the line
        // const controlY = midY - 30; // Adjust for curve intensity/direction
        // const pathData = `M ${sourceNode.x} ${sourceNode.y} Q ${controlX} ${controlY} ${targetNode.x} ${targetNode.y}`;

        return (
          <line
            key={edge.id}
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5" // Slightly thinner lines
          />
          // <path 
          //   key={edge.id}
          //   d={pathData}
          //   stroke="hsl(var(--muted-foreground))"
          //   strokeWidth="1.5"
          //   fill="none"
          // />
        );
      })}
      {nodes.map(node => (
        <g key={node.id} transform={`translate(${node.x || 0}, ${node.y || 0})`}>
          <rect // Using rect instead of circle for boxes, approximate image
            width="100" // Adjust width as needed
            height="40"  // Adjust height as needed
            x="-50"      // Center the rect
            y="-20"      // Center the rect
            rx="5"       // Rounded corners
            ry="5"       // Rounded corners
            fill={node.id === 'sam' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            onMouseDown={(e) => handleMouseDown(e as any, node.id)} // Cast to any to bypass circle specific event
            className="cursor-grab active:cursor-grabbing"
          />
          <text
            textAnchor="middle"
            dy=".3em" // Vertically center text
            fill={node.id === 'sam' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))'}
            fontSize="10"
            fontFamily="sans-serif"
            className="pointer-events-none select-none"
          >
            {/* Basic multi-line text attempt (SVG text is tricky) */}
            {node.label.length > 12 && node.label.includes(" ") ? 
              node.label.split(" ").map((part, index, arr) => (
                <tspan key={index} x="0" dy={index === 0 ? "0" : "1.2em"}>
                  {part}
                  {index === arr.length -1 && node.label.length > 24 ? "..." : ""}
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
      
      <Card className="flex-grow shadow-md overflow-hidden">
        <CardContent className="p-4 h-full">
            <p className="text-sm text-muted-foreground mb-4">
              This is an updated placeholder for the interactive relationship map based on the provided image. Drag nodes to reposition. 
              A full implementation would use a dedicated graph library and could include features like node expansion, dynamic data, and the orange relationship type boxes.
            </p>
            <div className="h-[calc(100%-60px)]"> {/* Adjusted height for the paragraph */}
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
                <div className="flex items-center gap-2"><div style={{width: '16px', height: '16px', borderRadius: '3px', backgroundColor: 'hsl(var(--primary))'}}></div> Central Person (SAM)</div>
                <div className="flex items-center gap-2"><div style={{width: '16px', height: '16px', borderRadius: '3px', backgroundColor: 'hsl(var(--secondary))'}}></div> Connected Contact</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-green-500" /> Family (e.g., Parents, Sister)</div>
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Partner (e.g., Girlfriend)</div>
            </div>
            <div className="md:ml-auto">
                <p className="font-medium mb-1">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    <li>Drag nodes to reposition them.</li>
                    <li>Click on a node to view details (future).</li>
                    <li>Hover for quick info (future).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

