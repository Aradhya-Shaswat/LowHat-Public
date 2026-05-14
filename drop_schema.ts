import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  console.log("Dropped and recreated public schema");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
