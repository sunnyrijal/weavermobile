"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, ZoomIn, ZoomOut, Download, Users, Link as LinkIcon, UsersRound, UserSquare2, Group, Heart, Briefcase, PawPrint, Home, Brain, UserCog } from "lucide-react"; 
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
  cx: number; // center x for the label
  cy: number; // center y for the label
  originalText?: string; // To match relationship type/customLabel for line drawing
}

// Layout Constants
const CARD_WIDTH = 160; 
const CARD_HEIGHT = 200; 
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 30;

const Y_OFFSET_TOP = 50;
const V_SPACE_LABEL_CARD = 20;
const V_SPACE_CARD = 40; 
const V_SPACE_BETWEEN_ROWS = 80; 

const COL1_X = 280; 
const COL2_X = 600; 
const COL3_X = 980; // Increased from 920 to prevent overlap

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


const SVG_PADDING_HORIZONTAL = 50;
const SVG_PADDING_VERTICAL = 50;

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

const getBadgeText = (contact: Contact): string => {
  if (contact.category === 'Pet') {
    return getPetTypeFromTags(contact.tags);
  }

  const familyRolePriority = [
    "Mother", "Father", "Parent",
    "Sister", "Brother", "Sibling",
    "Daughter", "Son", "Child",
    "Wife", "Husband", "Spouse", "Partner", "Girlfriend", "Boyfriend",
    "Grandmother", "Grandfather", "Grandparent",
    "Aunt", "Uncle",
    "Niece", "Nephew",
    "Cousin",
  ];

  if (contact.category === "Family" || contact.category === "Partner") {
    if (contact.tags && contact.tags.length > 0) {
      for (const role of familyRolePriority) {
        if (contact.tags.some(tag => tag.toLowerCase() === role.toLowerCase())) {
          return role;
        }
      }
    }
  }
  return contact.category || "N/A";
};


