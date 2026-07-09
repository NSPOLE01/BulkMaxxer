import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { searchFood, FoodResult } from '../lib/api';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchFood(q);
      setResults(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to search. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (food: FoodResult) => {
    router.push({
      pathname: '/confirm',
      params: {
        name: food.name,
        calories: String(food.calories),
        protein: String(food.protein),
        sodium: String(food.sodium),
        sugar: String(food.sugar),
        fat: String(food.fat),
        serving_size: food.serving_size ?? '',
      },
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a food..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Ionicons name="search" size={20} color="#000" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00C853" size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.resultMacros}>
                  P: {Math.round(item.protein)}g · F: {Math.round(item.fat)}g ·{' '}
                  S: {Math.round(item.sugar)}g
                </Text>
                {item.serving_size ? (
                  <Text style={styles.resultServing}>{item.serving_size}</Text>
                ) : null}
              </View>
              <View style={styles.resultRight}>
                <Text style={styles.resultCalories}>{Math.round(item.calories)}</Text>
                <Text style={styles.resultKcal}>kcal</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="nutrition-outline" size={48} color="#333" />
                <Text style={styles.emptyTitle}>Search for any food</Text>
                <Text style={styles.emptySubtitle}>
                  Powered by Open Food Facts database
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchBtn: {
    backgroundColor: '#00C853',
    borderRadius: 10,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  list: {
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
    gap: 10,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#333',
  },
  resultItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLeft: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultMacros: {
    fontSize: 11,
    color: '#888',
  },
  resultServing: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultCalories: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00C853',
  },
  resultKcal: {
    fontSize: 10,
    color: '#555',
  },
});
