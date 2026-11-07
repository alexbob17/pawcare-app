import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/hooks/useAuth';
import { Icon, GoogleSvgIcon } from '../../src/components/common/Icons';
import GoogleAccountPopup from '../../src/components/auth/GoogleAccountPopup';

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [modalGoogleVisible, setModalGoogleVisible] = useState(false);
  const { registrar, registrarConGoogle, iniciarSesionNativaGoogle } = useAuth();
  const router = useRouter();

  const handleRegistro = async () => {
    setMensajeError('');
    if (!nombre.trim()) {
      setMensajeError('Por favor ingresa tu nombre completo o regístrate con Google.');
      return;
    }
    if (!correo.trim()) {
      setMensajeError('Por favor ingresa un correo electrónico.');
      return;
    }
    if (!contrasena) {
      setMensajeError('Por favor ingresa una contraseña.');
      return;
    }
    if (contrasena.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (contrasena !== confirmar) {
      setMensajeError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    const resultado = await registrar({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      contrasena,
    });
    setCargando(false);

    if (!resultado.exito) {
      setMensajeError(resultado.mensaje || 'Error al registrar la cuenta.');
    }
  };

  const handleBotonGoogle = async () => {
    setMensajeError('');
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

  const handleRegistroGoogle = async ({ correo: correoGoogle, nombre: nombreGoogle }) => {
    setMensajeError('');
    setCargandoGoogle(true);
    try {
      const resultado = await registrarConGoogle({
        correo: correoGoogle,
        nombre: nombreGoogle,
      });
      if (!resultado.exito) {
        setModalGoogleVisible(false);
        setMensajeError(resultado.mensaje || 'No se pudo registrar con Google.');
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
          {/* Botón Volver */}
          <View style={estilos.topRow}>
            <TouchableOpacity
              style={estilos.btnVolver}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Icon
                name="arrow"
                size={17}
                color="#1D3348"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          </View>

          {/* Encabezado */}
          <View style={estilos.encabezado}>
            <Text style={estilos.eyebrow}>ÚNETE A PAWCARE</Text>
            <Text style={estilos.displayTitle}>
              Crea tu cuenta{'\n'}
              <Text style={estilos.displayTitleEm}>y cuida de los tuyos</Text>
            </Text>
            <Text style={estilos.parrafo}>
              Guarda el historial médico, vacunas y recordatorios de tus mascotas en la nube.
            </Text>
          </View>

          {/* Formulario */}
          <View style={estilos.authForm}>
            {/* Banner Visible de Error */}
            {mensajeError ? (
              <View style={estilos.bannerError}>
                <View style={estilos.iconoErrorContenedor}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.tituloError}>Atención</Text>
                  <Text style={estilos.textoBannerError}>{mensajeError}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMensajeError('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={estilos.cerrarError}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Botón Rápido: Registrarse con Google sin llenar datos */}
            <TouchableOpacity
              style={estilos.googleButton}
              onPress={handleBotonGoogle}
              disabled={cargandoGoogle}
              activeOpacity={0.85}
            >
              <GoogleSvgIcon size={18} />
              <Text style={estilos.googleButtonTexto}>
                {cargandoGoogle
                  ? 'Registrando con Google...'
                  : 'Registrarse con Google'}
              </Text>
            </TouchableOpacity>

            {/* Separador visual */}
            <View style={estilos.divisorRow}>
              <View style={estilos.divisorLinea} />
              <Text style={estilos.divisorTexto}>o ingresa tus datos manualmente</Text>
              <View style={estilos.divisorLinea} />
            </View>

            {/* Nombre */}
            <View style={estilos.campo}>
              <Icon name="profile" size={17} color="#7B91A1" />
              <TextInput
                style={estilos.input}
                placeholder="Nombre completo"
                placeholderTextColor="#94A1AD"
                value={nombre}
                onChangeText={(t) => {
                  setNombre(t);
                  if (mensajeError) setMensajeError('');
                }}
              />
            </View>

            {/* Correo */}
            <View style={estilos.campo}>
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

            {/* Contraseña */}
            <View style={estilos.campo}>
              <Icon name="lock" size={17} color="#7B91A1" />
              <TextInput
                style={estilos.input}
                placeholder="Contraseña (mínimo 6 caracteres)"
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

            {/* Confirmar Contraseña */}
            <View style={estilos.campo}>
              <Icon name="lock" size={17} color="#7B91A1" />
              <TextInput
                style={estilos.input}
                placeholder="Repetir contraseña"
                placeholderTextColor="#94A1AD"
                secureTextEntry={!verContrasena}
                value={confirmar}
                onChangeText={(t) => {
                  setConfirmar(t);
                  if (mensajeError) setMensajeError('');
                }}
                autoCapitalize="none"
              />
            </View>

            {/* Botón Registrarse */}
            <TouchableOpacity
              style={estilos.botonPrimario}
              onPress={handleRegistro}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={estilos.textoBotonPrimario}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Enlace Iniciar Sesión */}
            <View style={estilos.footer}>
              <Text style={estilos.textoFooter}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={estilos.linkLogin}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Popup para Registrarse con Google */}
        <GoogleAccountPopup
          visible={modalGoogleVisible}
          modo="registro"
          cargando={cargandoGoogle}
          onClose={() => setModalGoogleVisible(false)}
          onSeleccionarCuenta={handleRegistroGoogle}
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
    paddingTop: 45,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  btnVolver: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D3348',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  encabezado: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  eyebrow: {
    color: '#4D9FD3',
    fontWeight: '800',
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  displayTitle: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 31,
    color: '#1D3348',
  },
  displayTitleEm: {
    color: '#4E9FD2',
  },
  parrafo: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: '#738495',
    textAlign: 'center',
    maxWidth: 260,
  },
  authForm: {
    width: '100%',
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
  cerrarError: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  googleButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0DCE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2F4653',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  googleButtonTexto: {
    color: '#1D3348',
    fontSize: 12.5,
    fontWeight: '800',
  },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  divisorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDE6ED',
  },
  divisorTexto: {
    fontSize: 10.5,
    color: '#738495',
    fontWeight: '600',
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
  linkLogin: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4E9FD2',
  },
});
