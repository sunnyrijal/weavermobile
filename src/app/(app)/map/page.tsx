"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, ZoomIn, ZoomOut, Download, Users, Link as LinkIcon, UsersRound, UserSquare2, Group, Heart, Briefcase, PawPrint, Home as HomeIcon, Brain, UserCog, ChevronsLeftRight, Loader2 } from "lucide-react"; 
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useContacts } from '@/hooks/useContacts';
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
  originalText?: string; // To match relationship type/customLabel for line drawing
}

// Layout Constants
const CARD_WIDTH = 160; 
const CARD_HEIGHT = 65; // Reduced height
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;

const Y_OFFSET_TOP = 50;
const V_SPACE_LABEL_CARD = 20;
const V_SPACE_CARD = 30; // Reduced vertical space between cards in the same group
const V_SPACE_BETWEEN_ROWS = 70; // Reduced vertical space between rows

const COL1_X = 280; 
const COL2_X = 600; 
const COL3_X = 980; 

const H_SPACING_BETWEEN_PAIRED_CARDS = 30;

// Calculate Y positions for rows (primarily for Sam's detailed layout)
const Y_ROW1_LABEL_CY = Y_OFFSET_TOP + LABEL_HEIGHT / 2;
const Y_ROW1_CARD_Y = Y_OFFSET_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;

const Y_SAM_Y = Y_ROW1_CARD_Y + CARD_HEIGHT + V_SPACE_BETWEEN_ROWS; 

const Y_ROW2_LABEL_Y_TOP = Y_SAM_Y; 
const Y_ROW2_LABEL_CY = Y_ROW2_LABEL_Y_TOP + LABEL_HEIGHT / 2;
const Y_ROW2_CARD_Y = Y_ROW2_LABEL_Y_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;


const Y_ROW3_LABEL_Y_TOP = Math.max(Y_SAM_Y + CARD_HEIGHT, Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_CARD) + V_SPACE_BETWEEN_ROWS; 
const Y_ROW3_LABEL_CY = Y_ROW3_LABEL_Y_TOP + LABEL_HEIGHT / 2;
const Y_ROW3_CARD_Y_VAL = Y_ROW3_LABEL_Y_TOP + LABEL_HEIGHT + V_SPACE_LABEL_CARD;


const SVG_PADDING_HORIZONTAL = 100; 
const SVG_PADDING_VERTICAL = 100; 

const getPetTypeFromTags = (tags?: string[]): string => {
  if (!tags || tags.length === 0) return "Pet";
  const commonPetTypes = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster", "Guinea Pig"];
  for (const tag of tags) {
    const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
    if (commonPetTypes.includes(capitalizedTag)) {
      return capitalizedTag;
    }
  }
  return "Pet"; 
};

const getBadgeText = (
  nodeContact: Contact,
  centralContact?: Contact
): string => {
  if (centralContact && nodeContact.id === centralContact.id) {
    if (nodeContact.category === 'Pet') return getPetTypeFromTags(nodeContact.tags);

    const selfFamilyRolePriority = [ 
      "Mother", "Father", "Parent", "Sister", "Brother", "Sibling", "Daughter", "Son", "Child",
      "Wife", "Husband", "Spouse", "Partner", "Girlfriend", "Boyfriend", "Grandmother", "Grandfather", "Grandparent",
      "Aunt", "Uncle", "Niece", "Nephew", "Cousin", "Host Mom", "Host Father", "Host Parent"
    ];
    if (nodeContact.tags && nodeContact.tags.length > 0) {
      for (const role of selfFamilyRolePriority) {
        if (nodeContact.tags.some(tag => tag.toLowerCase() === role.toLowerCase())) {
          return role;
        }
      }
    }
    if (nodeContact.category && nodeContact.category !== "Other" && nodeContact.category !== "N/A" && nodeContact.category !== "Friend" && nodeContact.category !== "Colleague") {
        return nodeContact.category;
    }
    if ((nodeContact.category === "Friend" || nodeContact.category === "Colleague") && nodeContact.occupation) {
        return nodeContact.occupation;
    }
    return nodeContact.occupation || nodeContact.category || "N/A"; 
  }

  if (centralContact) {
    const relationshipFromCentralToNode = centralContact.relationships?.find(
      (rel) => rel.relatedContactId === nodeContact.id
    );
    if (relationshipFromCentralToNode) {
      return relationshipFromCentralToNode.customLabel || relationshipFromCentralToNode.type;
    }
  }

  if (nodeContact.category === 'Pet') return getPetTypeFromTags(nodeContact.tags);

  const familyRolePriorityForFallback = [
    "Mother", "Father", "Parent", "Sister", "Brother", "Sibling", "Daughter", "Son", "Child",
    "Wife", "Husband", "Spouse", "Partner", "Girlfriend", "Boyfriend", "Grandmother", "Grandfather", "Grandparent",
    "Aunt", "Uncle", "Niece", "Nephew", "Cousin", "Host Mom", "Host Father", "Host Parent"
  ];
  if ((nodeContact.category === "Family" || nodeContact.category === "Partner" || nodeContact.category === "Other") && nodeContact.tags && nodeContact.tags.length > 0) {
    for (const role of familyRolePriorityForFallback) {
      if (nodeContact.tags.some(tag => tag.toLowerCase() === role.toLowerCase())) {
        return role;
      }
    }
  }
  return nodeContact.category || nodeContact.occupation || "N/A";
};


