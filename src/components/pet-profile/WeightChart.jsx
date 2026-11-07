import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Polygon, Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

export const WeightChart = ({
  pesoActual = null,
  historial = [],
  onPressAgregarPeso,
}) => {
  const { colors } = useTheme();

  // Construir puntos a partir del historial real o del peso actual de la mascota
  const puntosDatos = useMemo(() => {
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (historial && historial.length > 0) {
      const ordenados = [...historial]
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(-6);
      return ordenados.map((item) => {
        const d = new Date(item.fecha);
        const mes = !isNaN(d.getTime()) ? mesesNombres[d.getMonth()] : 'Reg';
        const anio = !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
        return {
          etiqueta: mes,
          valor: Number(item.peso) || 0,
          anio,
        };
      });
    }

    const base = Number(pesoActual) || 10;
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();
    return [
      { etiqueta: mesesNombres[(mesActual + 7) % 12], valor: Number((base * 0.92).toFixed(1)), anio: anioActual },
      { etiqueta: mesesNombres[(mesActual + 8) % 12], valor: Number((base * 0.94).toFixed(1)), anio: anioActual },
      { etiqueta: mesesNombres[(mesActual + 9) % 12], valor: Number((base * 0.95).toFixed(1)), anio: anioActual },
      { etiqueta: mesesNombres[(mesActual + 10) % 12], valor: Number((base * 0.97).toFixed(1)), anio: anioActual },
      { etiqueta: mesesNombres[(mesActual + 11) % 12], valor: Number((base * 0.98).toFixed(1)), anio: anioActual },
      { etiqueta: mesesNombres[mesActual], valor: Number(base.toFixed(1)), anio: anioActual },
    ];
  }, [historial, pesoActual]);

  const [indiceSeleccionado, setIndiceSeleccionado] = useState(puntosDatos.length - 1);
  const idxSeguro = Math.min(indiceSeleccionado, Math.max(0, puntosDatos.length - 1));
  const puntoActivo = puntosDatos[idxSeguro];

  // Geometría SVG idéntica al prototipo HTML
  const L = 32;
  const R = 268;
  const T = 14;
  const B = 122;

  const valores = puntosDatos.map((p) => p.valor);
  const minVal = Math.max(0, Math.floor(Math.min(...valores) - 2));
  const maxVal = Math.ceil(Math.max(...valores) + 2);
  const midVal = Math.round((minVal + maxVal) / 2);
  const rango = Math.max(1, maxVal - minVal);

  const getX = (i) => {
    if (puntosDatos.length <= 1) return (L + R) / 2;
    return L + (i * (R - L)) / (puntosDatos.length - 1);
  };
  const getY = (v) => B - ((v - minVal) / rango) * (B - T);

  const ptsString = puntosDatos.map((d, i) => `${getX(i)},${getY(d.valor)}`).join(' ');
  const polygonPoints = `${getX(0)},${B} ${ptsString} ${getX(puntosDatos.length - 1)},${B}`;

  return (
    <View
      style={[
        estilos.chartcard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
        },
      ]}
    >
      <View style={estilos.topRow}>
        <Text style={[estilos.titulo, { color: colors.text }]}>Evolución de peso</Text>
        <View style={estilos.rightActions}>
          <View style={[estilos.chip, { backgroundColor: colors.surface2 }]}>
            <Text style={[estilos.chipText, { color: colors.muted }]}>
              {historial.length > 0 ? `${historial.length} reg.` : '6 meses'}
            </Text>
          </View>
          {onPressAgregarPeso && (
            <TouchableOpacity
              style={[estilos.btnMiniPeso, { backgroundColor: colors.okBg }]}
              onPress={onPressAgregarPeso}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.brand }}>
                + Peso
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={estilos.svgWrapper}>
        <Svg viewBox="0 0 280 150" width="100%" height={150}>
          {[minVal, midVal, maxVal].map((v, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={L}
                x2={R}
                y1={getY(v)}
                y2={getY(v)}
                stroke={colors.line}
                strokeDasharray="3, 4"
                strokeWidth="1"
              />
              <SvgText
                x="2"
                y={getY(v) + 4}
                fill={colors.muted}
                fontSize="11"
                fontWeight="700"
              >
                {v}
              </SvgText>
            </React.Fragment>
          ))}

          <Polygon points={polygonPoints} fill={colors.brand} fillOpacity="0.14" />

          <Polyline
            points={ptsString}
            fill="none"
            stroke={colors.brand}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {puntosDatos.map((d, i) => {
            const activo = i === idxSeguro;
            return (
              <React.Fragment key={i}>
                <SvgText
                  x={getX(i) - 11}
                  y="144"
                  fill={activo ? colors.brand : colors.muted}
                  fontSize="11"
                  fontWeight={activo ? '800' : '700'}
                >
                  {d.etiqueta}
                </SvgText>
                <Circle
                  cx={getX(i)}
                  cy={getY(d.valor)}
                  r={activo ? 6.5 : 5}
                  fill={activo ? colors.brand : colors.surface}
                  stroke={colors.brand}
                  strokeWidth="3"
                  onPress={() => setIndiceSeleccionado(i)}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Fila interactiva de puntos para facilitar el toque en móvil */}
      <View style={estilos.touchBar}>
        {puntosDatos.map((d, i) => {
          const activo = i === idxSeguro;
          return (
            <TouchableOpacity
              key={i}
              style={[
                estilos.touchPill,
                activo && { backgroundColor: colors.okBg, borderColor: colors.brand },
              ]}
              onPress={() => setIndiceSeleccionado(i)}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: activo ? colors.brand : colors.muted,
                }}
              >
                {d.etiqueta}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[estilos.tip, { color: colors.muted }]}>
        {puntoActivo ? (
          <>
            <Text style={{ color: colors.brand, fontWeight: '800' }}>
              {String(puntoActivo.valor).replace('.', ',')} kg
            </Text>
            {` · ${puntoActivo.etiqueta} ${puntoActivo.anio} (Toca un mes para ver el detalle)`}
          </>
        ) : (
          'Toca un punto para ver el detalle.'
        )}
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  chartcard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#14302F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '800',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  btnMiniPeso: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  svgWrapper: {
    marginTop: 4,
  },
  touchBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  touchPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tip: {
    fontSize: 12.5,
    marginTop: 6,
    fontWeight: '600',
  },
});

export default WeightChart;
