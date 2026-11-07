import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { avisar } from '../../utils/dialogs';
import { useTheme } from '../../hooks/useTheme';

export default function EmergencyQRModal({ visible, onClose, mascota, usuario }) {
  const { colors, isDark } = useTheme();
  if (!mascota) return null;

  const ownerName = usuario?.nombre || 'Tutor de PawCare';
  const ownerPhone = usuario?.telefono || 'Sin teléfono configurado (añádelo en Mi Perfil)';
  const ownerAddress =
    usuario?.direccion || mascota?.zona || 'Dirección no especificada (añádela en Mi Perfil)';
  const chipInfo = mascota.microchip ? ` | Microchip: ${mascota.microchip}` : '';
  const rasgosInfo =
    mascota.color || mascota.caracteristicas
      ? ` | Señas: ${[mascota.color, mascota.tamano, mascota.caracteristicas].filter(Boolean).join(', ')}`
      : '';

  const waMessage = `¡Hola ${ownerName}! Encontré a tu mascota ${mascota.nombre} (${mascota.raza || mascota.especie}${chipInfo}${rasgosInfo}). Dirección registrada: ${ownerAddress}. Favor contáctame para coordinar su regreso.`;
  const cleanDigits = (usuario?.telefono || '').replace(/[^0-9]/g, '');
  const qrData = cleanDigits
    ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(waMessage)}`
    : waMessage;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=14302F&bgcolor=FFFFFF&margin=6&data=${encodeURIComponent(qrData)}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={estilos.modalOverlay}>
        <TouchableOpacity
          style={estilos.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[estilos.qrSheetContenido, { backgroundColor: colors.surface }]}>
          <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />

          <View style={estilos.qrSheetHeader}>
            <View style={estilos.qrTitleRow}>
              <View style={[estilos.qrBadgeIcon, { backgroundColor: colors.okBg }]}>
                <Text style={{ fontSize: 20, color: colors.brand }}>▦</Text>
              </View>
              <View>
                <Text style={[estilos.qrTituloPrincipal, { color: colors.text }]}>
                  QR de emergencia
                </Text>
                <Text style={[estilos.qrSubtitulo, { color: colors.muted }]}>
                  Placa de identificación para {mascota.nombre}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[estilos.qrBtnCerrar, { backgroundColor: colors.surface2 }]}
              onPress={onClose}
            >
              <Text style={[estilos.qrBtnCerrarTexto, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              estilos.qrCardCentral,
              { backgroundColor: colors.surface2, borderColor: colors.line },
            ]}
          >
            <View style={estilos.qrImageFrame}>
              <Image
                source={{ uri: qrImgUrl }}
                style={estilos.qrImage}
                resizeMode="contain"
              />
              <View style={[estilos.qrPawBadge, { borderColor: colors.brand }]}>
                <Text style={{ fontSize: 13 }}>🐾</Text>
              </View>
            </View>
            <Text style={[estilos.qrPregunta, { color: colors.text }]}>
              ¿Encontraste a {mascota.nombre}?
            </Text>
            <Text style={[estilos.qrAyudaTexto, { color: colors.muted }]}>
              Escanea el código QR para abrir WhatsApp con los datos de su tutor y dirección.
            </Text>
          </View>

          {(mascota.microchip || mascota.color || mascota.caracteristicas) && (
            <View
              style={[
                estilos.qrInfoCard,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={[estilos.qrInfoIcono, { backgroundColor: colors.surface2 }]}>
                <Text style={{ fontSize: 18 }}>🆔</Text>
              </View>
              <View style={estilos.qrInfoTextos}>
                <Text style={[estilos.qrInfoEtiqueta, { color: colors.muted }]}>
                  MICROCHIP Y SEÑAS PARTICULARES
                </Text>
                <Text style={[estilos.qrInfoValor, { color: colors.text }]}>
                  {[
                    mascota.microchip ? `Chip: ${mascota.microchip}` : null,
                    mascota.tamano,
                    mascota.color,
                    mascota.caracteristicas,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          )}

          <View
            style={[
              estilos.qrInfoCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <View style={[estilos.qrInfoIcono, { backgroundColor: colors.surface2 }]}>
              <Text style={{ fontSize: 18 }}>📍</Text>
            </View>
            <View style={estilos.qrInfoTextos}>
              <Text style={[estilos.qrInfoEtiqueta, { color: colors.muted }]}>
                DIRECCIÓN / ZONA DEL TUTOR
              </Text>
              <Text style={[estilos.qrInfoValor, { color: colors.text }]}>{ownerAddress}</Text>
            </View>
          </View>

          <View
            style={[
              estilos.qrInfoCard,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <View style={[estilos.qrInfoIcono, { backgroundColor: colors.surface2 }]}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={estilos.qrInfoTextos}>
              <Text style={[estilos.qrInfoEtiqueta, { color: colors.muted }]}>
                TELÉFONO DE EMERGENCIA ({ownerName.toUpperCase()})
              </Text>
              <Text style={[estilos.qrInfoValor, { color: colors.text }]}>{ownerPhone}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[estilos.btnDescargarQr, { backgroundColor: colors.brand }]}
            onPress={async () => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.open(qrImgUrl, '_blank');
                return;
              }
              try {
                const supported = await Linking.canOpenURL(qrImgUrl);
                if (supported) {
                  await Linking.openURL(qrImgUrl);
                } else {
                  avisar('Placa QR Lista 🐾', `Código de emergencia para ${mascota.nombre}:\n${qrData}`);
                }
              } catch {
                avisar('Placa QR Lista 🐾', `Código de emergencia para ${mascota.nombre}:\n${qrData}`);
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 16, color: isDark ? '#06201B' : '#FFFFFF', marginRight: 8 }}>
              📥
            </Text>
            <Text style={[estilos.btnDescargarQrTexto, { color: isDark ? '#06201B' : '#FFFFFF' }]}>
              Descargar / Guardar QR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 21, 20, 0.58)',
  },
  qrSheetContenido: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  qrSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  qrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  qrBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTituloPrincipal: {
    fontSize: 17,
    fontWeight: '800',
  },
  qrSubtitulo: {
    fontSize: 12,
    marginTop: 1,
  },
  qrBtnCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBtnCerrarTexto: {
    fontSize: 13,
    fontWeight: '800',
  },
  qrCardCentral: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  qrImageFrame: {
    width: 168,
    height: 168,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrPawBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    elevation: 2,
  },
  qrPregunta: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrAyudaTexto: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 17,
  },
  qrInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  qrInfoIcono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  qrInfoTextos: {
    flex: 1,
  },
  qrInfoEtiqueta: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrInfoValor: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 1,
  },
  btnDescargarQr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
  },
  btnDescargarQrTexto: {
    fontSize: 15,
    fontWeight: '800',
  },
});
