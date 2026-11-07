import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedBootSplash({ onFinish }) {
  const escala = useRef(new Animated.Value(0.75)).current;
  const opacidadContenedor = useRef(new Animated.Value(1)).current;
  const opacidadTexto = useRef(new Animated.Value(0)).current;
  const progresoBarra = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(escala, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadTexto, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progresoBarra, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(opacidadContenedor, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const anchoBarra = progresoBarra.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%'],
  });

  return (
    <Animated.View style={[estilos.overlay, { opacity: opacidadContenedor }]}>
      <LinearGradient
        colors={['#0F2B29', '#1B5E52', '#2E9E86']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.gradient}
      >
        <Animated.View
          style={[
            estilos.emblemaWrap,
            {
              transform: [{ scale: escala }],
            },
          ]}
        >
          <View style={estilos.anilloExterior}>
            <View style={estilos.circuloCentral}>
              <Text style={estilos.pawEmoji}>🐾</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[estilos.textosWrap, { opacity: opacidadTexto }]}>
          <Text style={estilos.brandTitle}>PawCare</Text>
          <Text style={estilos.brandSub}>Cuidado inteligente para tus mascotas</Text>

          <View style={estilos.barraTrack}>
            <Animated.View style={[estilos.barraFill, { width: anchoBarra }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emblemaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  anilloExterior: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloCentral: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  pawEmoji: {
    fontSize: 42,
  },
  textosWrap: {
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: 26,
    textAlign: 'center',
  },
  barraTrack: {
    width: 140,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  barraFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#6EE7C8',
  },
});

