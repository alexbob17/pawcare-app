import { Alert, Platform } from 'react-native';

/**
 * Diálogos multiplataforma.
 * Soporta tanto llamadas con argumentos posicionales:
 *   confirmar(titulo, mensaje, onConfirm)
 * como llamadas con objeto de opciones que retornan Promesa:
 *   const ok = await confirmar({ titulo, mensaje, textoConfirmar, destructivo })
 */
export const avisar = (titulo, mensaje = '') => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
};

export const confirmar = (arg1, arg2 = '', arg3 = null) => {
  let titulo = '';
  let mensaje = '';
  let textoConfirmar = 'Aceptar';
  let destructivo = true;
  let onConfirmCallback = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    titulo = arg1.titulo || 'Confirmar';
    mensaje = arg1.mensaje || '';
    textoConfirmar = arg1.textoConfirmar || 'Aceptar';
    destructivo = arg1.destructivo ?? false;
    onConfirmCallback = arg1.onConfirm || null;
  } else {
    titulo = String(arg1 || 'Confirmar');
    mensaje = typeof arg2 === 'string' ? arg2 : '';
    if (typeof arg3 === 'function') {
      onConfirmCallback = arg3;
    } else if (typeof arg2 === 'function') {
      onConfirmCallback = arg2;
      mensaje = '';
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const aceptado = window.confirm(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    if (aceptado && typeof onConfirmCallback === 'function') {
      onConfirmCallback();
    }
    return Promise.resolve(aceptado);
  }

  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: textoConfirmar,
          style: destructivo ? 'destructive' : 'default',
          onPress: async () => {
            if (typeof onConfirmCallback === 'function') {
              await onConfirmCallback();
            }
            resolve(true);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
};
