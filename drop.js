import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_lL28bEBZuwWs@ep-dawn-sound-as9vl7ki-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require');

async function run() {
  await sql`DROP TABLE IF EXISTS "recipes";`;
  console.log("Table dropped.");
}
run();
