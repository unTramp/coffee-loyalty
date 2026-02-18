import { pgTable, uuid, varchar, integer, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  hmacSecret: varchar('hmac_secret', { length: 255 }).notNull(),
  stampGoal: integer('stamp_goal').notNull().default(6),
  minIntervalSeconds: integer('min_interval_seconds').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  otpCode: varchar('otp_code', { length: 10 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  role: varchar('role', { length: 50 }).notNull().default('barista'), // admin | barista
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: varchar('telegram_id', { length: 50 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  otpCode: varchar('otp_code', { length: 10 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const loyaltyCards = pgTable('loyalty_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  stampCount: integer('stamp_count').notNull().default(0),
  totalRedeemed: integer('total_redeemed').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('loyalty_cards_customer_shop_idx').on(table.customerId, table.shopId),
]);

export const stampTransactions = pgTable('stamp_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').notNull().references(() => loyaltyCards.id),
  staffId: uuid('staff_id').references(() => staff.id),
  type: varchar('type', { length: 20 }).notNull(), // stamp | redeem | void
  stampsBefore: integer('stamps_before').notNull(),
  stampsAfter: integer('stamps_after').notNull(),
  qrPayload: text('qr_payload'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
