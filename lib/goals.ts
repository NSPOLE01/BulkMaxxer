import AsyncStorage from '@react-native-async-storage/async-storage';

const CALORIE_GOAL_KEY = '@bulkmaxxer_calorie_goal';
const DEFAULT_GOAL = 2000;

export async function getCalorieGoal(): Promise<number> {
  const val = await AsyncStorage.getItem(CALORIE_GOAL_KEY);
  return val ? Number(val) : DEFAULT_GOAL;
}

export async function saveCalorieGoal(calories: number): Promise<void> {
  await AsyncStorage.setItem(CALORIE_GOAL_KEY, String(calories));
}
