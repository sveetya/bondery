/**
 * Sanitizes a name by removing emojis and special characters,
 * keeping only letters, spaces, hyphens, and apostrophes.
 *
 * @param name - The name string to sanitize
 * @returns The sanitized name string
 */
export const sanitizeName = (name: string): string => {
  return name
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, "") // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, "") // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "") // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "") // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "") // Symbols and Pictographs Extended-A
    .replace(/[^\p{L}\s'-]/gu, "") // Keep only letters, spaces, hyphens, and apostrophes
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .trim();
};
