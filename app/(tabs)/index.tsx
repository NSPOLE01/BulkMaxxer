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
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useAuth } from '../../lib/auth';
import { getTodayLog, getWeekLog, getWeightHistory, FoodEntry, WeekDay, WeightEntry } from '../../lib/api';
import { getCalorieGoal, getWeightGoal } from '../../lib/goals';
import { useFocusEffect } from 'expo-router';
import { colors, gradients, fonts, radius, shadow } from '../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function CalorieCard({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);

  return (
    <View style={styles.calorieCard}>
      <View style={styles.calorieHeaderRow}>
        <Text style={styles.calorieLabel}>Today's Calories</Text>
        <Text style={styles.calorieRemaining}>
          {remaining > 0 ? `${Math.round(remaining)} left` : 'Goal reached!'}
        </Text>
      </View>
      <View style={styles.calorieNumberRow}>
        <Text style={styles.calorieConsumed}>{Math.round(consumed)}</Text>
        <Text style={styles.calorieGoal}> / {goal}</Text>
      </View>
      <View style={styles.calorieTrack}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.calorieFill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  );
}

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        <Text style={styles.macroUnit}> {unit}</Text>
      </Text>
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
    frontColor: d.date === new Date().toISOString().split('T')[0] ? colors.primary : colors.track,
    topLabelComponent: () => null,
  }));

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.appName}>BulkMaxxer</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <View style={styles.section}>
          <CalorieCard consumed={totalCalories} goal={calorieGoal} />
        </View>

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
                xAxisColor={colors.borderLight}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10, fontFamily: fonts.bodySemiBold }}
                xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10, fontFamily: fonts.bodySemiBold }}
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

        <View style={[styles.chartSection, { marginTop: 24 }]}>
          <View style={styles.weightHeader}>
            <Text style={styles.sectionTitle}>Weight — Past Month</Text>
            {weightHistory.length > 0 && (
              <View style={styles.weightBadge}>
                <Text style={styles.weightBadgeValue}>{weightHistory[weightHistory.length - 1].weight}</Text>
                <Text style={styles.weightBadgeUnit}> lbs</Text>
              </View>
            )}
          </View>
          {weightHistory.length > 0 ? (() => {
            const weightChartData = weightHistory.map((e) => ({
              value: e.weight,
              label: new Date(e.logged_at!).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            }));
            const allW = weightHistory.map((e) => e.weight);
            if (weightGoal) allW.push(weightGoal);
            const minW = Math.min(...allW) - 5;
            const maxW = Math.max(...allW) + 5;
            return (
              <>
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={weightChartData}
                    width={SCREEN_WIDTH - 96}
                    height={180}
                    color={colors.primary}
                    thickness={2}
                    dataPointsColor={colors.primary}
                    dataPointsRadius={4}
                    yAxisTextStyle={{ color: colors.muted, fontSize: 10, fontFamily: fonts.bodySemiBold }}
                    xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9, fontFamily: fonts.bodySemiBold }}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={colors.borderLight}
                    hideRules
                    isAnimated
                    yAxisOffset={minW}
                    maxValue={maxW - minW}
                    noOfSections={4}
                    referenceLine1Position={weightGoal ? weightGoal - minW : undefined}
                    referenceLine1Config={weightGoal ? { color: colors.accent, thickness: 1, width: SCREEN_WIDTH - 96 } : undefined}
                  />
                </View>
                {weightGoal ? (
                  <View style={styles.weightLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.goalLine}>Actual</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                      <Text style={styles.goalLine}>Target ({weightGoal} lbs)</Text>
                    </View>
                  </View>
                ) : null}
              </>
            );
          })() : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>No weight logged yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  appName: {
    fontSize: 26,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  calorieCard: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
    ...shadow.card,
  },
  calorieHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  calorieLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calorieRemaining: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  calorieNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieConsumed: {
    fontSize: 38,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  calorieGoal: {
    fontSize: 18,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  calorieTrack: {
    height: 20,
    backgroundColor: colors.track,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  calorieFill: {
    height: '100%',
    borderRadius: 8,
  },
  macroRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 8,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  macroUnit: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  macroLabel: {
    fontSize: 10.5,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  chartSection: {
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    marginBottom: 16,
  },
  chartWrapper: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadow.soft,
  },
  emptyChart: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  goalLine: {
    color: colors.muted,
    fontFamily: fonts.bodySemiBold,
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
    fontSize: 20,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  weightBadgeUnit: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
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
