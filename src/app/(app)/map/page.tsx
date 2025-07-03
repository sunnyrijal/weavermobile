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

// Layout Constants - Even bigger cards
const CARD_WIDTH = 400; // Increased from 350
const CARD_HEIGHT = 200; // Increased from 170
const LABEL_WIDTH = 180; // Increased label width
const LABEL_HEIGHT = 40; // Increased label height

const Y_OFFSET_TOP = 100;
const V_SPACE_LABEL_CARD = 50;
const V_SPACE_CARD = 150; // Increased vertical space
const V_SPACE_BETWEEN_ROWS = 250; // Increased vertical space between rows

const COL1_X = 500; // Further apart column positions
const COL2_X = 1100; 
const COL3_X = 1700; 

const H_SPACING_BETWEEN_PAIRED_CARDS = 150; // Increased horizontal spacing between paired cards

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


const SVG_PADDING_HORIZONTAL = 400; 
const SVG_PADDING_VERTICAL = 400; 

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

// Helper function to compare MongoDB IDs which might be in different formats
const isSameId = (id1: string | undefined, id2: string | undefined): boolean => {
  // Handle undefined cases
  if (!id1 || !id2) return false;
  
  // MongoDB IDs can sometimes be compared as strings or objects
  // This function normalizes the comparison
  return id1 === id2 || 
         id1 === id2.toString() || 
         id1.toString() === id2;
}

