import { useState, useCallback, useEffect } from 'react';
import {
  obtenerMascotasFirestore,
  obtenerMascotasEnMemoria,
  guardarMascotaFirestore,
  eliminarMascotaFirestore,
} from '../services/firestore.service';
import { generarId } from '../utils/dates';

export const usePets = (usuarioId) => {
  // Inicializar directamente desde la caché en memoria para que haya 0ms de demora y sin parpadeos
  const [mascotas, setMascotas] = useState(() => obtenerMascotasEnMemoria(usuarioId || null));
  const [cargando, setCargando] = useState(false);

  const cargarMascotas = useCallback(async () => {
    const enMemoria = obtenerMascotasEnMemoria(usuarioId || null);
    if (enMemoria.length === 0) {
      setCargando(true);
    } else {
      setMascotas(enMemoria);
    }
    try {
      const lista = await obtenerMascotasFirestore(usuarioId || null);
      setMascotas(lista || []);
    } catch (e) {
      console.warn('Error cargando mascotas:', e);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  // Actualización optimista: añade la mascota al estado local al instante para 0ms de espera
  const agregarMascota = useCallback(
    async (datosMascota) => {
      const uId = usuarioId || 'usuario_activo';
      const tempId = datosMascota.id || generarId();
      const nuevaMascota = {
        id: tempId,
        ...datosMascota,
        usuarioId: uId,
        creadaEn: new Date().toISOString(),
      };

      setMascotas((prev) => [nuevaMascota, ...prev]);

      try {
        const idReal = await guardarMascotaFirestore(nuevaMascota);
        if (idReal && idReal !== tempId) {
          setMascotas((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: idReal } : m))
          );
        }
        return { ...nuevaMascota, id: idReal || tempId };
      } catch (err) {
        console.warn('Advertencia al sincronizar mascota en nube:', err);
        return nuevaMascota;
      }
    },
    [usuarioId]
  );

  // Edición optimista
  const editarMascota = useCallback(
    async (mascotaActualizada) => {
      setMascotas((prev) =>
        prev.map((m) => (m.id === mascotaActualizada.id ? { ...m, ...mascotaActualizada } : m))
      );
      try {
        await guardarMascotaFirestore(mascotaActualizada);
      } catch (err) {
        console.warn('Advertencia al editar mascota:', err);
      }
    },
    []
  );

  // Borrado optimista
  const borrarMascota = useCallback(
    async (mascotaId) => {
      setMascotas((prev) => prev.filter((m) => m.id !== mascotaId));
      try {
        await eliminarMascotaFirestore(mascotaId);
      } catch (err) {
        console.warn('Advertencia al eliminar mascota:', err);
      }
    },
    []
  );

  return { mascotas, cargando, cargarMascotas, agregarMascota, editarMascota, borrarMascota };
};

export default usePets;
