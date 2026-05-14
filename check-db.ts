import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const users = await pool.query("SELECT * FROM \"user\"");
    console.log("USERS:", users.rows);
    
    const accounts = await pool.query("SELECT * FROM \"account\"");
    console.log("ACCOUNTS:", accounts.rows);

    const verifications = await pool.query("SELECT * FROM \"verification\"");
    console.log("VERIFICATIONS:", verifications.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
