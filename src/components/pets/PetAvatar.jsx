import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

/**
 * Avatar circular de mascota con foto o emoji por defecto
 */
const PetAvatar = ({ mascota, tamaño = 60, estilo = {} }) => {
  const tieneFoto = !!mascota?.foto;
  const esAvatarImg = mascota?.avatar && (mascota.avatar.startsWith('http') || mascota.avatar.startsWith('data:'));
  const avatarVisual = mascota?.avatar || (mascota?.especie === 'gato' ? '🐱' : '🐶');

  return (
    <View
      style={[
        estilos.contenedor,
        {
          width: tamaño,
          height: tamaño,
          borderRadius: tamaño / 2,
        },
        estilo,
      ]}
    >
      {tieneFoto ? (
        <Image
          source={{ uri: mascota.foto }}
          style={{
            width: tamaño,
            height: tamaño,
            borderRadius: tamaño / 2,
          }}
          resizeMode="cover"
        />
      ) : esAvatarImg ? (
        <Image
          source={{ uri: mascota.avatar }}
          style={{
            width: tamaño,
            height: tamaño,
            borderRadius: tamaño / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: tamaño * 0.55 }}>{avatarVisual}</Text>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: Colors.azulClaro,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: Colors.azulMedio,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default PetAvatar;
