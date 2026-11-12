import fs from 'fs';
import zlib from 'zlib';

const pdf = fs.readFileSync('C:/Users/User/.gemini/antigravity/brain/9770a52a-14f8-4812-84ac-6cd9cc72df7d/.user_uploaded/media_1794491660667_28d49991.pdf');
const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
let match;
let fullText = '';

while ((match = streamRegex.exec(pdf.toString('latin1'))) !== null) {
  try {
    const buf = Buffer.from(match[1], 'latin1');
    const decompressed = zlib.inflateSync(buf);
    const str = decompressed.toString('utf8');
    // Extract text in parentheses (text) Tj or [(text)] TJ
    const tjRegex = /\((.*?)\)\s*Tj/g;
    let m2;
    while ((m2 = tjRegex.exec(str)) !== null) {
      fullText += m2[1] + ' ';
    }
  } catch (e) {
    // not deflate or error
  }
}

console.log('Sample extracted text:');
console.log(fullText.slice(0, 1500));
