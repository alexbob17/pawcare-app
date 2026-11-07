import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permisos ─────────────────────────────────────────────────────────────────

export const solicitarPermisosNotificaciones = async () => {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('pawcare', {
        name: 'PawCare Recordatorios',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E9E86',
      });
    } catch {}
  }

  try {
    const { status: existente } = await Notifications.getPermissionsAsync();
    let estado = existente;
    if (existente !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      estado = status;
    }
    return estado === 'granted';
  } catch (e) {
    if (!Device.isDevice) {
      console.warn('Las notificaciones push requieren dispositivo físico.');
    }
    return false;
  }
};

// ─── Programar recordatorio ───────────────────────────────────────────────────

/**
 * Programa una notificación local en la fecha indicada.
 * Si la fecha está en el futuro, agenda la alerta exacta; también envía confirmación si aplica.
 */
export const programarRecordatorio = async ({ titulo, cuerpo, fecha, datos = {} }) => {
  if (Platform.OS === 'web') return null;

  try {
    const permiso = await solicitarPermisosNotificaciones();
    if (!permiso) {
      console.warn('Sin permiso para notificaciones');
      return null;
    }

    const ahora = new Date();
    const fechaObjetivo = fecha instanceof Date ? fecha : new Date(fecha);

    // Si la fecha programada ya pasó, no disparar alarma falsa
    const segundosRestantes = Math.floor((fechaObjetivo.getTime() - ahora.getTime()) / 1000);
    if (segundosRestantes <= 0) {
      return null;
    }

    const trigger = { date: fechaObjetivo, channelId: 'pawcare' };

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐾 ${titulo}`,
        body: cuerpo || 'Recordatorio de salud en PawCare',
        data: datos,
        sound: true,
        channelId: 'pawcare',
      },
      trigger,
    });

    return notifId;
  } catch (e) {
    console.error('Error al programar recordatorio:', e);
    return null;
  }
};

export const dispararNotificacionInmediata = async (titulo, cuerpo) => {
  if (Platform.OS === 'web') return false;
  try {
    const permiso = await solicitarPermisosNotificaciones();
    if (!permiso) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐾 ${titulo}`,
        body: cuerpo,
        sound: true,
        channelId: 'pawcare',
      },
      trigger: { seconds: 1, channelId: 'pawcare' },
    });
    return true;
  } catch {
    return false;
  }
};

// ─── Cancelar recordatorio ────────────────────────────────────────────────────

export const cancelarRecordatorio = async (notifId) => {
  if (Platform.OS === 'web') return true;
  try {
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    }
    return true;
  } catch (e) {
    console.error('Error al cancelar recordatorio:', e);
    return false;
  }
};

export const cancelarTodosLosRecordatorios = async () => {
  if (Platform.OS === 'web') return true;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (e) {
    console.error('Error al cancelar recordatorios:', e);
    return false;
  }
};

export const listarRecordatoriosProgramados = async () => {
  if (Platform.OS === 'web') return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('Error al listar recordatorios:', e);
    return [];
  }
};
