import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuth, AuthProvider } from '../src/hooks/useAuth';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import AnimatedBootSplash from '../src/components/common/AnimatedBootSplash';

function AuthGate({ children }) {
  const { usuario, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    try {
      SplashScreen.hideAsync();
    } catch {}
  }, []);

  useEffect(() => {
    if (cargando) return;

    const enAuth = segments[0] === '(auth)';

    if (!usuario && !enAuth) {
      router.replace('/(auth)/login');
    } else if (usuario && enAuth) {
      router.replace('/(tabs)/');
    }
  }, [usuario, cargando, segments]);

  return children;
}

function NavigationStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="pet/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pet/[id]/vaccines"
        options={{
          headerShown: true,
          headerTitle: 'Vacunas',
          headerStyle: { backgroundColor: colors.hero2 },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
      <Stack.Screen
        name="pet/[id]/medications"
        options={{
          headerShown: true,
          headerTitle: 'Control de medicinas',
          headerStyle: { backgroundColor: colors.hero2 },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
      <Stack.Screen
        name="pet/[id]/appointments"
        options={{
          headerShown: true,
          headerTitle: 'Citas y visitas veterinarias',
          headerStyle: { backgroundColor: colors.hero2 },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
      <Stack.Screen
        name="pet/[id]/weight"
        options={{
          headerShown: true,
          headerTitle: 'Control de peso',
          headerStyle: { backgroundColor: colors.hero2 },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
      <Stack.Screen
        name="pet/[id]/health"
        options={{
          headerShown: true,
          headerTitle: 'Alergias y restricciones',
          headerStyle: { backgroundColor: colors.hero2 },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [mostrarSplashAnimado, setMostrarSplashAnimado] = useState(true);

  useEffect(() => {
    try {
      SplashScreen.hideAsync();
    } catch {}
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const datos = response.notification.request.content.data;
        console.log('Notificación abierta:', datos);
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <View style={estilos.flex}>
          <AuthGate>
            <NavigationStack />
          </AuthGate>
          {mostrarSplashAnimado && (
            <AnimatedBootSplash onFinish={() => setMostrarSplashAnimado(false)} />
          )}
        </View>
      </AuthProvider>
    </ThemeProvider>
  );
}

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
