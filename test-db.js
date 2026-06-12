const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { pgTable, text, integer } = require('drizzle-orm/pg-core');

const sql = neon('postgresql://neondb_owner:npg_lL28bEBZuwWs@ep-dawn-sound-as9vl7ki-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require');
const db = drizzle(sql);

const recipes = pgTable('recipes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  time: text('time').notNull(),
  difficulty: text('difficulty'),
  ingredientIds: text('ingredientIds').array().notNull(),
  ingredientsList: text('ingredientsList').array().notNull(),
  steps: text('steps').array().notNull(),
  createdAt: integer('createdAt').notNull(),
});

async function run() {
  try {
    const data = {
      id: 'test3',
      title: 'T',
      summary: 'S',
      time: '1',
      difficulty: '1',
      ingredientIds: ['1', '2'],
      ingredientsList: ['A', 'B'],
      steps: ['C', 'D'],
      createdAt: 123
    };
    await db.insert(recipes).values([data]).onConflictDoNothing({ target: recipes.id });
    console.log("Drizzle Insert Success");
  } catch (e) {
    console.error("Drizzle ERROR", e);
  }
}
run();
