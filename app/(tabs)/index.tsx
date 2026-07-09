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
import { useFocusEffect } from 'expo-router';

const CALORIE_GOAL = 2000;
const SCREEN_WIDTH = Dimensions.get('window').width;

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const remaining = Math.max(goal - consumed, 0);

  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringOuter}>
        <View style={[styles.ringFill, { opacity: pct > 0 ? 1 : 0.15 }]} />
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
        <Text style={[styles.goalPct, { color: pct >= 1 ? '#FF5252' : '#00C853' }]}>
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [todayEntries, week] = await Promise.all([
        getTodayLog(user.uid),
        getWeekLog(user.uid),
      ]);
      setEntries(todayEntries);
      setWeekData(week);
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
    frontColor: d.date === new Date().toISOString().split('T')[0] ? '#00C853' : '#2A6642',
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
          tintColor="#00C853"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>BulkMaxxer</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      {/* Calorie Ring */}
      <CalorieRing consumed={totalCalories} goal={CALORIE_GOAL} />

      {/* Macro Cards */}
      <View style={styles.macroRow}>
        <MacroCard label="Protein" value={totalProtein} unit="g" />
        <MacroCard label="Fat" value={totalFat} unit="g" />
        <MacroCard label="Sugar" value={totalSugar} unit="g" />
        <MacroCard label="Sodium" value={totalSodium} unit="mg" />
      </View>

      {/* Weekly Chart */}
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
              xAxisColor="#2A2A2A"
              yAxisTextStyle={{ color: '#666', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 10 }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value), CALORIE_GOAL) + 200}
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
        <Text style={styles.goalLine}>Daily goal: {CALORIE_GOAL} kcal</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
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
    color: '#00C853',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
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
    borderColor: '#2A2A2A',
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
    borderColor: '#00C853',
  },
  ringInner: {
    alignItems: 'center',
  },
  ringCalories: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ringLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: -4,
  },
  ringRemaining: {
    fontSize: 11,
    color: '#00C853',
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  goalText: {
    color: '#666',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  macroUnit: {
    fontSize: 10,
    color: '#00C853',
    marginTop: -2,
  },
  macroLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  chartSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartWrapper: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  emptyChart: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },
  goalLine: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