const RelationshipMapCard = React.memo(({ contact, onButtonClick, centralContactForMap }: { contact: Contact; onButtonClick: (contactId: string) => void; centralContactForMap?: Contact }) => {
  const getInitials = (name: string) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const badgeText = getBadgeText(contact, centralContactForMap);
  const displayName = contact.name.replace(/\s*\((Dog|Cat|Pet)\)\s*/i, '').trim();

  return (
    <div 
      className="bg-card text-card-foreground rounded-lg shadow-lg p-2 flex flex-col items-center justify-between border border-border overflow-hidden" 
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <p 
        className="font-semibold text-xs text-center truncate w-full leading-tight pt-1" 
        title={displayName}
      >
        {displayName}
      </p> 
      {badgeText && (
        <Badge 
            variant="outline" // Using outline for consistency, color handled by style
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }} // Neutral badge for role
            className="mt-0.5 text-[10px] truncate max-w-[calc(100%-0.5rem)] px-1.5 py-0.5" 
        >
            {badgeText}
        </Badge>
      )}
      <p 
        className="text-[10px] text-muted-foreground mt-0.5 text-center w-full truncate leading-tight" 
        title={contact.occupation || contact.college || contact.currentLocation || 'N/A'}
      > 
        {contact.occupation || contact.college || contact.currentLocation || 'N/A'}
      </p>
      <Button 
        size="sm" 
        variant="ghost" 
        className="mt-0.5 w-full text-[10px] h-6 py-0.5" 
        onClick={() => onButtonClick(contact.id)}
      >
        View Profile
      </Button>
    </div>
  );
});
RelationshipMapCard.displayName = 'RelationshipMapCard';


interface RelationshipMapPlaceholderProps {
  centralContactId: string;
  viewBox: string;
  scale: number;
  currentViewBoxOrigin: { x: number; y: number };
  onViewBoxOriginChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  contacts: Contact[];
}

