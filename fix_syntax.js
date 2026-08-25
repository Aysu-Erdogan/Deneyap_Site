const fs = require('fs');
let content = fs.readFileSync('C:\\Users\\DELL\\Desktop\\Deneyap_Site\\frontend\\js\\yonetici.js', 'utf8');

// Fix pattern 1: .replace(/'/g, '') -> .replace(/'/g, '&apos;')
content = content.split(".replace(/'/g, '')").join(".replace(/'/g, '&apos;')");

// Fix pattern 2: .replace(/'/g, "'/g, ")") -> .replace(/'/g, '&apos;')
content = content.split('.replace(/'/g, \'"/g, ")').join(".replace(/\\'/g, '&apos;')");

fs.writeFileSync('C:\\Users\\DELL\\Desktop\\Deneyap_Site\\frontend\\js\\yonetici.js', content);
console.log('Done');