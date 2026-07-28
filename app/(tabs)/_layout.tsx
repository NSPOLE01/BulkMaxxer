import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, fonts } from '../../lib/theme';

function AddTabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        marginTop: -26,
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.border,
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={gradients.primary}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </LinearGradient>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyExtraBold,
          fontSize: 10.5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <AddTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
