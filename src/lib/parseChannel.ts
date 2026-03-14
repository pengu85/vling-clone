/**
 * Parse user input that could be a YouTube channel ID, handle, URL, or search term.
 */
export function parseChannelInput(input: string): { type: "id" | "handle" | "search"; value: string } {
  const trimmed = input.trim();

  // Direct channel ID (UC...)
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  // URL patterns
  const urlPatterns = [
    /youtube\.com\/channel\/(UC[\w-]{22})/,
    /youtube\.com\/@([\w.-]+)/,
    /youtube\.com\/c\/([\w.-]+)/,
  ];
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      if (match[1].startsWith("UC")) return { type: "id", value: match[1] };
      return { type: "handle", value: match[1] };
    }
  }

  // @handle
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1) };
  }

  // Fallback to search
  return { type: "search", value: trimmed };
}
