import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

/**
 * Tarjeta contenedora con sombra y bordes redondeados
 * elevacion: 'baja' | 'media' | 'alta'
 */
const Card = ({ children, estilo = {}, elevacion = 'media', color = Colors.fondoCard }) => {
  return (
    <View style={[estilos.card, estilos[`elev_${elevacion}`], { backgroundColor: color }, estilo]}>
      {children}
    </View>
  );
};

const estilos = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.fondoCard,
  },
  elev_baja: {
    shadowColor: '#A8D4F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  elev_media: {
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  elev_alta: {
    shadowColor: '#2B5FA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default Card;
