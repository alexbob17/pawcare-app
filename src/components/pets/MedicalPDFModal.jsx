import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { obtenerTextoEdad, formatearFecha } from '../../utils/dates';
import { obtenerSubcoleccionFirestore } from '../../services/firestore.service';
import { avisar } from '../../utils/dialogs';
import { useTheme } from '../../hooks/useTheme';

export default function MedicalPDFModal({ visible, onClose, mascota, usuario }) {
  const { colors, isDark } = useTheme();
  const [vacunas, setVacunas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [pesos, setPesos] = useState([]);
  const [salud, setSalud] = useState([]);

  useEffect(() => {
    if (mascota?.id && visible) {
      obtenerSubcoleccionFirestore('vacunas', mascota.id).then((v) => setVacunas(v || []));
      obtenerSubcoleccionFirestore('medicamentos', mascota.id).then((m) => setMedicamentos(m || []));
      obtenerSubcoleccionFirestore('citas', mascota.id).then((c) => setCitas(c || []));
      obtenerSubcoleccionFirestore('pesos', mascota.id).then((p) => {
        const ordenados = (p || []).sort(
          (a, b) => new Date(b.fecha || b.creadaEn || 0) - new Date(a.fecha || a.creadaEn || 0)
        );
        setPesos(ordenados);
      });
      obtenerSubcoleccionFirestore('salud', mascota.id).then((s) => setSalud(s || []));
    }
  }, [mascota?.id, visible]);

  if (!mascota) return null;

  const edadTexto = obtenerTextoEdad(mascota);
  const pesoMasReciente = pesos.length > 0 ? pesos[0].peso : (mascota.pesoActual || null);

  const formatearEspecieRaza = () => {
    const esp = (mascota.especie || '').trim();
    const espCap = esp ? esp.charAt(0).toUpperCase() + esp.slice(1).toLowerCase() : 'Mascota';
    const rz = (mascota.raza || '').trim();
    if (!rz || rz.toLowerCase() === 'mestizo' || rz.toLowerCase() === esp.toLowerCase()) {
      return espCap;
    }
    return `${espCap} · ${rz}`;
  };

  const handleCompartirOImprimir = async () => {
    const ownerName = usuario?.nombre || 'Alejandro Morales';
    const ownerPhone = usuario?.telefono || '+505 8888 7777';
    const ownerAddress = usuario?.direccion ? ` | Dirección: ${usuario.direccion}` : '';

    const vacTexto = vacunas.length
      ? vacunas
          .map(
            (v) =>
              `• ${v.nombre} (Apl: ${v.fechaAplicacion ? formatearFecha(v.fechaAplicacion) : 'Registrada'}${
                v.proximaDosis ? ` - Próx: ${formatearFecha(v.proximaDosis)}` : ''
              }${v.lugar || v.veterinario ? ` - 📍 ${v.lugar || v.veterinario}` : ''})`
          )
          .join('\n')
      : '• Sin vacunas registradas';

    const medTexto = medicamentos.length
      ? medicamentos
          .map(
            (m) =>
              `• ${m.nombre} (${m.dosis || '1 dosis'} - ${m.frecuencia || 'Diario'}${
                m.lugar ? ` - 📍 ${m.lugar}` : ''
              })`
          )
          .join('\n')
      : '• Sin tratamientos activos';

    const citasTexto = citas.length
      ? citas
          .map(
            (c) =>
              `• ${c.motivo} (${formatearFecha(c.fecha)}${
                c.lugar || c.veterinario ? ` - 📍 ${c.lugar || c.veterinario}` : ''
              })${c.diagnostico ? `\n   ↳ Diagnóstico Vet: ${c.diagnostico}` : ''}${
                c.seguimientoPostConsulta ? `\n   ↳ Seguimiento: ${c.seguimientoPostConsulta}` : ''
              }`
          )
          .join('\n')
      : '• Sin citas registradas';

    const pesoTexto = pesos.length
      ? pesos.map((p) => `• ${p.fecha ? formatearFecha(p.fecha) : 'Registro'}: ${p.peso} kg`).join('\n')
      : `• Actual: ${pesoMasReciente || 10} kg`;

    const alergiasTexto = salud.length
      ? salud.map((s) => `• ${s.nombre} (${s.tipo || 'condición'})`).join('\n')
      : mascota.alergias || 'Sin alergias, cirugías ni síntomas registrados.';

    const reporte =
      `🐾 FICHA DE CONTROL Y REGISTRO DE SALUD · PAWCARE\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `MASCOTA: ${mascota.nombre.toUpperCase()}\n` +
      `Especie/Raza: ${formatearEspecieRaza()}\n` +
      `Edad: ${edadTexto} | Sexo: ${mascota.sexo || 'Macho'} | Tamaño: ${mascota.tamano || 'Mediano'}\n` +
      `Color: ${mascota.color || 'N/E'} | Microchip/ID: ${mascota.microchip || 'Sin registro'}\n` +
      (mascota.caracteristicas ? `Señas particulares: ${mascota.caracteristicas}\n` : '') +
      `Tutor: ${ownerName} (${ownerPhone})${ownerAddress}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💉 VACUNAS Y DESPARASITACIÓN:\n${vacTexto}\n\n` +
      `💊 MEDICAMENTOS Y DURACIÓN:\n${medTexto}\n\n` +
      `🩺 CITAS, DIAGNÓSTICOS Y SEGUIMIENTO POST-CONSULTA:\n${citasTexto}\n\n` +
      `⚖️ EVOLUCIÓN DE PESO:\n${pesoTexto}\n\n` +
      `❤️ ALERGIAS, CIRUGÍAS Y SÍNTOMAS:\n${alergiasTexto}\n\n` +
      `Generado desde PawCare · Registro de cuidado de mascotas`; +
      `Edad: ${edadTexto} | Sexo: ${mascota.sexo || 'Macho'} | Tamaño: ${mascota.tamano || 'Mediano'}\n` +
      `Color: ${mascota.color || 'N/E'} | Microchip/ID: ${mascota.microchip || 'Sin registro'}\n` +
      (mascota.caracteristicas ? `Señas particulares: ${mascota.caracteristicas}\n` : '') +
      `Tutor: ${ownerName} (${ownerPhone})${ownerAddress}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💉 VACUNAS Y DESPARASITACIÓN:\n${vacTexto}\n\n` +
      `💊 MEDICAMENTOS Y DURACIÓN:\n${medTexto}\n\n` +
      `🩺 CITAS, DIAGNÓSTICOS Y SEGUIMIENTO POST-CONSULTA:\n${citasTexto}\n\n` +
      `⚖️ EVOLUCIÓN DE PESO:\n${pesoTexto}\n\n` +
      `❤️ ALERGIAS, CIRUGÍAS Y SÍNTOMAS:\n${alergiasTexto}\n\n` +
      `Generado desde PawCare · Registro de cuidado de mascotas`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(reporte);
          avisar(
            'Ficha Copiada',
            'El resumen de salud ha sido copiado al portapapeles para compartir o imprimir.'
          );
        } else {
          avisar('Ficha de Salud', reporte);
        }
      } catch {
        avisar('Ficha de Salud', reporte);
      }
      return;
    }

    try {
      await Share.share({
        title: `Ficha de Salud - ${mascota.nombre}`,
        message: reporte,
      });
    } catch {
      avisar('Ficha de Salud', reporte);
    }
  };

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
        <View style={[estilos.qrSheetContenido, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
          <View style={[estilos.sheetHandle, { backgroundColor: colors.line }]} />

          <View style={estilos.qrSheetHeader}>
            <View style={estilos.qrTitleRow}>
              <View style={[estilos.qrBadgeIcon, { backgroundColor: colors.okBg }]}>
                <Text style={{ fontSize: 20 }}>📄</Text>
              </View>
              <View>
                <Text style={[estilos.qrTituloPrincipal, { color: colors.text }]}>
                  Ficha de Salud (PDF)
                </Text>
                <Text style={[estilos.qrSubtitulo, { color: colors.muted }]}>
                  Resumen de control y cuidados de {mascota.nombre}
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

          <ScrollView style={estilos.pdfScroll} showsVerticalScrollIndicator={false}>
            <View
              style={[
                estilos.pdfDocumento,
                { backgroundColor: colors.surface2, borderColor: colors.line },
              ]}
            >
              {/* Encabezado Documento (Sin texto de clínica veterinaria) */}
              <View style={estilos.pdfDocHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[estilos.pdfLogoTitulo, { color: colors.brand }]}>
                    🐾 PAWCARE
                  </Text>
                  <Text style={[estilos.pdfLogoSub, { color: colors.muted }]}>
                    REGISTRO PERSONAL DE SALUD Y CUIDADO
                  </Text>
                </View>
                <View
                  style={[
                    estilos.pdfFolioBadge,
                    { backgroundColor: colors.okBg, borderColor: colors.brand },
                  ]}
                >
                  <Text style={[estilos.pdfFolioTexto, { color: colors.brand }]}>
                    ID: {String(mascota.id).slice(-6).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[estilos.pdfSeparador, { backgroundColor: colors.line }]} />

              {/* Fila Mascota y Tutor */}
              <View style={estilos.pdfGridDos}>
                <View style={estilos.pdfCol}>
                  <Text style={[estilos.pdfDatoLabel, { color: colors.muted }]}>MASCOTA</Text>
                  <Text style={[estilos.pdfDatoValor, { color: colors.text }]}>{mascota.nombre}</Text>
                  <Text style={[estilos.pdfDatoSub, { color: colors.muted }]}>
                    {formatearEspecieRaza()}
                  </Text>
                </View>
                <View style={estilos.pdfCol}>
                  <Text style={[estilos.pdfDatoLabel, { color: colors.muted }]}>TUTOR RESPONSABLE</Text>
                  <Text style={[estilos.pdfDatoValor, { color: colors.text }]}>
                    {usuario?.nombre || 'Alejandro Morales'}
                  </Text>
                  <Text style={[estilos.pdfDatoSub, { color: colors.muted }]}>
                    {usuario?.telefono || '+505 8888 7777'}
                  </Text>
                  {usuario?.direccion ? (
                    <Text style={[estilos.pdfDatoSub, { color: colors.muted }]}>
                      📍 {usuario.direccion}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={estilos.pdfGridDos}>
                <View style={estilos.pdfCol}>
                  <Text style={[estilos.pdfDatoLabel, { color: colors.muted }]}>EDAD / SEXO / TAMAÑO</Text>
                  <Text style={[estilos.pdfDatoValor, { color: colors.text }]}>
                    {edadTexto} · {mascota.sexo || 'macho'} · {mascota.tamano || 'Mediano'}
                  </Text>
                  {mascota.color ? (
                    <Text style={[estilos.pdfDatoSub, { color: colors.muted }]}>
                      🎨 Color: {mascota.color}
                    </Text>
                  ) : null}
                </View>
                <View style={estilos.pdfCol}>
                  <Text style={[estilos.pdfDatoLabel, { color: colors.muted }]}>PESO Y MICROCHIP</Text>
                  <Text style={[estilos.pdfDatoValor, { color: colors.text }]}>
                    {pesoMasReciente ? `${pesoMasReciente} kg` : 'Sin datos'}
                  </Text>
                  <Text style={[estilos.pdfDatoSub, { color: colors.muted }]}>
                    🆔 {mascota.microchip || 'Sin microchip'}
                  </Text>
                </View>
              </View>

              {/* Vacunas y Desparasitación */}
              <Text style={[estilos.pdfSeccionSub, { color: colors.text }]}>
                💉 Vacunas y Control de Desparasitación
              </Text>
              {vacunas.length > 0 ? (
                vacunas.map((v) => (
                  <View key={v.id} style={estilos.pdfItemBlock}>
                    <View style={estilos.pdfItemRow}>
                      <Text style={[estilos.pdfItemTitle, { color: colors.text }]}>• {v.nombre}</Text>
                      <Text style={[estilos.pdfItemDate, { color: colors.muted }]}>
                        {v.fechaAplicacion ? formatearFecha(v.fechaAplicacion) : 'Aplicada'}
                        {v.proximaDosis ? ` (Próx: ${formatearFecha(v.proximaDosis)})` : ''}
                      </Text>
                    </View>
                    {v.lugar || v.veterinario ? (
                      <Text style={[estilos.pdfItemLugar, { color: colors.muted }]}>
                        📍 Lugar / Vet: {[v.lugar, v.veterinario].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={[estilos.pdfVacioTexto, { color: colors.muted }]}>
                  Sin vacunas registradas
                </Text>
              )}

              {/* Medicamentos */}
              <Text style={[estilos.pdfSeccionSub, { color: colors.text }]}>
                💊 Medicamentos y Tratamientos
              </Text>
              {medicamentos.length > 0 ? (
                medicamentos.map((m) => (
                  <View key={m.id} style={estilos.pdfItemBlock}>
                    <View style={estilos.pdfItemRow}>
                      <Text style={[estilos.pdfItemTitle, { color: colors.text }]}>• {m.nombre}</Text>
                      <Text style={[estilos.pdfItemDate, { color: colors.muted }]}>
                        {m.dosis || '1 dosis'} {m.frecuencia ? `• ${m.frecuencia}` : ''}
                      </Text>
                    </View>
                    {m.lugar ? (
                      <Text style={[estilos.pdfItemLugar, { color: colors.muted }]}>
                        📍 {m.lugar}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={[estilos.pdfVacioTexto, { color: colors.muted }]}>
                  Sin tratamientos activos
                </Text>
              )}

              {/* Citas */}
              <Text style={[estilos.pdfSeccionSub, { color: colors.text }]}>
                🩺 Citas y Visitas Veterinarias
              </Text>
              {citas.length > 0 ? (
                citas.map((c) => (
                  <View key={c.id} style={estilos.pdfItemBlock}>
                    <View style={estilos.pdfItemRow}>
                      <Text style={[estilos.pdfItemTitle, { color: colors.text }]}>• {c.motivo}</Text>
                      <Text style={[estilos.pdfItemDate, { color: colors.muted }]}>
                        {formatearFecha(c.fecha)}
                      </Text>
                    </View>
                    {c.lugar || c.veterinario ? (
                      <Text style={[estilos.pdfItemLugar, { color: colors.muted }]}>
                        📍 {[c.lugar, c.veterinario].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                    {c.diagnostico || c.seguimientoPostConsulta ? (
                      <Text style={[estilos.pdfItemLugar, { color: colors.brand, fontWeight: '700' }]}>
                        📋 Seguimiento Vet: {[c.diagnostico, c.seguimientoPostConsulta].filter(Boolean).join(' — ')}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={[estilos.pdfVacioTexto, { color: colors.muted }]}>
                  Sin citas médicas registradas
                </Text>
              )}

              {/* Control de Peso */}
              <Text style={[estilos.pdfSeccionSub, { color: colors.text }]}>
                ⚖️ Control de Peso
              </Text>
              {pesos.length > 0 ? (
                pesos.slice(0, 3).map((w) => (
                  <View key={w.id} style={estilos.pdfItemRow}>
                    <Text style={[estilos.pdfItemTitle, { color: colors.text }]}>• {w.peso} kg</Text>
                    <Text style={[estilos.pdfItemDate, { color: colors.muted }]}>
                      {w.fecha ? formatearFecha(w.fecha) : 'Registro'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[estilos.pdfVacioTexto, { color: colors.muted }]}>
                  Peso actual: {pesoMasReciente ? `${pesoMasReciente} kg` : 'Sin datos'}
                </Text>
              )}

              {/* Alergias, Cirugías y Síntomas */}
              <View
                style={[
                  estilos.pdfAlergiaBox,
                  { backgroundColor: colors.warnBg, borderColor: colors.warn },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.warn }}>
                  ! Alergias, Cirugías y Síntomas:
                </Text>
                <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>
                  {salud.length
                    ? salud.map((s) => `${s.nombre} (${s.tipo || 'registro'})`).join(', ')
                    : mascota.alergias || 'Sin alergias, cirugías ni restricciones registradas.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[estilos.btnDescargarQr, { backgroundColor: colors.brand }]}
            onPress={handleCompartirOImprimir}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 16, color: isDark ? '#06201B' : '#FFFFFF', marginRight: 8 }}>
              📄
            </Text>
            <Text style={[estilos.btnDescargarQrTexto, { color: isDark ? '#06201B' : '#FFFFFF' }]}>
              {Platform.OS === 'web' ? 'Copiar / Imprimir Ficha' : 'Compartir / Exportar Ficha'}
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
    marginBottom: 16,
  },
  qrSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrTituloPrincipal: {
    fontSize: 16,
    fontWeight: '800',
  },
  qrSubtitulo: {
    fontSize: 11,
    marginTop: 1,
  },
  qrBtnCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrBtnCerrarTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  pdfScroll: {
    maxHeight: 410,
    marginBottom: 16,
  },
  pdfDocumento: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  pdfDocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pdfLogoTitulo: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  pdfLogoSub: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  pdfFolioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfFolioTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  pdfSeparador: {
    height: 1,
    marginVertical: 12,
  },
  pdfGridDos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pdfCol: {
    flex: 1,
  },
  pdfDatoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pdfDatoValor: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  pdfDatoSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  pdfSeccionSub: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  pdfItemBlock: {
    paddingVertical: 3,
  },
  pdfItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pdfItemTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  pdfItemDate: {
    fontSize: 10.5,
  },
  pdfItemLugar: {
    fontSize: 10,
    marginLeft: 10,
    marginTop: 1,
  },
  pdfVacioTexto: {
    fontSize: 11.5,
    fontStyle: 'italic',
    marginVertical: 3,
  },
  pdfAlergiaBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  btnDescargarQr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
  },
  btnDescargarQrTexto: {
    fontSize: 14,
    fontWeight: '800',
  },
});
