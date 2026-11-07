import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Colors from '../../constants/colors';

/**
 * Botón principal de PawCare
 * variante: 'primario' | 'secundario' | 'peligro' | 'fantasma'
 */
const Button = ({
  titulo,
  onPress,
  variante = 'primario',
  tamaño = 'mediano',
  cargando = false,
  deshabilitado = false,
  icono = null,
  estilo = {},
  estiloTexto = {},
}) => {
  const estiloBoton = [
    estilos.base,
    estilos[variante],
    estilos[`tamaño_${tamaño}`],
    (deshabilitado || cargando) && estilos.deshabilitado,
    estilo,
  ];

  const estiloTextoFinal = [
    estilos.texto,
    estilos[`texto_${variante}`],
    estilos[`textoTamaño_${tamaño}`],
    estiloTexto,
  ];

  return (
    <TouchableOpacity
      style={estiloBoton}
      onPress={onPress}
      disabled={deshabilitado || cargando}
      activeOpacity={0.8}
    >
      {cargando ? (
        <ActivityIndicator
          color={variante === 'primario' ? '#FFF' : Colors.azulMedio}
          size="small"
        />
      ) : (
        <View style={estilos.contenido}>
          {icono && <View style={estilos.icono}>{icono}</View>}
          <Text style={estiloTextoFinal}>{titulo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icono: {
    marginRight: 4,
  },

  // Variantes
  primario: {
    backgroundColor: Colors.azulMedio,
    shadowColor: Colors.azulMedio,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secundario: {
    backgroundColor: Colors.fondoSecundario,
    borderWidth: 1.5,
    borderColor: Colors.azulMedio,
  },
  peligro: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  fantasma: {
    backgroundColor: 'transparent',
  },

  // Tamaños
  tamaño_grande: { paddingVertical: 16, paddingHorizontal: 32 },
  tamaño_mediano: { paddingVertical: 13, paddingHorizontal: 24 },
  tamaño_pequeño: { paddingVertical: 8, paddingHorizontal: 16 },

  // Textos
  texto: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  texto_primario: { color: '#FFFFFF' },
  texto_secundario: { color: Colors.azulMedio },
  texto_peligro: { color: Colors.error },
  texto_fantasma: { color: Colors.azulMedio },

  textoTamaño_grande: { fontSize: 17 },
  textoTamaño_mediano: { fontSize: 15 },
  textoTamaño_pequeño: { fontSize: 13 },

  deshabilitado: { opacity: 0.5 },
});

export default Button;
