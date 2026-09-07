export interface WikiMonumentDetails {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  coordinates?: { lat: number; lon: number };
  contentUrls: { desktop: string; mobile: string };
}

const getHeaders = () => ({
  'User-Agent': 'GhoomHeritageApp/1.0 (https://github.com/ghoom-heritage; contact@ghoom.local)',
  'Api-User-Agent': 'GhoomHeritageApp/1.0'
});

/** Convert a monument name to candidate Wikipedia article titles */
function getCandidateTitles(name: string): string[] {
  const base = name.trim();
  const candidates: string[] = [base];

  // Remove parenthetical qualifiers: "Varanasi Ghats (Dashashwamedh)" → "Varanasi Ghats"
  const withoutParen = base.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (withoutParen !== base) candidates.push(withoutParen);

  // Remove "Group of Monuments at " → just the location
  const withoutGroupPrefix = base.replace(/^Group of Monuments at /i, '').trim();
  if (withoutGroupPrefix !== base) candidates.push(withoutGroupPrefix);

  // For "Ghats" entries, try "<City> ghat" (e.g. "Dashashwamedh Ghat")
  const ghatsMatch = base.match(/\(([^)]+)\)/);
  if (ghatsMatch) candidates.push(ghatsMatch[1].trim()); // inner paren content

  // Deduplicate
  return [...new Set(candidates)];
}

async function fetchSummaryByTitle(title: string): Promise<WikiMonumentDetails | null> {
  const sanitized = encodeURIComponent(title.trim().replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${sanitized}`;
  const response = await fetch(url, { headers: getHeaders() });

  if (response.status === 404) return null;
  if (response.status === 403 || response.status === 401) throw new Error('WIKIMEDIA_403');
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.extract) return null; // disambiguation page or empty

  return {
    title: data.title,
    extract: data.extract,
    description: data.description,
    thumbnailUrl: data.thumbnail?.source,
    originalImageUrl: data.originalimage?.source,
    coordinates: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : undefined,
    contentUrls: {
      desktop: data.content_urls?.desktop?.page,
      mobile: data.content_urls?.mobile?.page
    }
  };
}

export async function fetchMonumentSummary(name: string): Promise<WikiMonumentDetails | null> {
  const candidates = getCandidateTitles(name);
  for (const candidate of candidates) {
    const result = await fetchSummaryByTitle(candidate);
    if (result) return result;
  }
  return null;
}

export async function searchMonument(query: string): Promise<string | null> {
  const cleanQuery = query
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/^Group of Monuments at /i, '')
    .trim();
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=3&namespace=0&format=json`;
  const response = await fetch(url, { headers: getHeaders() });

  if (response.status === 403 || response.status === 401) throw new Error('WIKIMEDIA_403');
  if (!response.ok) return null;

  const data = await response.json();
  if (data[1] && data[1].length > 0) return data[1][0];
  return null;
}