const getBadgeText = (
  nodeContact: Contact,
  centralContact?: Contact
): string => {
  if (centralContact && isSameId(nodeContact.id, centralContact.id)) {
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
      (rel) => isSameId(rel.relatedContactId, nodeContact.id)
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
  
  // Get relationship information
  let relationshipInfo = "";
  if (centralContactForMap && !isSameId(contact.id, centralContactForMap.id)) {
    const relationFromCentralToThis = centralContactForMap.relationships?.find(
      rel => isSameId(rel.relatedContactId, contact.id)
    );
    if (relationFromCentralToThis) {
      relationshipInfo = relationFromCentralToThis.customLabel || relationFromCentralToThis.type;
    }
  }
  
  const badgeText = getBadgeText(contact, centralContactForMap);
  const displayName = contact.name.replace(/\s*\((Dog|Cat|Pet)\)\s*/i, '').trim();
  
  // Get occupation or other key info
  const occupationInfo = contact.occupation || "";
  const locationInfo = contact.currentLocation || "";
  const companyInfo = contact.company || "";
  const collegeInfo = contact.college || "";

  // Determine what secondary info to show
  let secondaryInfo = occupationInfo;
  if (!secondaryInfo && companyInfo) secondaryInfo = `Works at ${companyInfo}`;
  if (!secondaryInfo && collegeInfo) secondaryInfo = `Studies at ${collegeInfo}`;
  if (!secondaryInfo && locationInfo) secondaryInfo = `Lives in ${locationInfo}`;
  
  // Badge color based on relationship type
  const getBadgeStyle = () => {
    if (isSameId(contact.id, centralContactForMap?.id)) {
      return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' };
    }
    
    const relType = centralContactForMap?.relationships?.find(rel => isSameId(rel.relatedContactId, contact.id))?.type;
    
    switch(relType) {
      case 'Parent':
        return { backgroundColor: 'hsl(var(--success))', color: 'white', borderColor: 'hsl(var(--success))' };
      case 'Sibling':
        return { backgroundColor: 'hsl(var(--info))', color: 'white', borderColor: 'hsl(var(--info))' };
      case 'Partner':
        return { backgroundColor: 'hsl(var(--destructive))', color: 'white', borderColor: 'hsl(var(--destructive))' };
      case 'Child':
        return { backgroundColor: 'hsl(var(--warning))', color: 'black', borderColor: 'hsl(var(--warning))' };
      case 'Pet':
        return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', borderColor: 'hsl(var(--accent))' };
      default:
        return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' };
    }
  };

  // Add a function to handle button clicks and stop propagation
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling to parent elements
    onButtonClick(contact.id);
  };

  return (
    <div 
      className="bg-card text-card-foreground rounded-lg shadow-lg p-5 flex flex-col items-center justify-between border border-border overflow-hidden"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <p 
        className="font-semibold text-xl text-center w-full leading-tight pt-1" 
        title={displayName}
      >
        {displayName}
      </p> 
      {badgeText && (
        <Badge 
            variant="outline"
            style={getBadgeStyle()}
            className="mt-3 text-base truncate max-w-[calc(100%-1rem)] px-4 py-1.5 font-semibold" 
        >
            {badgeText}
        </Badge>
      )}
      <p 
        className="text-base text-muted-foreground mt-3 text-center w-full leading-tight" 
        title={secondaryInfo || 'N/A'}
      > 
        {secondaryInfo || 'N/A'}
      </p>
      {locationInfo && (
        <p className="text-base text-muted-foreground mt-2 text-center w-full leading-tight" title={locationInfo}>
          <span className="opacity-70">📍</span> {locationInfo}
        </p>
      )}
      {collegeInfo && (
        <p className="text-base text-muted-foreground mt-2 text-center w-full leading-tight" title={collegeInfo}>
          <span className="opacity-70">🎓</span> {collegeInfo}
        </p>
      )}
      {companyInfo && !secondaryInfo.includes(companyInfo) && (
        <p className="text-base text-muted-foreground mt-2 text-center w-full leading-tight" title={companyInfo}>
          <span className="opacity-70">💼</span> {companyInfo}
        </p>
      )}
      
      {/* Replace button with direct link */}
      <a 
        href={`/contacts/${contact.id}`}
        className="mt-6 w-full text-base h-12 py-2 px-6 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-md transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          // Let the default href navigation handle it
        }}
      >
        View Profile
      </a>
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
  const { toast } = useToast();
  
  // Find central contact
  const centralContact = useMemo(() => contacts.find(c => isSameId(c.id, centralContactId)), [centralContactId, contacts]);
  
  // Build relationship contacts map for lookup
  const relatedContactsMap = useMemo(() => {
    const map: Record<string, Contact> = {};
    if (centralContact?.relationships) {
      centralContact.relationships.forEach(rel => {
        if (rel.relatedContactId) {
          // Find the contact by ID in the contacts array
          const contact = contacts.find(c => isSameId(c.id, rel.relatedContactId));
          if (contact) {
            map[rel.relatedContactId] = contact;
          }
        }
      });
    }
    return map;
  }, [centralContact, contacts]);
  
  // Helper function to get contact by ID (either from contacts list or from relatedContactsMap)
  const getContactById = useCallback((contactId: string): Contact | undefined => {
    // First check in the relatedContactsMap for better performance
    if (relatedContactsMap[contactId]) {
      return relatedContactsMap[contactId];
    }
    // Fall back to searching in the contacts array
    return contacts.find(c => isSameId(c.id, contactId));
  }, [contacts, relatedContactsMap]);
  
  const { nodes: initialNodes, groupLabels: initialGroupLabels } = useMemo(() => {
    if (!centralContact) return { nodes: [], groupLabels: [] };

    const nodes: Node[] = [];
    const groupLabels: GroupLabel[] = [];

    nodes.push({ id: centralContact.id, contact: centralContact, x: COL2_X - CARD_WIDTH / 2, y: Y_SAM_Y });

    // Generic approach for all contacts instead of hardcoded IDs
    const organizedGroups: { [key: string]: { display: string, keyForMatching: string, colX: number, labelY: number, cardY: number, contacts: Contact[] } } = {
        "Parents": { display: "Parents", keyForMatching: "Parent", colX: COL2_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
        "Partner": { display: "Partner", keyForMatching: "Partner", colX: COL1_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
        "Siblings": { display: "Siblings", keyForMatching: "Sibling", colX: COL3_X, labelY: Y_ROW1_LABEL_CY, cardY: Y_ROW1_CARD_Y, contacts: [] },
        "Pets": { display: "Pets", keyForMatching: "Pet", colX: COL2_X, labelY: Y_ROW3_LABEL_CY, cardY: Y_ROW3_CARD_Y_VAL, contacts: [] },
    };
    const otherRelationshipTypes = new Map<string, { contacts: Contact[], display: string, keyForMatching: string }>();

    if (centralContact.relationships && centralContact.relationships.length > 0) {
        centralContact.relationships.forEach(rel => {
            // Get related contact by ID
            const relatedContact = getContactById(rel.relatedContactId);
            if (!relatedContact) {
                console.log(`Related contact not found for ID: ${rel.relatedContactId}, type: ${rel.type}`);
                return;
            }

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
            } else if (rel.type === "Pet") {
                organizedGroups["Pets"].contacts.push(relatedContact);
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
    
    return { nodes, groupLabels };
  }, [centralContact, getContactById]);


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
    console.log("Navigating to contact:", contactId);
    // Use router.push with { scroll: false } to avoid potential scroll issues
    router.push(`/contacts/${contactId}`, { scroll: false });
  }, [router]);
  
  const centralNodeDetails = currentNodes.find(n => isSameId(n.id, centralContact?.id));

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
      style={{ position: "relative" }}
      pointerEvents="visiblePainted"
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
        
        const relationship = centralContact.relationships?.find(
          (rel) => isSameId(rel.relatedContactId, node.id)
        );
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
                rx="10" 
                fill="hsl(var(--accent))" 
            />
            <text 
                x={LABEL_WIDTH/2} 
                y={LABEL_HEIGHT/2 + 6} 
                fontFamily="sans-serif" 
                fontSize="16px" 
                fill="hsl(var(--accent-foreground))" 
                textAnchor="middle"
                fontWeight="bold"
            >
                {label.text}
            </text>
        </g>
      ))}

      {/* Nodes (Contact Cards) - Updated to fix link click issue */}
      {currentNodes.map(node => (
        <foreignObject 
          key={node.id}
          x={node.x} 
          y={node.y} 
          width={CARD_WIDTH} 
          height={CARD_HEIGHT}
          onMouseDown={(e) => {
            // Only initiate dragging if not clicking on the link
            if ((e.target as HTMLElement).tagName !== 'A') {
              handleNodeMouseDown(e, node.id);
            }
          }}
          style={{ 
            pointerEvents: "auto",
            overflow: "visible"
          }}
        >
          <div className="w-full h-full p-0.5"> 
            <RelationshipMapCard 
              contact={node.contact} 
              onButtonClick={handleViewProfileClick} 
              centralContactForMap={centralContact}
            />
          </div>
        </foreignObject>
      ))}
    </svg>
  );
};


