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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { searchFood, FoodResult } from '../lib/api';
import { colors, gradients, fonts, radius, shadow } from '../lib/theme';

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
    <LinearGradient colors={gradients.background} style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a food..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus
        />
        <TouchableOpacity
          style={styles.searchBtnWrap}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={gradients.primary} style={styles.searchBtn}>
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="search" size={20} color={colors.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
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
                <Ionicons name="search-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="nutrition-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyTitle}>Search for any food</Text>
                <Text style={styles.emptySubtitle}>
                  Powered by Open Food Facts database
                </Text>
              </View>
            )
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchBtnWrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  searchBtn: {
    width: 48,
    height: '100%',
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
    color: colors.muted,
    fontFamily: fonts.bodySemiBold,
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
    fontSize: 17,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  resultItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.soft,
  },
  resultLeft: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  resultMacros: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  resultServing: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 2,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultCalories: {
    fontSize: 20,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  resultKcal: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
});
