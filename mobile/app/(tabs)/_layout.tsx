import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Layout } from '../../constants/Layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

type TabName = 'index' | 'search' | 'trips' | 'budget' | 'profile';

const tabs: { name: TabName; label: string; icon: string; activeIcon: string }[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'search', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  { name: 'trips', label: 'My Plan', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'budget', label: 'Budget', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <BlurView intensity={80} tint="dark" style={styles.tabBar}>
            {tabs.map((tab, index) => {
              const isActive = state.index === index;
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tabItem}
                  onPress={() => navigation.navigate(tab.name)}
                  activeOpacity={0.7}
                >
                  {isActive && <View style={styles.activeIndicator} />}
                  <Ionicons
                    name={(isActive ? tab.activeIcon : tab.icon) as any}
                    size={22}
                    color={isActive ? Colors.gold : 'rgba(255,255,255,0.5)'}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Discover' }} />
      <Tabs.Screen name="trips" options={{ title: 'My Plan' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    elevation: 20, // To ensure it floats above all scroll views
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: Layout.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -12,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: Typography.xs,
    fontFamily: Typography.sans,
    color: 'rgba(255,255,255,0.5)',
  },
  tabLabelActive: {
    color: Colors.gold,
    fontFamily: Typography.sansBold,
  },
});