export default function RelationshipMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { contacts, isLoading, error } = useContacts();

  // Debug logging to help troubleshoot
  useEffect(() => {
    if (contacts.length > 0) {
      console.log("Loaded contacts:", contacts.length);
      console.log("Sample contact:", contacts[0]);
      
      // Check for relationships
      const contactsWithRelationships = contacts.filter(c => c.relationships && c.relationships.length > 0);
      console.log("Contacts with relationships:", contactsWithRelationships.length);
      
      if (contactsWithRelationships.length > 0) {
        const sampleWithRel = contactsWithRelationships[0];
        console.log("Sample contact with relationships:", sampleWithRel.name);
        console.log("Relationships:", sampleWithRel.relationships);
        
        // Check if related contacts exist
        sampleWithRel.relationships.forEach(rel => {
          const relatedContact = contacts.find(c => c.id === rel.relatedContactId);
          console.log(`Related contact for ${rel.type}:`, relatedContact ? relatedContact.name : "Not found");
        });
      }
    }
  }, [contacts]);

  const mapContacts = useMemo(() => {
    return contacts;
  }, [contacts]);

  const defaultMapContactId = useMemo(() => {
    return mapContacts.length > 0 ? mapContacts[0].id : ''; // Default to first contact
  }, [mapContacts]);

  const [selectedCentralContactId, setSelectedCentralContactId] = useState<string>(() => {
    const contactIdFromQuery = searchParams.get('contactId');
    if (contactIdFromQuery && mapContacts.some(c => isSameId(c.id, contactIdFromQuery))) {
      return contactIdFromQuery;
    }
    return defaultMapContactId;
  });
  
  useEffect(() => {
    const contactIdFromQuery = searchParams.get('contactId');
    if (contactIdFromQuery && mapContacts.some(c => isSameId(c.id, contactIdFromQuery))) {
        if (!isSameId(selectedCentralContactId, contactIdFromQuery)) {
            setSelectedCentralContactId(contactIdFromQuery);
        }
    } else if (!contactIdFromQuery && !isSameId(selectedCentralContactId, defaultMapContactId)) {
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
      maxY = Y_ROW3_CARD_Y_VAL + CARD_HEIGHT + 400; 
    } else { // Simpler maps (Chandra, Abhas)
      maxX = COL3_X + CARD_WIDTH * 1.5; 
      maxY = Y_SAM_Y + 3 * (CARD_HEIGHT + V_SPACE_BETWEEN_ROWS + LABEL_HEIGHT + V_SPACE_LABEL_CARD); 
    }
    
    const width = maxX + SVG_PADDING_HORIZONTAL * 2; 
    const height = maxY + SVG_PADDING_VERTICAL * 2; 
    return { 
      width: Math.max(2500, width), 
      height: Math.max(2000, height) 
    }; 
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
            <div className="space-y-2 sm:space-y-3">
                <p className="font-medium mb-1 text-foreground">Relationship Types:</p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }} className="h-5">Central</Badge>
                        <span className="text-muted-foreground">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--success))', color: 'white' }} className="h-5">Parent</Badge>
                        <span className="text-muted-foreground">Mother/Father</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--info))', color: 'white' }} className="h-5">Sibling</Badge>
                        <span className="text-muted-foreground">Brother/Sister</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--destructive))', color: 'white' }} className="h-5">Partner</Badge>
                        <span className="text-muted-foreground">Spouse/Partner</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--warning))', color: 'black' }} className="h-5">Child</Badge>
                        <span className="text-muted-foreground">Son/Daughter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="h-5">Pet</Badge>
                        <span className="text-muted-foreground">Pet/Animal</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                    <p className="font-medium text-foreground">Node Types:</p>
                    <div className="flex items-center gap-2">
                        <div className="w-14 h-10 bg-card border border-border rounded-md shadow-sm flex flex-col items-center justify-center">
                            <div className="text-[8px] font-medium">Name</div>
                            <div className="bg-muted text-[7px] px-1 rounded-sm mt-0.5">Role</div>
                        </div>
                        <span className="text-muted-foreground">Contact Card</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-[10px] font-semibold shadow-sm">Group Label</div>
                        <span className="text-muted-foreground">Relationship Group</span>
                    </div>
                </div>
            </div>
            <div className="md:ml-auto space-y-1 sm:space-y-2 mt-3 md:mt-0">
                <p className="font-medium mb-1 text-foreground">Interactions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 sm:space-y-1">
                    <li>Drag cards to reposition.</li>
                    <li>Drag background to pan map.</li>
                    <li>Hover on cards for detailed info.</li>
                    <li>Click "View Profile" for full details.</li>
                    <li>Use Zoom & Download buttons.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}