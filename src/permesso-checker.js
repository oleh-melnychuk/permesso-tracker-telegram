import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'https://questure.poliziadistato.it/servizio/stranieri';

/**
 * Sanitize text for Telegram HTML parse mode
 * Preserves <a href="...">...</a> links and <br> tags
 */
export function sanitizeForTelegram(text) {
  if (!text) return '';
  
  // Placeholder for links
  const links = [];
  
  // Extract and preserve <a> tags
  let result = text.replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (match, href, content) => {
    const placeholder = `__LINK_${links.length}__`;
    links.push({ href, content });
    return placeholder;
  });
  
  // Convert <br> to newlines
  result = result.replace(/<br\s*\/?>/gi, '\n');
  
  // Escape HTML special characters
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  // Restore links with Telegram-compatible HTML
  links.forEach((link, index) => {
    const safeContent = link.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    result = result.replace(`__LINK_${index}__`, `<a href="${link.href}">${safeContent}</a>`);
  });
  
  return result;
}

/**
 * Fetch permesso di soggiorno status from the police website
 * @param {string} praticaNumber - The pratica (case) number
 * @param {string} lang - Language code (ukrainian, english, italian, etc.)
 * @returns {Promise<Object|null>} Status object or null if failed
 */
export async function fetchPermessoStatus(praticaNumber, lang = 'ukrainian') {
  const url = `${BASE_URL}?lang=${lang}&pratica=${praticaNumber}&invia=Invia&mime=4`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/xml, text/xml, */*',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const xmlText = await response.text();
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  
  const result = parser.parse(xmlText);
  const item = result?.rss?.channel?.item;
  
  if (!item) {
    return null;
  }
  
  return {
    praticaNumber: sanitizeForTelegram(praticaNumber),
    description: sanitizeForTelegram(item.description?.trim() || ''),
    pubDate: sanitizeForTelegram(item.pubDate || ''),
    link: item.guid || '',
  };
}
