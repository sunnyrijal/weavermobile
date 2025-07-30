// whisperTransform.ts
// Utility for Whisper-style 'quick note' transformation

export interface QuickNoteResult {
  formatted: string;
  note: string;
}

/**
 * Extracts structured info from freeform text and returns a formatted quick note and note section.
 * This is a rule-based approximation of Whisper's LLM transform.
 */
export function whisperQuickNoteTransform(input: string): QuickNoteResult {
  // Basic regexes for demo purposes
  const nameMatch = input.match(/(?:was|is|named|roommate|girlfriend|boyfriend|mom|dad|brother|sister|friend|partner|name is) ([A-Z][a-z]+ [A-Z][a-z]+)/);
  const ageMatch = input.match(/age (\d{1,3})|([0-9]{1,3}) years old/);
  const majorMatch = input.match(/(major|studies|studying|occupation|works as|job):? ([A-Za-z ]+)/i);
  const girlfriendMatch = input.match(/girlfriend[:]? ([A-Z][a-z]+ [A-Z][a-z]+)/i);
  const momMatch = input.match(/mom[:]? ([A-Z][a-z]+ [A-Z][a-z]+)(?: \(.*\))?/i);
  const dadMatch = input.match(/dad[:]? ([A-Z][a-z]+ [A-Z][a-z]+)(?: \(.*\))?/i);
  const brotherMatch = input.match(/brother[:]? ([A-Z][a-z]+ [A-Z][a-z]+)/i);
  const hometownMatch = input.match(/Home: ([^\.]+)|from ([^\.]+)|hometown:? ([^\.]+)/i);
  const collegeMatch = input.match(/goes to ([A-Za-z ]+ University)|attends ([A-Za-z ]+ University)/i);
  const currentMatch = input.match(/Currently (?:goes to|attends|lives in) ([A-Za-z ,]+)/i);

  // Compose output
  let formatted = '';
  if (nameMatch) formatted += `${nameMatch[1] || nameMatch[2] || ''}\n`;
  if (ageMatch) formatted += `\nAge: ${ageMatch[1] || ageMatch[2]}`;
  if (majorMatch) formatted += `\nMajor: ${majorMatch[2]}`;
  if (girlfriendMatch) formatted += `\nGirlfriend: ${girlfriendMatch[1]}`;
  if (momMatch) formatted += `\nMom: ${momMatch[1]}`;
  if (dadMatch) formatted += `\nDad: ${dadMatch[1]}`;
  if (brotherMatch) formatted += `\nBrother: ${brotherMatch[1]}`;
  if (hometownMatch) formatted += `\nHometown: ${hometownMatch[1] || hometownMatch[2] || hometownMatch[3]}`;
  if (collegeMatch) formatted += `\nCurrently at: ${collegeMatch[1] || collegeMatch[2]}`;
  else if (currentMatch) formatted += `\nCurrently at: ${currentMatch[1]}`;

  // Auto-generate Note section
  let note = '';
  if (/roommate/i.test(input) && nameMatch) {
    note = `${nameMatch[1] || nameMatch[2] || ''} is my roommate`;
  } else if (/girlfriend/i.test(input) && girlfriendMatch) {
    note = `${girlfriendMatch[1]} is my friend's girlfriend`;
  } else if (nameMatch) {
    note = `${nameMatch[1] || nameMatch[2] || ''} is mentioned in this memory.`;
  }

  return { formatted: formatted.trim(), note };
} 