const RelationshipMapCard = React.memo(({ contact, onButtonClick }: { contact: Contact; onButtonClick: (contactId: string) => void; }) => {
  const getInitials = (name: string) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCategoryBadgeVariant = (categoryOrRole?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (categoryOrRole?.toLowerCase()) {
      case 'family': case 'mother': case 'father': case 'parent': 
      case 'sister': case 'brother': case 'sibling':
      case 'son': case 'daughter': case 'child':
      case 'grandmother': case 'grandfather': case 'grandparent':
      case 'aunt': case 'uncle':
        return 'default'; 
      case 'partner': case 'girlfriend': case 'boyfriend': case 'spouse': case 'husband': case 'wife':
        return 'destructive'; 
      case 'friend': return 'secondary'; 
      case 'pet': case 'dog': case 'cat': // Add specific pet types if needed
        return 'outline'; 
      case 'colleague': case 'professional':
        return 'secondary';
      default: return 'outline';
    }
  };
  
  const getCategoryBadgeStyle = (categoryOrRole?: string): React.CSSProperties => {
     switch (categoryOrRole?.toLowerCase()) {
      case 'family': case 'mother': case 'father': case 'parent':
      case 'sister': case 'brother': case 'sibling':
      case 'son': case 'daughter': case 'child':
      case 'grandmother': case 'grandfather': case 'grandparent':
      case 'aunt': case 'uncle':
         return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' };
      case 'partner': case 'girlfriend': case 'boyfriend': case 'spouse': case 'husband': case 'wife':
        return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', borderColor: 'hsl(var(--destructive))' };
      case 'friend': return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', borderColor: 'hsl(var(--secondary))' };
      case 'pet': case 'dog': case 'cat':
        return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', borderColor: 'hsl(var(--accent))' }; 
      default: return {};
    }
  }

  const badgeText = getBadgeText(contact);
  const displayName = contact.name.replace(/\s*\(Dog\)\s*/i, '').trim(); // Remove (Dog) from name


  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-xl p-3 flex flex-col items-center justify-between border border-border" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <Avatar className="w-16 h-16 mb-2 border-2 border-muted">
        <AvatarImage src={contact.photoURL} alt={displayName} data-ai-hint="profile avatar"/>
        <AvatarFallback className="bg-muted text-xl">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-sm text-center truncate w-full" title={displayName}>{displayName}</p>
      {badgeText && (
        <Badge 
            variant={getCategoryBadgeVariant(badgeText)} 
            style={getCategoryBadgeStyle(badgeText)}
            className="mt-1 text-xs"
        >
            {badgeText}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground mt-1 text-center w-full truncate" title={contact.occupation || contact.college || contact.locationDetails || 'N/A'}>
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


interface RelationshipMapPlaceholderProps {
  centralContactId: string;
  viewBox: string;
  scale: number;
  currentViewBoxOrigin: { x: number; y: number };
  onViewBoxOriginChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const RelationshipMapPlaceholder: React.FC<RelationshipMapPlaceholderProps> = ({ centralContactId, viewBox, scale, currentViewBoxOrigin, onViewBoxOriginChange }) => {
  const router = useRouter();
  
  const centralContact = useMemo(() => mockContacts.find(c => c.id === centralContactId), [centralContactId]);
  
  const { nodes: initialNodes, groupLabels: initialGroupLabels } = useMemo(() => {
    if (!centralContact) return { nodes: [], groupLabels: [] };

    const nodes: Node[] = [];
    const groupLabels: GroupLabel[] = [];

    nodes.push({ id: centralContact.id, contact: centralContact, x: COL2_X - CARD_WIDTH / 2, y: Y_SAM_Y });

    if (centralContact.id === '4') { // Sam Hendrickson - Detailed Layout
      groupLabels.push(
        { text: "Partner", originalText: "Partner", cx: COL1_X, cy: Y_ROW1_LABEL_CY }, // Could be "Girlfriend" if customLabel is preferred
        { text: "Parents", originalText: "Parent", cx: COL2_X, cy: Y_ROW1_LABEL_CY },
        { text: "Sister", originalText: "Sibling", cx: COL3_X, cy: Y_ROW1_LABEL_CY },
        { text: "Grandparents", originalText: "Grandparent", cx: COL1_X, cy: Y_ROW2_LABEL_CY },
        { text: "Uncles", originalText: "Uncle", cx: COL3_X, cy: Y_ROW2_LABEL_CY },
        { text: "Pets", originalText: "Pet", cx: COL2_X, cy: Y_ROW3_LABEL_CY }
      );
      const samNodesRaw = [
        { id: 'emily_g', contact: mockContacts.find(c=>c.id==='emily_g')!, x: COL1_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },
        { id: 'john_h', contact: mockContacts.find(c=>c.id==='john_h')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },
        { id: 'sara_h', contact: mockContacts.find(c=>c.id==='sara_h')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW1_CARD_Y },
        { id: 'greta_h', contact: mockContacts.find(c=>c.id==='greta_h')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW1_CARD_Y },
        { id: 'anne_e', contact: mockContacts.find(c=>c.id==='anne_e')!, x: COL1_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
        { id: 'jim_e', contact: mockContacts.find(c=>c.id==='jim_e')!, x: COL1_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW2_CARD_Y },
        // Uncles centered around Ty Baucum as the middle one
        { id: 'philip_e', contact: mockContacts.find(c=>c.id==='philip_e')!, x: (COL3_X - CARD_WIDTH/2) - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS , y: Y_ROW2_CARD_Y }, 
        { id: 'ty_b', contact: mockContacts.find(c=>c.id==='ty_b')!, x: COL3_X - CARD_WIDTH/2, y: Y_ROW2_CARD_Y },
        { id: 'ryan_h', contact: mockContacts.find(c=>c.id==='ryan_h')!, x: (COL3_X - CARD_WIDTH/2) + CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS, y: Y_ROW2_CARD_Y },
        { id: 'alpine_d', contact: mockContacts.find(c=>c.id==='alpine_d')!, x: COL2_X - CARD_WIDTH - H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
        { id: 'shula_d', contact: mockContacts.find(c=>c.id==='shula_d')!, x: COL2_X + H_SPACING_BETWEEN_PAIRED_CARDS/2, y: Y_ROW3_CARD_Y_VAL },
      ];
      nodes.push(...samNodesRaw.filter(node => node.contact).map(n => n as Node));
    } else { // Generic Layout for Chandra, Abhas, or others
        const organizedGroups: { [key: string]: { display: string, keyForMatching: string, colX: number, labelY: number, cardY: number, contacts: Contact[] } } = {
            "Parents": { display: "Parents", keyForMatching: "Parent", colX: COL2_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
            "Partner": { display: "Partner", keyForMatching: "Partner", colX: COL1_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
            "Siblings": { display: "Siblings", keyForMatching: "Sibling", colX: COL3_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
        };
        const otherRelationshipTypes = new Map<string, Contact[]>();

        if (centralContact.relationships) {
            centralContact.relationships.forEach(rel => {
                const relatedContact = mockContacts.find(c => c.id === rel.relatedContactId);
                if (!relatedContact) return;

                if (rel.type === "Parent") {
                    organizedGroups["Parents"].contacts.push(relatedContact);
                } else if (rel.type === "Partner") {
                    organizedGroups["Partner"].contacts.push(relatedContact);
                    if (rel.customLabel) organizedGroups["Partner"].display = rel.customLabel; // e.g. "Girlfriend"
                    if (rel.customLabel) organizedGroups["Partner"].keyForMatching = rel.customLabel;
                } else if (rel.type === "Sibling") {
                    organizedGroups["Siblings"].contacts.push(relatedContact);
                     if (rel.customLabel) organizedGroups["Siblings"].display = rel.customLabel; 
                    if (rel.customLabel) organizedGroups["Siblings"].keyForMatching = rel.customLabel;
                } else {
                    const key = rel.customLabel || rel.type;
                    if (!otherRelationshipTypes.has(key)) otherRelationshipTypes.set(key, []);
                    otherRelationshipTypes.get(key)!.push(relatedContact);
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
                    if (groupData.contacts.length > 1) {
                        const totalWidthOfGroup = (groupData.contacts.length * CARD_WIDTH) + ((groupData.contacts.length - 1) * H_SPACING_BETWEEN_PAIRED_CARDS);
                        const startXForGroup = groupData.colX - totalWidthOfGroup / 2;
                        cardX = startXForGroup + (idx * (CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS));
                    }
                    nodes.push({ id: contact.id, contact, x: cardX, y: groupData.cardY });
                });
            }
        });
        
        let otherY = Y_ROW2_CARD_Y + CARD_HEIGHT + V_SPACE_BETWEEN_ROWS; // Start other types lower
        let otherColIdx = 0;
        const otherCols = [COL1_X, COL2_X, COL3_X];

        otherRelationshipTypes.forEach((contacts, type) => {
            const currentCx = otherCols[otherColIdx % otherCols.length];
            groupLabels.push({ text: type, originalText: type, cx: currentCx, cy: otherY - V_SPACE_LABEL_CARD - LABEL_HEIGHT/2 });
            contacts.forEach((contact, idx) => {
                 let cardX = currentCx - CARD_WIDTH / 2;
                if (contacts.length > 1) {
                    const totalWidthOfGroup = (contacts.length * CARD_WIDTH) + ((contacts.length - 1) * H_SPACING_BETWEEN_PAIRED_CARDS);
                    const startXForGroup = currentCx - totalWidthOfGroup / 2;
                    cardX = startXForGroup + (idx * (CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS));
                }
                nodes.push({ id: contact.id, contact, x: cardX, y: otherY });
            });
            otherColIdx++;
            if (otherColIdx % otherCols.length === 0 || contacts.length > 2) { // Move to next row if all cols used or group is large
                 otherY += (Math.ceil(contacts.length / 2)) * (CARD_HEIGHT + V_SPACE_CARD) + V_SPACE_BETWEEN_ROWS;
            } else if (otherColIdx % otherCols.length !== 0 && contacts.length <=2){
                // keep same Y for next group in same row if space
            }
        });
    }
    return { nodes, groupLabels };
  }, [centralContactId, centralContact]);


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

      {/* Lines */}
      {currentNodes.map(node => {
        if (node.id === centralContact.id || !centralNodeDetails) return null; 
        
        const relationship = centralContact.relationships?.find(rel => rel.relatedContactId === node.id);
        let groupKeyForNode = relationship?.customLabel || relationship?.type;
        
        if (node.contact.category === "Pet" && !groupKeyForNode) {
            groupKeyForNode = "Pet"; // Default for pets if not explicitly typed in relationships
        }

        const parentGroupLabel = currentGroupLabels.find(gl => {
            if (!groupKeyForNode || !gl.originalText) return false;
            
            // Direct match for specific labels (like "Girlfriend", "Uncle Joe")
            if (gl.originalText.toLowerCase() === groupKeyForNode.toLowerCase()) return true;

            // Match broader categories (e.g., rel.type "Parent" should match group label "Parent")
            if (relationship?.type && gl.originalText.toLowerCase() === relationship.type.toLowerCase()) return true;
            
            // Specific handling for "Parents" group (originalText "Parent") matching individual parent types
            if (gl.originalText === "Parent" && relationship?.type === "Parent") return true;
            if (gl.originalText === "Sibling" && relationship?.type === "Sibling") return true;
            if (gl.originalText === "Pet" && node.contact.category === "Pet") return true;


            return false;
        });

        if (parentGroupLabel) {
          // Line from central node to group label
          const lineToGroupKey = `line-central-to-group-${parentGroupLabel.text.replace(/\s+/g, '-')}`;
          // Line from group label to node
          const lineFromGroupToNodeKey = `line-group-${parentGroupLabel.text.replace(/\s+/g, '-')}-to-${node.id}`;
          
          return (
              <React.Fragment key={`${lineToGroupKey}-${lineFromGroupToNodeKey}`}>
                  {/* Only draw one line from central to group label, even if multiple nodes in group */}
                  {/* This check assumes first node for a group implies the group line drawing */}
                  {currentNodes.filter(n => {
                      const rel = centralContact.relationships?.find(r => r.relatedContactId === n.id);
                      let key = rel?.customLabel || rel?.type;
                      if (n.contact.category === "Pet" && !key) key = "Pet";
                      const pgLabel = currentGroupLabels.find(gl => {
                          if (!key || !gl.originalText) return false;
                          if (gl.originalText.toLowerCase() === key.toLowerCase()) return true;
                          if (rel?.type && gl.originalText.toLowerCase() === rel.type.toLowerCase()) return true;
                          if (gl.originalText === "Parent" && rel?.type === "Parent") return true;
                          if (gl.originalText === "Sibling" && rel?.type === "Sibling") return true;
                          if (gl.originalText === "Pet" && n.contact.category === "Pet") return true;
                          return false;
                      });
                      return pgLabel?.text === parentGroupLabel.text;
                  })[0]?.id === node.id && (
                      <line
                          key={lineToGroupKey}
                          x1={centralNodeDetails.x + CARD_WIDTH / 2}
                          y1={centralNodeDetails.y + CARD_HEIGHT / 2}
                          x2={parentGroupLabel.cx}
                          y2={parentGroupLabel.cy}
                          stroke="hsl(var(--border))"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                      />
                  )}
                  <line
                      key={lineFromGroupToNodeKey}
                      x1={parentGroupLabel.cx}
                      y1={parentGroupLabel.cy + LABEL_HEIGHT / 2} // From bottom-middle of label
                      x2={node.x + CARD_WIDTH / 2}              // To top-middle of card
                      y2={node.y}
                      stroke="hsl(var(--border))"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                  />
              </React.Fragment>
          );
        } else { // Fallback: direct line from central to node if no group label matches
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
                y={LABEL_HEIGHT/2 + 5} // Adjust for vertical centering
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
                        draggingNode === node.id ? "scale-105 shadow-2xl z-10" : "z-0" // Ensure dragging node is on top
                    )}
                >
                    <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full p-1"> 
                        <RelationshipMapCard contact={node.contact} onButtonClick={handleViewProfileClick} />
                    </div>
                </foreignObject>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border shadow-lg rounded-md p-2">
              <p className="font-semibold text-sm">{node.contact.name.replace(/\s*\(Dog\)\s*/i, '').trim()}</p>
              {node.contact.occupation && <p className="text-xs">Occupation: {node.contact.occupation}</p>}
              { <p className="text-xs">Role: {getBadgeText(node.contact)}</p>}
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
  const [selectedCentralContactId, setSelectedCentralContactId] = useState<string>('4'); // Default to Sam

  const mapContacts = useMemo(() => {
    return [
        mockContacts.find(c => c.id === '4'), // Sam
        mockContacts.find(c => c.id === '1'), // Chandra
        mockContacts.find(c => c.id === '3'), // Abhas
        mockContacts.find(c => c.id === 'ck_host'), // Curt Kowaleski
    ].filter(Boolean) as Contact[];
  }, []);

  const initialViewBoxDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;

    if (selectedCentralContactId === '4') { // Sam's layout
      maxX = Math.max(
        COL1_X, COL2_X, COL3_X,
        (COL3_X - CARD_WIDTH/2) + CARD_WIDTH + H_SPACING_BETWEEN_PAIRED_CARDS + CARD_WIDTH // Ryan H's right edge
      );
       maxY = Y_ROW3_CARD_Y_VAL + CARD_HEIGHT; // Based on Pets being lowest for Sam
    } else { // Generic layout estimation (can be refined)
      maxX = COL3_X + CARD_WIDTH;
      maxY = Y_SAM_Y + 2 * (CARD_HEIGHT + V_SPACE_BETWEEN_ROWS + LABEL_HEIGHT + V_SPACE_LABEL_CARD); 
    }
    
    const width = maxX + SVG_PADDING_HORIZONTAL * 2; 
    const height = maxY + SVG_PADDING_VERTICAL * 2; 
    return { width: Math.max(1200, width), height: Math.max(1100, height) }; 
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
      a.download = `relationship-map-${mockContacts.find(c=>c.id === selectedCentralContactId)?.name.replace(/\s+/g, '_') || 'contact'}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  const centralContactName = useMemo(() => {
    return mockContacts.find(c => c.id === selectedCentralContactId)?.name || "Selected Contact";
  }, [selectedCentralContactId]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-md bg-card flex-shrink-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
                <Brain className="text-primary" /> Interactive Relationship Map
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Visualize and explore connections for: <span className="font-semibold text-primary">{centralContactName}</span>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 items-start sm:items-center">
                <Select value={selectedCentralContactId} onValueChange={(value) => { setSelectedCentralContactId(value); setViewBoxOrigin({x:0, y:0}); setScale(1); } }>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select Central Contact" />
                    </SelectTrigger>
                    <SelectContent>
                        {mapContacts.map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                               <div className="flex items-center gap-2">
                                 <UserCog className="h-4 w-4 text-muted-foreground"/> {contact.name}
                               </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" title="Zoom In" onClick={() => handleZoom('in')}><ZoomIn className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" title="Zoom Out" onClick={() => handleZoom('out')}><ZoomOut className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" title="Download SVG" onClick={handleDownloadSVG}><Download className="h-4 w-4"/></Button>
                </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="flex-grow shadow-md overflow-hidden bg-card rounded-lg border border-border">
          <CardContent className="p-0 sm:p-4 h-full"> 
              <p className="text-xs text-muted-foreground mb-2 text-center sm:text-left px-4 pt-2 sm:px-0 sm:pt-0">
                Hover over cards for quick info. Drag cards to reposition. Drag background to pan. Lines indicate connections.
              </p>
              <div className="h-[calc(100%-25px)] w-full"> 
                  <RelationshipMapPlaceholder 
                    centralContactId={selectedCentralContactId}
                    viewBox={currentViewBoxString} 
                    scale={scale}
                    currentViewBoxOrigin={viewBoxOrigin}
                    onViewBoxOriginChange={setViewBoxOrigin}
                  />
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
                    <li>Drag the background to pan the map view.</li>
                    <li>Hover over a contact card for quick information.</li>
                    <li>Click "View Profile" on a card to navigate to the contact's detail page.</li>
                    <li>Lines connect the central node to group labels, and group labels to individuals.</li>
                    <li>Use Zoom In/Out buttons to adjust map scale.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

