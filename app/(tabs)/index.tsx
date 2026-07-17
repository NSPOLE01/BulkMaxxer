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
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useAuth } from '../../lib/auth';
import { getTodayLog, getWeekLog, getWeightHistory, FoodEntry, WeekDay, WeightEntry } from '../../lib/api';
import { getCalorieGoal, getWeightGoal } from '../../lib/goals';
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
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [weightGoal, setWeightGoal] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [todayEntries, week, goal, wGoal, wHistory] = await Promise.all([
        getTodayLog(user.uid),
        getWeekLog(user.uid),
        getCalorieGoal(),
        getWeightGoal(),
        getWeightHistory(user.uid, 30),
      ]);
      setEntries(todayEntries);
      setWeekData(week);
      setCalorieGoal(goal);
      setWeightGoal(wGoal);
      setWeightHistory(wHistory);
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

      {(() => {
        if (weightHistory.length === 0) return null;
        const weightChartData = weightHistory.map((e) => ({
          value: e.weight,
          label: new Date(e.logged_at!).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        }));
        const allW = weightHistory.map((e) => e.weight);
        if (weightGoal) allW.push(weightGoal);
        const minW = Math.min(...allW) - 5;
        const maxW = Math.max(...allW) + 5;
        const latest = weightHistory[weightHistory.length - 1];
        return (
          <View style={[styles.chartSection, { marginTop: 24 }]}>
            <View style={styles.weightHeader}>
              <Text style={styles.sectionTitle}>Weight — Past Month</Text>
              <View style={styles.weightBadge}>
                <Text style={styles.weightBadgeValue}>{latest.weight}</Text>
                <Text style={styles.weightBadgeUnit}> lbs</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <LineChart
                data={weightChartData}
                width={SCREEN_WIDTH - 96}
                height={160}
                color="#111111"
                thickness={2}
                dataPointsColor="#111111"
                dataPointsRadius={4}
                yAxisTextStyle={{ color: '#AAAAAA', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#AAAAAA', fontSize: 9 }}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#E5E5E5"
                hideRules
                isAnimated
                yAxisOffset={minW}
                maxValue={maxW - minW}
                noOfSections={4}
                referenceLine1Position={weightGoal ? weightGoal - minW : undefined}
                referenceLine1Config={weightGoal ? { color: '#CCCCCC', thickness: 1, width: SCREEN_WIDTH - 96 } : undefined}
              />
            </View>
            {weightGoal ? (
              <View style={styles.weightLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#111111' }]} />
                  <Text style={styles.goalLine}>Actual</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#CCCCCC' }]} />
                  <Text style={styles.goalLine}>Target ({weightGoal} lbs)</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })()}
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
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightBadgeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  weightBadgeUnit: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  weightLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
