import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import {
  tieneFotoPersonalizada,
  emojiSoloEspecie,
  simboloSexo,
  nombreEspecie,
} from '../../constants/pets';
import { obtenerTextoEdad, obtenerAnioNacimiento } from '../../utils/dates';

export const ProfileHero = ({
  mascota,
  pesos = [],
  onVolver,
  onOptions,
  onEditarFoto,
}) => {
  const { colors } = useTheme();
  const nombre = mascota?.nombre || 'Mascota';
  const sexoSimb = simboloSexo(mascota?.sexo);
  const especieTexto = nombreEspecie(mascota?.especie, mascota?.sexo);
  const razaLimpia =
    !mascota?.raza ||
    mascota.raza.trim().toLowerCase() === 'mestizo' ||
    mascota.raza.trim().toLowerCase() === (mascota?.especie || '').trim().toLowerCase()
      ? 'Mestizo'
      : mascota.raza.trim();
  const especieConRaza =
    razaLimpia !== 'Mestizo' ? `${especieTexto} (${razaLimpia})` : especieTexto;
  const edadTexto = obtenerTextoEdad(mascota);
  const desdeAnio = obtenerAnioNacimiento(mascota);

  const pesoMostrado =
    pesos.length > 0
      ? pesos[0].peso
      : mascota?.pesoActual
      ? mascota.pesoActual
      : null;

  let deltaTexto = 'Estable';
  if (pesos.length >= 2) {
    const diff = Number(pesos[0].peso) - Number(pesos[1].peso);
    if (diff > 0) deltaTexto = `↗ +${diff.toFixed(1)} kg`;
    else if (diff < 0) deltaTexto = `↘ ${diff.toFixed(1)} kg`;
  } else if (pesoMostrado) {
    deltaTexto = 'Registrado';
  } else {
    deltaTexto = 'Sin registro';
  }

  const usaFotoReal = tieneFotoPersonalizada(mascota);
  const emoji = emojiSoloEspecie(mascota?.especie);

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Hero Header Degradado (.hero) */}
      <LinearGradient
        colors={[colors.hero2, colors.hero1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.hero}
      >
        {/* Barra superior (.bar) */}
        <View style={estilos.bar}>
          <TouchableOpacity style={estilos.round} onPress={onVolver} activeOpacity={0.8}>
            <Text style={estilos.roundText}>←</Text>
          </TouchableOpacity>
          <Text style={estilos.barTitle}>Perfil de salud</Text>
          <TouchableOpacity style={estilos.round} onPress={onOptions} activeOpacity={0.8}>
            <Text style={estilos.roundText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Bloque Horizontal (.who) */}
        <View style={estilos.who}>
          <TouchableOpacity
            style={[estilos.av, { backgroundColor: colors.surface }]}
            onPress={onEditarFoto}
            activeOpacity={0.85}
          >
            {usaFotoReal ? (
              <Image source={{ uri: mascota.foto }} style={estilos.avImg} />
            ) : (
              <Text style={estilos.avEmoji}>{emoji}</Text>
            )}
            {onEditarFoto && (
              <View style={[estilos.camBadge, { backgroundColor: colors.brand }]}>
                <Text style={{ fontSize: 11 }}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={estilos.h2}>
              {nombre} {sexoSimb}
            </Text>
            <Text style={estilos.subInfo}>
              {especieConRaza} · {edadTexto} · {pesoMostrado ? `${pesoMostrado} kg` : 'Sin peso'}
            </Text>
            <View style={estilos.pill}>
              <Text style={estilos.pillText}>♥ Saludable</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tarjeta Flotante de 3 Estadísticas (.card.stats) */}
      <View
        style={[
          estilos.stats,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}
      >
        <View style={[estilos.statCol, { borderRightWidth: 1, borderRightColor: colors.line }]}>
          <Text style={[estilos.statSmall, { color: colors.muted }]}>Peso actual</Text>
          <Text style={[estilos.statBold, { color: colors.text }]}>
            {pesoMostrado ? `${pesoMostrado} kg` : '—'}
          </Text>
          <Text style={[estilos.statEm, { color: colors.brand }]}>{deltaTexto}</Text>
        </View>

        <View style={[estilos.statCol, { borderRightWidth: 1, borderRightColor: colors.line }]}>
          <Text style={[estilos.statSmall, { color: colors.muted }]}>Edad</Text>
          <Text style={[estilos.statBold, { color: colors.text }]}>{edadTexto}</Text>
          <Text style={[estilos.statEm, { color: colors.brand }]}>{desdeAnio}</Text>
        </View>

        <View style={estilos.statCol}>
          <Text style={[estilos.statSmall, { color: colors.muted }]}>Raza</Text>
          <Text numberOfLines={1} style={[estilos.statBold, { color: colors.text, fontSize: 16 }]}>
            {razaLimpia}
          </Text>
          <Text style={[estilos.statEm, { color: colors.brand }]}>{especieTexto}</Text>
        </View>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedorPrincipal: {
    marginBottom: 6,
  },
  hero: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 18,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  round: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  barTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  av: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avImg: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avEmoji: {
    fontSize: 40,
  },
  camBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  subInfo: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 2,
    opacity: 0.95,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: -42,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statSmall: {
    fontSize: 12,
    fontWeight: '700',
  },
  statBold: {
    fontSize: 19,
    fontWeight: '800',
    marginVertical: 2,
  },
  statEm: {
    fontSize: 11.5,
    fontWeight: '800',
  },
});

export default ProfileHero;
