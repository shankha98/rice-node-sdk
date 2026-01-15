import { storage } from "../dist";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const host = process.env.RICEDB_HOST || "localhost";
  console.log(`Connecting to Storage at ${host}`);
  const db = new storage(host, "auto");

  try {
    await db.connect();
    console.log("Storage connected successfully");

    const health = await db.health();
    console.log("Health:", health);

    db.disconnect();
  } catch (e) {
    console.error("Storage connection failed:", e);
  }
}
main().catch(console.error);
