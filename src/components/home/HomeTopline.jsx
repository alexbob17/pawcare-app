import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export const HomeTopline = ({
  nombre = 'Tutor',
  isDark = false,
  onToggleTheme,
  onOpenNotifications,
  unreadNotifications = false,
}) => {
  const { colors } = useTheme();
  const primerNombre = (nombre || 'Tutor').trim().split(' ')[0];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        estilos.head,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[estilos.h2, { color: colors.text }]}>
          ¡Hola, {primerNombre}!
        </Text>
        <Text style={[estilos.sub, { color: colors.muted }]}>
          Un gran día para cuidar a tus mascotas
        </Text>
      </View>

      <View style={estilos.acciones}>
        <TouchableOpacity
          style={[
            estilos.avBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}
          onPress={onToggleTheme}
          activeOpacity={0.78}
          accessibilityLabel="Cambiar tema"
        >
          <Feather
            name={isDark ? 'sun' : 'moon'}
            size={18}
            color={isDark ? '#F6C453' : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            estilos.avBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}
          onPress={onOpenNotifications}
          activeOpacity={0.78}
          accessibilityLabel="Notificaciones"
        >
          <Feather name="bell" size={18} color={colors.text} />
          {unreadNotifications && (
            <View style={[estilos.puntoNotificacion, { backgroundColor: colors.warn }]} />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const estilos = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  h2: {
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13.5,
    marginTop: 2,
    fontWeight: '600',
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  puntoNotificacion: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default HomeTopline;
