const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting pool customers import...');
  const poolService = await prisma.service.findUnique({
    where: { name: 'Pool Facilities' },
  });

  if (!poolService) {
    throw new Error('Service "Pool Facilities" not found');
  }

  const dataPath = path.join(__dirname, '..', 'prisma', 'data', 'pool_customers.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found at ${dataPath}`);
  }
  const poolCustomers = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Loaded ${poolCustomers.length} pool customers from JSON.`);

  // Find all existing customers by phone
  const phones = poolCustomers.map(p => p.phone).filter(Boolean);
  const existing = await prisma.customer.findMany({
    where: { phone: { in: phones } },
    select: { id: true, phone: true },
  });
  const existingMap = new Map(existing.map(c => [c.phone, c.id]));
  console.log(`Found ${existing.length} existing customers with matching phone.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of poolCustomers) {
    const existingId = item.phone ? existingMap.get(item.phone) : null;
    if (existingId) {
      await prisma.customer.update({
        where: { id: existingId },
        data: {
          services: {
            connect: { id: poolService.id },
          },
        },
      });
      updatedCount++;
    } else {
      await prisma.customer.create({
        data: {
          name: item.name,
          phone: item.phone,
          address: item.address || null,
          notes: item.notes || 'Customer registered from Pool Side records',
          services: {
            connect: { id: poolService.id },
          },
        },
      });
      createdCount++;
    }
  }

  console.log(`Import finished! Created: ${createdCount}, Updated: ${updatedCount}`);
  const totalInDb = await prisma.customer.count();
  const poolCount = await prisma.customer.count({
    where: { services: { some: { name: 'Pool Facilities' } } },
  });
  console.log(`Total customers now in database: ${totalInDb}`);
  console.log(`Total customers with "Pool Facilities" service: ${poolCount}`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
