import { useCallback } from 'react';
import {
  obtenerRecordatoriosFirestore,
  guardarRecordatorioFirestore,
  eliminarRecordatorioFirestore,
  eliminarRegistroSaludFirestore,
} from '../services/firestore.service';
import {
  programarRecordatorio,
  cancelarRecordatorio,
} from '../services/notifications';
import { leerPerfilLocal } from '../services/auth.service';
import { generarId } from '../utils/dates';

export const useReminders = (usuarioId) => {
  // Crear recordatorio (guarda en Firestore + almacenamiento local Y programa notificación nativa si está activa)
  const crearRecordatorio = useCallback(
    async ({ titulo, cuerpo, fecha, mascotaId, tipo, lugar, veterinario, referenciaId }) => {
      const fechaObj = fecha ? new Date(fecha) : new Date();

      let notifId = null;
      try {
        const perfil = await leerPerfilLocal(usuarioId);
        const notifHabilitadas = perfil?.notificacionesActivas !== false;
        if (notifHabilitadas && fechaObj > new Date()) {
          const cuerpoNotif = [cuerpo, lugar ? `📍 ${lugar}` : ''].filter(Boolean).join(' · ');
          notifId = await programarRecordatorio({
            titulo,
            cuerpo: cuerpoNotif || 'Tienes un cuidado programado para tu mascota',
            fecha: fechaObj,
            datos: { mascotaId, tipo, lugar, referenciaId },
          });
        }
      } catch (e) {
        console.warn('No se pudo programar la notificación nativa:', e);
      }

      const recordatorio = {
        id: generarId(),
        usuarioId: usuarioId || 'usuario_activo',
        mascotaId: mascotaId || null,
        tipo: tipo || 'vacuna', // 'vacuna' | 'medicamento' | 'cita'
        referenciaId: referenciaId || null,
        titulo,
        cuerpo: cuerpo || '',
        lugar: lugar || '',
        veterinario: veterinario || '',
        fecha: fechaObj.toISOString(),
        notifId,
        activo: true,
        creadoEn: new Date().toISOString(),
      };

      await guardarRecordatorioFirestore(recordatorio);
      return recordatorio;
    },
    [usuarioId]
  );

  // Actualizar / reagendar un recordatorio existente
  const actualizarRecordatorio = useCallback(
    async (recordatorioActualizado) => {
      if (recordatorioActualizado.notifId) {
        try {
          await cancelarRecordatorio(recordatorioActualizado.notifId);
        } catch {}
      }
      let nuevoNotifId = null;
      try {
        const fechaObj = new Date(recordatorioActualizado.fecha);
        if (fechaObj > new Date()) {
          nuevoNotifId = await programarRecordatorio({
            titulo: recordatorioActualizado.titulo,
            cuerpo: recordatorioActualizado.lugar
              ? `📍 ${recordatorioActualizado.lugar}`
              : recordatorioActualizado.cuerpo || 'Recordatorio de PawCare',
            fecha: fechaObj,
            datos: {
              mascotaId: recordatorioActualizado.mascotaId,
              tipo: recordatorioActualizado.tipo,
            },
          });
        }
      } catch {}

      const finalRec = {
        ...recordatorioActualizado,
        notifId: nuevoNotifId,
      };
      await guardarRecordatorioFirestore(finalRec);
      return finalRec;
    },
    []
  );

  // Cancelar y eliminar recordatorio de forma segura y sin bloqueo
  const borrarRecordatorio = useCallback(async (recordatorio) => {
    const idBorrar = typeof recordatorio === 'object' ? recordatorio?.id : recordatorio;
    if (!idBorrar) return;

    await eliminarRecordatorioFirestore(idBorrar);

    // También limpiar registro vinculado si se creó desde la agenda
    if (typeof recordatorio === 'object') {
      const refId = recordatorio.referenciaId || recordatorio.id;
      const col =
        recordatorio.tipo === 'vacuna'
          ? 'vacunas'
          : recordatorio.tipo === 'medicamento'
          ? 'medicamentos'
          : recordatorio.tipo === 'cita'
          ? 'citas'
          : null;
      if (col && refId) {
        eliminarRegistroSaludFirestore(col, refId).catch(() => {});
      }
      if (recordatorio.notifId) {
        cancelarRecordatorio(recordatorio.notifId).catch(() => {});
      }
    }
  }, []);

  // Obtener todos los recordatorios del usuario ordenados por fecha
  const obtenerMisRecordatorios = useCallback(async () => {
    const todos = await obtenerRecordatoriosFirestore(usuarioId);
    return (todos || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [usuarioId]);

  // Obtener recordatorios próximos (o el más cercano pendiente)
  const obtenerProximos = useCallback(async () => {
    const todos = await obtenerRecordatoriosFirestore(usuarioId);
    const ordenados = (todos || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const ahora = new Date();
    const futuros = ordenados.filter((r) => new Date(r.fecha) >= ahora);
    return futuros.length > 0 ? futuros : ordenados;
  }, [usuarioId]);

  return {
    crearRecordatorio,
    actualizarRecordatorio,
    borrarRecordatorio,
    obtenerMisRecordatorios,
    obtenerProximos,
  };
};

export default useReminders;
