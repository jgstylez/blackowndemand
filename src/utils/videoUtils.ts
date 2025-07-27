/**
 * Utility functions for handling video-related operations
 */

/**
 * Extracts the src attribute from an iframe tag
 * This is particularly useful for handling embed codes from platforms like TheBlackTube
 * 
 * @param input - The string that may contain an iframe tag
 * @returns The extracted src URL or the original input if no iframe is found
 */
export const extractVideoSrc = (input: string): string => {
  if (!input) return '';
  
  // If the input is already a URL, return it as is
  if (input.startsWith('http') && !input.includes('<iframe')) {
    return input;
  }
  
  // Regular expression to match the src attribute in an iframe tag
  const srcRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/i;
  const match = input.match(srcRegex);
  
  // If a match is found, return the src URL, otherwise return the original input
  return match && match[1] ? match[1] : input;
};