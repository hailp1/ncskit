const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(process.cwd());
let changedFiles = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('https://ncskit.org')) {
        // Only replace exact matches, be careful with https://ncskit.org/something
        const newContent = content.replace(/https:\/\/ncskit\.org/g, 'https://open.ncskit.org');
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated: ${file}`);
            changedFiles++;
        }
    }
});

console.log(`Total files updated: ${changedFiles}`);
