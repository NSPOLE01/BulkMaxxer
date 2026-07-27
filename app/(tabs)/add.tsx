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
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { logWeight, getWeightHistory, WeightEntry } from '../../lib/api';

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
        <Ionicons name={icon} size={32} color="#111111" />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
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

  const todayStr = new Date().toISOString().split('T')[0];
  const hasLoggedToday = weightHistory.some(
    (e) => e.logged_at && e.logged_at.split('T')[0] === todayStr
  );

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Add</Text>
        <Text style={styles.subtitle}>Log food or today's weight</Text>
      </View>

      <View style={styles.cards}>
        {/* Weight logging */}
        {hasLoggedToday ? (
          <View style={styles.loggedCard}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={32} color="#111111" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Today's Weight</Text>
              <Text style={styles.cardDesc}>
                {weightHistory[weightHistory.length - 1].weight} lbs — logged
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
          </View>
        ) : (
          <View style={styles.weightCard}>
            <View style={styles.weightCardTop}>
              <View style={styles.iconBox}>
                <Ionicons name="scale-outline" size={32} color="#111111" />
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
                placeholderTextColor="#CCCCCC"
                maxLength={6}
              />
              <Text style={styles.logUnit}>lbs</Text>
              <TouchableOpacity
                style={[styles.logBtn, logging && styles.logBtnDisabled]}
                onPress={handleLogWeight}
                disabled={logging}
                activeOpacity={0.8}
              >
                {logging ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.logBtnText}>Log</Text>
                )}
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  cards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loggedCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weightCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  weightCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#999999',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  logUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
  logBtn: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  logBtnDisabled: {
    opacity: 0.5,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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
});
