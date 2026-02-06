import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'https://questure.poliziadistato.it/servizio/stranieri';

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
    praticaNumber,
    description: item.description?.trim() || '',
    pubDate: item.pubDate || '',
    link: item.guid || '',
  };
}
