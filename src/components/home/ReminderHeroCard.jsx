import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { diasHasta, formatearFechaCorta, formatearHora } from '../../utils/dates';

export const ReminderHeroCard = ({
  recordatorio,
  mascotaNombre,
  onPress,
}) => {
  const { colors } = useTheme();
  const escala = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(escala, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  if (!recordatorio) {
    return (
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={[colors.hero2, colors.hero1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.reminder}
          >
            <View style={estilos.ic}>
              <Feather name="calendar" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.small}>Agenda y recordatorios</Text>
              <Text style={estilos.bold}>Sin eventos pendientes</Text>
              <Text style={estilos.em}>Toca para programar vacunas, citas o medicinas</Text>
            </View>
            <View style={estilos.go}>
              <Feather name="plus" size={18} color="#1B5870" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const tipo = recordatorio.tipo || 'vacuna';
  const iconName =
    tipo === 'vacuna'
      ? 'shield'
      : tipo === 'medicamento'
      ? 'plus-circle'
      : tipo === 'cumpleanos'
      ? 'gift'
      : 'activity';
  const dias = diasHasta(recordatorio.fecha);

  let etiquetaDias = 'Programado';
  if (dias !== null) {
    if (dias < 0) etiquetaDias = `Vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
    else if (dias === 0) etiquetaDias = 'Hoy';
    else if (dias === 1) etiquetaDias = 'Mañana';
    else etiquetaDias = `en ${dias} días`;
  }

  const fechaTexto = formatearFechaCorta(recordatorio.fecha);
  const horaTexto = formatearHora(recordatorio.fecha);
  const partesDetalle = [
    mascotaNombre || null,
    fechaTexto || null,
    horaTexto || null,
    recordatorio.lugar ? `📍 ${recordatorio.lugar}` : null,
  ].filter(Boolean);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={[colors.hero2, colors.hero1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.reminder}
        >
          <View style={estilos.ic}>
            <Feather name={iconName} size={22} color="#FFFFFF" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={estilos.small}>Próximo recordatorio · {etiquetaDias}</Text>
            <Text numberOfLines={1} style={estilos.bold}>
              {recordatorio.titulo}
            </Text>
            <Text numberOfLines={1} style={estilos.em}>
              {partesDetalle.join(' · ')}
            </Text>
          </View>

          <View style={estilos.go}>
            <Feather name="arrow-right" size={17} color="#1B5870" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const estilos = StyleSheet.create({
  reminder: {
    marginTop: 4,
    marginBottom: 18,
    padding: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  ic: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontWeight: '700',
  },
  bold: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 1,
  },
  em: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  go: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReminderHeroCard;
