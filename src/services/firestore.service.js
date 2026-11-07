import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { cancelarRecordatorio } from './notifications';
import { conTimeout } from '../utils/timeout';

// Claves de respaldo local para persistencia instantánea y offline
const LOCAL_KEYS = {
  mascotas: '@pawcare:cache_mascotas',
  recordatorios: '@pawcare:cache_recordatorios',
  comunidad: '@pawcare:cache_comunidad_v2',
  subcoleccion: (col) => `@pawcare:cache_${col}`,
};

// Caché en memoria RAM para lectura en 0ms al cambiar de pestañas o pantallas
const MEM_CACHE = {};
// Control de peticiones en vuelo y última sincronización para evitar congelamientos al cambiar rápido de pestaña
const IN_FLIGHT = {};
const LAST_SYNC = {};
const SYNC_COOLDOWN_MS = 12000;

const getLocal = async (key) => {
  if (MEM_CACHE[key]) {
    return MEM_CACHE[key];
  }
  try {
    const val = await AsyncStorage.getItem(key);
    const parsed = val ? JSON.parse(val) : [];
    MEM_CACHE[key] = Array.isArray(parsed) ? parsed : [];
    return MEM_CACHE[key];
  } catch {
    MEM_CACHE[key] = [];
    return [];
  }
};

const setLocal = async (key, data) => {
  const safeData = Array.isArray(data) ? data : [];
  MEM_CACHE[key] = safeData;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(safeData));
  } catch {}
};

/** Lectura síncrona instantánea desde memoria RAM (0ms) */
export const obtenerMascotasEnMemoria = (usuarioId) => {
  const lista = MEM_CACHE[LOCAL_KEYS.mascotas] || [];
  if (!usuarioId) return lista;
  return lista.filter((m) => m.usuarioId === usuarioId || !m.usuarioId);
};

export const obtenerRecordatoriosEnMemoria = (usuarioId) => {
  const lista = MEM_CACHE[LOCAL_KEYS.recordatorios] || [];
  if (!usuarioId) return lista;
  return lista.filter((r) => r.usuarioId === usuarioId || !r.usuarioId);
};

export const obtenerSubcoleccionEnMemoria = (coleccionNombre, mascotaId) => {
  if (!mascotaId) return [];
  const lista = MEM_CACHE[LOCAL_KEYS.subcoleccion(coleccionNombre)] || [];
  return lista.filter((it) => it.mascotaId === mascotaId);
};

// ─── MASCOTAS ─────────────────────────────────────────────────────────────────

export const obtenerMascotasFirestore = async (usuarioId) => {
  const cacheKey = LOCAL_KEYS.mascotas;
  const syncKey = `mascotas_${usuarioId || 'anon'}`;
  const mascotasLocales = await getLocal(cacheKey);
  const filtradasLocales = usuarioId
    ? mascotasLocales.filter((m) => m.usuarioId === usuarioId || !m.usuarioId)
    : mascotasLocales;

  const ahora = Date.now();
  const recienSincronizado = LAST_SYNC[syncKey] && ahora - LAST_SYNC[syncKey] < SYNC_COOLDOWN_MS;

  const sincronizarNube = async () => {
    if (!usuarioId) return filtradasLocales;
    if (IN_FLIGHT[syncKey]) return IN_FLIGHT[syncKey];

    IN_FLIGHT[syncKey] = (async () => {
      try {
        LAST_SYNC[syncKey] = Date.now();
        const q = query(collection(db, 'mascotas'), where('usuarioId', '==', usuarioId));
        const snapshot = await conTimeout(getDocs(q), 2500);
        const listaNube = [];
        snapshot.forEach((d) => listaNube.push({ id: d.id, ...d.data() }));

        if (listaNube.length > 0) {
          const actuales = await getLocal(cacheKey);
          const mapa = new Map();
          actuales.forEach((m) => mapa.set(m.id, m));
          listaNube.forEach((m) => {
            const localExistente = mapa.get(m.id);
            mapa.set(m.id, { ...m, ...localExistente });
          });
          const combinada = Array.from(mapa.values());
          await setLocal(cacheKey, combinada);
          return usuarioId
            ? combinada.filter((m) => m.usuarioId === usuarioId || !m.usuarioId)
            : combinada;
        }
        return filtradasLocales;
      } catch {
        return filtradasLocales;
      } finally {
        delete IN_FLIGHT[syncKey];
      }
    })();

    return IN_FLIGHT[syncKey];
  };

  if (filtradasLocales.length > 0 || recienSincronizado) {
    if (!recienSincronizado) {
      sincronizarNube().catch(() => {});
    }
    return filtradasLocales;
  }

  return await sincronizarNube();
};

