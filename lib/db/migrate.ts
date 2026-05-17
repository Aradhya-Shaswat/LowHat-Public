import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function runMigrations() {
  // console.log('⏳ Running migrations...');
  const start = Date.now();

  try {
    await migrate(db, { migrationsFolder: 'lib/db/migrations' });
    const end = Date.now();
    // console.log(`✅ Migrations completed successfully in ${end - start}ms`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
