import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import PetAvatar from './PetAvatar';
import { calcularEdad } from '../../utils/dates';

/**
 * Ítem de lista para cada mascota en la pantalla de mascotas
 */
const PetListItem = ({ mascota, onPress }) => {
  const { colors, isDark } = useTheme();
  const edad = calcularEdad(mascota.fechaNacimiento);

  const textoEdad = () => {
    if (!edad) return 'Edad desconocida';
    if (edad.anos > 0)
      return `${edad.anos} año${edad.anos !== 1 ? 's' : ''}`;
    return `${edad.meses} mes${edad.meses !== 1 ? 'es' : ''}`;
  };

  return (
    <TouchableOpacity
      style={[
        estilos.contenedor,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <PetAvatar mascota={mascota} tamaño={54} />
      <View style={estilos.info}>
        <Text style={[estilos.nombre, { color: colors.textoOscuro }]}>{mascota.nombre}</Text>
        <Text style={[estilos.detalle, { color: colors.textoMedio }]}>
          {mascota.especie === 'gato' ? '🐱 Gato' : '🐶 Perro'} · {mascota.raza || 'Raza no especificada'}
        </Text>
        <Text style={[estilos.edad, { color: colors.azulMedio }]}>{textoEdad()}</Text>
      </View>
      <View style={[estilos.flecha, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
        <Ionicons name="chevron-forward" size={16} color={colors.azulMedio} />
      </View>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    gap: 3,
  },
  nombre: {
    fontSize: 16.5,
    fontWeight: '700',
  },
  detalle: {
    fontSize: 13,
  },
  edad: {
    fontSize: 12,
    fontWeight: '600',
  },
  flecha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PetListItem;
