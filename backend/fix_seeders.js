const fs = require('fs');

function fix(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/from '\.\.\/\.\.\/generated\/prisma'/g, "from '../../../generated/prisma'");
    fs.writeFileSync(filePath, content);
}
fix('backend/src/common/seeders/catalog.seeder.ts');
fix('backend/src/common/seeders/supermarket-merchant.seeder.ts');
