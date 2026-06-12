import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.EXPO_PUBLIC_DATABASE_URL || '';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
