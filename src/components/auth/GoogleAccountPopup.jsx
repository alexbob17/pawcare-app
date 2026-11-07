import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { GoogleSvgIcon } from '../common/Icons';
import { obtenerCuentasGoogleDispositivo } from '../../services/auth.service';

const COLORES_AVATAR = ['#1A73E8', '#0F9D58', '#DB4437', '#F4B400', '#7B1FA2', '#00897B'];

export default function GoogleAccountPopup({
  visible,
  modo = 'login', // 'login' | 'registro'
  onClose,
  onSeleccionarCuenta,
  cargando = false,
  errorExterno = '',
}) {
  const [cuentasGuardadas, setCuentasGuardadas] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [usarOtraCuenta, setUsarOtraCuenta] = useState(false);
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [errorLocal, setErrorLocal] = useState('');

  useEffect(() => {
    if (visible) {
      setErrorLocal('');
      cargarCuentas();
    }
  }, [visible]);

  const cargarCuentas = async () => {
    setCargandoCuentas(true);
    try {
      const lista = await obtenerCuentasGoogleDispositivo();
      setCuentasGuardadas(lista);
      // Mostrar primero el selector de cuentas estilo Google One-Tap si hay cuentas disponibles
      if (lista.length > 0) {
        setUsarOtraCuenta(false);
      } else {
        setUsarOtraCuenta(true);
      }
    } finally {
      setCargandoCuentas(false);
    }
  };

  const formatearNombreDesdeCorreo = (emailStr) => {
    const base = emailStr.split('@')[0] || 'Usuario';
    return base
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  };

  const manejarContinuarManual = () => {
    setErrorLocal('');
    const emailLimpio = correo.trim().toLowerCase();
    if (!emailLimpio) {
      setErrorLocal('Ingresa tu correo electrónico de Google.');
      return;
    }
    const emailFinal = emailLimpio.includes('@') ? emailLimpio : `${emailLimpio}@gmail.com`;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(emailFinal)) {
      setErrorLocal('Ingresa un correo electrónico válido (ej. usuario@gmail.com).');
      return;
    }

    const nombreFinal =
      nombre.trim() || formatearNombreDesdeCorreo(emailFinal);

    onSeleccionarCuenta({
      correo: emailFinal,
      nombre: nombreFinal,
    });
  };

  const manejarClickCuentaGuardada = (cuenta) => {
    setErrorLocal('');
    onSeleccionarCuenta({
      correo: cuenta.correo,
      nombre: cuenta.nombre || formatearNombreDesdeCorreo(cuenta.correo),
    });
  };

  const mensajeError = errorLocal || errorExterno;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={estilos.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.popupCard}>
          {/* Barra superior estilo Google */}
          <View style={estilos.topHeader}>
            <View style={estilos.googleBrandRow}>
              <GoogleSvgIcon size={20} />
              <Text style={estilos.googleBrandText}>
                Acceder con Google
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={cargando}
              style={estilos.btnCerrar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={estilos.btnCerrarTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={estilos.contenido}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Encabezado del Popup */}
            <View style={estilos.encabezado}>
              <View style={estilos.badgeApp}>
                <Text style={{ fontSize: 18 }}>🐾</Text>
              </View>
              <Text style={estilos.titulo}>
                Elige una cuenta
              </Text>
              <Text style={estilos.subtitulo}>
                para continuar a <Text style={estilos.subtituloBold}>PawCare</Text>
              </Text>
            </View>

            {/* Mensaje de error si ocurre */}
            {mensajeError ? (
              <View style={estilos.alertaError}>
                <Text style={estilos.alertaErrorIcono}>⚠️</Text>
                <Text style={estilos.alertaErrorTexto}>{mensajeError}</Text>
              </View>
            ) : null}

            {/* Estado cargando cuentas */}
            {cargandoCuentas ? (
              <View style={estilos.cargandoBox}>
                <ActivityIndicator size="small" color="#1A73E8" />
                <Text style={estilos.cargandoTexto}>Buscando cuentas de Google...</Text>
              </View>
            ) : !usarOtraCuenta && cuentasGuardadas.length > 0 ? (
              /* Lista de cuentas estilo Google One-Tap (1 toque para entrar sin escribir) */
              <View style={estilos.listaCuentas}>
                {cuentasGuardadas.map((cuenta, idx) => {
                  const inicial = (cuenta.nombre || cuenta.correo || 'G')
                    .charAt(0)
                    .toUpperCase();
                  const colorBg = COLORES_AVATAR[idx % COLORES_AVATAR.length];
                  return (
                    <TouchableOpacity
                      key={cuenta.correo}
                      style={estilos.itemCuenta}
                      onPress={() => manejarClickCuentaGuardada(cuenta)}
                      disabled={cargando}
                      activeOpacity={0.72}
                    >
                      <View style={[estilos.avatarCuenta, { backgroundColor: colorBg }]}>
                        <Text style={estilos.avatarTexto}>{inicial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.nombreCuenta} numberOfLines={1}>
                          {cuenta.nombre || formatearNombreDesdeCorreo(cuenta.correo)}
                        </Text>
                        <Text style={estilos.correoCuenta} numberOfLines={1}>
                          {cuenta.correo}
                        </Text>
                      </View>
                      {cargando ? (
                        <ActivityIndicator size="small" color="#1A73E8" />
                      ) : (
                        <Text style={estilos.flechaCuenta}>›</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={estilos.btnOtraCuenta}
                  onPress={() => {
                    setErrorLocal('');
                    setUsarOtraCuenta(true);
                  }}
                  disabled={cargando}
                >
                  <View style={estilos.iconoOtraCuenta}>
                    <Text style={{ fontSize: 15, color: '#5F6368', fontWeight: '700' }}>＋</Text>
                  </View>
                  <Text style={estilos.textoOtraCuenta}>Usar otra cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Formulario para vincular otra cuenta de Google */
              <View style={estilos.formulario}>
                {cuentasGuardadas.length > 0 && (
                  <TouchableOpacity
                    style={estilos.linkVerCuentas}
                    onPress={() => {
                      setErrorLocal('');
                      setUsarOtraCuenta(false);
                    }}
                  >
                    <Text style={estilos.linkVerCuentasTxt}>
                      ← Volver a las cuentas disponibles ({cuentasGuardadas.length})
                    </Text>
                  </TouchableOpacity>
                )}

                {modo === 'registro' && (
                  <View style={estilos.grupoInput}>
                    <Text style={estilos.labelInput}>Tu nombre (opcional)</Text>
                    <TextInput
                      style={estilos.inputGoogle}
                      placeholder="Ej. Alejandro Morales"
                      placeholderTextColor="#9AA0A6"
                      value={nombre}
                      onChangeText={(t) => {
                        setNombre(t);
                        if (errorLocal) setErrorLocal('');
                      }}
                      editable={!cargando}
                    />
                  </View>
                )}

                <View style={estilos.grupoInput}>
                  <Text style={estilos.labelInput}>Correo electrónico o Gmail</Text>
                  <TextInput
                    style={estilos.inputGoogle}
                    placeholder="tucorreo@gmail.com"
                    placeholderTextColor="#9AA0A6"
                    value={correo}
                    onChangeText={(t) => {
                      setCorreo(t);
                      if (errorLocal) setErrorLocal('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!cargando}
                  />
                </View>

                <Text style={estilos.notaPrivacidad}>
                  Una vez vinculada, tu cuenta aparecerá automáticamente en la lista para entrar con un solo toque.
                </Text>

                <View style={estilos.accionesRow}>
                  <TouchableOpacity
                    style={estilos.btnCancelar}
                    onPress={onClose}
                    disabled={cargando}
                  >
                    <Text style={estilos.btnCancelarTxt}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[estilos.btnSiguiente, cargando && { opacity: 0.7 }]}
                    onPress={manejarContinuarManual}
                    disabled={cargando}
                    activeOpacity={0.85}
                  >
                    {cargando ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={estilos.btnSiguienteTxt}>
                        {modo === 'registro' ? 'Registrarme' : 'Continuar'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  googleBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleBrandText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  btnCerrar: {
    padding: 4,
  },
  btnCerrarTxt: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: '700',
  },
  contenido: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeApp: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202124',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 4,
    textAlign: 'center',
  },
  subtituloBold: {
    fontWeight: '700',
    color: '#2E9E86',
  },
  cargandoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    gap: 10,
  },
  cargandoTexto: {
    fontSize: 13,
    color: '#5F6368',
    fontWeight: '600',
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 11,
    marginBottom: 14,
    gap: 8,
  },
  alertaErrorIcono: {
    fontSize: 14,
  },
  alertaErrorTexto: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
  },
  listaCuentas: {
    marginTop: 2,
  },
  itemCuenta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    gap: 12,
  },
  avatarCuenta: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nombreCuenta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  correoCuenta: {
    fontSize: 12.5,
    color: '#5F6368',
    marginTop: 1,
  },
  flechaCuenta: {
    fontSize: 22,
    color: '#9AA0A6',
    fontWeight: '600',
  },
  btnOtraCuenta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 12,
  },
  iconoOtraCuenta: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DADCE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoOtraCuenta: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3C4043',
  },
  formulario: {
    marginTop: 2,
  },
  linkVerCuentas: {
    marginBottom: 12,
  },
  linkVerCuentasTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A73E8',
  },
  grupoInput: {
    marginBottom: 12,
  },
  labelInput: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C4043',
    marginBottom: 6,
  },
  inputGoogle: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#202124',
    backgroundColor: '#FFFFFF',
  },
  notaPrivacidad: {
    fontSize: 11.5,
    color: '#5F6368',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 18,
  },
  accionesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  btnCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnCancelarTxt: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A73E8',
  },
  btnSiguiente: {
    backgroundColor: '#1A73E8',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  btnSiguienteTxt: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
