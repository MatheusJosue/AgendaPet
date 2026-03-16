import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.glass,
            borderTopColor: colors.glassBorder,
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Agenda',
            tabBarLabel: 'Agenda',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="new-appointment"
          options={{
            title: 'Novo',
            tabBarLabel: 'Novo',
            tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clientes',
            tabBarLabel: 'Clientes',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Config',
            tabBarLabel: 'Config',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
