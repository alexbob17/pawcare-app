import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginConEmail,
  registroConEmail,
  loginConGoogle,
  registroConGoogle,
  loginConGoogleCredential,
  autenticarConGoogleNativo,
  cerrarSesion as fbCerrarSesion,
  suscribirEstadoAuth,
  guardarPerfilUsuario,
} from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Escuchar estado de autenticación de Firebase en tiempo real
  useEffect(() => {
    const desuscribir = suscribirEstadoAuth((usuarioFirebase) => {
      setUsuario(usuarioFirebase);
      setCargando(false);
    });
    return () => {
      if (typeof desuscribir === 'function') desuscribir();
    };
  }, []);

  // Iniciar sesión con correo y contraseña en Firebase Auth con mapeo de errores amigables
  const iniciarSesion = useCallback(async ({ correo, contrasena }) => {
    try {
      const u = await loginConEmail(correo, contrasena);
      setUsuario(u);
      return { exito: true, usuario: u };
    } catch (e) {
      let errorCodigo = 'credencialesInvalidas';
      let mensajeAmigable = 'Correo o contraseña incorrectos.';

      const code = e?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        errorCodigo = 'credencialesInvalidas';
        mensajeAmigable =
          'No existe una cuenta con estos datos o la contraseña es incorrecta. Si eres nuevo, pulsa "Regístrate gratis".';
      } else if (code === 'auth/invalid-email') {
        errorCodigo = 'emailInvalido';
        mensajeAmigable = 'El correo electrónico ingresado no tiene un formato válido.';
      } else if (code === 'auth/operation-not-allowed') {
        errorCodigo = 'operacionNoPermitida';
        mensajeAmigable = 'El inicio de sesión con correo no está habilitado temporalmente.';
      } else if (code === 'auth/too-many-requests') {
        errorCodigo = 'demasiadosIntentos';
        mensajeAmigable =
          'Demasiados intentos fallidos. Por seguridad, espera unos minutos o restablece tu contraseña.';
      } else if (code === 'auth/network-request-failed') {
        errorCodigo = 'errorConexion';
        mensajeAmigable = 'Error de conexión. Verifica que tengas acceso a internet.';
      } else if (e?.message) {
        mensajeAmigable = e.message;
      }

      return {
        exito: false,
        error: errorCodigo,
        mensaje: mensajeAmigable,
        codigoFirebase: code,
      };
    }
  }, []);

  // Registrar nuevo usuario en Firebase Auth + Firestore
  const registrar = useCallback(async ({ nombre, correo, contrasena }) => {
    try {
      const u = await registroConEmail(correo, contrasena, nombre);
      setUsuario(u);
      return { exito: true, usuario: u };
    } catch (e) {
      let errorCodigo = 'errorRegistro';
      let mensajeAmigable = 'No se pudo crear la cuenta. Intenta nuevamente.';

      const code = e?.code || '';
      if (code === 'auth/email-already-in-use') {
        errorCodigo = 'correoYaRegistrado';
        mensajeAmigable =
          'Este correo electrónico ya está registrado. Inicia sesión en su lugar.';
      } else if (code === 'auth/weak-password') {
        errorCodigo = 'contrasenaDebil';
        mensajeAmigable = 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';
      } else if (code === 'auth/invalid-email') {
        errorCodigo = 'emailInvalido';
        mensajeAmigable = 'El correo electrónico no es válido.';
      } else if (code === 'auth/operation-not-allowed') {
        errorCodigo = 'operacionNoPermitida';
        mensajeAmigable = 'El registro de usuarios se encuentra en mantenimiento temporal.';
      } else if (e?.message) {
        mensajeAmigable = e.message;
      }

      return {
        exito: false,
        error: errorCodigo,
        mensaje: mensajeAmigable,
        codigoFirebase: code,
      };
    }
  }, []);

  // Iniciar sesión con Google (verifica que la cuenta ya esté registrada)
  const iniciarSesionConGoogle = useCallback(async (datos) => {
    try {
      if (typeof datos === 'string') {
        const u = await loginConGoogleCredential(datos);
        setUsuario(u);
        return { exito: true, usuario: u };
      }
      if (datos && datos.correo) {
        const u = await loginConGoogle(datos);
        setUsuario(u);
        return { exito: true, usuario: u };
      }
      return {
        exito: false,
        error: 'requiereCuenta',
        mensaje: 'Selecciona una cuenta de Google para continuar.',
      };
    } catch (e) {
      return {
        exito: false,
        noRegistrado: e?.code === 'auth/google-not-registered',
        error: e?.code || 'errorGoogle',
        mensaje:
          e?.message ||
          'Esta cuenta de Google no está registrada. Por favor regístrate primero.',
      };
    }
  }, []);

  // Registrar cuenta nueva con Google (sin llenar formulario manual)
  const registrarConGoogle = useCallback(async (datos) => {
    try {
      const u = await registroConGoogle(datos);
      setUsuario(u);
      return { exito: true, usuario: u };
    } catch (e) {
      return {
        exito: false,
        error: e?.code || 'errorGoogleRegistro',
        mensaje: e?.message || 'No se pudo registrar con Google. Intenta de nuevo.',
      };
    }
  }, []);

  // Iniciar sesión / registrar con el selector nativo de Google Play Services de Android
  const iniciarSesionNativaGoogle = useCallback(async () => {
    try {
      const res = await autenticarConGoogleNativo();
      if (res.disponible && res.exito && res.usuario) {
        setUsuario(res.usuario);
        return { exito: true, usuario: res.usuario };
      }
      if (res.cancelado) {
        return { exito: false, cancelado: true };
      }
      return { exito: false, disponible: false, mensaje: res.error };
    } catch (e) {
      return {
        exito: false,
        error: e?.code || 'errorGoogle',
        mensaje: e?.message || 'Error al autenticar con Google.',
      };
    }
  }, []);

  // Actualizar perfil de usuario en Cloud Firestore
  const actualizarPerfil = useCallback(
    async (datos) => {
      if (!usuario?.id) return { exito: false, error: 'noUsuario' };
      const ok = await guardarPerfilUsuario(usuario.id, datos);
      if (ok) {
        setUsuario((prev) => ({ ...prev, ...datos }));
        return { exito: true };
      }
      return { exito: false, error: 'errorActualizar', mensaje: 'No se pudo guardar el perfil' };
    },
    [usuario]
  );

  // Cerrar sesión en Firebase Auth
  const cerrarSesion = useCallback(async () => {
    await fbCerrarSesion();
    setUsuario(null);
  }, []);

  const valor = {
    usuario,
    cargando,
    registrar,
    iniciarSesion,
    iniciarSesionConGoogle,
    registrarConGoogle,
    iniciarSesionNativaGoogle,
    actualizarPerfil,
    cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
};

export default useAuth;
