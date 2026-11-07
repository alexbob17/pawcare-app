import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../constants/colors';

/**
 * Input reutilizable con etiqueta, ícono y manejo de errores
 */
const Input = ({
  etiqueta,
  valor,
  alCambiar,
  placeholder,
  esPassword = false,
  teclado = 'default',
  multilinea = false,
  lineas = 1,
  error = null,
  iconoIzquierda = null,
  iconoDerecha = null,
  alPresionarIconoDerecha = null,
  deshabilitado = false,
  estilo = {},
}) => {
  const [enfocado, setEnfocado] = React.useState(false);

  return (
    <View style={[estilos.contenedor, estilo]}>
      {etiqueta && <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <View
        style={[
          estilos.campo,
          enfocado && estilos.campoEnfocado,
          error && estilos.campoError,
          deshabilitado && estilos.campoDeshabilitado,
        ]}
      >
        {iconoIzquierda && (
          <View style={estilos.iconoIzquierda}>{iconoIzquierda}</View>
        )}
        <TextInput
          style={[
            estilos.input,
            iconoIzquierda && { paddingLeft: 4 },
            multilinea && { textAlignVertical: 'top', minHeight: lineas * 22 },
          ]}
          value={valor}
          onChangeText={alCambiar}
          placeholder={placeholder}
          placeholderTextColor={Colors.textoClaro}
          secureTextEntry={esPassword}
          keyboardType={teclado}
          multiline={multilinea}
          numberOfLines={lineas}
          editable={!deshabilitado}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
        />
        {iconoDerecha && (
          <TouchableOpacity
            onPress={alPresionarIconoDerecha}
            style={estilos.iconoDerecha}
          >
            {iconoDerecha}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={estilos.textoError}>{error}</Text>}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textoMedio,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fondoSecundario,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borde,
    paddingHorizontal: 14,
    paddingVertical: 2,
    minHeight: 50,
  },
  campoEnfocado: {
    borderColor: Colors.azulMedio,
    backgroundColor: '#F0F7FF',
    shadowColor: Colors.azulMedio,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  campoError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  campoDeshabilitado: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textoOscuro,
    paddingVertical: 10,
  },
  iconoIzquierda: {
    marginRight: 10,
  },
  iconoDerecha: {
    marginLeft: 10,
    padding: 4,
  },
  textoError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
