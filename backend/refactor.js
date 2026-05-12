const fs = require('fs');

function refactorService(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove TypeORM imports
  content = content.replace(/import \{ InjectRepository \} from '@nestjs\/typeorm';\n/g, '');
  content = content.replace(/import \{\n  DataSource,\n  DeepPartial,\n  EntityManager,\n  In,\n  IsNull,\n  Repository,\n\} from 'typeorm';\n/g, '');
  
  // Replace entity imports with Prisma model imports
  content = content.replace(/import \{ Order \} from '.\/entities\/order\.entity';/g, "import { Order, OrderItem, DayClosure, Prisma } from '../../generated/prisma';");
  content = content.replace(/import \{ OrderItem \} from '.\/entities\/order-item\.entity';\n/g, '');
  content = content.replace(/import \{ DayClosure \} from '.\/entities\/day-closure\.entity';\n/g, '');
  content = content.replace(/import \{ Product \} from 'src\/products\/entities\/product\.entity';/g, "import { Product } from '../../generated/prisma';");
  content = content.replace(/import \{ ProductPriceHistory \} from 'src\/products\/entities\/product-price-history\.entity';/g, "import { ProductPriceHistory } from '../../generated/prisma';");

  // Inject PrismaService
  content = content.replace(/@InjectRepository\(Order\)\n\s+private readonly ordersRepository: Repository<Order>,/g, '');
  content = content.replace(/@InjectRepository\(OrderItem\)\n\s+private readonly orderItemsRepository: Repository<OrderItem>,/g, '');
  content = content.replace(/@InjectRepository\(Product\)\n\s+private readonly productsRepository: Repository<Product>,/g, '');
  content = content.replace(/@InjectRepository\(DayClosure\)\n\s+private readonly dayClosuresRepository: Repository<DayClosure>,/g, '');
  content = content.replace(/private readonly dataSource: DataSource,/g, '');
  
  content = content.replace(/constructor\(/g, "constructor(\n    private readonly prisma: PrismaService,");

  // Add PrismaService import if not exists
  if (!content.includes('PrismaService')) {
    content = "import { PrismaService } from 'src/prisma/prisma.service';\n" + content;
  }

  // Update withTenantManager
  content = content.replace(/private async withTenantManager<T>\(\n\s+tenantId: string,\n\s+callback: \(manager: EntityManager\) => Promise<T>,\n\s+\): Promise<T> \{/g, `private async withTenantManager<T>(
    tenantId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {`);

  content = content.replace(/const manager = DbTenantContext\.getManager\(\);/g, 'const manager = DbTenantContext.getManager() as Prisma.TransactionClient | undefined;');

  // Re-write the internal logic of withTenantManager
  content = content.replace(/return await this\.dataSource\.transaction\(async \(manager\) => \{/g, `return await this.prisma.$transaction(async (manager) => {
      await manager.$executeRaw\`SELECT set_config('app.tenant_id', '\${tenantId}', true)\`;`);

  fs.writeFileSync(filePath, content);
}

refactorService('backend/src/orders/orders.service.ts');
if (fs.existsSync('backend/src/webhooks/webhooks.service.ts')) {
    refactorService('backend/src/webhooks/webhooks.service.ts');
}