const RelationshipMapPlaceholder: React.FC<RelationshipMapPlaceholderProps> = ({ centralContactId, viewBox, scale, currentViewBoxOrigin, onViewBoxOriginChange, contacts }) => {
  const router = useRouter();
  
  const centralContact = useMemo(() => contacts.find(c => c.id === centralContactId), [centralContactId, contacts]);
  
  const { nodes: initialNodes, groupLabels: initialGroupLabels } = useMemo(() => {
    if (!centralContact) return { nodes: [], groupLabels: [] };

    const nodes: Node[] = [];
    const groupLabels: GroupLabel[] = [];

    nodes.push({ id: centralContact.id, contact: centralContact, x: COL2_X - CARD_WIDTH / 2, y: Y_SAM_Y });

    if (centralContact.id === '4') { // Sam Hendrickson - Detailed Layout
      groupLabels.push(
        { text: "Partner", originalText: "Partner", cx: COL1_X, cy: Y_ROW1_LABEL_CY }, 
        { text: "Parents", originalText: "Parent", cx: COL2_X, cy: Y_ROW1_LABEL_CY },
        { text: "Sister", originalText: "Sibling", cx: COL3_X, cy: Y_ROW1_LABEL_CY },
        { text: "Grandparents", originalText: "Grandparent", cx: COL1_X, cy: Y_ROW2_LABEL_CY },
        { text: "Uncles", originalText: "Uncle", cx: COL3_X, cy: Y_ROW2_LABEL_CY },
        { text: "Pets", originalText: "Pet", cx: COL2_X, cy: Y_ROW3_LABEL_CY }
      );
      const samNodesRaw = [
        { id: 'emily_g', contact: contacts.find(c=>c.id==='emily_g')!, x: COL1_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },
        
        { id: 'sara_h', contact: contacts.find(c=>c.id==='sara_h')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },
        { id: 'john_h', contact: contacts.find(c=>c.id==='john_h')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },

        { id: 'greta_h', contact: contacts.find(c=>c.id==='greta_h')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },

        { id: 'anne_e', contact: contacts.find(c=>c.id==='anne_e')!, x: COL1_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
        { id: 'jim_e', contact: contacts.find(c=>c.id==='jim_e')!, x: COL1_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
        
        { id: 'philip_e', contact: contacts.find(c=>c.id==='philip_e')!, x: (COL3_X - CARD_WIDTH/2) - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS , y: Y_ROW2_CARD_Y }, 
        { id: 'ty_b', contact: contacts.find(c=>c.id==='ty_b')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW2_CARD_Y },
        { id: 'ryan_h', contact: contacts.find(c=>c.id==='ryan_h')!, x: (COL3_X - CARD_WIDTH/2) + CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS, y: Y_ROW2_CARD_Y },
        
        { id: 'alpine_d', contact: contacts.find(c=>c.id==='alpine_d')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
        { id: 'shula_d', contact: contacts.find(c=>c.id==='shula_d')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
      ];
      nodes.push(...samNodesRaw.filter(node => node.contact).map(n => ({ ...n, contact: n.contact } as Node)));
    } else { 
        const organizedGroups: { [key: string]: { display: string, keyForMatching: string, colX: number, labelY: number, cardY: number, contacts: Contact[] } } = {
            "Parents": { display: "Parents", keyForMatching: "Parent", colX: COL2_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
            "Partner": { display: "Partner", keyForMatching: "Partner", colX: COL1_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
            "Siblings": { display: "Siblings", keyForMatching: "Sibling", colX: COL3_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
        };
        const otherRelationshipTypes = new Map<string, { contacts: Contact[], display: string, keyForMatching: string }>();

        if (centralContact.relationships) {
            centralContact.relationships.forEach(rel => {
                const relatedContact = contacts.find(c => c.id === rel.relatedContactId);
                if (!relatedContact) return;

                if (rel.type === "Parent") {
                    organizedGroups["Parents"].contacts.push(relatedContact);
                } else if (rel.type === "Partner") {
                    organizedGroups["Partner"].contacts.push(relatedContact);
                    if (rel.customLabel) organizedGroups["Partner"].display = rel.customLabel;
                    if (rel.customLabel) organizedGroups["Partner"].keyForMatching = rel.customLabel;
                } else if (rel.type === "Sibling") {
                    organizedGroups["Siblings"].contacts.push(relatedContact);
                    if (rel.customLabel) organizedGroups["Siblings"].display = rel.customLabel; 
                    if (rel.customLabel) organizedGroups["Siblings"].keyForMatching = rel.customLabel;
                } else {
                    const key = rel.customLabel || rel.type;
                    if (!otherRelationshipTypes.has(key)) {
                        otherRelationshipTypes.set(key, { contacts: [], display: key, keyForMatching: rel.type});
                    }
                    otherRelationshipTypes.get(key)!.contacts.push(relatedContact);
                }
            });
        }

        Object.values(organizedGroups).forEach(groupData => {
            if (groupData.contacts.length > 0) {
                groupLabels.push({
                    text: groupData.display,
                    originalText: groupData.keyForMatching,
                    cx: groupData.colX,
                    cy: groupData.labelY
                });
                groupData.contacts.forEach((contact, idx) => {
                    let cardX = groupData.colX - CARD_WIDTH / 2;
                    if (groupData.contacts.length > 1 && groupData.keyForMatching === "Parent") { // Special handling for paired parents
                         if (idx === 0) cardX = groupData.colX - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS / 2;
                         else cardX = groupData.colX + H_SPACING_BETWEEN_PAIRED_CARDS / 2;
                    } else if (groupData.contacts.length > 1) { // General horizontal stacking for other groups if multiple
                        const totalWidthOfGroup = (groupData.contacts.length * CARD_WIDTH) + ((groupData.contacts.length - 1) * H_SPACING_BETWEEN_PAIRED_CARDS);
                        const startXForGroup = groupData.colX - totalWidthOfGroup / 2;
                        cardX = startXForGroup + (idx * (CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS));
                    }
                    nodes.push({ id: contact.id, contact, x: cardX, y: groupData.cardY });
                });
            }
        });
        
        let otherY = Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_BETWEEN_ROWS;
        let otherColIdx = 0;
        const otherCols = [COL1_X, COL2_X, COL3_X];

        otherRelationshipTypes.forEach((groupData, typeKey) => {
            const currentCx = otherCols[otherColIdx % otherCols.length];
            groupLabels.push({ text: groupData.display, originalText: groupData.display, cx: currentCx, cy: otherY - V_SPACE_LABEL_CARD - LABEL_HEIGHT/2 });
            groupData.contacts.forEach((contact, idx) => {
                 let cardX = currentCx - CARD_WIDTH / 2;
                if (groupData.contacts.length > 1) {
                    const totalWidthOfGroup = (groupData.contacts.length * CARD_WIDTH) + ((groupData.contacts.length - 1) * H_SPACING_BETWEEN_PAIRED_CARDS);
                    const startXForGroup = currentCx - totalWidthOfGroup / 2;
                    cardX = startXForGroup + (idx * (CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS));
                }
                nodes.push({ id: contact.id, contact, x: cardX, y: otherY });
            });
            otherColIdx++;
            if (otherColIdx % otherCols.length === 0 || groupData.contacts.length > 2) { // Adjust Y for next row of 'other' groups
                 otherY += (Math.ceil(groupData.contacts.length / Math.min(groupData.contacts.length,2))) * (CARD_HEIGHT + V_SPACE_CARD) + V_SPACE_BETWEEN_ROWS;
            }
        });
    }
    return { nodes, groupLabels };
  }, [centralContact]);


  const [currentNodes, setCurrentNodes] = useState<Node[]>(initialNodes);
  const [currentGroupLabels, setCurrentGroupLabelsState] = useState<GroupLabel[]>(initialGroupLabels);

  useEffect(() => {
    setCurrentNodes(initialNodes);
    setCurrentGroupLabelsState(initialGroupLabels);
  }, [initialNodes, initialGroupLabels]);


  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStartCoords, setPanStartCoords] = useState<{ clientX: number, clientY: number } | null>(null);
  const [viewBoxOriginAtPanStart, setViewBoxOriginAtPanStart] = useState<{ x: number, y: number } | null>(null);


  const handleNodeMouseDown = useCallback((e: React.MouseEvent<SVGForeignObjectElement, MouseEvent>, nodeId: string) => {
    setDraggingNode(nodeId);
    const node = currentNodes.find(n => n.id === nodeId);
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
  }, [currentNodes]);
  
  const handleBackgroundMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.target === svgRef.current) { 
      e.preventDefault();
      setIsPanning(true);
      setPanStartCoords({ clientX: e.clientX, clientY: e.clientY });
      setViewBoxOriginAtPanStart(currentViewBoxOrigin);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isPanning && panStartCoords && viewBoxOriginAtPanStart && svgRef.current) {
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
          setCurrentNodes(prevNodes =>
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
  
  const centralNodeDetails = currentNodes.find(n => n.id === centralContact?.id);

  if (!centralContact || !centralNodeDetails) return <p>Central contact or its details not found.</p>;


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

      {/* Lines from Central to Group Labels */}
      {currentGroupLabels.map(groupLabel => (
          <line
              key={`line-central-to-group-${groupLabel.text.replace(/\s+/g, '-')}-${groupLabel.cx}-${groupLabel.cy}`}
              x1={centralNodeDetails.x + CARD_WIDTH / 2}
              y1={centralNodeDetails.y + CARD_HEIGHT / 2}
              x2={groupLabel.cx}
              y2={groupLabel.cy}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
          />
      ))}

      {/* Lines from Group Labels to Nodes */}
      {currentNodes.map(node => {
        if (node.id === centralContact.id || !centralNodeDetails) return null; 
        
        const relationship = centralContact.relationships?.find(rel => rel.relatedContactId === node.id);
        let groupKeyForNode = relationship?.customLabel || relationship?.type;
        
        if (node.contact.category === "Pet" && !groupKeyForNode) {
            groupKeyForNode = "Pet"; 
        }

        const parentGroupLabelForNode = currentGroupLabels.find(gl => {
            if (!groupKeyForNode || !gl.originalText) return false;
            if (gl.originalText.toLowerCase() === groupKeyForNode.toLowerCase()) return true;
            
            const genericTypeMatch = relationship?.type && gl.originalText.toLowerCase() === relationship.type.toLowerCase();
            if (genericTypeMatch && (gl.originalText === "Parent" || gl.originalText === "Sibling" || gl.originalText === "Pet")) return true;
            
            return false;
        });

        if (parentGroupLabelForNode) {
          return (
              <line
                  key={`line-group-${parentGroupLabelForNode.text.replace(/\s+/g, '-')}-to-${node.id}`}
                  x1={parentGroupLabelForNode.cx}
                  y1={parentGroupLabelForNode.cy + LABEL_HEIGHT / 2} 
                  x2={node.x + CARD_WIDTH / 2}              
                  y2={node.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
              />
          );
        } else { 
            return (
                 <line
                    key={`line-direct-central-to-${node.id}`}
                    x1={centralNodeDetails.x + CARD_WIDTH / 2}
                    y1={centralNodeDetails.y + CARD_HEIGHT / 2}
                    x2={node.x + CARD_WIDTH / 2}              
                    y2={node.y}  
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
            );
        }
      })}


      {/* Group Labels */}
      {currentGroupLabels.map(label => (
        <g key={label.text.replace(/\s+/g, '-') + label.cx + label.cy} transform={`translate(${label.cx - LABEL_WIDTH/2}, ${label.cy - LABEL_HEIGHT/2})`}>
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
      {currentNodes.map(node => (
        <TooltipProvider key={node.id}>
          <Tooltip>
            <TooltipTrigger asChild>
                <foreignObject 
                    x={node.x} 
                    y={node.y} 
                    width={CARD_WIDTH} 
                    height={CARD_HEIGHT}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    className={cn(
                        "transition-all duration-100 ease-in-out active:cursor-grabbing cursor-grab",
                        draggingNode === node.id ? "scale-105 shadow-2xl z-10" : "z-0" 
                    )}
                >
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full p-0.5"> 
                        <RelationshipMapCard contact={node.contact} onButtonClick={handleViewProfileClick} centralContactForMap={centralContact}/>
                    </div>
                </foreignObject>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border shadow-lg rounded-md p-2">
              <p className="font-semibold text-sm">{node.contact.name.replace(/\s*\((Dog|Cat|Pet)\s*\)/i, '').trim()}</p>
              {node.contact.occupation && <p className="text-xs">Occupation: {node.contact.occupation}</p>}
              <p className="text-xs">Role: {getBadgeText(node.contact, centralContact)}</p>
              {node.contact.currentLocation && <p className="text-xs">Location: {node.contact.currentLocation}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </svg>
  );
};


export default function RelationshipMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { contacts, isLoading, error } = useContacts();

  const mapContacts = useMemo(() => {
    // Use all contacts from the database
    return contacts;
  }, [contacts]);

  const defaultMapContactId = useMemo(() => {
    return mapContacts.length > 0 ? mapContacts[0].id : ''; // Default to first contact
  }, [mapContacts]);

  const [selectedCentralContactId, setSelectedCentralContactId] = useState<string>(() => {
    const contactIdFromQuery = searchParams.get('contactId');
    if (contactIdFromQuery && mapContacts.some(c => c.id === contactIdFromQuery)) {
      return contactIdFromQuery;
    }
    return defaultMapContactId;
  });
  
  useEffect(() => {
    const contactIdFromQuery = searchParams.get('contactId');
    if (contactIdFromQuery && mapContacts.some(c => c.id === contactIdFromQuery)) {
        if (selectedCentralContactId !== contactIdFromQuery) {
            setSelectedCentralContactId(contactIdFromQuery);
        }
    } else if (!contactIdFromQuery && selectedCentralContactId !== defaultMapContactId ) {
        // If query param removed and current is not the overall default, revert to overall default.
        // Or, simply let the current selection persist if query is removed.
        // For now, if a contactId was in query and is removed, revert to defaultMapContactId.
        // If user just selected from dropdown, that persists until query changes again.
         if (searchParams.has('contactId') === false) { // only revert if contactId is truly gone from URL
            // setSelectedCentralContactId(defaultMapContactId); // This could be too aggressive.
         }
    }
  }, [searchParams, mapContacts, defaultMapContactId, selectedCentralContactId]);


  const [scale, setScale] = useState(1);
  const [viewBoxOrigin, setViewBoxOrigin] = useState({ x: 0, y: 0 });
  const ZOOM_FACTOR = 1.2;

  const initialViewBoxDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    
    // Simplified calculation, can be refined based on actual node positions of the selected contact
    if (selectedCentralContactId === '4' || selectedCentralContactId === 'ck_host') { // More complex maps
      maxX = Math.max( COL3_X, (COL3_X - CARD_WIDTH/2) + CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS + CARD_WIDTH );
      maxY = Y_ROW3_CARD_Y_VAL + CARD_HEIGHT; 
    } else { // Simpler maps (Chandra, Abhas)
      maxX = COL3_X + CARD_WIDTH * 1.5; 
      maxY = Y_SAM_Y + 2 * (CARD_HEIGHT + V_SPACE_BETWEEN_ROWS + LABEL_HEIGHT + V_SPACE_LABEL_CARD); 
    }
    
    const width = maxX + SVG_PADDING_HORIZONTAL * 2; 
    const height = maxY + SVG_PADDING_VERTICAL * 2; 
    return { width: Math.max(1200, width), height: Math.max(900, height) }; // Min dimensions
  }, [selectedCentralContactId]);

  const currentViewBoxString = useMemo(() => {
    const currentWidth = initialViewBoxDimensions.width / scale;
    const currentHeight = initialViewBoxDimensions.height / scale;
    return `${viewBoxOrigin.x} ${viewBoxOrigin.y} ${currentWidth} ${currentHeight}`;
  }, [scale, viewBoxOrigin, initialViewBoxDimensions]);

 const handleZoom = (direction: 'in' | 'out') => {
    setScale(prevScale => {
      const oldScale = prevScale;
      let newScale = direction === 'in' ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR;
      
      newScale = Math.max(0.2, Math.min(newScale, 3)); 

      if (newScale === oldScale) return oldScale; 

      const currentViewCenterX = viewBoxOrigin.x + (initialViewBoxDimensions.width / oldScale) / 2;
      const currentViewCenterY = viewBoxOrigin.y + (initialViewBoxDimensions.height / oldScale) / 2;
      
      const newWidth = initialViewBoxDimensions.width / newScale;
      const newHeight = initialViewBoxDimensions.height / newScale;

      setViewBoxOrigin({
        x: currentViewCenterX - newWidth / 2,
        y: currentViewCenterY - newHeight / 2,
      });
      
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
      a.download = `relationship-map-${contacts.find(c=>c.id === selectedCentralContactId)?.name.replace(/\s+/g, '_') || 'contact'}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({title: "SVG Downloaded", description: "Map saved as SVG file."})
    } else {
      toast({title: "Download Failed", description: "Could not find SVG element.", variant: "destructive"})
    }
  };
  
  const centralContactName = useMemo(() => {
    return contacts.find(c => c.id === selectedCentralContactId)?.name || "Selected Contact";
  }, [selectedCentralContactId, contacts]);

  const handleSelectChange = (value: string) => {
    setSelectedCentralContactId(value);
    // Update URL without full page reload for better UX and shareability
    router.push(`/map?contactId=${value}`, { scroll: false });
    setViewBoxOrigin({x:0, y:0}); // Reset pan/zoom for new contact
    setScale(1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Error Loading Contacts</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (mapContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">No Contacts Found</h1>
        <p className="text-muted-foreground mb-4">Add contacts to view relationship map.</p>
        <Button onClick={() => router.push("/contacts/new")} className="w-full sm:w-auto">
          Add New Contact
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4 md:space-y-6 h-full flex flex-col p-1 sm:p-0">
      <Card className="shadow-md bg-card flex-shrink-0">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 text-foreground">
                <Brain className="text-primary h-5 w-5 sm:h-6 sm:w-6" /> Interactive Relationship Map
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Visualizing connections for: <span className="font-semibold text-primary">{centralContactName}</span>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 items-stretch sm:items-center w-full sm:w-auto">
                <Select value={selectedCentralContactId} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select Central Contact" />
                    </SelectTrigger>
                    <SelectContent>
                        {mapContacts.map(contact => (
                            <SelectItem key={contact.id} value={contact.id} className="text-xs sm:text-sm">
                               <div className="flex items-center gap-2">
                                 <UserCog className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground"/> {contact.name}
                               </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <Button variant="outline" size="icon" title="Zoom In" onClick={() => handleZoom('in')} className="h-9 w-9 sm:h-10 sm:w-10"><ZoomIn className="h-4 w-4 sm:h-5 sm:w-5"/></Button>
                    <Button variant="outline" size="icon" title="Zoom Out" onClick={() => handleZoom('out')} className="h-9 w-9 sm:h-10 sm:w-10"><ZoomOut className="h-4 w-4 sm:h-5 sm:w-5"/></Button>
                    <Button variant="outline" size="icon" title="Download SVG" onClick={handleDownloadSVG} className="h-9 w-9 sm:h-10 sm:w-10"><Download className="h-4 w-4 sm:h-5 sm:w-5"/></Button>
                </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-grow shadow-md overflow-hidden bg-card rounded-lg border border-border">
          <CardContent className="p-1 sm:p-2 md:p-4 h-full"> 
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2 text-center sm:text-left px-1 sm:px-0">
                Hover for info. Drag cards to move. Drag background to pan.
              </p>
              <div className="h-[calc(100%-20px)] sm:h-[calc(100%-25px)] w-full"> 
                  <RelationshipMapPlaceholder 
                    centralContactId={selectedCentralContactId}
                    viewBox={currentViewBoxString} 
                    scale={scale}
                    currentViewBoxOrigin={viewBoxOrigin}
                    onViewBoxOriginChange={setViewBoxOrigin}
                    contacts={contacts}
                  />
              </div>
          </CardContent>
      </div>

      <Card className="shadow-md bg-card flex-shrink-0">
        <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg text-foreground">Map Legend & Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 sm:gap-4 text-xs sm:text-sm p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-1 sm:space-y-2">
                <p className="font-medium mb-1 text-foreground">Node Types:</p>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-card border border-border flex items-center justify-center p-1 shadow-sm">
                        <UserSquare2 className="w-4 h-4 sm:w-6 sm:w-6 text-primary"/>
                    </div> 
                    <span className="text-muted-foreground">Contact Card</span>
                </div>
                 <div className="flex items-center gap-2 mt-1 sm:mt-2">
                    <div className="px-2 sm:px-3 py-1 rounded-md bg-accent text-accent-foreground text-[10px] sm:text-xs font-semibold shadow-sm">Group Label</div>
                    <span className="text-muted-foreground">Relationship Group</span>
                </div>
            </div>
            <div className="md:ml-auto space-y-1 sm:space-y-2">
                <p className="font-medium mb-1 text-foreground">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 sm:space-y-1">
                    <li>Drag cards to reposition.</li>
                    <li>Drag background to pan map.</li>
                    <li>Hover on cards for quick info.</li>
                    <li>Click "View Profile" for details.</li>
                    <li>Use Zoom & Download buttons.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}