import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useReminders } from '../../src/hooks/useReminders';
import { usePets } from '../../src/hooks/usePets';
import { solicitarPermisosNotificaciones } from '../../src/services/notifications';
import { obtenerResumenClinicoMascota } from '../../src/services/firestore.service';

import HomeTopline from '../../src/components/home/HomeTopline';
import PetCarousel from '../../src/components/home/PetCarousel';
import ReminderHeroCard from '../../src/components/home/ReminderHeroCard';
import QuickActionsGrid from '../../src/components/home/QuickActionsGrid';
import EmergencyQRModal from '../../src/components/pets/EmergencyQRModal';
import MedicalPDFModal from '../../src/components/pets/MedicalPDFModal';
import WelcomeOnboardingModal from '../../src/components/common/WelcomeOnboardingModal';
import { avisar } from '../../src/utils/dialogs';

const BIENVENIDA_KEY_PREFIX = '@pawcare:bienvenida_unica_v4_';

export default function HomeScreen() {
  const { usuario, actualizarPerfil } = useAuth();
  const { colors, isDark, toggleTema } = useTheme();
  const router = useRouter();

  const { mascotas, cargarMascotas } = usePets(usuario?.id);
  const { obtenerProximos } = useReminders(usuario?.id);

  const [recordatorios, setRecordatorios] = useState([]);
  const [refrescando, setRefrescando] = useState(false);
  const [mascotaSeleccionadaId, setMascotaSeleccionadaId] = useState(null);
  const [resumenClinico, setResumenClinico] = useState({
    vacunas: [],
    medicamentos: [],
    citas: [],
    pesos: [],
    salud: [],
  });

  // Estados de Modales
  const [modalQrVisible, setModalQrVisible] = useState(false);
  const [modalPdfVisible, setModalPdfVisible] = useState(false);
  const [modalBienvenidaVisible, setModalBienvenidaVisible] = useState(false);

  const mascotaActiva =
    mascotas.find((m) => m.id === mascotaSeleccionadaId) || mascotas[0] || null;

  // Mostrar popup de bienvenida SOLO la primera vez que el usuario inicia sesión
  useEffect(() => {
    const verificarBienvenidaUnica = async () => {
      if (!usuario?.id) return;
      try {
        const key = `${BIENVENIDA_KEY_PREFIX}${usuario.id}`;
        const yaVistaLocal = await AsyncStorage.getItem(key);
        if (!yaVistaLocal && !usuario.bienvenidaVista) {
          setModalBienvenidaVisible(true);
        } else {
          // Si ya vio la bienvenida antes, asegurar permiso de notificaciones
          solicitarPermisosNotificaciones().catch(() => {});
        }
      } catch {}
    };
    verificarBienvenidaUnica();
  }, [usuario?.id, usuario?.bienvenidaVista]);

  const cerrarBienvenidaYPedirPermiso = async () => {
    setModalBienvenidaVisible(false);
    try {
      if (usuario?.id) {
        const key = `${BIENVENIDA_KEY_PREFIX}${usuario.id}`;
        await AsyncStorage.setItem(key, 'true');
        actualizarPerfil({ bienvenidaVista: true }).catch(() => {});
      }
      // Apenas cierra la bienvenida por primera vez, pedir permiso nativo de notificaciones al usuario
      await solicitarPermisosNotificaciones();
    } catch {}
  };

  const cargarResumenMascotaActiva = useCallback(async (petId) => {
    if (!petId) {
      setResumenClinico({ vacunas: [], medicamentos: [], citas: [], pesos: [], salud: [] });
      return;
    }
    const datos = await obtenerResumenClinicoMascota(petId);
    setResumenClinico(datos);
  }, []);

  const cargarDatos = useCallback(async () => {
    await cargarMascotas();
    const proximos = await obtenerProximos();
    setRecordatorios(proximos || []);
  }, [cargarMascotas, obtenerProximos]);

  useEffect(() => {
    if (mascotaActiva?.id) {
      cargarResumenMascotaActiva(mascotaActiva.id);
    } else {
      setResumenClinico({ vacunas: [], medicamentos: [], citas: [], pesos: [], salud: [] });
    }
  }, [mascotaActiva?.id, cargarResumenMascotaActiva]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
      if (mascotaActiva?.id) {
        cargarResumenMascotaActiva(mascotaActiva.id);
      }
    }, [cargarDatos, mascotaActiva?.id, cargarResumenMascotaActiva])
  );

  const alRefrescar = async () => {
    setRefrescando(true);
    await cargarDatos();
    if (mascotaActiva?.id) {
      await cargarResumenMascotaActiva(mascotaActiva.id);
    }
    setRefrescando(false);
  };

  const proximoRecordatorio = recordatorios[0] || null;
  const mascotaDelRecordatorio = proximoRecordatorio?.mascotaId
    ? mascotas.find((m) => m.id === proximoRecordatorio.mascotaId)?.nombre
    : mascotaActiva?.nombre;

  const handleAccionRapida = (tipo) => {
    if (!mascotaActiva) {
      router.push('/(tabs)/pets');
      return;
    }
    router.push(`/pet/${mascotaActiva.id}/${tipo}`);
  };

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        }
      >
        {/* 1. Saludo Superior y Controles de Tema / Notificaciones (sin botón de bienvenida) */}
        <HomeTopline
          nombre={usuario?.nombre}
          isDark={isDark}
          onToggleTheme={toggleTema}
          onOpenNotifications={() => router.push('/(tabs)/reminders')}
          unreadNotifications={recordatorios.length > 0}
        />

        {/* 2. Mis Mascotas (Pet Chips con Emoji o Foto Real) */}
        <PetCarousel
          mascotas={mascotas}
          mascotaSeleccionadaId={mascotaActiva?.id}
          onSeleccionarMascota={(id) => setMascotaSeleccionadaId(id)}
          onVerTodas={() => router.push('/(tabs)/pets')}
          onAgregarMascota={() =>
            router.push({ pathname: '/(tabs)/pets', params: { openModal: 'new' } })
          }
        />

        {/* 3. Tarjeta del Próximo Recordatorio */}
        <ReminderHeroCard
          recordatorio={proximoRecordatorio}
          mascotaNombre={mascotaDelRecordatorio}
          onPress={() => router.push('/(tabs)/reminders')}
        />

        {/* 4. Cuadrícula 3x2 de Accesos Rápidos ligada a datos reales + Banner */}
        <QuickActionsGrid
          mascotaActiva={mascotaActiva}
          resumenClinico={resumenClinico}
          onPressAccion={handleAccionRapida}
          onPressQR={() => {
            if (!mascotaActiva) {
              avisar(
                'Sin mascotas registradas',
                'Registra primero tu mascota para generar su placa QR de collar.'
              );
              return;
            }
            setModalQrVisible(true);
          }}
          onPressPDF={() => {
            if (!mascotaActiva) {
              avisar(
                'Sin mascotas registradas',
                'Registra primero tu mascota para exportar su ficha médica.'
              );
              return;
            }
            setModalPdfVisible(true);
          }}
        />
      </ScrollView>

      {/* Popup de Bienvenida de 1 sola vista (SOLO aparece en el primer inicio de sesión) */}
      <WelcomeOnboardingModal
        visible={modalBienvenidaVisible}
        nombreUsuario={usuario?.nombre}
        onClose={cerrarBienvenidaYPedirPermiso}
      />

      {/* Modales de Utilidad */}
      {mascotaActiva && (
        <>
          <EmergencyQRModal
            visible={modalQrVisible}
            onClose={() => setModalQrVisible(false)}
            mascota={mascotaActiva}
            usuario={usuario}
          />
          <MedicalPDFModal
            visible={modalPdfVisible}
            onClose={() => setModalPdfVisible(false)}
            mascota={mascotaActiva}
            usuario={usuario}
          />
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 36,
  },
});
