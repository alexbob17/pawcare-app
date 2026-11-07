import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import {
  tieneFotoPersonalizada,
  emojiSoloEspecie,
  simboloSexo,
  nombreEspecie,
} from '../../constants/pets';
import { obtenerTextoEdad } from '../../utils/dates';

export const PetCarousel = ({
  mascotas = [],
  mascotaSeleccionadaId,
  onSeleccionarMascota,
  onVerTodas,
  onAgregarMascota,
}) => {
  const { colors } = useTheme();

  return (
    <View style={estilos.seccion}>
      <View style={estilos.h3Row}>
        <Text style={[estilos.h3, { color: colors.text }]}>Mis mascotas</Text>
        <TouchableOpacity onPress={onVerTodas} activeOpacity={0.7}>
          <Text style={[estilos.link, { color: colors.brand }]}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {mascotas.length === 0 ? (
        <TouchableOpacity
          onPress={onAgregarMascota}
          activeOpacity={0.85}
          style={[
            estilos.emptyPetChip,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <View
            style={[
              estilos.av,
              { backgroundColor: colors.okBg, borderColor: colors.brand },
            ]}
          >
            <Text style={{ fontSize: 22 }}>🐾</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[estilos.petName, { color: colors.text }]}>
              Registra tu primera mascota
            </Text>
            <Text style={[estilos.petMeta, { color: colors.muted }]}>
              Toca aquí para añadir su nombre, especie y edad
            </Text>
          </View>
          <Text style={{ color: colors.brand, fontWeight: '800', fontSize: 18 }}>＋</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.row}
        >
          {mascotas.map((m) => {
            const esActiva =
              mascotaSeleccionadaId === m.id ||
              (!mascotaSeleccionadaId && mascotas[0]?.id === m.id);
            const usaFotoReal = tieneFotoPersonalizada(m);
            const emoji = emojiSoloEspecie(m.especie);
            const sexoSimbolo = simboloSexo(m.sexo);
            const razaOEsp = m.raza || nombreEspecie(m.especie, m.sexo);
            const edadTexto = obtenerTextoEdad(m);

            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => onSeleccionarMascota(m.id)}
              >
                <LinearGradient
                  colors={
                    esActiva
                      ? [colors.okBg, colors.surface2]
                      : [colors.surface, colors.surface2]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    estilos.petChip,
                    {
                      borderColor: esActiva ? colors.brand : colors.line,
                      borderWidth: esActiva ? 1.8 : 1,
                    },
                  ]}
                >
                  <View style={estilos.top}>
                    <View
                      style={[
                        estilos.av,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.brand,
                        },
                      ]}
                    >
                      {usaFotoReal ? (
                        <Image source={{ uri: m.foto }} style={estilos.avImg} />
                      ) : (
                        <Text style={estilos.avEmoji}>{emoji}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[estilos.petName, { color: colors.text }]}
                      >
                        {m.nombre} {sexoSimbolo}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[estilos.petMeta, { color: colors.muted }]}
                      >
                        {razaOEsp} · {edadTexto}
                      </Text>
                    </View>
                  </View>

                  <View style={estilos.okRow}>
                    <Text style={[estilos.okText, { color: colors.brand }]}>
                      ♥ Saludable
                    </Text>
                    {esActiva && (
                      <Text style={[estilos.activeDot, { color: colors.brand }]}>
                        ● Activo
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  seccion: {
    marginBottom: 14,
  },
  h3Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  h3: {
    fontSize: 17,
    fontWeight: '800',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
  },
  petChip: {
    minWidth: 162,
    padding: 12,
    borderRadius: 20,
  },
  emptyPetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  av: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avImg: {
    width: '100%',
    height: '100%',
  },
  avEmoji: {
    fontSize: 24,
  },
  petName: {
    fontSize: 15,
    fontWeight: '800',
  },
  petMeta: {
    fontSize: 12.5,
    marginTop: 1,
    fontWeight: '600',
  },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  okText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  activeDot: {
    fontSize: 10.5,
    fontWeight: '800',
  },
});

export default PetCarousel;
