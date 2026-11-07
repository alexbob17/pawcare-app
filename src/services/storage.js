import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves de almacenamiento
const KEYS = {
  USUARIOS: '@pawcare:usuarios',
  SESION_ACTIVA: '@pawcare:sesion',
  MASCOTAS: '@pawcare:mascotas',
  VACUNAS: '@pawcare:vacunas',
  MEDICAMENTOS: '@pawcare:medicamentos',
  CITAS: '@pawcare:citas',
  PESOS: '@pawcare:pesos',
  SALUD: '@pawcare:salud',
  RECORDATORIOS: '@pawcare:recordatorios',
};

// ─── Helpers genéricos ────────────────────────────────────────────────────────

const guardar = async (clave, datos) => {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(datos));
    return true;
  } catch (e) {
    console.error('Error al guardar:', clave, e);
    return false;
  }
};

const obtener = async (clave) => {
  try {
    const valor = await AsyncStorage.getItem(clave);
    return valor ? JSON.parse(valor) : null;
  } catch (e) {
    console.error('Error al obtener:', clave, e);
    return null;
  }
};

const eliminar = async (clave) => {
  try {
    await AsyncStorage.removeItem(clave);
    return true;
  } catch (e) {
    console.error('Error al eliminar:', clave, e);
    return false;
  }
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const obtenerUsuarios = async () => {
  const usuarios = await obtener(KEYS.USUARIOS);
  return usuarios || [];
};

export const guardarUsuario = async (usuario) => {
  const usuarios = await obtenerUsuarios();
  usuarios.push(usuario);
  return guardar(KEYS.USUARIOS, usuarios);
};

export const actualizarUsuario = async (usuarioActualizado) => {
  const usuarios = await obtenerUsuarios();
  const idx = usuarios.findIndex((u) => u.id === usuarioActualizado.id);
  if (idx !== -1) {
    usuarios[idx] = usuarioActualizado;
    return guardar(KEYS.USUARIOS, usuarios);
  }
  return false;
};

// ─── Sesión ───────────────────────────────────────────────────────────────────

export const guardarSesion = async (usuario) => {
  return guardar(KEYS.SESION_ACTIVA, usuario);
};

export const obtenerSesion = async () => {
  return obtener(KEYS.SESION_ACTIVA);
};

export const eliminarSesion = async () => {
  return eliminar(KEYS.SESION_ACTIVA);
};

// ─── Mascotas ─────────────────────────────────────────────────────────────────

export const obtenerMascotas = async (usuarioId) => {
  const todas = await obtener(KEYS.MASCOTAS);
  if (!todas) return [];
  return todas.filter((m) => m.usuarioId === usuarioId);
};

export const guardarMascota = async (mascota) => {
  const todas = (await obtener(KEYS.MASCOTAS)) || [];
  const idx = todas.findIndex((m) => m.id === mascota.id);
  if (idx !== -1) {
    todas[idx] = mascota;
  } else {
    todas.push(mascota);
  }
  return guardar(KEYS.MASCOTAS, todas);
};

export const eliminarMascota = async (mascotaId) => {
  const todas = (await obtener(KEYS.MASCOTAS)) || [];
  const filtradas = todas.filter((m) => m.id !== mascotaId);
  return guardar(KEYS.MASCOTAS, filtradas);
};

// ─── Registros por mascota (genérico) ─────────────────────────────────────────

const obtenerRegistros = async (clave, mascotaId) => {
  const todos = (await obtener(clave)) || [];
  if (mascotaId) return todos.filter((r) => r.mascotaId === mascotaId);
  return todos;
};

const guardarRegistro = async (clave, registro) => {
  const todos = (await obtener(clave)) || [];
  const idx = todos.findIndex((r) => r.id === registro.id);
  if (idx !== -1) {
    todos[idx] = registro;
  } else {
    todos.push(registro);
  }
  return guardar(clave, todos);
};

const eliminarRegistro = async (clave, registroId) => {
  const todos = (await obtener(clave)) || [];
  const filtrados = todos.filter((r) => r.id !== registroId);
  return guardar(clave, filtrados);
};

// ─── Vacunas ──────────────────────────────────────────────────────────────────

export const obtenerVacunas = (mascotaId) => obtenerRegistros(KEYS.VACUNAS, mascotaId);
export const guardarVacuna = (vacuna) => guardarRegistro(KEYS.VACUNAS, vacuna);
export const eliminarVacuna = (id) => eliminarRegistro(KEYS.VACUNAS, id);

// ─── Medicamentos ─────────────────────────────────────────────────────────────

export const obtenerMedicamentos = (mascotaId) => obtenerRegistros(KEYS.MEDICAMENTOS, mascotaId);
export const guardarMedicamento = (med) => guardarRegistro(KEYS.MEDICAMENTOS, med);
export const eliminarMedicamento = (id) => eliminarRegistro(KEYS.MEDICAMENTOS, id);

// ─── Citas ────────────────────────────────────────────────────────────────────

export const obtenerCitas = (mascotaId) => obtenerRegistros(KEYS.CITAS, mascotaId);
export const guardarCita = (cita) => guardarRegistro(KEYS.CITAS, cita);
export const eliminarCita = (id) => eliminarRegistro(KEYS.CITAS, id);

// ─── Pesos ────────────────────────────────────────────────────────────────────

export const obtenerPesos = (mascotaId) => obtenerRegistros(KEYS.PESOS, mascotaId);
export const guardarPeso = (peso) => guardarRegistro(KEYS.PESOS, peso);
export const eliminarPeso = (id) => eliminarRegistro(KEYS.PESOS, id);

// ─── Salud (enfermedades y alergias) ──────────────────────────────────────────

export const obtenerSalud = (mascotaId) => obtenerRegistros(KEYS.SALUD, mascotaId);
export const guardarSalud = (item) => guardarRegistro(KEYS.SALUD, item);
export const eliminarSalud = (id) => eliminarRegistro(KEYS.SALUD, id);

// ─── Recordatorios ────────────────────────────────────────────────────────────

export const obtenerRecordatorios = async (usuarioId) => {
  const todos = (await obtener(KEYS.RECORDATORIOS)) || [];
  if (usuarioId) return todos.filter((r) => r.usuarioId === usuarioId);
  return todos;
};
export const guardarRecordatorio = (rec) => guardarRegistro(KEYS.RECORDATORIOS, rec);
export const eliminarRecordatorio = (id) => eliminarRegistro(KEYS.RECORDATORIOS, id);
