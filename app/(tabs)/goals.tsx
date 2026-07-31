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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { getWeightHistory, getLoggingStreak, logWeight, isToday, WeightEntry } from '../../lib/api';
import { getUserGoals, saveUserGoals, GoalType, UserGoals } from '../../lib/goals';
import { colors, gradients, fonts, radius, shadow } from '../../lib/theme';

const PRESETS = [1500, 1800, 2000, 2200, 2500];

const GOAL_TYPE_OPTIONS: { id: GoalType; letter: string; label: string; desc: string }[] = [
  { id: 'bulk', letter: 'B', label: 'Bulk Up', desc: 'Eat in a surplus, build muscle' },
  { id: 'maintain', letter: 'M', label: 'Maintain', desc: 'Stay steady at your weight' },
  { id: 'cut', letter: 'C', label: 'Cut', desc: 'Eat in a deficit, lean out' },
];

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [calorieInput, setCalorieInput] = useState('');
  const [weightGoalInput, setWeightGoalInput] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('bulk');
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCalorie, setEditingCalorie] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);

  const [modalType, setModalType] = useState<GoalType | null>(null);
  const [modalCurrentWeight, setModalCurrentWeight] = useState('');
  const [modalGoalWeight, setModalGoalWeight] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [userGoals, history, streakDays] = await Promise.all([
      getUserGoals(user.uid),
      getWeightHistory(user.uid, 90),
      getLoggingStreak(user.uid),
    ]);
    setCalorieInput(String(userGoals.calorieGoal));
    setWeightGoalInput(userGoals.weightGoal !== null ? String(userGoals.weightGoal) : '');
    setGoalType(userGoals.goalType);
    setWeightHistory(history);
    setStreak(streakDays);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSaved(false);
    }, [loadData])
  );

  const handleSaveGoals = async () => {
    if (!user) return;
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
      const patch: Partial<UserGoals> = { calorieGoal: cal, goalType };
      if (weightGoalInput) patch.weightGoal = Number(weightGoalInput);
      await saveUserGoals(user.uid, patch);
      setSaved(true);
      setEditingCalorie(false);
      setEditingWeight(false);
    } catch {
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openGoalTypeModal = (type: GoalType) => {
    setModalCurrentWeight(
      todayWeightEntry ? String(todayWeightEntry.weight) : currentWeight !== null ? String(currentWeight) : ''
    );
    setModalGoalWeight(weightGoalInput);
    setModalType(type);
  };

  const closeGoalTypeModal = () => {
    if (modalSaving) return;
    setModalType(null);
  };

  const handleModalSave = async () => {
    if (!modalType || !user) return;
    const goalVal = Number(modalGoalWeight);
    if (!modalGoalWeight || isNaN(goalVal) || goalVal <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid goal weight.');
      return;
    }

    // Weight is already logged for today (e.g. via the Add tab) — don't write
    // a second weight_log entry, just carry the existing value forward.
    let curVal: number | null = null;
    if (!todayWeightEntry) {
      curVal = Number(modalCurrentWeight);
      if (!modalCurrentWeight || isNaN(curVal) || curVal <= 0) {
        Alert.alert('Invalid Weight', 'Please enter a valid current weight.');
        return;
      }
    }

    setModalSaving(true);
    try {
      if (curVal !== null) {
        await logWeight(user.uid, curVal);
        setWeightHistory((prev) => [...prev, { weight: curVal as number, logged_at: new Date().toISOString() }]);
      }
      await saveUserGoals(user.uid, { weightGoal: goalVal, goalType: modalType });
      setGoalType(modalType);
      setWeightGoalInput(String(goalVal));
      setSaved(false);
      setModalType(null);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setModalSaving(false);
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

  const activeModalOption = GOAL_TYPE_OPTIONS.find((o) => o.id === modalType);
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;
  const todayWeightEntry = weightHistory.find((e) => e.logged_at && isToday(e.logged_at));

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
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{currentWeight !== null ? Math.round(currentWeight) : '—'}</Text>
            <Text style={styles.statLabel}>LBS NOW</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{weightGoalInput || '—'}</Text>
            <Text style={styles.statLabel}>LBS GOAL</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>GOAL TYPE</Text>
        </View>

        <View style={styles.goalTypeList}>
          {GOAL_TYPE_OPTIONS.map((opt) => {
            const selected = opt.id === goalType;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.goalTypeCard, selected && styles.goalTypeCardActive]}
                onPress={() => openGoalTypeModal(opt.id)}
                activeOpacity={0.8}
              >
                {selected ? (
                  <LinearGradient colors={gradients.primary} style={styles.goalTypeChip}>
                    <Text style={styles.goalTypeChipTextActive}>{opt.letter}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.goalTypeChip}>
                    <Text style={styles.goalTypeChipText}>{opt.letter}</Text>
                  </View>
                )}
                <View style={styles.goalTypeText}>
                  <Text style={styles.goalTypeLabel}>{opt.label}</Text>
                  <Text style={styles.goalTypeDesc}>{opt.desc}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>YOUR GOALS</Text>
        </View>

        <View style={styles.card}>
          {/* Target Weight */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Target Weight</Text>
            {editingWeight ? (
              <View style={styles.weightEditRow}>
                <View style={styles.weightInputWrap}>
                  <TextInput
                    style={styles.weightInput}
                    value={weightGoalInput}
                    onChangeText={(v) => { setWeightGoalInput(v); setSaved(false); }}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    maxLength={6}
                    selectTextOnFocus
                    autoFocus
                  />
                  <Text style={styles.weightUnit}>lbs</Text>
                </View>
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setEditingWeight(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={16} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.calorieReadRow}>
                <Text style={styles.calorieReadValue}>{weightGoalInput ? `${weightGoalInput} lbs` : '—'}</Text>
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setEditingWeight(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={15} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.rowDivider} />

          {/* Daily Calorie Goal */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily Calorie Goal</Text>
            {editingCalorie ? (
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjust(-50)} activeOpacity={0.7}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.calorieInput}
                  value={calorieInput}
                  onChangeText={(v) => { setCalorieInput(v); setSaved(false); }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={5}
                  selectTextOnFocus
                  autoFocus
                />
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjust(50)} activeOpacity={0.7}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setEditingCalorie(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={16} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.calorieReadRow}>
                <Text style={styles.calorieReadValue}>{calorieInput || '—'} kcal</Text>
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setEditingCalorie(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={15} color={colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editingCalorie && (
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
          )}
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

      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={closeGoalTypeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{activeModalOption?.label}</Text>
            <Text style={styles.modalSubtitle}>{activeModalOption?.desc}</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Current Weight</Text>
              <View style={[styles.modalInputWrap, todayWeightEntry && styles.modalInputWrapDisabled]}>
                <TextInput
                  style={styles.modalInput}
                  value={modalCurrentWeight}
                  onChangeText={setModalCurrentWeight}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  maxLength={6}
                  autoFocus={!todayWeightEntry}
                  editable={!todayWeightEntry}
                />
                <Text style={styles.modalUnit}>lbs</Text>
              </View>
              {todayWeightEntry && (
                <Text style={styles.modalHint}>Already logged today — edit it from the Add tab.</Text>
              )}
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Goal Weight</Text>
              <View style={styles.modalInputWrap}>
                <TextInput
                  style={styles.modalInput}
                  value={modalGoalWeight}
                  onChangeText={setModalGoalWeight}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  maxLength={6}
                />
                <Text style={styles.modalUnit}>lbs</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeGoalTypeModal}
                disabled={modalSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleModalSave}
                disabled={modalSaving}
                activeOpacity={0.85}
                style={[styles.modalSaveBtnWrap, modalSaving && styles.saveBtnDisabled]}
              >
                <LinearGradient colors={gradients.primary} style={styles.modalSaveBtn}>
                  {modalSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    ...shadow.soft,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  statLabel: {
    fontSize: 10.5,
    fontFamily: fonts.bodyExtraBold,
    color: colors.muted,
    letterSpacing: 0.4,
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
  goalTypeList: {
    gap: 10,
  },
  goalTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    ...shadow.soft,
  },
  goalTypeCardActive: {
    borderColor: colors.primary,
  },
  goalTypeChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTypeChipText: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  goalTypeChipTextActive: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.white,
  },
  goalTypeText: {
    flex: 1,
  },
  goalTypeLabel: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  goalTypeDesc: {
    fontSize: 12.5,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowDivider: {
    height: 1.5,
    backgroundColor: colors.borderLight,
    marginHorizontal: 18,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  weightEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  weightInput: {
    fontSize: 20,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    minWidth: 44,
    textAlign: 'right',
    padding: 0,
  },
  weightUnit: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 17,
    fontFamily: fonts.headlineMedium,
    color: colors.primaryDark,
    lineHeight: 20,
  },
  calorieInput: {
    fontSize: 20,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    minWidth: 56,
    textAlign: 'center',
    padding: 0,
  },
  calorieReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calorieReadValue: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
  },
  editToggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  presetTextActive: {
    color: colors.white,
  },
  saveBtnWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(58,42,24,0.45)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 22,
    gap: 16,
    ...shadow.card,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: -12,
  },
  modalField: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12.5,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalInputWrapDisabled: {
    opacity: 0.6,
  },
  modalInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    padding: 0,
  },
  modalHint: {
    fontSize: 11.5,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: -2,
  },
  modalUnit: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  modalSaveBtnWrap: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  modalSaveBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.white,
  },
});
