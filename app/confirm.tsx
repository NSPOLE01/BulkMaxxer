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
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { addFoodEntry } from '../lib/api';
import { colors, gradients, fonts, radius, shadow } from '../lib/theme';

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
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.nameSection}>
            <Text style={styles.sectionLabel}>FOOD NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Food name"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Serving Size</Text>
            <TextInput
              style={styles.input}
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="e.g. 100g, 1 cup"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

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

          <View style={styles.preview}>
            <Text style={styles.previewTitle}>SUMMARY</Text>
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
            onPress={handleLog}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.logBtnWrap, loading && styles.logBtnDisabled]}
          >
            <LinearGradient colors={gradients.primary} style={styles.logBtn}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.logBtnText}>Log Food</Text>
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
    gap: 20,
  },
  nameSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  macroSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...shadow.soft,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    flex: 1,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroInput: {
    backgroundColor: colors.white,
    borderRadius: radius.sm - 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    width: 80,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroUnit: {
    color: colors.muted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    width: 30,
  },
  preview: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.card,
  },
  previewTitle: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
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
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    flex: 1,
  },
  previewCalories: {
    alignItems: 'flex-end',
  },
  previewCalNum: {
    fontSize: 28,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  previewKcal: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: -4,
  },
  previewMacros: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: 6,
  },
  logBtnWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  logBtn: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  logBtnDisabled: {
    opacity: 0.6,
  },
  logBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
  },
});
