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
import { router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { addFoodEntry } from '../lib/api';

interface Field {
  label: string;
  key: string;
  placeholder: string;
  unit?: string;
  required?: boolean;
  keyboard?: 'default' | 'numeric' | 'decimal-pad';
}

const FIELDS: Field[] = [
  { label: 'Food Name', key: 'food_name', placeholder: 'e.g. Chicken Breast', required: true, keyboard: 'default' },
  { label: 'Calories', key: 'calories', placeholder: '0', unit: 'kcal', required: true, keyboard: 'numeric' },
  { label: 'Protein', key: 'protein', placeholder: '0', unit: 'g', keyboard: 'decimal-pad' },
  { label: 'Fat', key: 'fat', placeholder: '0', unit: 'g', keyboard: 'decimal-pad' },
  { label: 'Sugar', key: 'sugar', placeholder: '0', unit: 'g', keyboard: 'decimal-pad' },
  { label: 'Sodium', key: 'sodium', placeholder: '0', unit: 'mg', keyboard: 'decimal-pad' },
  { label: 'Serving Size', key: 'serving_size', placeholder: 'e.g. 100g or 1 cup', keyboard: 'default' },
];

export default function ManualScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({
    food_name: '',
    calories: '',
    protein: '0',
    fat: '0',
    sugar: '0',
    sodium: '0',
    serving_size: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!values.food_name.trim()) {
      Alert.alert('Error', 'Please enter a food name.');
      return;
    }
    if (!values.calories || isNaN(Number(values.calories))) {
      Alert.alert('Error', 'Please enter a valid calorie amount.');
      return;
    }

    setLoading(true);
    try {
      await addFoodEntry(user.uid, {
        food_name: values.food_name.trim(),
        calories: Number(values.calories) || 0,
        protein: Number(values.protein) || 0,
        fat: Number(values.fat) || 0,
        sugar: Number(values.sugar) || 0,
        sodium: Number(values.sodium) || 0,
        serving_size: values.serving_size.trim() || undefined,
      });
      router.replace('/(tabs)/log');
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
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
        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, field.unit ? styles.inputWithUnit : null]}
                placeholder={field.placeholder}
                placeholderTextColor="#555"
                keyboardType={field.keyboard as 'default' | 'numeric' | 'decimal-pad' ?? 'default'}
                value={values[field.key]}
                onChangeText={(v) => update(field.key, v)}
                returnKeyType="next"
              />
              {field.unit && (
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>{field.unit}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save Entry</Text>
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
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#FF5252',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unitBadge: {
    backgroundColor: '#2A2A2A',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#2A2A2A',
    minWidth: 52,
    alignItems: 'center',
  },
  unitText: {
    color: '#888',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#00C853',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 17,
  },
});
