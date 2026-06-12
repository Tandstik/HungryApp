import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_lL28bEBZuwWs@ep-dawn-sound-as9vl7ki-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  },
} satisfies Config;
