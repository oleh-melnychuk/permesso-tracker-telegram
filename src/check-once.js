import 'dotenv/config';
import { fetchPermessoStatus } from './permesso-checker.js';

const PRATICA_NUMBER = process.env.PRATICA_NUMBER;
const LANG = process.env.LANG || 'ukrainian';

async function main() {
  console.log(`🔍 Checking pratica: ${PRATICA_NUMBER}\n`);
  
  try {
    const status = await fetchPermessoStatus(PRATICA_NUMBER, LANG);
    
    if (!status) {
      console.log('❌ Could not fetch status');
      process.exit(1);
    }
    
    console.log(`📝 Pratica: ${status.praticaNumber}`);
    console.log(`📅 Date: ${status.pubDate}`);
    console.log(`📌 Status: ${status.description}`);
    console.log(`🔗 Link: ${status.link}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
