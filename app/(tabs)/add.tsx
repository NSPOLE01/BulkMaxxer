import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { logWeight, getWeightHistory, isToday, WeightEntry } from '../../lib/api';
import { colors, gradients, fonts, radius, shadow } from '../../lib/theme';

interface OptionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

function OptionCard({ icon, title, description, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={30} color={colors.primaryDark} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [weightInput, setWeightInput] = useState('');
  const [logging, setLogging] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const history = await getWeightHistory(user.uid);
    setWeightHistory(history);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const hasLoggedToday = weightHistory.some((e) => e.logged_at && isToday(e.logged_at));

  const handleLogWeight = async () => {
    if (!user) return;
    const val = Number(weightInput);
    if (!weightInput || isNaN(val) || val <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    setLogging(true);
    try {
      await logWeight(user.uid, val);
      setWeightInput('');
      const history = await getWeightHistory(user.uid);
      setWeightHistory(history);
    } catch {
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Food</Text>
        <Text style={styles.subtitle}>Log food or today's weight</Text>
      </View>

      <View style={styles.cards}>
        {/* Weight logging */}
        {hasLoggedToday ? (
          <View style={styles.loggedCard}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={30} color={colors.primaryDark} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Today's Weight</Text>
              <Text style={styles.cardDesc}>
                {weightHistory[weightHistory.length - 1].weight} lbs — logged
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
          </View>
        ) : (
          <View style={styles.weightCard}>
            <View style={styles.weightCardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="scale-outline" size={30} color={colors.primaryDark} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Log Today's Weight</Text>
                <Text style={styles.cardDesc}>Track your progress over time</Text>
              </View>
            </View>
            <View style={styles.logRow}>
              <TextInput
                style={styles.logInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder="e.g. 185"
                placeholderTextColor={colors.muted}
                maxLength={6}
              />
              <Text style={styles.logUnit}>lbs</Text>
              <TouchableOpacity
                onPress={handleLogWeight}
                disabled={logging}
                activeOpacity={0.85}
                style={[styles.logBtnWrap, logging && styles.logBtnDisabled]}
              >
                <LinearGradient colors={gradients.primary} style={styles.logBtn}>
                  {logging ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.logBtnText}>Log</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider}>
          <Text style={styles.dividerText}>FOOD</Text>
        </View>

        <OptionCard
          icon="search"
          title="Search Food"
          description="Search the USDA food database"
          onPress={() => router.push('/search')}
        />
        <OptionCard
          icon="barcode-outline"
          title="Scan Barcode"
          description="Point your camera at a product barcode"
          onPress={() => router.push('/scan')}
        />
        <OptionCard
          icon="create-outline"
          title="Manual Entry"
          description="Enter nutrition details manually"
          onPress={() => router.push('/manual')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: 4,
  },
  cards: {
    paddingHorizontal: 22,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadow.soft,
  },
  loggedCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadow.soft,
  },
  weightCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
    ...shadow.card,
  },
  weightCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logInput: {
    flex: 1,
    fontSize: 26,
    fontFamily: fonts.headlineSemiBold,
    color: colors.text,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logUnit: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.muted,
  },
  logBtnWrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  logBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnDisabled: {
    opacity: 0.6,
  },
  logBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
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
});
