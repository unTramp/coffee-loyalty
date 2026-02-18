import { db } from './index.js';
import { shops, staff } from './schema.js';
import { config } from '../config.js';

async function seed() {
  console.log('Seeding database...');

  // Create shop
  const [shop] = await db.insert(shops).values({
    name: 'Coffee Loyalty Shop',
    hmacSecret: config.hmacSecret,
    stampGoal: 6,
    minIntervalSeconds: 60,
  }).returning();

  console.log('Created shop:', shop.id);

  // Create admin
  const [admin] = await db.insert(staff).values({
    shopId: shop.id,
    email: 'admin@coffee.local',
    name: 'Admin',
    role: 'admin',
  }).returning();

  console.log('Created admin:', admin.email);

  // Create barista
  const [barista] = await db.insert(staff).values({
    shopId: shop.id,
    email: 'barista@coffee.local',
    name: 'Barista',
    role: 'barista',
  }).returning();

  console.log('Created barista:', barista.email);
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
