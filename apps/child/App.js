import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from './src/services/AuthContext';
import { getSocket } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TasksScreen from './src/screens/TasksScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import BlockedScreen from './src/screens/BlockedScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { בית: '🏠', משימות: '📋', פרופיל: '👤' };

function ChildTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 22 }}>{ICONS[route.name]}</Text>,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { paddingBottom: 8, height: 60 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="בית" component={DashboardStack} />
      <Tab.Screen name="משימות" component={TasksScreen} />
    </Tab.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    socket.on('screentime:lock_changed', ({ locked }) => {
      if (locked) {
        // Navigation to BlockedScreen is handled by screen-level listeners
      }
    });
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={ChildTabs} />
      <Stack.Screen name="Blocked" component={BlockedScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
