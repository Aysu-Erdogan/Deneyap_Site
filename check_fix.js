const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\DELL\\Desktop\\Deneyap_Site\\frontend\\yonetici.ejs', 'utf8');
console.log('Has invalid pattern 1:', content.includes(".replace(/'/g, '')"));
console.log('Has invalid pattern 2:', content.includes(".replace(/'/g, \"'/g, \"')"));
console.log('Has &apos;:', content.includes('&apos;'));