export const obtenerMascotaPorIdFirestore = async (mascotaId) => {
  const mascotasLocales = await getLocal(LOCAL_KEYS.mascotas);
  const local = mascotasLocales.find((m) => m.id === mascotaId);
  if (local) return local;

  try {
    const ref = doc(db, 'mascotas', mascotaId);
    const snap = await conTimeout(getDoc(ref), 2000);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch {
    return null;
  }
};

export const guardarMascotaFirestore = async (mascota) => {
  const cacheKey = LOCAL_KEYS.mascotas;
  const id = mascota.id || String(Date.now());
  const mascotaConId = { ...mascota, id };

  // 1. Guardar al instante en memoria y almacenamiento local (0ms de bloqueo)
  const locales = [...(await getLocal(cacheKey))];
  const index = locales.findIndex((m) => m.id === id);
  if (index >= 0) {
    locales[index] = { ...locales[index], ...mascotaConId };
  } else {
    locales.unshift(mascotaConId);
  }
  await setLocal(cacheKey, locales);

  // 2. Sincronizar en segundo plano con Firestore sin bloquear la UI
  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'mascotas', id);
      await conTimeout(
        setDoc(
          ref,
          {
            ...mascotaConId,
            actualizadaEn: serverTimestamp(),
          },
          { merge: true }
        ),
        3500
      );
    } catch {}
  });

  return id;
};

export const eliminarMascotaFirestore = async (mascotaId) => {
  const cacheKey = LOCAL_KEYS.mascotas;
  const locales = await getLocal(cacheKey);
  const restantes = locales.filter((m) => m.id !== mascotaId);
  await setLocal(cacheKey, restantes);

  // Limpiar en cascada recordatorios y cancelar sus notificaciones programadas
  try {
    const recKey = LOCAL_KEYS.recordatorios;
    const todosRec = await getLocal(recKey);
    const recDeMascota = todosRec.filter((r) => String(r.mascotaId) === String(mascotaId));
    const recRestantes = todosRec.filter((r) => String(r.mascotaId) !== String(mascotaId));
    await setLocal(recKey, recRestantes);

    recDeMascota.forEach((r) => {
      if (r.notifId) cancelarRecordatorio(r.notifId).catch(() => {});
      deleteDoc(doc(db, 'recordatorios', String(r.id))).catch(() => {});
    });
  } catch {}

  // Limpiar subcolecciones clínicas locales de la mascota eliminada
  const subCols = ['vacunas', 'medicamentos', 'citas', 'pesos', 'salud', 'fechas_especiales'];
  for (const colName of subCols) {
    try {
      const subKey = LOCAL_KEYS.subcoleccion(colName);
      const items = await getLocal(subKey);
      await setLocal(
        subKey,
        items.filter((it) => String(it.mascotaId) !== String(mascotaId))
      );
    } catch {}
  }

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'mascotas', mascotaId);
      await conTimeout(deleteDoc(ref), 3500);
    } catch {}
  });

  return true;
};

// ─── RECORDATORIOS ────────────────────────────────────────────────────────────

