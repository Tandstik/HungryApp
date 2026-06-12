import { db } from '../db';
import { recipes } from '../db/schema';
import { count } from 'drizzle-orm';

const DB_THRESHOLD = 1; // Artık DB'de 1 tarif bile varsa kullanmayı deneyecek

export interface StoredRecipe {
  id: string;
  title: string;
  summary: string;
  time: string;
  difficulty: string;
  ingredientIds: string[];      // Kullanılan malzeme ID'leri
  ingredientsList: string[];    // Detaylı malzeme listesi
  steps: string[];              // Adımlar
  createdAt: number;
}

// Toplam tarif sayısını döndür
export const getRecipeCount = async (): Promise<number> => {
  try {
    const result = await db.select({ count: count() }).from(recipes);
    return result[0].count;
  } catch (e) {
    console.error('[DB] getRecipeCount hatası:', e);
    return 0;
  }
};

// Yeni tarifleri kaydet (duplicate'ları atla)
export const saveRecipesToDB = async (newRecipes: StoredRecipe[]): Promise<void> => {
  if (newRecipes.length === 0) return;
  try {
    const existing = await db.select({ title: recipes.title }).from(recipes);
    const existingTitles = new Set(existing.map(r => r.title.toLowerCase().trim()));
    
    const newOnes = newRecipes.filter(r => !existingTitles.has(r.title.toLowerCase().trim()));
    if (newOnes.length === 0) return;

    await db.insert(recipes).values(newOnes).onConflictDoNothing();
    console.log(`[DB] ${newOnes.length} yeni tarif kaydedildi.`);
  } catch (e) {
    console.error('[DB] Kaydetme hatası:', e);
  }
};

// Seçili malzemelere uyan tarifleri database'den getir
export const getRecipesFromDB = async (
  selectedIngredientIds: string[],
  limitCount: number = 3
): Promise<StoredRecipe[]> => {
  try {
    const allRecipes = await db.select().from(recipes);
    
    const matching = allRecipes.filter(recipe => {
      const ids = recipe.ingredientIds || [];
      return ids.length > 0 && ids.every((id: string) => selectedIngredientIds.includes(id));
    });

    if (matching.length === 0) return [];

    // Karıştır ve istenen kadar döndür
    const shuffled = [...matching].sort(() => Math.random() - 0.5);
    // @ts-ignore
    return shuffled.slice(0, limitCount) as StoredRecipe[];
  } catch (e) {
    console.error('[DB] getRecipesFromDB hatası:', e);
    return [];
  }
};

// Database'den toplu tüm tarifleri sil (debug amaçlı)
export const clearDB = async (): Promise<void> => {
  try {
    await db.delete(recipes);
  } catch (e) {
    console.error('[DB] clearDB hatası:', e);
  }
};

// AI'dan dönen kart listesini StoredRecipe formatına dönüştür
export const aiCardToStoredRecipe = (
  aiCard: { title: string; summary: string; time: string; difficulty: string },
  ingredientIds: string[],
  ingredientsList: string[],
  steps: string[]
): StoredRecipe => ({
  id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  title: aiCard.title,
  summary: aiCard.summary,
  time: aiCard.time,
  difficulty: aiCard.difficulty,
  ingredientIds,
  ingredientsList,
  steps,
  createdAt: Date.now(),
});

// Karar: DB mi kullanılsın, AI mi?
export const shouldUseDB = async (): Promise<boolean> => {
  const c = await getRecipeCount();
  if (c < DB_THRESHOLD) return false;
  // DB'de tarif varsa her zaman önce DB'yi denesin (AI maliyetini azaltmak için)
  return true; 
};
