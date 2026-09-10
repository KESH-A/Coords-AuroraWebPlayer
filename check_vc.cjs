const fs = require('fs');
const path = process.argv[1];
try {
  const content = fs.readFileSync(path, 'utf8');
  console.log('=== CONTENT LENGTH:', content.length, '===');
  console.log(content);
} catch (e) {
  console.error('Error:', e.message);
}
