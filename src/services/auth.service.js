import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { cancelarTodosLosRecordatorios } from './notifications';
import { conTimeout } from '../utils/timeout';

// Configuración de Google Sign-In Nativo para Android / iOS
let GoogleSigninModule = null;
let statusCodes = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gModule = require('@react-native-google-signin/google-signin');
  GoogleSigninModule = gModule.GoogleSignin;
  statusCodes = gModule.statusCodes;
  if (GoogleSigninModule) {
    GoogleSigninModule.configure({
      webClientId:
        '1083580494874-846rcsdpnt68muol44t0p5q7uomptg9v.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }
} catch {
  // Modo Web o fallback si no está en entorno nativo
}

const PERFIL_LOCAL_KEY = '@pawcare:perfil_usuario';
const CUENTAS_GOOGLE_KEY = '@pawcare:cuentas_google_dispositivo';

/** Clave interna determinística para vincular cuentas Google en Firebase Auth multiplataforma (Web + APK). */
const generarClaveGoogle = (correo) =>
  `GAuth#PawCare#${String(correo || '').trim().toLowerCase()}`;

const formatearNombreDesdeEmail = (emailStr) => {
  const base = String(emailStr || '').split('@')[0] || 'Usuario';
  return base
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
};

export const guardarCuentaGoogleDispositivo = async ({ id, correo, nombre, foto }) => {
  try {
    const emailLimpio = String(correo || '').trim().toLowerCase();
    if (!emailLimpio) return;
    const raw = await AsyncStorage.getItem(CUENTAS_GOOGLE_KEY);
    const actuales = raw ? JSON.parse(raw) : [];
    const listaSegura = Array.isArray(actuales) ? actuales : [];
    const previa = listaSegura.find((c) => c.correo === emailLimpio) || {};
    const filtradas = listaSegura.filter((c) => c.correo !== emailLimpio);

    const nuevaLista = [
      {
        id: id || previa.id || null,
        correo: emailLimpio,
        nombre: nombre || previa.nombre || formatearNombreDesdeEmail(emailLimpio),
        foto: foto || previa.foto || null,
        actualizadoEn: Date.now(),
      },
      ...filtradas,
    ].slice(0, 8);
    await AsyncStorage.setItem(CUENTAS_GOOGLE_KEY, JSON.stringify(nuevaLista));
  } catch {}
};

/**
 * Obtiene únicamente las cuentas guardadas localmente en ESTE dispositivo físico.
 * Nunca consulta la colección global de Firestore para proteger la privacidad entre dispositivos.
 */
export const obtenerCuentasGoogleDispositivo = async () => {
  const mapa = new Map();

  try {
    const raw = await AsyncStorage.getItem(CUENTAS_GOOGLE_KEY);
    const locales = raw ? JSON.parse(raw) : [];
    if (Array.isArray(locales)) {
      locales.forEach((c) => {
        if (c?.correo) {
          const email = c.correo.trim().toLowerCase();
          // Ignorar cuentas de prueba ficticias o compartidas
          if (
            email.includes('pruebacorreonic') ||
            email.includes('pruebacorreo123')
          ) {
            return;
          }
          mapa.set(email, {
            id: c.id || null,
            correo: email,
            nombre: c.nombre || formatearNombreDesdeEmail(email),
            foto: c.foto || null,
          });
        }
      });
    }
  } catch {}

  try {
    const perfil = await leerPerfilLocal();
    if (perfil?.email) {
      const email = perfil.email.trim().toLowerCase();
      if (!mapa.has(email)) {
        mapa.set(email, {
          id: perfil.id || null,
          correo: email,
          nombre: perfil.nombre || formatearNombreDesdeEmail(email),
          foto: perfil.foto || null,
        });
      }
    }
  } catch {}

  return Array.from(mapa.values());
};

/**
 * Dispara el selector nativo de cuentas de Google Play Services de Android (exactamente como Claude).
 * Muestra el bottom-sheet del sistema con todas las cuentas del teléfono del usuario.
 */
export const autenticarConGoogleNativo = async () => {
  if (Platform.OS === 'web' || !GoogleSigninModule) {
    return { disponible: false };
  }

  try {
    await GoogleSigninModule.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Se cierra sesión previa en GoogleSignin para forzar que Android siempre muestre la lista completa de cuentas del dispositivo
    await GoogleSigninModule.signOut().catch(() => {});

    const respuesta = await GoogleSigninModule.signIn();
    // v13+: al cerrar el selector devuelve { type: 'cancelled' } en lugar de lanzar error
    if (respuesta?.type === 'cancelled') {
      return { disponible: true, cancelado: true };
    }
    // En v13 / v14 el token puede venir en respuesta.idToken o respuesta.data?.idToken
    const idToken = respuesta?.idToken || respuesta?.data?.idToken;
    if (!idToken) {
      throw new Error('Google Play Services no devolvió el token de identidad necesario.');
    }

    const usuarioFirebase = await loginConGoogleCredential(idToken);
    return { disponible: true, exito: true, usuario: usuarioFirebase };
  } catch (error) {
    if (error?.code === statusCodes?.SIGN_IN_CANCELLED) {
      return { disponible: true, cancelado: true };
    }
    if (error?.code === statusCodes?.IN_PROGRESS) {
      return { disponible: true, cancelado: true };
    }
    if (error?.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        disponible: false,
        error: 'Google Play Services no se encuentra disponible o actualizado.',
      };
    }
    // Propagar error para que la UI informe claramente al usuario
    throw error;
  }
};

/**
 * Lee el perfil almacenado en caché local verificando estrictamente que pertenezca al uid activo.
 */
export const leerPerfilLocal = async (uid) => {
  try {
    const raw = await AsyncStorage.getItem(PERFIL_LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (uid && parsed.id && parsed.id !== uid) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

export const guardarPerfilLocal = async (datos) => {
  try {
    const actual = await leerPerfilLocal(datos?.id);
    const combinado = { ...actual, ...datos };
    await AsyncStorage.setItem(PERFIL_LOCAL_KEY, JSON.stringify(combinado));
    return combinado;
  } catch {
    return datos;
  }
};

/** Convierte el usuario de Auth en el objeto básico que usa la app (sin teléfonos quemados). */
const mapearUsuario = (user, extra = {}) => ({
  id: user.uid || user.id,
  email: user.email,
  nombre: extra.nombre || user.displayName || formatearNombreDesdeEmail(user.email),
  foto: extra.foto || user.photoURL || null,
  telefono: extra.telefono || '',
  direccion: extra.direccion || '',
  veterinarioNombre: extra.veterinarioNombre || '',
  veterinarioClinica: extra.veterinarioClinica || '',
  veterinarioTelefono: extra.veterinarioTelefono || '',
  notificacionesActivas: extra.notificacionesActivas ?? true,
  ...extra,
  sesionActiva: true,
});

/**
 * Inicia sesión con correo y contraseña.
 */
export const loginConEmail = async (email, password) => {
  const emailLimpio = email.trim().toLowerCase();
  const cred = await conTimeout(signInWithEmailAndPassword(auth, emailLimpio, password));
  const extraLocal = await leerPerfilLocal(cred.user.uid);
  const usuarioMapeado = mapearUsuario(cred.user, extraLocal);
  await guardarPerfilLocal(usuarioMapeado);
  await guardarCuentaGoogleDispositivo({
    id: usuarioMapeado.id,
    correo: emailLimpio,
    nombre: usuarioMapeado.nombre,
    foto: usuarioMapeado.foto,
  });
  guardarPerfilUsuario(cred.user.uid, { ...usuarioMapeado, ultimoAcceso: serverTimestamp() });
  return usuarioMapeado;
};

/** Registra un nuevo usuario con correo, contraseña y nombre. */
export const registroConEmail = async (email, password, nombre) => {
  const emailLimpio = email.trim().toLowerCase();
  const cred = await conTimeout(createUserWithEmailAndPassword(auth, emailLimpio, password));
  const datos = mapearUsuario(cred.user, {
    nombre: nombre || formatearNombreDesdeEmail(emailLimpio),
    email: emailLimpio,
    proveedor: 'email',
  });

  await guardarPerfilLocal(datos);
  await guardarCuentaGoogleDispositivo({
    id: datos.id,
    correo: emailLimpio,
    nombre: datos.nombre,
  });
  updateProfile(cred.user, { displayName: datos.nombre }).catch(() => {});
  guardarPerfilUsuario(cred.user.uid, { ...datos, creadoEn: serverTimestamp() });

  return datos;
};

/**
 * Inicia sesión con una cuenta de Google asegurando sesión activa real en Firebase Auth.
 */
export const loginConGoogle = async ({ correo, nombre }) => {
  const emailLimpio = String(correo || '').trim().toLowerCase();
  const claveGoogle = generarClaveGoogle(emailLimpio);

  try {
    const cred = await conTimeout(signInWithEmailAndPassword(auth, emailLimpio, claveGoogle));
    const extraLocal = await leerPerfilLocal(cred.user.uid);
    const usuarioMapeado = mapearUsuario(cred.user, {
      ...extraLocal,
      email: emailLimpio,
      nombre:
        extraLocal.nombre ||
        cred.user.displayName ||
        nombre ||
        formatearNombreDesdeEmail(emailLimpio),
      proveedor: 'google',
    });
    await guardarPerfilLocal(usuarioMapeado);
    await guardarCuentaGoogleDispositivo({
      id: usuarioMapeado.id,
      correo: emailLimpio,
      nombre: usuarioMapeado.nombre,
    });
    guardarPerfilUsuario(cred.user.uid, { ...usuarioMapeado, ultimoAcceso: serverTimestamp() });
    return usuarioMapeado;
  } catch (e) {
    // Verificar si el correo fue registrado previamente con contraseña manual
    try {
      const q = query(collection(db, 'usuarios'), where('email', '==', emailLimpio));
      const snap = await conTimeout(getDocs(q), 2000);
      if (!snap.empty) {
        const datosExistentes = snap.docs[0].data();
        if (datosExistentes?.proveedor === 'email') {
          const errManual = new Error(
            `El correo "${emailLimpio}" fue registrado con contraseña manual. Por favor ingresa tu contraseña en la pantalla de Inicio de Sesión.`
          );
          errManual.code = 'auth/email-registered-manually';
          throw errManual;
        }
      }
    } catch (innerErr) {
      if (innerErr?.code === 'auth/email-registered-manually') {
        throw innerErr;
      }
    }

    const err = new Error(
      `La cuenta "${emailLimpio}" aún no está registrada en PawCare. Ve a "Regístrate gratis" y selecciona "Registrarse con Google".`
    );
    err.code = 'auth/google-not-registered';
    err.correo = emailLimpio;
    throw err;
  }
};

/**
 * Registra una nueva cuenta de Google en PawCare.
 * Si la cuenta ya estaba registrada con Google, inicia sesión automáticamente.
 */
export const registroConGoogle = async ({ correo, nombre }) => {
  const emailLimpio = String(correo || '').trim().toLowerCase();
  const claveGoogle = generarClaveGoogle(emailLimpio);
  const nombreFinal = nombre?.trim() || formatearNombreDesdeEmail(emailLimpio);

  try {
    const cred = await conTimeout(createUserWithEmailAndPassword(auth, emailLimpio, claveGoogle));
    const datos = mapearUsuario(cred.user, {
      nombre: nombreFinal,
      email: emailLimpio,
      proveedor: 'google',
      registradoConGoogle: true,
    });

    await guardarPerfilLocal(datos);
    await guardarCuentaGoogleDispositivo({
      id: datos.id,
      correo: emailLimpio,
      nombre: nombreFinal,
    });
    updateProfile(cred.user, { displayName: nombreFinal }).catch(() => {});
    guardarPerfilUsuario(cred.user.uid, { ...datos, creadoEn: serverTimestamp() });

    return datos;
  } catch (e) {
    if (e?.code === 'auth/email-already-in-use') {
      return await loginConGoogle({ correo: emailLimpio, nombre: nombreFinal });
    }
    throw e;
  }
};

/** Inicia sesión o registra con credencial nativa de Google (IdToken) si se provee. */
export const loginConGoogleCredential = async (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await conTimeout(signInWithCredential(auth, credential));
  const extraLocal = await leerPerfilLocal(cred.user.uid);
  const base = mapearUsuario(cred.user, extraLocal);
  await guardarPerfilLocal(base);
  await guardarCuentaGoogleDispositivo({
    id: base.id,
    correo: base.email,
    nombre: base.nombre,
    foto: base.foto,
  });
  guardarPerfilUsuario(cred.user.uid, { ...base, ultimoAcceso: serverTimestamp() });
  return base;
};

export const cerrarSesion = async () => {
  try {
    await cancelarTodosLosRecordatorios();
  } catch {}
  try {
    const actual = await leerPerfilLocal();
    if (actual) {
      await AsyncStorage.setItem(
        PERFIL_LOCAL_KEY,
        JSON.stringify({ ...actual, sesionActiva: false })
      );
    }
  } catch {}
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut aviso:', e?.message);
  }
};

/**
 * Escucha cambios de sesión combinando Firebase Auth y perfil sincronizado en Firestore.
 */
export const suscribirEstadoAuth = (callback) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const extraLocal = await leerPerfilLocal(user.uid);
    const base = mapearUsuario(user, extraLocal);
    await guardarCuentaGoogleDispositivo({
      id: base.id,
      correo: base.email,
      nombre: base.nombre,
      foto: base.foto,
    });
    callback(base);

    // Sincronizar datos extra desde Firestore en segundo plano si existen
    obtenerPerfilUsuario(user.uid)
      .then(async (remoto) => {
        if (remoto) {
          const enriquecido = mapearUsuario(user, { ...remoto, ...extraLocal });
          await guardarPerfilLocal(enriquecido);
          callback(enriquecido);
        } else {
          guardarPerfilUsuario(user.uid, base);
        }
      })
      .catch(() => {});
  });

/** Obtiene el documento de perfil extendido (teléfono, dirección, veterinario, etc.). */
export const obtenerPerfilUsuario = async (uid) => {
  try {
    const snapshot = await conTimeout(getDoc(doc(db, 'usuarios', uid)), 3000);
    return snapshot.exists() ? snapshot.data() : null;
  } catch {
    return null;
  }
};

/** Guarda o actualiza el perfil del usuario localmente al instante y en Firestore en segundo plano. */
export const guardarPerfilUsuario = async (uid, datos) => {
  await guardarPerfilLocal({ id: uid, ...datos });
  Promise.resolve().then(async () => {
    try {
      await conTimeout(setDoc(doc(db, 'usuarios', uid), datos, { merge: true }), 3500);
    } catch {}
  });
  return true;
};
