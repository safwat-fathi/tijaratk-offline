const fs = require('fs');

function fixFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(([oldStr, newStr]) => {
        content = content.replace(oldStr, newStr);
    });
    fs.writeFileSync(filePath, content);
}

fixFile('backend/src/common/seeders/catalog.seeder.ts', [
    [/import \{ CatalogItem \} from 'src\/products\/entities\/catalog-item\.entity';/g, "import { CatalogItem } from '../../generated/prisma';"],
    [/import \{ Product \} from 'src\/products\/entities\/product\.entity';/g, "import { Product } from '../../generated/prisma';"]
]);

fixFile('backend/src/common/seeders/supermarket-merchant.seeder.ts', [
    [/import \{ Product \} from 'src\/products\/entities\/product\.entity';/g, "import { Product } from '../../generated/prisma';"],
    [/import \{ TenantProductCategory \} from 'src\/products\/entities\/tenant-product-category\.entity';/g, "import { TenantProductCategory } from '../../generated/prisma';"]
]);

fixFile('backend/src/orders/order-whatsapp.service.ts', [
    [/import \{ Order \} from '\.\/entities\/order\.entity';/g, "import { Order } from '../../generated/prisma';"],
    [/import \{ OrderItem \} from '\.\/entities\/order-item\.entity';/g, "import { OrderItem } from '../../generated/prisma';"]
]);

