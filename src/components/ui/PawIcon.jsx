import React from 'react';
import { Text } from 'react-native';

/**
 * Ícono de huella de perro/gato usando emoji y texto
 * Se usa como elemento decorativo en la UI
 */
const PawIcon = ({ tamaño = 24, color = '#4A90D9', estilo = {} }) => {
  return (
    <Text style={[{ fontSize: tamaño, lineHeight: tamaño * 1.2 }, estilo]}>
      🐾
    </Text>
  );
};

export default PawIcon;
