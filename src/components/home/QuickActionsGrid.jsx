import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { diasHasta, formatearFechaCorta } from '../../utils/dates';

const TileItem = ({ tile, colors }) => {
  const escala = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(escala, {
      toValue: 0.94,
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

  return (
    <Animated.View style={[{ width: '31.5%' }, { transform: [{ scale: escala }] }]}>
      <TouchableOpacity
        style={[
          estilos.tile,
          {
            backgroundColor: colors.surface,
            borderColor: tile.late ? colors.warn : colors.line,
          },
        ]}
        onPress={tile.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[estilos.ic, { backgroundColor: tile.bgIcono }]}>
          <Feather name={tile.icon} size={18} color={tile.colorIcono} />
        </View>
        <Text numberOfLines={1} style={[estilos.tileBold, { color: colors.text }]}>
          {tile.titulo}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            estilos.tileSmall,
            {
              color: tile.late ? colors.warn : colors.muted,
              fontWeight: tile.late ? '800' : '600',
            },
          ]}
        >
          {tile.detalle}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const QuickActionsGrid = ({
  mascotaActiva,
  resumenClinico = { vacunas: [], medicamentos: [], citas: [], pesos: [] },
  onPressAccion,
  onPressQR,
  onPressPDF,
}) => {
  const { colors } = useTheme();

  // 1. Estado real de Vacunas (Diferenciando pendientes / vencidas de aplicadas)
  const vacunas = resumenClinico?.vacunas || [];
  const vacunasPendientes = vacunas.filter(
    (v) => v.aplicada === false || v.estado === 'pendiente'
  );
  const vacunasVencidas = vacunasPendientes.filter((v) => {
    const f = new Date(v.fechaProgramada || v.proximaDosis || v.fechaAplicacion);
    return f < new Date();
  });
  const vacunasFuturas = vacunasPendientes
    .filter((v) => {
      const f = new Date(v.fechaProgramada || v.proximaDosis || v.fechaAplicacion);
      return f >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.fechaProgramada || a.proximaDosis || a.fechaAplicacion) -
        new Date(b.fechaProgramada || b.proximaDosis || b.fechaAplicacion)
    );

  let detalleVacunas = 'Sin datos';
  let vacunasAlerta = false;

  if (mascotaActiva && vacunas.length > 0) {
    if (vacunasVencidas.length > 0) {
      detalleVacunas = `${vacunasVencidas.length} ${
        vacunasVencidas.length === 1 ? 'pendiente' : 'pendientes'
      }`;
      vacunasAlerta = true;
    } else if (vacunasFuturas.length > 0) {
      const fechaProx =
        vacunasFuturas[0].fechaProgramada ||
        vacunasFuturas[0].proximaDosis ||
        vacunasFuturas[0].fechaAplicacion;
      detalleVacunas = `Próx. ${formatearFechaCorta(fechaProx)}`;
    } else {
      detalleVacunas = 'Al día';
    }
  }

  // 2. Estado real de Medicinas
  const medicamentos = resumenClinico?.medicamentos || [];
  const detalleMedicinas = !mascotaActiva
    ? 'Sin datos'
    : medicamentos.length > 0
    ? `${medicamentos.length} ${medicamentos.length === 1 ? 'activo' : 'activos'}`
    : 'Sin datos';

  // 3. Estado real de Citas (detectando vencidas)
  const citas = resumenClinico?.citas || [];
  const citasVencidas = citas.filter((c) => {
    const d = diasHasta(c.fecha);
    return d !== null && d < 0;
  });
  const citasFuturas = citas
    .filter((c) => {
      const d = diasHasta(c.fecha);
      return d !== null && d >= 0;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  let detalleCitas = 'Sin datos';
  let citaVencida = false;
  if (mascotaActiva && citas.length > 0) {
    if (citasVencidas.length > 0) {
      detalleCitas = `${citasVencidas.length} ${
        citasVencidas.length === 1 ? 'vencida' : 'vencidas'
      }`;
      citaVencida = true;
    } else if (citasFuturas.length > 0) {
      detalleCitas = `Próx. ${formatearFechaCorta(citasFuturas[0].fecha)}`;
    }
  }

  // 4. Estado real de Peso
  const pesos = resumenClinico?.pesos || [];
  const ultimoPeso =
    pesos.length > 0
      ? pesos[0].peso
      : mascotaActiva?.pesoActual
      ? mascotaActiva.pesoActual
      : null;
  const detallePeso = !mascotaActiva || !ultimoPeso ? 'Sin datos' : `${ultimoPeso} kg`;

  const tiles = [
    {
      id: 'vaccines',
      icon: 'shield',
      colorIcono: vacunasAlerta ? colors.warn : '#059669',
      bgIcono: vacunasAlerta ? '#FEE2E2' : '#ECFDF5',
      titulo: 'Vacunas',
      detalle: detalleVacunas,
      late: vacunasAlerta,
      onPress: () => onPressAccion('vaccines'),
    },
    {
      id: 'medications',
      icon: 'plus-circle',
      colorIcono: '#4F46E5',
      bgIcono: '#EEF2FF',
      titulo: 'Medicinas',
      detalle: detalleMedicinas,
      late: false,
      onPress: () => onPressAccion('medications'),
    },
    {
      id: 'appointments',
      icon: 'calendar',
      colorIcono: citaVencida ? colors.warn : '#D97706',
      bgIcono: citaVencida ? '#FEE2E2' : '#FEF3C7',
      titulo: 'Citas',
      detalle: detalleCitas,
      late: citaVencida,
      onPress: () => onPressAccion('appointments'),
    },
    {
      id: 'weight',
      icon: 'trending-up',
      colorIcono: '#DB2777',
      bgIcono: '#FCE7F3',
      titulo: 'Peso',
      detalle: detallePeso,
      late: false,
      onPress: () => onPressAccion('weight'),
    },
    {
      id: 'qr',
      icon: 'maximize',
      colorIcono: '#0D9488',
      bgIcono: '#CCFBF1',
      titulo: 'QR Collar',
      detalle: 'Emergencia',
      late: false,
      onPress: onPressQR,
    },
    {
      id: 'pdf',
      icon: 'file-text',
      colorIcono: '#7C3AED',
      bgIcono: '#F3E8FF',
      titulo: 'Ficha PDF',
      detalle: 'Historial',
      late: false,
      onPress: onPressPDF,
    },
  ];

  return (
    <View style={estilos.seccion}>
      <View style={estilos.h3Row}>
        <Text style={[estilos.h3, { color: colors.text }]}>Accesos rápidos</Text>
        {mascotaActiva && (
          <Text style={[estilos.mascotaTag, { color: colors.brand }]}>
            🐾 {mascotaActiva.nombre}
          </Text>
        )}
      </View>

      <View style={estilos.grid}>
        {tiles.map((t) => (
          <TileItem key={t.id} tile={t} colors={colors} />
        ))}
      </View>

      {/* Banner Motivacional */}
      <View style={[estilos.banner, { backgroundColor: colors.okBg }]}>
        <Feather name="heart" size={20} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={[estilos.bannerBold, { color: colors.text }]}>
            Pequeños cuidados, grandes momentos
          </Text>
          <Text style={[estilos.bannerSmall, { color: colors.muted }]}>
            Su salud también es parte de tu bienestar.
          </Text>
        </View>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  seccion: {
    marginBottom: 20,
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
  mascotaTag: {
    fontSize: 13,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tile: {
    width: '100%',
    minHeight: 106,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  ic: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBold: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileSmall: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  banner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSmall: {
    fontSize: 12.5,
    marginTop: 1,
    fontWeight: '600',
  },
});

export default QuickActionsGrid;