export const obtenerRecordatoriosFirestore = async (usuarioId) => {
  const cacheKey = LOCAL_KEYS.recordatorios;
  const syncKey = `recordatorios_${usuarioId || 'anon'}`;
  const locales = await getLocal(cacheKey);
  const filtrados = usuarioId
    ? locales.filter((r) => r.usuarioId === usuarioId || !r.usuarioId)
    : locales;

  const ahora = Date.now();
  const recienSincronizado = LAST_SYNC[syncKey] && ahora - LAST_SYNC[syncKey] < SYNC_COOLDOWN_MS;

  const sincronizarNube = async () => {
    if (!usuarioId) return filtrados;
    if (IN_FLIGHT[syncKey]) return IN_FLIGHT[syncKey];

    IN_FLIGHT[syncKey] = (async () => {
      try {
        LAST_SYNC[syncKey] = Date.now();
        const q = query(collection(db, 'recordatorios'), where('usuarioId', '==', usuarioId));
        const snapshot = await conTimeout(getDocs(q), 2500);
        const lista = [];
        snapshot.forEach((d) => lista.push({ id: d.id, ...d.data() }));
        if (lista.length > 0) {
          const actuales = await getLocal(cacheKey);
          const mapa = new Map();
          actuales.forEach((r) => mapa.set(r.id, r));
          lista.forEach((r) => mapa.set(r.id, { ...r, ...(mapa.get(r.id) || {}) }));
          const combinada = Array.from(mapa.values());
          await setLocal(cacheKey, combinada);
          return combinada.filter((r) => r.usuarioId === usuarioId || !r.usuarioId);
        }
        return filtrados;
      } catch {
        return filtrados;
      } finally {
        delete IN_FLIGHT[syncKey];
      }
    })();

    return IN_FLIGHT[syncKey];
  };

  if (filtrados.length > 0 || recienSincronizado) {
    if (!recienSincronizado) {
      sincronizarNube().catch(() => {});
    }
    return filtrados;
  }

  return await sincronizarNube();
};

export const guardarRecordatorioFirestore = async (recordatorio) => {
  const cacheKey = LOCAL_KEYS.recordatorios;
  const id = recordatorio.id || String(Date.now());
  const recConId = { ...recordatorio, id };

  const locales = [...(await getLocal(cacheKey))];
  const index = locales.findIndex((r) => r.id === id);
  if (index >= 0) {
    locales[index] = { ...locales[index], ...recConId };
  } else {
    locales.unshift(recConId);
  }
  await setLocal(cacheKey, locales);

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'recordatorios', id);
      await conTimeout(
        setDoc(
          ref,
          {
            ...recConId,
            actualizadaEn: serverTimestamp(),
          },
          { merge: true }
        ),
        3500
      );
    } catch {}
  });

  return id;
};

export const eliminarRecordatorioFirestore = async (recordatorioId) => {
  const cacheKey = LOCAL_KEYS.recordatorios;
  const locales = await getLocal(cacheKey);
  await setLocal(
    cacheKey,
    locales.filter((r) => String(r.id) !== String(recordatorioId))
  );

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'recordatorios', String(recordatorioId));
      await conTimeout(deleteDoc(ref), 3500);
    } catch {}
  });

  return true;
};

// ─── HISTORIAL CLÍNICO (Vacunas, Medicamentos, Citas, Peso, Salud) ────────────

export const obtenerSubcoleccionFirestore = async (coleccionNombre, mascotaId) => {
  if (!mascotaId) return [];
  const cacheKey = LOCAL_KEYS.subcoleccion(coleccionNombre);
  const syncKey = `sub_${coleccionNombre}_${mascotaId}`;
  const locales = await getLocal(cacheKey);
  const filtrados = locales.filter((item) => item.mascotaId === mascotaId);

  const ahora = Date.now();
  const recienSincronizado = LAST_SYNC[syncKey] && ahora - LAST_SYNC[syncKey] < SYNC_COOLDOWN_MS;

  const sincronizarNube = async () => {
    if (IN_FLIGHT[syncKey]) return IN_FLIGHT[syncKey];

    IN_FLIGHT[syncKey] = (async () => {
      try {
        LAST_SYNC[syncKey] = Date.now();
        const q = query(collection(db, coleccionNombre), where('mascotaId', '==', mascotaId));
        const snapshot = await conTimeout(getDocs(q), 2500);
        const lista = [];
        snapshot.forEach((d) => lista.push({ id: d.id, ...d.data() }));

        if (lista.length > 0) {
          const actuales = await getLocal(cacheKey);
          const actFiltrados = actuales.filter((item) => item.mascotaId === mascotaId);
          const mapa = new Map();
          actFiltrados.forEach((it) => mapa.set(it.id, it));
          lista.forEach((it) => mapa.set(it.id, { ...it, ...(mapa.get(it.id) || {}) }));
          const combinada = Array.from(mapa.values());
          const otros = actuales.filter((item) => item.mascotaId !== mascotaId);
          await setLocal(cacheKey, [...otros, ...combinada]);
          return combinada;
        }
        return filtrados;
      } catch {
        return filtrados;
      } finally {
        delete IN_FLIGHT[syncKey];
      }
    })();

    return IN_FLIGHT[syncKey];
  };

  if (filtrados.length > 0 || recienSincronizado) {
    if (!recienSincronizado) {
      sincronizarNube().catch(() => {});
    }
    return filtrados;
  }

  return await sincronizarNube();
};

