import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon('postgresql://neondb_owner:npg_lL28bEBZuwWs@ep-dawn-sound-as9vl7ki-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require');
export const db = drizzle(sql, { schema });
