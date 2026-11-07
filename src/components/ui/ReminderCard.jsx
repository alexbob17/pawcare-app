import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';
import { diasHasta, formatearFecha, formatearHora } from '../../utils/dates';

const ICONOS_TIPO = {
  vacuna: '💉',
  medicamento: '💊',
  cita: '🏥',
  desparasitacion: '🐛',
};

const COLORES_TIPO = {
  vacuna: Colors.vacuna,
  medicamento: Colors.medicamento,
  cita: Colors.cita,
  desparasitacion: Colors.alerta,
};

/**
 * Tarjeta de recordatorio para la pantalla de inicio
 */
const ReminderCard = ({ recordatorio, onPress, onEliminar }) => {
  const dias = diasHasta(recordatorio.fecha);
  const color = COLORES_TIPO[recordatorio.tipo] || Colors.azulMedio;
  const icono = ICONOS_TIPO[recordatorio.tipo] || '🔔';

  const etiquetaDias = () => {
    if (dias === 0) return { texto: 'Hoy', color: Colors.error };
    if (dias === 1) return { texto: 'Mañana', color: Colors.alerta };
    if (dias < 0) return { texto: 'Pasado', color: Colors.textoClaro };
    return { texto: `En ${dias} días`, color: Colors.azulMedio };
  };

  const { texto: textoDias, color: colorDias } = etiquetaDias();

  return (
    <TouchableOpacity
      style={[estilos.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[estilos.iconoContenedor, { backgroundColor: `${color}20` }]}>
        <Text style={estilos.icono}>{icono}</Text>
      </View>
      <View style={estilos.info}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {recordatorio.titulo}
        </Text>
        <Text style={estilos.cuerpo} numberOfLines={1}>
          {recordatorio.cuerpo}
        </Text>
        <View style={estilos.fila}>
          <Text style={estilos.fecha}>
            {formatearFecha(recordatorio.fecha)} · {formatearHora(recordatorio.fecha)}
          </Text>
        </View>
      </View>
      <View style={estilos.derecha}>
        <Text style={[estilos.etiquetaDias, { color: colorDias }]}>{textoDias}</Text>
        {onEliminar && (
          <TouchableOpacity onPress={onEliminar} style={estilos.btnEliminar}>
            <Text style={estilos.textoEliminar}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconoContenedor: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icono: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textoOscuro,
  },
  cuerpo: {
    fontSize: 12,
    color: Colors.textoMedio,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  fecha: {
    fontSize: 11,
    color: Colors.textoClaro,
  },
  derecha: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 8,
  },
  etiquetaDias: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnEliminar: {
    padding: 4,
  },
  textoEliminar: {
    fontSize: 13,
    color: Colors.textoClaro,
  },
});

export default ReminderCard;
