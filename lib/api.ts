import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface FoodEntry {
  id?: string;
  user_id?: string;
  food_name: string;
  calories: number;
  protein: number;
  sodium: number;
  sugar: number;
  fat: number;
  serving_size?: string;
  eaten_at?: string;
  created_at?: string;
}

export interface WeekDay {
  date: string;
  calories: number;
}

export interface FoodResult {
  name: string;
  calories: number;
  protein: number;
  sodium: number;
  sugar: number;
  fat: number;
  serving_size?: string;
}

type FirestoreData = Record<string, unknown>;

function docToEntry(id: string, data: FirestoreData): FoodEntry {
  return {
    id,
    user_id: data.user_id as string,
    food_name: data.food_name as string,
    calories: Number(data.calories),
    protein: Number(data.protein),
    sodium: Number(data.sodium),
    sugar: Number(data.sugar),
    fat: Number(data.fat),
    serving_size: (data.serving_size as string) ?? undefined,
    eaten_at: (data.eaten_at as Timestamp).toDate().toISOString(),
    created_at: (data.created_at as Timestamp).toDate().toISOString(),
  };
}

export async function getTodayLog(userId: string): Promise<FoodEntry[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'food_log'),
    where('user_id', '==', userId),
    where('eaten_at', '>=', Timestamp.fromDate(start)),
    where('eaten_at', '<=', Timestamp.fromDate(end)),
    orderBy('eaten_at', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToEntry(d.id, d.data() as FirestoreData));
}

export async function getWeekLog(userId: string): Promise<WeekDay[]> {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'food_log'),
    where('user_id', '==', userId),
    where('eaten_at', '>=', Timestamp.fromDate(start)),
    where('eaten_at', '<=', Timestamp.fromDate(end))
  );

  const snapshot = await getDocs(q);

  // Pre-fill all 7 days with 0
  const grouped: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    grouped[d.toISOString().split('T')[0]] = 0;
  }

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const date = (data.eaten_at as Timestamp).toDate().toISOString().split('T')[0];
    if (date in grouped) {
      grouped[date] += Number(data.calories);
    }
  }

  return Object.entries(grouped).map(([date, calories]) => ({ date, calories }));
}

export async function addFoodEntry(
  userId: string,
  entry: Omit<FoodEntry, 'id' | 'user_id' | 'created_at'>
): Promise<FoodEntry> {
  const now = new Date();
  const eatenAt = entry.eaten_at ? new Date(entry.eaten_at) : now;

  const docRef = await addDoc(collection(db, 'food_log'), {
    user_id: userId,
    food_name: entry.food_name,
    calories: entry.calories,
    protein: entry.protein,
    sodium: entry.sodium,
    sugar: entry.sugar,
    fat: entry.fat,
    serving_size: entry.serving_size ?? null,
    eaten_at: Timestamp.fromDate(eatenAt),
    created_at: Timestamp.fromDate(now),
  });

  return {
    id: docRef.id,
    user_id: userId,
    ...entry,
    eaten_at: eatenAt.toISOString(),
    created_at: now.toISOString(),
  };
}

export async function deleteFoodEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'food_log', id));
}

interface UsdaNutrient {
  nutrientId: number;
  value: number;
}

function getNutrient(nutrients: UsdaNutrient[], id: number): number {
  const match = nutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : 0;
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  const key = process.env.EXPO_PUBLIC_USDA_API_KEY ?? '';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${key}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search food database');
  const json = await res.json();

  const results: FoodResult[] = [];
  for (const food of json.foods ?? []) {
    const name = food.description as string | undefined;
    if (!name) continue;
    const nutrients: UsdaNutrient[] = food.foodNutrients ?? [];
    results.push({
      name,
      calories: getNutrient(nutrients, 1008),  // Energy (kcal)
      protein: getNutrient(nutrients, 1003),   // Protein
      fat: getNutrient(nutrients, 1004),       // Total lipid (fat)
      sugar: getNutrient(nutrients, 2000),     // Sugars, total
      sodium: getNutrient(nutrients, 1093),    // Sodium (mg)
      serving_size: food.servingSize
        ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
        : undefined,
    });
  }
  return results;
}

export async function lookupBarcode(barcode: string): Promise<FoodResult | null> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to lookup barcode');
  const json = await res.json();

  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const n = p.nutriments ?? {};
  const name = p.product_name || p.product_name_en || 'Unknown food';

  return {
    name: String(name),
    calories: getNutrimentValue(n, 'energy-kcal_100g'),
    protein: getNutrimentValue(n, 'proteins_100g'),
    sodium: getNutrimentValue(n, 'sodium_100g') * 1000,
    sugar: getNutrimentValue(n, 'sugars_100g'),
    fat: getNutrimentValue(n, 'fat_100g'),
    serving_size: p.serving_size ?? p.quantity ?? undefined,
  };
}
