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
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { getTodayLog, deleteFoodEntry, FoodEntry } from '../../lib/api';

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
          <Ionicons name="trash-outline" size={18} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LogScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTodayLog(user.uid);
      setEntries(data);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Log</Text>
        {entries.length > 0 && (
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{Math.round(totalCalories)} kcal</Text>
          </View>
        )}
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
            tintColor="#00C853"
          />
        }
        contentContainerStyle={
          entries.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the Add tab to log your first meal today
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  totalText: {
    color: '#00C853',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#444',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  itemContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemMacros: {
    fontSize: 11,
    color: '#888',
  },
  itemServing: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemCalories: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00C853',
  },
  itemKcal: {
    fontSize: 10,
    color: '#555',
  },
  deleteBtn: {
    marginTop: 8,
    padding: 4,
  },
});
