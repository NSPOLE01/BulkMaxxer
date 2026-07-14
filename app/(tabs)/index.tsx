import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../../lib/auth';
import { getTodayLog, getWeekLog, FoodEntry, WeekDay } from '../../lib/api';
import { getCalorieGoal } from '../../lib/goals';
import { useFocusEffect } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);

  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringOuter}>
        <View style={[styles.ringFill, { opacity: pct > 0 ? 1 : 0.1 }]} />
        <View style={styles.ringInner}>
          <Text style={styles.ringCalories}>{Math.round(consumed)}</Text>
          <Text style={styles.ringLabel}>calories</Text>
          <Text style={styles.ringRemaining}>
            {remaining > 0 ? `${Math.round(remaining)} remaining` : 'Goal reached!'}
          </Text>
        </View>
      </View>
      <View style={styles.goalRow}>
        <Text style={styles.goalText}>Goal: {goal} kcal</Text>
        <Text style={[styles.goalPct, { color: pct >= 1 ? '#FF3B30' : '#111111' }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </View>
  );
}

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValue}>{Math.round(value)}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [todayEntries, week, goal] = await Promise.all([
        getTodayLog(user.uid),
        getWeekLog(user.uid),
        getCalorieGoal(),
      ]);
      setEntries(todayEntries);
      setWeekData(week);
      setCalorieGoal(goal);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalCalories = entries.reduce((s, e) => s + Number(e.calories), 0);
  const totalProtein = entries.reduce((s, e) => s + Number(e.protein), 0);
  const totalFat = entries.reduce((s, e) => s + Number(e.fat), 0);
  const totalSugar = entries.reduce((s, e) => s + Number(e.sugar), 0);
  const totalSodium = entries.reduce((s, e) => s + Number(e.sodium), 0);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const barData = weekData.map((d) => ({
    value: Math.round(d.calories),
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    frontColor: d.date === new Date().toISOString().split('T')[0] ? '#111111' : '#CCCCCC',
    topLabelComponent: () => null,
  }));

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#111111"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.appName}>BulkMaxxer</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      <CalorieRing consumed={totalCalories} goal={calorieGoal} />

      <View style={styles.macroRow}>
        <MacroCard label="Protein" value={totalProtein} unit="g" />
        <MacroCard label="Fat" value={totalFat} unit="g" />
        <MacroCard label="Sugar" value={totalSugar} unit="g" />
        <MacroCard label="Sodium" value={totalSodium} unit="mg" />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        {weekData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <BarChart
              data={barData}
              barWidth={28}
              spacing={12}
              roundedTop
              roundedBottom
              hideRules
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#E5E5E5"
              yAxisTextStyle={{ color: '#AAAAAA', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#AAAAAA', fontSize: 10 }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value), calorieGoal) + 200}
              width={SCREEN_WIDTH - 64}
              height={180}
              isAnimated
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No data yet this week</Text>
          </View>
        )}
        <Text style={styles.goalLine}>Daily goal: {calorieGoal} kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringFill: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#111111',
  },
  ringInner: {
    alignItems: 'center',
  },
  ringCalories: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111111',
  },
  ringLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: -4,
  },
  ringRemaining: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  goalText: {
    color: '#999999',
    fontSize: 13,
  },
  goalPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  macroRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  macroUnit: {
    fontSize: 10,
    color: '#999999',
    marginTop: -2,
  },
  macroLabel: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  chartSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  chartWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
  },
  emptyChart: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  goalLine: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
