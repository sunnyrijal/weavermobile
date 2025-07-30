import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 and 1, where 1 means identical
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Quick exact match check
  if (s1 === s2) return 1;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    // Higher similarity for substring matches
    const longerLength = Math.max(s1.length, s2.length);
    const shorterLength = Math.min(s1.length, s2.length);
    return shorterLength / longerLength * 0.9; // 90% similarity for substring
  }
  
  // For names, check if first or last names match exactly
  const s1Parts = s1.split(/\s+/);
  const s2Parts = s2.split(/\s+/);
  
  for (const part1 of s1Parts) {
    if (part1.length > 2) { // Avoid matching on short parts like "de", "la", etc.
      for (const part2 of s2Parts) {
        if (part1 === part2 && part1.length > 2) {
          return 0.8; // 80% similarity for matching name parts
        }
      }
    }
  }
  
  // Calculate Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return maxLength === 0 ? 1 : (1 - distance / maxLength);
}

/**
 * Find potential matches between a person name and a list of contacts
 * Returns an array of matching contact IDs with their similarity scores
 * Now also matches against nicknames/notes for smarter matching (as in Ask AI)
 */
export function findPotentialContactMatches(personName: string, contacts: any[], threshold = 0.7) {
  if (!personName || !contacts?.length) return [];
  const lowerPersonName = personName.toLowerCase();
  return contacts
    .map(contact => {
      let similarity = calculateStringSimilarity(personName, contact.name);
      let reason = '';
      
      // Check if personName is a substring of contact name (e.g., "Alice" in "Alice Williams")
      if (contact.name.toLowerCase().includes(lowerPersonName)) {
        similarity = Math.max(similarity, 0.9);
        reason = 'Partial name match';
      }
      
      // Check if contact name starts with personName (e.g., "Alice" matches "Alice Williams")
      if (contact.name.toLowerCase().startsWith(lowerPersonName + ' ')) {
        similarity = Math.max(similarity, 0.95);
        reason = 'First name match';
      }
      
      // Boost similarity if the personName is found in notes (nickname match)
      if (contact.notes && contact.notes.toLowerCase().includes(lowerPersonName)) {
        similarity = Math.max(similarity, 0.95); // treat as a strong match
        reason = 'Matched in notes';
      }
      // Boost similarity if the personName matches the nickname
      if (contact.nickname && contact.nickname.toLowerCase().includes(lowerPersonName)) {
        similarity = Math.max(similarity, 0.98);
        reason = 'Matched nickname';
      }
      // If exact match to nickname, set to 1.0
      if (contact.nickname && contact.nickname.toLowerCase() === lowerPersonName) {
        similarity = 1.0;
        reason = 'Exact nickname match';
      }
      // If exact match to name, set to 1.0
      if (contact.name && contact.name.toLowerCase() === lowerPersonName) {
        similarity = 1.0;
        reason = 'Exact name match';
      }
      if (similarity >= threshold) {
        console.debug(`[findPotentialContactMatches] Matched contact:`, {
          id: contact.id,
          name: contact.name,
          nickname: contact.nickname,
          similarity,
          reason
        });
      }
      return {
        id: contact.id,
        name: contact.name,
        nickname: contact.nickname,
        similarity,
        reason
      };
    })
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
