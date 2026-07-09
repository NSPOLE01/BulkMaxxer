import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { addFoodEntry } from '../lib/api';

interface EditableField {
  label: string;
  key: string;
  unit: string;
}

const EDITABLE_FIELDS: EditableField[] = [
  { label: 'Calories', key: 'calories', unit: 'kcal' },
  { label: 'Protein', key: 'protein', unit: 'g' },
  { label: 'Fat', key: 'fat', unit: 'g' },
  { label: 'Sugar', key: 'sugar', unit: 'g' },
  { label: 'Sodium', key: 'sodium', unit: 'mg' },
];

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    name: string;
    calories: string;
    protein: string;
    sodium: string;
    sugar: string;
    fat: string;
    serving_size: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [values, setValues] = useState({
    calories: params.calories ?? '0',
    protein: params.protein ?? '0',
    fat: params.fat ?? '0',
    sugar: params.sugar ?? '0',
    sodium: params.sodium ?? '0',
  });
  const [servingSize, setServingSize] = useState(params.serving_size ?? '');
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleLog = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Food name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      await addFoodEntry(user.uid, {
        food_name: name.trim(),
        calories: Number(values.calories) || 0,
        protein: Number(values.protein) || 0,
        fat: Number(values.fat) || 0,
        sugar: Number(values.sugar) || 0,
        sodium: Number(values.sodium) || 0,
        serving_size: servingSize.trim() || undefined,
      });
      router.replace('/(tabs)/log');
    } catch (e) {
      Alert.alert('Error', 'Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Food Name */}
        <View style={styles.nameSection}>
          <Text style={styles.sectionLabel}>FOOD NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Food name"
            placeholderTextColor="#555"
            returnKeyType="next"
          />
        </View>

        {/* Serving Size */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Serving Size</Text>
          <TextInput
            style={styles.input}
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="e.g. 100g, 1 cup"
            placeholderTextColor="#555"
            returnKeyType="next"
          />
        </View>

        {/* Macros */}
        <View style={styles.macroSection}>
          <Text style={styles.sectionLabel}>NUTRITION PER SERVING</Text>
          {EDITABLE_FIELDS.map((field) => (
            <View key={field.key} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{field.label}</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroInput}
                  value={values[field.key as keyof typeof values]}
                  onChangeText={(v) => update(field.key, v)}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
                <Text style={styles.macroUnit}>{field.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Preview Card */}
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Summary</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewFood} numberOfLines={2}>
              {name || 'Food name'}
            </Text>
            <View style={styles.previewCalories}>
              <Text style={styles.previewCalNum}>
                {Math.round(Number(values.calories) || 0)}
              </Text>
              <Text style={styles.previewKcal}>kcal</Text>
            </View>
          </View>
          <Text style={styles.previewMacros}>
            P: {Math.round(Number(values.protein) || 0)}g · F:{' '}
            {Math.round(Number(values.fat) || 0)}g · S:{' '}
            {Math.round(Number(values.sugar) || 0)}g · Na:{' '}
            {Math.round(Number(values.sodium) || 0)}mg
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logBtn, loading && styles.logBtnDisabled]}
          onPress={handleLog}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.logBtnText}>Log Food</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  nameSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 1,
    marginBottom: 2,
  },
  nameInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  macroSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 15,
    color: '#CCCCCC',
    flex: 1,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroInput: {
    backgroundColor: '#252525',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#FFFFFF',
    width: 80,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#333',
  },
  macroUnit: {
    color: '#888',
    fontSize: 13,
    width: 30,
  },
  preview: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C853',
    letterSpacing: 1,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewFood: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  previewCalories: {
    alignItems: 'flex-end',
  },
  previewCalNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00C853',
  },
  previewKcal: {
    fontSize: 10,
    color: '#555',
    marginTop: -4,
  },
  previewMacros: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  logBtn: {
    backgroundColor: '#00C853',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  logBtnDisabled: {
    opacity: 0.6,
  },
  logBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 17,
  },
});
