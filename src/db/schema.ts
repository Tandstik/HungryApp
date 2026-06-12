import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
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
