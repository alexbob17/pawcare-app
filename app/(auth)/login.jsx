import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/hooks/useAuth';
import { Icon, GoogleSvgIcon } from '../../src/components/common/Icons';
import GoogleAccountPopup from '../../src/components/auth/GoogleAccountPopup';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [modalGoogleVisible, setModalGoogleVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cuentaNoRegistrada, setCuentaNoRegistrada] = useState(false);
  const { iniciarSesion, iniciarSesionConGoogle, iniciarSesionNativaGoogle } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setMensajeError('');
    setCuentaNoRegistrada(false);
    if (!correo.trim()) {
      setMensajeError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!contrasena) {
      setMensajeError('Por favor ingresa tu contraseña.');
      return;
    }

    setCargando(true);
    const res = await iniciarSesion({ correo: correo.trim(), contrasena });
    setCargando(false);

    if (!res.exito) {
      setMensajeError(res.mensaje || 'Error al iniciar sesión. Verifica tus datos.');
    }
  };

  const abrirPopupGoogle = async () => {
    setMensajeError('');
    setCuentaNoRegistrada(false);

    // En Android / iOS, invocar el selector nativo de Google Play Services (cuentas del dispositivo)
    if (Platform.OS !== 'web') {
      setCargandoGoogle(true);
      try {
        const res = await iniciarSesionNativaGoogle();
        if (res.exito) {
          return;
        }
        if (res.cancelado) {
          return;
        }
        if (res.disponible === false) {
          setModalGoogleVisible(true);
          return;
        }
        if (res.mensaje) {
          setMensajeError(res.mensaje);
        }
      } catch (err) {
        setMensajeError(err?.message || 'Error al conectar con Google.');
      } finally {
        setCargandoGoogle(false);
      }
      return;
    }

    setModalGoogleVisible(true);
  };

  const handleSeleccionarCuentaGoogle = async ({ correo: correoGoogle, nombre }) => {
    setCargandoGoogle(true);
    try {
      const res = await iniciarSesionConGoogle({ correo: correoGoogle, nombre });
      if (!res.exito) {
        setModalGoogleVisible(false);
        setMensajeError(
          res.mensaje || 'Esta cuenta de Google no está registrada. Regístrate primero.'
        );
        setCuentaNoRegistrada(Boolean(res.noRegistrado));
      } else {
        setModalGoogleVisible(false);
      }
    } finally {
      setCargandoGoogle(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#E5F5FD', '#F5FBFF', '#FFFFFF']}
        style={estilos.flex}
      >
        <ScrollView
          contentContainerStyle={estilos.contenedor}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo con Halos Luminosos */}
          <View style={estilos.welcomeLogoContenedor}>
            <View style={estilos.haloDos} />
            <View style={estilos.haloUno} />
            <View style={estilos.logoCirculo}>
              <Image
                source={require('../../assets/pawcare-logo.jpg')}
                style={estilos.logoImg}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Copy y Título de Bienvenida */}
          <View style={estilos.welcomeCopy}>
            <Text style={estilos.eyebrow}>TU MEJOR AMIGO, SIEMPRE BIEN</Text>
            <Text style={estilos.displayTitle}>
              Salud hoy,{'\n'}
              <Text style={estilos.displayTitleEm}>más momentos juntos</Text>
            </Text>
            <Text style={estilos.parrafo}>
              Todo el cuidado de tu mascota, simple y en un solo lugar.
            </Text>
          </View>

          {/* Formulario de Acceso */}
          <View style={estilos.authForm}>
            {/* Banner Visible de Error */}
            {mensajeError ? (
              <View style={estilos.bannerError}>
                <View style={estilos.iconoErrorContenedor}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.tituloError}>
                    {cuentaNoRegistrada ? 'Cuenta no registrada' : 'Atención'}
                  </Text>
                  <Text style={estilos.textoBannerError}>{mensajeError}</Text>
                  {cuentaNoRegistrada && (
                    <TouchableOpacity
                      style={estilos.btnIrARegistro}
                      onPress={() => router.push('/(auth)/register')}
                    >
                      <Text style={estilos.btnIrARegistroTxt}>
                        Ir a Regístrate gratis con Google →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setMensajeError('');
                    setCuentaNoRegistrada(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={estilos.cerrarError}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Campo Correo */}
            <View
              style={[
                estilos.campo,
                mensajeError ? { borderColor: '#FCA5A5' } : null,
              ]}
            >
              <Icon name="mail" size={17} color="#7B91A1" />
              <TextInput
                style={estilos.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94A1AD"
                value={correo}
                onChangeText={(t) => {
                  setCorreo(t);
                  if (mensajeError) setMensajeError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Campo Contraseña */}
            <View
              style={[
                estilos.campo,
                mensajeError ? { borderColor: '#FCA5A5' } : null,
              ]}
            >
              <Icon name="lock" size={17} color="#7B91A1" />
              <TextInput
                style={estilos.input}
                placeholder="Contraseña"
                placeholderTextColor="#94A1AD"
                secureTextEntry={!verContrasena}
                value={contrasena}
                onChangeText={(t) => {
                  setContrasena(t);
                  if (mensajeError) setMensajeError('');
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setVerContrasena(!verContrasena)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="eye" size={17} color="#91A0AA" />
              </TouchableOpacity>
            </View>

            {/* Botón Iniciar Sesión Correo */}
            <TouchableOpacity
              style={estilos.botonPrimario}
              onPress={handleLogin}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={estilos.textoBotonPrimario}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Botón Continuar con Google */}
            <TouchableOpacity
              style={estilos.googleButton}
              onPress={abrirPopupGoogle}
              disabled={cargandoGoogle}
              activeOpacity={0.85}
            >
              <GoogleSvgIcon size={18} />
              <Text style={estilos.googleButtonTexto}>
                {cargandoGoogle ? 'Verificando cuenta...' : 'Continuar con Google'}
              </Text>
            </TouchableOpacity>

            {/* Enlace de Registro */}
            <View style={estilos.footer}>
              <Text style={estilos.textoFooter}>¿No tienes una cuenta aún? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={estilos.linkRegistro}>Regístrate gratis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Popup Selector / Verificador de Cuenta Google */}
        <GoogleAccountPopup
          visible={modalGoogleVisible}
          modo="login"
          cargando={cargandoGoogle}
          onClose={() => setModalGoogleVisible(false)}
          onSeleccionarCuenta={handleSeleccionarCuentaGoogle}
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenedor: {
    paddingHorizontal: 26,
    paddingTop: 55,
    paddingBottom: 40,
    alignItems: 'center',
  },
  welcomeLogoContenedor: {
    width: '100%',
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  haloDos: {
    position: 'absolute',
    width: 215,
    height: 215,
    borderRadius: 108,
    borderWidth: 1,
    borderColor: 'rgba(74, 165, 221, 0.25)',
    borderStyle: 'dashed',
  },
  haloUno: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 1,
    borderColor: 'rgba(74, 165, 221, 0.2)',
  },
  logoCirculo: {
    width: 155,
    height: 155,
    borderRadius: 78,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F7DB1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 8,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  welcomeCopy: {
    alignItems: 'center',
    marginTop: 8,
  },
  eyebrow: {
    color: '#4D9FD3',
    fontWeight: '800',
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  displayTitle: {
    marginTop: 6,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 32,
    color: '#1D3348',
  },
  displayTitleEm: {
    color: '#4E9FD2',
    fontStyle: 'normal',
  },
  parrafo: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: '#738495',
    textAlign: 'center',
    maxWidth: 240,
  },
  authForm: {
    width: '100%',
    marginTop: 20,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  iconoErrorContenedor: {
    marginTop: 1,
  },
  tituloError: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  textoBannerError: {
    fontSize: 11,
    color: '#B91C1C',
    lineHeight: 15,
    marginTop: 1,
  },
  btnIrARegistro: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  btnIrARegistroTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cerrarError: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  campo: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#1D3348',
  },
  botonPrimario: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#4E9FD2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4E9FD2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  textoBotonPrimario: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  googleButton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#2F4653',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  googleButtonTexto: {
    color: '#1D3348',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  textoFooter: {
    fontSize: 11,
    color: '#738495',
  },
  linkRegistro: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4E9FD2',
  },
});