/**
 * Obtiene de una sola vez en milisegundos todo el resumen clínico de una mascota
 * (vacunas, medicamentos, citas, pesos, salud) desde el almacenamiento local.
 */
export const obtenerResumenClinicoMascota = async (mascotaId) => {
  if (!mascotaId) {
    return { vacunas: [], medicamentos: [], citas: [], pesos: [], salud: [] };
  }
  const [vacunas, medicamentos, citas, pesos, salud] = await Promise.all([
    obtenerSubcoleccionFirestore('vacunas', mascotaId),
    obtenerSubcoleccionFirestore('medicamentos', mascotaId),
    obtenerSubcoleccionFirestore('citas', mascotaId),
    obtenerSubcoleccionFirestore('pesos', mascotaId),
    obtenerSubcoleccionFirestore('salud', mascotaId),
  ]);

  const pesosOrdenados = (pesos || []).sort((a, b) => {
    const fA = new Date(a.fecha || a.creadaEn || 0).getTime();
    const fB = new Date(b.fecha || b.creadaEn || 0).getTime();
    return fB - fA;
  });

  return {
    vacunas: vacunas || [],
    medicamentos: medicamentos || [],
    citas: citas || [],
    pesos: pesosOrdenados,
    salud: salud || [],
  };
};

export const guardarRegistroSaludFirestore = async (coleccionNombre, datos) => {
  const cacheKey = LOCAL_KEYS.subcoleccion(coleccionNombre);
  const id = datos.id || String(Date.now());
  const itemConId = { ...datos, id };

  const locales = [...(await getLocal(cacheKey))];
  const index = locales.findIndex((it) => it.id === id);
  if (index >= 0) {
    locales[index] = { ...locales[index], ...itemConId };
  } else {
    locales.unshift(itemConId);
  }
  await setLocal(cacheKey, locales);

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, coleccionNombre, id);
      await conTimeout(
        setDoc(
          ref,
          {
            ...itemConId,
            actualizadaEn: serverTimestamp(),
          },
          { merge: true }
        ),
        3500
      );
    } catch {}
  });

  return id;
};

export const eliminarRegistroSaludFirestore = async (coleccionNombre, id) => {
  const cacheKey = LOCAL_KEYS.subcoleccion(coleccionNombre);
  const locales = await getLocal(cacheKey);
  await setLocal(
    cacheKey,
    locales.filter((it) => String(it.id) !== String(id))
  );

  // Eliminar también cualquier recordatorio vinculado en Agenda (por id o referenciaId)
  try {
    const recKey = LOCAL_KEYS.recordatorios;
    const todosRec = await getLocal(recKey);
    const vinculados = todosRec.filter(
      (r) => String(r.id) === String(id) || String(r.referenciaId) === String(id)
    );
    if (vinculados.length > 0) {
      await setLocal(
        recKey,
        todosRec.filter(
          (r) => String(r.id) !== String(id) && String(r.referenciaId) !== String(id)
        )
      );
      vinculados.forEach((r) => {
        if (r.notifId) cancelarRecordatorio(r.notifId).catch(() => {});
        deleteDoc(doc(db, 'recordatorios', String(r.id))).catch(() => {});
      });
    }
  } catch {}

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, coleccionNombre, String(id));
      await conTimeout(deleteDoc(ref), 3500);
    } catch {}
  });

  return true;
};

// ─── COMUNIDAD PAWCARE (EXPERIENCIAS, RECOMENDACIONES Y MODERACIÓN 3 REPORTES) ───

