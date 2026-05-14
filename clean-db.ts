import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clean() {
  try {
    await pool.query("DELETE FROM \"user\"");
    await pool.query("DELETE FROM \"account\"");
    await pool.query("DELETE FROM \"verification\"");
    console.log("Database cleaned.");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
clean();
