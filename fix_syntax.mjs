import fs from 'fs';
let content = fs.readFileSync('C:\\Users\\DELL\\Desktop\\Deneyap_Site\\frontend\\js\\yonetici.js', 'utf8');
content = content.replaceAll(".replace(/'/g, '')", '.replace(/'/g, "&apos;")');
content = content.replaceAll('.replace(/'/g, "\'/g, \"'\")', '.replace(/\'/g, "&apos;")');
fs.writeFileSync('C:\\Users\\DELL\\Desktop\\Deneyap_Site\\frontend\\js\\yonetici.js', content);
console.log('Done');