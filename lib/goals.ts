import AsyncStorage from '@react-native-async-storage/async-storage';

const CALORIE_GOAL_KEY = '@bulkmaxxer_calorie_goal';
const WEIGHT_GOAL_KEY = '@bulkmaxxer_weight_goal';
const GOAL_TYPE_KEY = '@bulkmaxxer_goal_type';
const DEFAULT_CALORIE_GOAL = 2000;
const DEFAULT_GOAL_TYPE: GoalType = 'bulk';

export type GoalType = 'bulk' | 'maintain' | 'cut';

export async function getCalorieGoal(): Promise<number> {
  const val = await AsyncStorage.getItem(CALORIE_GOAL_KEY);
  return val ? Number(val) : DEFAULT_CALORIE_GOAL;
}

export async function saveCalorieGoal(calories: number): Promise<void> {
  await AsyncStorage.setItem(CALORIE_GOAL_KEY, String(calories));
}

export async function getWeightGoal(): Promise<number | null> {
  const val = await AsyncStorage.getItem(WEIGHT_GOAL_KEY);
  return val ? Number(val) : null;
}

export async function saveWeightGoal(lbs: number): Promise<void> {
  await AsyncStorage.setItem(WEIGHT_GOAL_KEY, String(lbs));
}

export async function getGoalType(): Promise<GoalType> {
  const val = await AsyncStorage.getItem(GOAL_TYPE_KEY);
  return val === 'bulk' || val === 'maintain' || val === 'cut' ? val : DEFAULT_GOAL_TYPE;
}

export async function saveGoalType(goalType: GoalType): Promise<void> {
  await AsyncStorage.setItem(GOAL_TYPE_KEY, goalType);
}
