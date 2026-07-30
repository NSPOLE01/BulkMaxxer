import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type GoalType = 'bulk' | 'maintain' | 'cut';

export interface UserGoals {
  calorieGoal: number;
  weightGoal: number | null;
  goalType: GoalType;
}

const DEFAULT_GOALS: UserGoals = {
  calorieGoal: 2000,
  weightGoal: null,
  goalType: 'bulk',
};

function normalizeGoalType(val: unknown): GoalType {
  return val === 'bulk' || val === 'maintain' || val === 'cut' ? val : DEFAULT_GOALS.goalType;
}

export async function getUserGoals(userId: string): Promise<UserGoals> {
  const snap = await getDoc(doc(db, 'user_goals', userId));
  if (!snap.exists()) return DEFAULT_GOALS;

  const data = snap.data();
  return {
    calorieGoal: typeof data.calorieGoal === 'number' ? data.calorieGoal : DEFAULT_GOALS.calorieGoal,
    weightGoal: typeof data.weightGoal === 'number' ? data.weightGoal : null,
    goalType: normalizeGoalType(data.goalType),
  };
}

export async function saveUserGoals(userId: string, goals: Partial<UserGoals>): Promise<void> {
  await setDoc(doc(db, 'user_goals', userId), goals, { merge: true });
}
