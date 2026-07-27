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
import { useFocusEffect } from 'expo-router';
import { getCalorieGoal, saveCalorieGoal, getWeightGoal, saveWeightGoal } from '../../lib/goals';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
              placeholderTextColor="#CCCCCC"
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
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveGoals}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Goals'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  section: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCCCCC',
    letterSpacing: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  goalInput: {
    fontSize: 52,
    fontWeight: '800',
    color: '#111111',
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: -1,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999999',
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
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#111111',
    lineHeight: 28,
  },
  calorieInput: {
    fontSize: 52,
    fontWeight: '800',
    color: '#111111',
    minWidth: 140,
    textAlign: 'center',
    letterSpacing: -1,
  },
  unit: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
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
    borderRadius: 20,
    backgroundColor: '#EBEBEB',
  },
  presetBtnActive: {
    backgroundColor: '#111111',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
});