const COMUNIDAD_SEMILLA = [
  {
    id: 'p1',
    author: 'Diego Pérez',
    pet: 'Max (Beagle)',
    cat: 'consejos',
    when: 'hace 2 h',
    text: 'En días de calor paseo a Max antes de las 8 AM o después de las 5 PM. Antes de salir apoyo la palma de la mano en el pavimento: si no aguanto 5 segundos, está muy caliente para sus almohadillas.',
    likes: 4,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    mine: false,
    comments: [
      {
        id: 'c1',
        author: 'Camila Ruiz',
        text: 'Buen dato, lo voy a aplicar con Luna en el patio.',
        reports: 0,
        reportedBy: [],
        mine: false,
      },
    ],
  },
  {
    id: 'p2',
    author: 'Camila Ruiz',
    pet: 'Luna (Gato)',
    cat: 'recomendacion',
    when: 'hace 5 h',
    text: 'Si buscan peluquería para gatos, elijan una que atienda pocos animales a la vez. A Luna le fue mucho mejor en un horario tranquilo.',
    likes: 2,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    mine: false,
    comments: [],
  },
  {
    id: 'p5',
    author: 'Sofía Mendoza',
    pet: 'Toby (Mestizo)',
    cat: 'recomendacion',
    when: 'hace 1 día',
    text: 'Los cafés con terraza abierta suelen dejar entrar perros con correa. Pregunten antes de sentarse y lleven agua para su mascota. Si conocen un parque o lugar en Managua que los acepte, compártanlo aquí con la zona.',
    likes: 3,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    mine: false,
    comments: [],
  },
  {
    id: 'p3',
    author: 'Sofía Mendoza',
    pet: 'Toby (Mestizo)',
    cat: 'consulta',
    when: 'ayer',
    text: '¿Alguien sabe cómo acostumbrar a un perro rescatado a quedarse solo en casa sin que llore todo el día?',
    likes: 1,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    mine: false,
    comments: [
      {
        id: 'c2',
        author: 'Diego Pérez',
        text: 'Con Max empecé dejándolo solo 5 minutos y fui subiendo poco a poco.',
        reports: 0,
        reportedBy: [],
        mine: false,
      },
    ],
  },
  {
    id: 'p4',
    author: 'Usuario nuevo',
    pet: 'Rocky (Pitbull)',
    cat: 'experiencia',
    when: 'ayer',
    text: 'Croquetas al 50%, escríbeme al privado y te paso el precio. Solo hoy.',
    likes: 0,
    likedBy: [],
    reports: 2,
    reportedBy: [],
    mine: false,
    comments: [],
  },
];

const sincronizarPostComunidadNube = (postActualizado) => {
  if (!postActualizado?.id) return;
  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'comunidad', String(postActualizado.id));
      const copia = { ...postActualizado };
      delete copia.mine;
      if (Array.isArray(copia.comments)) {
        copia.comments = copia.comments.map((c) => {
          const cLimpio = { ...c };
          delete cLimpio.mine;
          return cLimpio;
        });
      }
      await conTimeout(
        setDoc(ref, { ...copia, actualizadaEn: serverTimestamp() }, { merge: true }),
        3500
      );
    } catch {}
  });
};

export const obtenerPostsComunidadFirestore = async (onActualizacionRemota) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  let locales = await getLocal(cacheKey);
  if (!locales || locales.length === 0) {
    locales = COMUNIDAD_SEMILLA;
    await setLocal(cacheKey, locales);
  }

  // Sincronizar en segundo plano con la nube sin bloquear el retorno inmediato en 0ms
  Promise.resolve().then(async () => {
    try {
      const snapshot = await conTimeout(getDocs(collection(db, 'comunidad')), 3500);
      if (!snapshot.empty) {
        const mapa = new Map();
        locales.forEach((p) => {
          const copia = { ...p };
          delete copia.mine;
          mapa.set(String(p.id), copia);
        });
        snapshot.forEach((d) => {
          const remoto = { id: d.id, ...d.data() };
          delete remoto.mine;
          const previo = mapa.get(String(d.id)) || {};
          mapa.set(String(d.id), { ...previo, ...remoto });
        });
        const combinada = Array.from(mapa.values());
        await setLocal(cacheKey, combinada);
        if (typeof onActualizacionRemota === 'function') {
          onActualizacionRemota(combinada);
        }
      }
    } catch {}
  });

  return locales;
};

export const guardarPostComunidadFirestore = async (post) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  const base = actuales && actuales.length > 0 ? actuales : COMUNIDAD_SEMILLA;
  const id = post.id || `p_${Date.now()}`;
  const nuevo = {
    likes: 0,
    likedBy: [],
    reports: 0,
    reportedBy: [],
    when: 'ahora',
    comments: [],
    creadaEn: new Date().toISOString(),
    ...post,
    id,
  };
  delete nuevo.mine;
  const lista = [nuevo, ...base];
  await setLocal(cacheKey, lista);
  sincronizarPostComunidadNube(nuevo);

  return lista;
};

