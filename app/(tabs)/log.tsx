import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { getTodayLog, deleteFoodEntry, FoodEntry } from '../../lib/api';
import { getUserGoals } from '../../lib/goals';
import { colors, gradients, fonts, radius, shadow } from '../../lib/theme';

function FoodItem({ item, onDelete }: { item: FoodEntry; onDelete: (id: string) => void }) {
  const time = item.eaten_at
    ? new Date(item.eaten_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const handleDelete = () => {
    Alert.alert('Delete Entry', `Remove "${item.food_name}" from your log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => item.id && onDelete(item.id),
      },
    ]);
  };

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.food_name}
        </Text>
        <Text style={styles.itemMacros}>
          P: {Math.round(Number(item.protein))}g · F: {Math.round(Number(item.fat))}g ·{' '}
          S: {Math.round(Number(item.sugar))}g · Na: {Math.round(Number(item.sodium))}mg
        </Text>
        {item.serving_size ? (
          <Text style={styles.itemServing}>{item.serving_size}</Text>
        ) : null}
        <Text style={styles.itemTime}>{time}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemCalories}>{Math.round(Number(item.calories))}</Text>
        <Text style={styles.itemKcal}>kcal</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LogScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const [data, userGoals] = await Promise.all([getTodayLog(user.uid), getUserGoals(user.uid)]);
      setEntries(data);
      setCalorieGoal(userGoals.calorieGoal);
    } catch (e) {
      console.error('Failed to load log', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFoodEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete entry. Please try again.');
    }
  };

  const totalCalories = entries.reduce((s, e) => s + Number(e.calories), 0);
  const remaining = Math.max(0, calorieGoal - totalCalories);

  return (
    <LinearGradient colors={gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Log</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Consumed</Text>
          <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Goal</Text>
          <Text style={styles.summaryValue}>{calorieGoal}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Left</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{Math.round(remaining)}</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={({ item }) => (
          <FoodItem item={item} onDelete={handleDelete} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          entries.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={56} color={colors.muted} />
            <Text style={styles.emptyTitle}>No food logged yet today</Text>
            <Text style={styles.emptySubtitle}>
              Tap the Add tab to log your first meal
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  summaryCol: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10.5,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    gap: 10,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  itemMacros: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  itemServing: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemCalories: {
    fontSize: 20,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  itemKcal: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  deleteBtn: {
    marginTop: 8,
    padding: 4,
  },
});
