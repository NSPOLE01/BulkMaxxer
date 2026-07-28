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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { addFoodEntry } from '../lib/api';
import { colors, gradients, fonts, radius } from '../lib/theme';

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
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
                {field.required ? <Text style={styles.required}> *</Text> : null}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, field.unit ? styles.inputWithUnit : null]}
                  value={values[field.key]}
                  onChangeText={(v) => update(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  keyboardType={field.keyboard ?? 'default'}
                  returnKeyType="next"
                />
                {field.unit ? (
                  <View style={styles.unitBox}>
                    <Text style={styles.unitText}>{field.unit}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.saveBtnWrap, loading && styles.saveBtnDisabled]}
          >
            <LinearGradient colors={gradients.primary} style={styles.saveBtn}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Entry</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  required: {
    color: colors.primaryDark,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unitBox: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderLeftWidth: 0,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  unitText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  saveBtnWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveBtn: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
  },
});