export const eliminarPostComunidadFirestore = async (postId, usuarioId = null) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  const post = actuales.find((p) => String(p.id) === String(postId));
  if (usuarioId && post?.authorId && post.authorId !== usuarioId) {
    return actuales;
  }
  const lista = actuales.filter((p) => String(p.id) !== String(postId));
  await setLocal(cacheKey, lista);

  Promise.resolve().then(async () => {
    try {
      const ref = doc(db, 'comunidad', String(postId));
      await conTimeout(deleteDoc(ref), 3500);
    } catch {}
  });

  return lista;
};

export const toggleLikePostComunidadFirestore = async (postId, usuarioId = 'local') => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  let modificado = null;
  const lista = actuales.map((p) => {
    if (String(p.id) !== String(postId)) return p;
    const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
    const yaDioLike = likedBy.includes(usuarioId);
    const nuevosLikes = yaDioLike ? Math.max(0, (p.likes || 1) - 1) : (p.likes || 0) + 1;
    const nuevoLikedBy = yaDioLike
      ? likedBy.filter((id) => id !== usuarioId)
      : [...likedBy, usuarioId];
    modificado = {
      ...p,
      likes: nuevosLikes,
      likedBy: nuevoLikedBy,
    };
    return modificado;
  });
  await setLocal(cacheKey, lista);
  if (modificado) sincronizarPostComunidadNube(modificado);
  return lista;
};

export const reportarPostComunidadFirestore = async (postId, usuarioId = 'local', motivo = '') => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  let modificado = null;
  const lista = actuales.map((p) => {
    if (String(p.id) !== String(postId)) return p;
    const reportedBy = Array.isArray(p.reportedBy) ? p.reportedBy : [];
    if (reportedBy.includes(usuarioId)) return p;
    modificado = {
      ...p,
      reports: (p.reports || 0) + 1,
      reportedBy: [...reportedBy, usuarioId],
      ultimoMotivoReporte: motivo,
    };
    return modificado;
  });
  await setLocal(cacheKey, lista);
  if (modificado) sincronizarPostComunidadNube(modificado);
  return lista;
};

export const agregarComentarioPostComunidadFirestore = async (postId, comentario) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  let modificado = null;
  const cLimpio = { ...comentario };
  delete cLimpio.mine;
  const lista = actuales.map((p) => {
    if (String(p.id) !== String(postId)) return p;
    modificado = {
      ...p,
      comments: [...(p.comments || []), cLimpio],
    };
    return modificado;
  });
  await setLocal(cacheKey, lista);
  if (modificado) sincronizarPostComunidadNube(modificado);
  return lista;
};

export const eliminarComentarioPostComunidadFirestore = async (
  postId,
  commentId,
  usuarioId = null
) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  let modificado = null;
  const lista = actuales.map((p) => {
    if (String(p.id) !== String(postId)) return p;
    const com = (p.comments || []).find((c) => String(c.id) === String(commentId));
    if (usuarioId && com?.authorId && com.authorId !== usuarioId) {
      return p;
    }
    modificado = {
      ...p,
      comments: (p.comments || []).filter((c) => String(c.id) !== String(commentId)),
    };
    return modificado;
  });
  await setLocal(cacheKey, lista);
  if (modificado) sincronizarPostComunidadNube(modificado);
  return lista;
};

export const reportarComentarioPostComunidadFirestore = async (
  postId,
  commentId,
  usuarioId = 'local'
) => {
  const cacheKey = LOCAL_KEYS.comunidad;
  const actuales = await getLocal(cacheKey);
  let modificado = null;
  const lista = actuales.map((p) => {
    if (String(p.id) !== String(postId)) return p;
    modificado = {
      ...p,
      comments: (p.comments || []).map((c) => {
        if (String(c.id) !== String(commentId)) return c;
        const reportedBy = Array.isArray(c.reportedBy) ? c.reportedBy : [];
        if (reportedBy.includes(usuarioId)) return c;
        return {
          ...c,
          reports: (c.reports || 0) + 1,
          reportedBy: [...reportedBy, usuarioId],
        };
      }),
    };
    return modificado;
  });
  await setLocal(cacheKey, lista);
  if (modificado) sincronizarPostComunidadNube(modificado);
  return lista;
};
