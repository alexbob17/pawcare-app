import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const BENEFICIOS = [
  {
    icon: 'trending-up',
    texto: 'Peso, vacunas y desparasitaciones registradas a lo largo del tiempo',
  },
  {
    icon: 'calendar',
    texto: 'Recordatorios de citas, medicamentos y seguimiento post-consulta',
  },
  {
    icon: 'file-text',
    texto: 'Comparte el historial médico en PDF y su placa QR de emergencia',
  },
  {
    icon: 'map-pin',
    texto: 'Explora veterinarias, parques y recomendaciones de la comunidad',
  },
];

export default function WelcomeOnboardingModal({ visible, nombreUsuario, onClose }) {
  const fadeHero = useRef(new Animated.Value(0)).current;
  const slideSheet = useRef(new Animated.Value(60)).current;
  const scaleLogo = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      fadeHero.setValue(0);
      slideSheet.setValue(60);
      scaleLogo.setValue(0.85);

      Animated.parallel([
        Animated.timing(fadeHero, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(scaleLogo, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(slideSheet, {
          toValue: 0,
          friction: 7,
          tension: 55,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeHero, slideSheet, scaleLogo]);

  const primerNombre = (nombreUsuario || '').trim().split(' ')[0];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={estilos.contenedor}>
        {/* Mitad Superior: Hero Visual con Logo de PawCare */}
        <LinearGradient
          colors={['#2E9E86', '#217B6D', '#154F47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.heroTop}
        >
          <Animated.View
            style={[
              estilos.heroContent,
              {
                opacity: fadeHero,
                transform: [{ scale: scaleLogo }],
              },
            ]}
          >
            <View style={estilos.haloExterno}>
              <View style={estilos.logoWrapper}>
                <Image
                  source={require('../../../assets/pawcare-logo.jpg')}
                  style={estilos.logoImg}
                  resizeMode="cover"
                />
              </View>
            </View>
            <Text style={estilos.brandTitle}>PawCare</Text>
            <Text style={estilos.brandTagline}>
              {primerNombre ? `¡Bienvenido, ${primerNombre}!` : 'Cuidado inteligente para tu mascota'}
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Mitad Inferior: Hoja Oscura Elegante (1 sola pantalla sin deslizar) */}
        <Animated.View
          style={[
            estilos.bottomSheet,
            {
              opacity: fadeHero,
              transform: [{ translateY: slideSheet }],
            },
          ]}
        >
          <Text style={estilos.headline}>
            Ten la certeza de que tu{'\n'}mascota está bien
          </Text>

          <View style={estilos.listaBeneficios}>
            {BENEFICIOS.map((item, idx) => (
              <View key={idx} style={estilos.filaBeneficio}>
                <View style={estilos.iconoCirculo}>
                  <Feather name={item.icon} size={19} color="#5CD6B9" />
                </View>
                <Text style={estilos.textoBeneficio}>{item.texto}</Text>
              </View>
            ))}
          </View>

          <View style={estilos.footer}>
            <Text style={estilos.subtextoFooter}>
              Todo su expediente clínico y agenda en un solo lugar
            </Text>

            <TouchableOpacity
              style={estilos.btnComenzar}
              onPress={onClose}
              activeOpacity={0.86}
            >
              <Text style={estilos.btnComenzarTexto}>Comenzar ahora</Text>
              <Feather name="arrow-right" size={18} color="#0D2622" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#131720',
  },
  heroTop: {
    flex: 0.42,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 28,
  },
  heroContent: {
    alignItems: 'center',
  },
  haloExterno: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoWrapper: {
    width: 106,
    height: 106,
    borderRadius: 53,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  bottomSheet: {
    flex: 0.58,
    backgroundColor: '#181C26',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headline: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  listaBeneficios: {
    gap: 16,
    marginVertical: 10,
  },
  filaBeneficio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconoCirculo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(92, 214, 185, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(92, 214, 185, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBeneficio: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#E5E9F0',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  subtextoFooter: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  btnComenzar: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#5CD6B9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#5CD6B9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  btnComenzarTexto: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D2622',
  },
});
