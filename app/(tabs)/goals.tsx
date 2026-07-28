import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { getCalorieGoal, saveCalorieGoal, getWeightGoal, saveWeightGoal } from '../../lib/goals';
import { colors, gradients, fonts, radius, shadow } from '../../lib/theme';

const PRESETS = [1500, 1800, 2000, 2200, 2500];

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();

  const [calorieInput, setCalorieInput] = useState('');
  const [weightGoalInput, setWeightGoalInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [cal, weightGoal] = await Promise.all([getCalorieGoal(), getWeightGoal()]);
    setCalorieInput(String(cal));
    setWeightGoalInput(weightGoal !== null ? String(weightGoal) : '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSaved(false);
    }, [loadData])
  );

  const handleSaveGoals = async () => {
    const cal = Number(calorieInput);
    if (!calorieInput || isNaN(cal) || cal < 500 || cal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a calorie goal between 500 and 10,000.');
      return;
    }
    if (weightGoalInput && (isNaN(Number(weightGoalInput)) || Number(weightGoalInput) <= 0)) {
      Alert.alert('Invalid Goal', 'Please enter a valid target weight.');
      return;
    }
    setSaving(true);
    try {
      await saveCalorieGoal(cal);
      if (weightGoalInput) await saveWeightGoal(Number(weightGoalInput));
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = (val: number) => {
    setCalorieInput(String(val));
    setSaved(false);
  };

  const adjust = (delta: number) => {
    const current = Number(calorieInput) || 2000;
    const next = Math.min(10000, Math.max(500, current + delta));
    setCalorieInput(String(next));
    setSaved(false);
  };


  return (
    <LinearGradient colors={gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.divider}>
          <Text style={styles.dividerText}>YOUR GOALS</Text>
        </View>

        {/* Target Weight Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TARGET WEIGHT</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.goalInput}
              value={weightGoalInput}
              onChangeText={(v) => { setWeightGoalInput(v); setSaved(false); }}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="0"
              placeholderTextColor={colors.muted}
              maxLength={6}
              selectTextOnFocus
            />
            <Text style={styles.weightUnit}>lbs</Text>
          </View>
        </View>

        {/* Daily Calorie Target */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY CALORIE TARGET</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjust(-50)} activeOpacity={0.7}>
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.calorieInput}
              value={calorieInput}
              onChangeText={(v) => { setCalorieInput(v); setSaved(false); }}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={5}
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjust(50)} activeOpacity={0.7}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.unit}>kcal / day</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetBtn, Number(calorieInput) === p && styles.presetBtnActive]}
                onPress={() => handlePreset(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, Number(calorieInput) === p && styles.presetTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSaveGoals}
          disabled={saving}
          activeOpacity={0.85}
          style={[styles.saveBtnWrap, saving && styles.saveBtnDisabled]}
        >
          <LinearGradient colors={gradients.primary} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Goals'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  goalInput: {
    fontSize: 52,
    fontFamily: fonts.headline,
    color: colors.text,
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontFamily: fonts.headlineMedium,
    color: colors.primaryDark,
    lineHeight: 28,
  },
  calorieInput: {
    fontSize: 52,
    fontFamily: fonts.headline,
    color: colors.text,
    minWidth: 140,
    textAlign: 'center',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: -4,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  presetText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  presetTextActive: {
    color: colors.white,
  },
  saveBtnWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 4,
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
