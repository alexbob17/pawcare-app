import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../../src/hooks/useAuth';
import { usePets } from '../../src/hooks/usePets';
import { useTheme } from '../../src/hooks/useTheme';
import {
  obtenerPostsComunidadFirestore,
  guardarPostComunidadFirestore,
  eliminarPostComunidadFirestore,
  toggleLikePostComunidadFirestore,
  reportarPostComunidadFirestore,
  agregarComentarioPostComunidadFirestore,
  eliminarComentarioPostComunidadFirestore,
  reportarComentarioPostComunidadFirestore,
} from '../../src/services/firestore.service';
import { nombreEspecie } from '../../src/constants/pets';
import { avisar } from '../../src/utils/dialogs';

const CATS = {
  consejos: 'Consejos',
  recomendacion: 'Recomendación',
  experiencia: 'Experiencia',
  consulta: 'Consulta',
};

const REASONS = [
  'Spam o publicidad',
  'Lenguaje ofensivo',
  'Información falsa o peligrosa',
  'Otro motivo',
];

const LIMIT = 3;

const BAD_WORDS = [
  'idiota',
  'estupido',
  'imbecil',
  'mierda',
  'puta',
  'puto',
  'pendejo',
  'maldito',
  'estupida',
];

function normalizarTexto(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function validarTextoComunidad(texto) {
  const n = normalizarTexto(texto);
  if (/https?:\/\/|www\./.test(n)) {
    return 'Quita los enlaces. La comunidad no permite publicidad.';
  }
  for (let i = 0; i < BAD_WORDS.length; i += 1) {
    const reg = new RegExp(`\\b${BAD_WORDS[i]}\\b`);
    if (reg.test(n)) {
      return 'Tu texto tiene lenguaje ofensivo. Reescríbelo para publicarlo.';
    }
  }
  return '';
}

function obtenerIniciales(nombre) {
  return String(nombre || 'Usuario')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

function ExploreIcon({ name, size = 20, color = '#74cdb4' }) {
  const strokeProps = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  switch (name) {
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" {...strokeProps} />
          <Circle cx="12" cy="9.5" r="2.5" {...strokeProps} />
        </Svg>
      );
    case 'hospital':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13H4z" {...strokeProps} />
          <Path d="M12 9v6M9 12h6" {...strokeProps} />
        </Svg>
      );
    case 'siren':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 17v-4a5 5 0 0 1 10 0v4" {...strokeProps} />
          <Path d="M5 17h14v3H5z" {...strokeProps} />
          <Path d="M12 3v2M4.5 6.5 6 8M19.5 6.5 18 8" {...strokeProps} />
        </Svg>
      );
    case 'scissors':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="6" cy="6" r="2.5" {...strokeProps} />
          <Circle cx="6" cy="18" r="2.5" {...strokeProps} />
          <Path d="M8 7.5 20 17M8 16.5 20 7" {...strokeProps} />
        </Svg>
      );
    case 'tree':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 21v-6" {...strokeProps} />
          <Path
            d="M12 15c-4 0-6-2.5-6-5.5S8.5 4 12 3c3.5 1 6 3.5 6 6.5S16 15 12 15z"
            {...strokeProps}
          />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
            {...strokeProps}
          />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 5h14v10H10l-5 4z" {...strokeProps} />
        </Svg>
      );
    case 'flag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 21V4" {...strokeProps} />
          <Path d="M6 5h11l-2 4 2 4H6" {...strokeProps} />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" {...strokeProps} />
        </Svg>
      );
    case 'ext':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" {...strokeProps} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...strokeProps} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" {...strokeProps} />
        </Svg>
      );
    default:
      return null;
  }
}

export default function ExploreScreen() {
  const { usuario } = useAuth();
  const { mascotas, cargarMascotas } = usePets(usuario?.id);
  const { colors, isDark } = useTheme();

  const [tab, setTab] = useState('servicios'); // 'servicios' | 'comunidad'
  const [filter, setFilter] = useState('todos');
  const [posts, setPosts] = useState([]);

  // Estado del compositor de nueva publicación
  const [composerOpen, setComposerOpen] = useState(false);
  const [newCat, setNewCat] = useState('consejos');
  const [newText, setNewText] = useState('');
  const [newError, setNewError] = useState('');

  // Estados interactivos por publicación (comentarios abiertos, reporte abierto, eliminar abierto, borradores)
  const [openComments, setOpenComments] = useState({});
  const [openReport, setOpenReport] = useState({});
  const [openDelete, setOpenDelete] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  const uidActual = usuario?.id || 'local';
  const nombreAutor = usuario?.nombre || 'Tutor PawCare';
  const mascotaActiva = mascotas[0];
  const etiquetaMascota = mascotaActiva
    ? `${mascotaActiva.nombre} (${mascotaActiva.raza || nombreEspecie(mascotaActiva.especie, mascotaActiva.sexo)})`
    : 'Mascota PawCare';

  const mostrarToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 2800);
  };

  const cargarTodo = useCallback(async () => {
    try {
      cargarMascotas();
      const lista = await obtenerPostsComunidadFirestore((remotos) => {
        setPosts(remotos || []);
      });
      setPosts(lista || []);
    } catch (e) {
      console.warn('Error cargando Explorar:', e);
    }
  }, [cargarMascotas]);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [cargarTodo])
  );

  const abrirGoogleMaps = async (queryStr) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      avisar('Google Maps', `No se pudo abrir el mapa para: ${queryStr}`);
    }
  };

  const irARecomendacionesComunidad = () => {
    setTab('comunidad');
    setFilter('recomendacion');
  };

  const handlePublicar = async () => {
    const textoLimpio = newText.trim();
    if (!textoLimpio) return;

    const errorValidacion = validarTextoComunidad(textoLimpio);
    if (errorValidacion) {
      setNewError(errorValidacion);
      return;
    }

    const actualizados = await guardarPostComunidadFirestore({
      author: nombreAutor,
      authorId: uidActual,
      pet: etiquetaMascota,
      cat: newCat,
      when: 'ahora',
      text: textoLimpio,
    });
    setPosts(actualizados);
    setNewText('');
    setNewError('');
    setComposerOpen(false);
    setFilter('todos');
    mostrarToast('Publicación compartida.');
  };

  const handleToggleLike = async (postId) => {
    const actualizados = await toggleLikePostComunidadFirestore(postId, uidActual);
    setPosts(actualizados);
  };

  const handleReportarPost = async (postId, motivo) => {
    const actualizados = await reportarPostComunidadFirestore(postId, uidActual, motivo);
    setPosts(actualizados);
    setOpenReport((prev) => ({ ...prev, [postId]: false }));
    const postActualizado = actualizados.find((p) => String(p.id) === String(postId));
    if (postActualizado && (postActualizado.reports || 0) >= LIMIT) {
      mostrarToast('Gracias. La publicación se ocultó por tener 3 reportes.');
    } else {
      mostrarToast('Reporte enviado. Gracias por cuidar la comunidad.');
    }
  };

  const handleEliminarPost = async (postId) => {
    const actualizados = await eliminarPostComunidadFirestore(postId, uidActual);
    setPosts(actualizados);
    setOpenDelete((prev) => ({ ...prev, [postId]: false }));
    mostrarToast('Publicación eliminada.');
  };

  const handleEnviarComentario = async (postId) => {
    const borrador = (commentDrafts[postId] || '').trim();
    if (!borrador) return;

    const err = validarTextoComunidad(borrador);
    if (err) {
      mostrarToast(err);
      return;
    }

    const nuevoCom = {
      id: `c_${Date.now()}`,
      author: nombreAutor,
      authorId: uidActual,
      text: borrador,
      reports: 0,
      reportedBy: [],
    };

    const actualizados = await agregarComentarioPostComunidadFirestore(postId, nuevoCom);
    setPosts(actualizados);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleEliminarComentario = async (postId, commentId) => {
    const actualizados = await eliminarComentarioPostComunidadFirestore(postId, commentId, uidActual);
    setPosts(actualizados);
  };

  const handleReportarComentario = async (postId, commentId) => {
    const actualizados = await reportarComentarioPostComunidadFirestore(
      postId,
      commentId,
      uidActual
    );
    setPosts(actualizados);
    const post = actualizados.find((p) => String(p.id) === String(postId));
    const com = (post?.comments || []).find((c) => String(c.id) === String(commentId));
    if (com && (com.reports || 0) >= LIMIT) {
      mostrarToast('El comentario se ocultó por tener 3 reportes.');
    } else {
      mostrarToast('Reporte enviado. Gracias por cuidar la comunidad.');
    }
  };

  const postsVisibles = posts.filter((p) => (p.reports || 0) < LIMIT);
  const postsFiltrados = postsVisibles.filter(
    (p) => filter === 'todos' || p.cat === filter
  );
  const totalOcultos = posts.length - postsVisibles.length;

  const dangerColor = isDark ? '#f0997d' : '#b4472c';
  const dangerBg = isDark ? '#2a1b17' : '#fbece7';
  const dangerLine = isDark ? '#5a3329' : '#efc6b9';

  return (
    <View style={[estilos.contenedor, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Principal */}
        <View style={estilos.header}>
          <Text style={[estilos.h1, { color: colors.text }]}>Explorar</Text>
          <Text style={[estilos.sub, { color: colors.muted }]}>
            Lugares para tu mascota y la comunidad de dueños.
          </Text>
        </View>

        {/* Dos Pestañas Superiores: Servicios y Mapa | Comunidad */}
        <View style={estilos.tabsRow}>
          <TouchableOpacity
            style={[
              estilos.tabBtn,
              {
                backgroundColor: tab === 'servicios' ? colors.brand : colors.surface,
                borderColor: tab === 'servicios' ? colors.brand : colors.line,
              },
            ]}
            onPress={() => setTab('servicios')}
            activeOpacity={0.85}
          >
            <ExploreIcon
              name="pin"
              size={19}
              color={tab === 'servicios' ? colors.brandInk : colors.text}
            />
            <Text
              style={[
                estilos.tabBtnText,
                { color: tab === 'servicios' ? colors.brandInk : colors.text },
              ]}
            >
              Servicios y Mapa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.tabBtn,
              {
                backgroundColor: tab === 'comunidad' ? colors.brand : colors.surface,
                borderColor: tab === 'comunidad' ? colors.brand : colors.line,
              },
            ]}
            onPress={() => setTab('comunidad')}
            activeOpacity={0.85}
          >
            <ExploreIcon
              name="chat"
              size={19}
              color={tab === 'comunidad' ? colors.brandInk : colors.text}
            />
            <Text
              style={[
                estilos.tabBtnText,
                { color: tab === 'comunidad' ? colors.brandInk : colors.text },
              ]}
            >
              Comunidad ({postsVisibles.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* PANEL 1: SERVICIOS Y MAPA */}
        {tab === 'servicios' && (
          <View style={estilos.panelStack}>
            <View style={estilos.noteRow}>
              <ExploreIcon name="pin" size={16} color={colors.muted} />
              <Text style={[estilos.noteText, { color: colors.muted }]}>
                Cada botón abre Google Maps con tu ubicación. Ahí ves horarios, teléfonos, fotos y reseñas al día.
              </Text>
            </View>

            {/* 1. Veterinarias cercanas */}
            <View
              style={[
                estilos.card,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={estilos.svcHead}>
                <View style={[estilos.tile, { backgroundColor: colors.surface2 }]}>
                  <ExploreIcon name="hospital" size={20} color={colors.brand} />
                </View>
                <Text style={[estilos.svcTitle, { color: colors.text }]}>
                  Veterinarias cercanas
                </Text>
              </View>
              <Text style={[estilos.svcDesc, { color: colors.muted }]}>
                Clínicas y hospitales veterinarios para consulta general, vacunas y cirugía.
              </Text>
              <TouchableOpacity
                style={[estilos.btnPrimary, { backgroundColor: colors.brand }]}
                onPress={() => abrirGoogleMaps('veterinarias cerca de mí')}
                activeOpacity={0.85}
              >
                <ExploreIcon name="ext" size={18} color={colors.brandInk} />
                <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                  Buscar veterinarias
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Emergencias 24/7 */}
            <View
              style={[
                estilos.card,
                { backgroundColor: colors.surface, borderColor: dangerLine },
              ]}
            >
              <View style={estilos.svcHead}>
                <View style={[estilos.tile, { backgroundColor: dangerBg }]}>
                  <ExploreIcon name="siren" size={20} color={dangerColor} />
                </View>
                <Text style={[estilos.svcTitle, { color: colors.text }]}>
                  Emergencias 24/7
                </Text>
              </View>
              <Text style={[estilos.svcDesc, { color: colors.muted }]}>
                Clínicas con atención las 24 horas. Llama antes de salir para confirmar que reciben urgencias y tienen espacio.
              </Text>
              <TouchableOpacity
                style={[estilos.btnPrimary, { backgroundColor: dangerColor }]}
                onPress={() =>
                  abrirGoogleMaps('veterinaria de emergencia 24 horas cerca de mí')
                }
                activeOpacity={0.85}
              >
                <ExploreIcon name="ext" size={18} color={isDark ? '#0b1514' : '#ffffff'} />
                <Text
                  style={[
                    estilos.btnPrimaryText,
                    { color: isDark ? '#0b1514' : '#ffffff' },
                  ]}
                >
                  Buscar emergencias
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Peluquerías y tiendas */}
            <View
              style={[
                estilos.card,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={estilos.svcHead}>
                <View style={[estilos.tile, { backgroundColor: colors.surface2 }]}>
                  <ExploreIcon name="scissors" size={20} color={colors.brand} />
                </View>
                <Text style={[estilos.svcTitle, { color: colors.text }]}>
                  Peluquerías y tiendas
                </Text>
              </View>
              <Text style={[estilos.svcDesc, { color: colors.muted }]}>
                Baño, corte de pelo, alimento y accesorios para mascotas.
              </Text>
              <View style={estilos.rowButtons}>
                <TouchableOpacity
                  style={[estilos.btnPrimary, { flex: 1, backgroundColor: colors.brand }]}
                  onPress={() => abrirGoogleMaps('peluquería canina cerca de mí')}
                  activeOpacity={0.85}
                >
                  <ExploreIcon name="ext" size={18} color={colors.brandInk} />
                  <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                    Peluquerías
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[estilos.btnPrimary, { flex: 1, backgroundColor: colors.brand }]}
                  onPress={() => abrirGoogleMaps('tienda de mascotas cerca de mí')}
                  activeOpacity={0.85}
                >
                  <ExploreIcon name="ext" size={18} color={colors.brandInk} />
                  <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                    Tiendas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Parques y lugares pet-friendly */}
            <View
              style={[
                estilos.card,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={estilos.svcHead}>
                <View style={[estilos.tile, { backgroundColor: colors.surface2 }]}>
                  <ExploreIcon name="tree" size={20} color={colors.brand} />
                </View>
                <Text style={[estilos.svcTitle, { color: colors.text }]}>
                  Parques y lugares pet-friendly
                </Text>
              </View>
              <Text style={[estilos.svcDesc, { color: colors.muted }]}>
                Maps te muestra los parques. Los dueños de la comunidad cuentan en qué parques, cafés y restaurantes dejan entrar mascotas.
              </Text>
              <View style={estilos.rowButtonsWrap}>
                <TouchableOpacity
                  style={[estilos.btnPrimary, { backgroundColor: colors.brand }]}
                  onPress={() => abrirGoogleMaps('parques cerca de mí')}
                  activeOpacity={0.85}
                >
                  <ExploreIcon name="ext" size={18} color={colors.brandInk} />
                  <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                    Ver parques en Maps
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[estilos.btnGhost, { backgroundColor: colors.surface2 }]}
                  onPress={irARecomendacionesComunidad}
                  activeOpacity={0.85}
                >
                  <ExploreIcon name="chat" size={18} color={colors.text} />
                  <Text style={[estilos.btnGhostText, { color: colors.text }]}>
                    Recomendados por la comunidad
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* PANEL 2: COMUNIDAD */}
        {tab === 'comunidad' && (
          <View style={estilos.panelStack}>
            <View style={estilos.noteRow}>
              <ExploreIcon name="shield" size={16} color={colors.muted} />
              <Text style={[estilos.noteText, { color: colors.muted }]}>
                Trato respetuoso, sin publicidad ni enlaces. Una publicación con 3 reportes se oculta sola.
              </Text>
            </View>

            {/* Botón o Formulario Compositor */}
            {!composerOpen ? (
              <TouchableOpacity
                style={[estilos.btnPrimary, { backgroundColor: colors.brand }]}
                onPress={() => setComposerOpen(true)}
                activeOpacity={0.85}
              >
                <ExploreIcon name="plus" size={18} color={colors.brandInk} />
                <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                  Compartir experiencia o recomendación
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  estilos.card,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <Text style={[estilos.svcTitle, { color: colors.text }]}>
                  Nueva publicación
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  Publicas como {nombreAutor} con {etiquetaMascota}.
                </Text>

                <View style={[estilos.rowButtonsWrap, { marginTop: 10 }]}>
                  {Object.keys(CATS).map((catKey) => {
                    const activo = newCat === catKey;
                    return (
                      <TouchableOpacity
                        key={catKey}
                        style={[
                          estilos.chip,
                          {
                            backgroundColor: activo ? colors.surface2 : colors.surface,
                            borderColor: activo ? colors.brand : colors.line,
                          },
                        ]}
                        onPress={() => setNewCat(catKey)}
                      >
                        <Text
                          style={{
                            fontSize: 13.5,
                            fontWeight: '600',
                            color: activo ? colors.brand : colors.muted,
                          }}
                        >
                          {CATS[catKey]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    estilos.textarea,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: colors.line,
                      color: colors.text,
                    },
                  ]}
                  multiline
                  maxLength={280}
                  placeholder={
                    newCat === 'recomendacion'
                      ? 'Nombre del lugar, zona y si aceptan mascotas (parque, café, tienda, veterinaria).'
                      : 'Cuenta tu experiencia, recomienda un lugar o haz una consulta.'
                  }
                  placeholderTextColor={colors.muted}
                  value={newText}
                  onChangeText={(val) => {
                    setNewText(val);
                    if (newError) setNewError('');
                  }}
                />

                {newError ? (
                  <Text style={{ fontSize: 13.5, color: dangerColor, fontWeight: '600' }}>
                    {newError}
                  </Text>
                ) : null}

                <View style={estilos.composerFooter}>
                  <Text style={{ fontSize: 13, color: colors.muted, marginRight: 'auto' }}>
                    {newText.length} / 280
                  </Text>
                  <TouchableOpacity
                    style={[estilos.btnGhost, { backgroundColor: colors.surface2 }]}
                    onPress={() => {
                      setComposerOpen(false);
                      setNewText('');
                      setNewError('');
                    }}
                  >
                    <Text style={[estilos.btnGhostText, { color: colors.text }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      estilos.btnPrimary,
                      {
                        backgroundColor: colors.brand,
                        opacity: newText.trim() ? 1 : 0.45,
                      },
                    ]}
                    disabled={!newText.trim()}
                    onPress={handlePublicar}
                  >
                    <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                      Publicar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Chips de Filtro de Categoría */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.chipsRow}
            >
              {[['todos', 'Todos'], ...Object.entries(CATS)].map(([key, label]) => {
                const activo = filter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      estilos.chip,
                      {
                        backgroundColor: activo ? colors.surface2 : colors.surface,
                        borderColor: activo ? colors.brand : colors.line,
                      },
                    ]}
                    onPress={() => setFilter(key)}
                  >
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: '600',
                        color: activo ? colors.brand : colors.muted,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Feed de Publicaciones */}
            {postsFiltrados.length === 0 ? (
              <View
                style={[
                  estilos.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.line,
                    alignItems: 'center',
                    paddingVertical: 28,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                  No hay publicaciones en esta categoría. Sé la primera persona en compartir algo.
                </Text>
              </View>
            ) : (
              postsFiltrados.map((p) => {
                const liked = Array.isArray(p.likedBy) && p.likedBy.includes(uidActual);
                const reported =
                  Array.isArray(p.reportedBy) && p.reportedBy.includes(uidActual);
                const esMio = Boolean(uidActual && uidActual !== 'local' && p.authorId === uidActual);
                const comentariosVisibles = (p.comments || []).filter(
                  (c) => (c.reports || 0) < LIMIT
                );

                return (
                  <View
                    key={p.id}
                    style={[
                      estilos.card,
                      { backgroundColor: colors.surface, borderColor: colors.line },
                    ]}
                  >
                    {/* Cabecera del Post */}
                    <View style={estilos.postHead}>
                      <View style={[estilos.avatar, { backgroundColor: colors.surface2 }]}>
                        <Text style={[estilos.avatarText, { color: colors.brand }]}>
                          {obtenerIniciales(p.author)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[estilos.postAuthor, { color: colors.text }]}>
                          {p.author}
                        </Text>
                        <Text style={[estilos.postMeta, { color: colors.muted }]}>
                          {p.pet} · {p.when || 'hace poco'}
                        </Text>
                      </View>
                      <View style={[estilos.pill, { backgroundColor: colors.surface2 }]}>
                        <Text style={[estilos.pillText, { color: colors.brand }]}>
                          {CATS[p.cat] || 'Comunidad'}
                        </Text>
                      </View>
                    </View>

                    {/* Texto de la Publicación */}
                    <Text style={[estilos.postText, { color: colors.text }]}>{p.text}</Text>

                    {/* Acciones: Me gusta, Comentarios, Reportar / Eliminar */}
                    <View style={[estilos.actionsRow, { borderTopColor: colors.line }]}>
                      <TouchableOpacity
                        style={[estilos.actBtn, { backgroundColor: colors.surface2 }]}
                        onPress={() => handleToggleLike(p.id)}
                      >
                        <ExploreIcon
                          name="heart"
                          size={17}
                          color={liked ? colors.brand : colors.text}
                        />
                        <Text
                          style={[
                            estilos.actBtnText,
                            { color: liked ? colors.brand : colors.text },
                          ]}
                        >
                          {p.likes || 0} Me gusta
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[estilos.actBtn, { backgroundColor: colors.surface2 }]}
                        onPress={() =>
                          setOpenComments((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                        }
                      >
                        <ExploreIcon name="chat" size={17} color={colors.text} />
                        <Text style={[estilos.actBtnText, { color: colors.text }]}>
                          {comentariosVisibles.length}{' '}
                          {comentariosVisibles.length === 1 ? 'comentario' : 'comentarios'}
                        </Text>
                      </TouchableOpacity>

                      {esMio ? (
                        <TouchableOpacity
                          style={[
                            estilos.actBtn,
                            { backgroundColor: colors.surface2, marginLeft: 'auto' },
                          ]}
                          onPress={() =>
                            setOpenDelete((prev) => ({
                              ...prev,
                              [p.id]: !prev[p.id],
                            }))
                          }
                        >
                          <ExploreIcon name="trash" size={17} color={colors.muted} />
                          <Text style={[estilos.actBtnText, { color: colors.muted }]}>
                            Eliminar
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            estilos.actBtn,
                            {
                              backgroundColor: colors.surface2,
                              marginLeft: 'auto',
                              opacity: reported ? 0.6 : 1,
                            },
                          ]}
                          disabled={reported}
                          onPress={() =>
                            setOpenReport((prev) => ({
                              ...prev,
                              [p.id]: !prev[p.id],
                            }))
                          }
                        >
                          <ExploreIcon name="flag" size={17} color={colors.muted} />
                          <Text style={[estilos.actBtnText, { color: colors.muted }]}>
                            {reported ? 'Reportada' : 'Reportar'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Sheet Confirmación Eliminar Post */}
                    {openDelete[p.id] && (
                      <View style={[estilos.sheet, { backgroundColor: colors.surface2 }]}>
                        <Text style={[estilos.sheetTitle, { color: colors.text }]}>
                          ¿Eliminar tu publicación? No se puede deshacer.
                        </Text>
                        <View style={estilos.rowButtons}>
                          <TouchableOpacity
                            style={[estilos.btnGhost, { backgroundColor: colors.surface }]}
                            onPress={() =>
                              setOpenDelete((prev) => ({ ...prev, [p.id]: false }))
                            }
                          >
                            <Text style={[estilos.btnGhostText, { color: colors.text }]}>
                              Cancelar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[estilos.btnPrimary, { backgroundColor: colors.brand }]}
                            onPress={() => handleEliminarPost(p.id)}
                          >
                            <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                              Eliminar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Sheet Motivos de Reporte */}
                    {openReport[p.id] && (
                      <View style={[estilos.sheet, { backgroundColor: colors.surface2 }]}>
                        <Text style={[estilos.sheetTitle, { color: colors.text }]}>
                          ¿Por qué reportas esta publicación?
                        </Text>
                        {REASONS.map((motivo) => (
                          <TouchableOpacity
                            key={motivo}
                            style={[
                              estilos.reasonBtn,
                              { backgroundColor: colors.surface, borderColor: colors.line },
                            ]}
                            onPress={() => handleReportarPost(p.id, motivo)}
                          >
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>
                              {motivo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={[estilos.btnGhost, { backgroundColor: colors.surface }]}
                          onPress={() =>
                            setOpenReport((prev) => ({ ...prev, [p.id]: false }))
                          }
                        >
                          <Text style={[estilos.btnGhostText, { color: colors.text }]}>
                            Cancelar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Lista de Comentarios y Formulario Inline */}
                    {openComments[p.id] && (
                      <View style={estilos.commentsContainer}>
                        {(p.comments || []).map((c) => {
                          if ((c.reports || 0) >= LIMIT) {
                            return (
                              <Text
                                key={c.id}
                                style={{
                                  fontSize: 13,
                                  fontStyle: 'italic',
                                  color: colors.muted,
                                }}
                              >
                                Comentario oculto por reportes de la comunidad.
                              </Text>
                            );
                          }
                          const comMio = Boolean(uidActual && uidActual !== 'local' && c.authorId === uidActual);
                          const comReportado =
                            Array.isArray(c.reportedBy) && c.reportedBy.includes(uidActual);

                          return (
                            <View key={c.id} style={estilos.commentRow}>
                              <View
                                style={[
                                  estilos.avatarSmall,
                                  { backgroundColor: colors.surface2 },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: '700',
                                    color: colors.brand,
                                  }}
                                >
                                  {obtenerIniciales(c.author)}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: colors.text,
                                  }}
                                >
                                  {c.author}
                                </Text>
                                <Text style={{ fontSize: 14, color: colors.text }}>
                                  {c.text}
                                </Text>
                              </View>
                              {comMio ? (
                                <TouchableOpacity
                                  style={estilos.flagBtn}
                                  onPress={() => handleEliminarComentario(p.id, c.id)}
                                >
                                  <ExploreIcon name="trash" size={16} color={colors.muted} />
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    estilos.flagBtn,
                                    { opacity: comReportado ? 0.5 : 1 },
                                  ]}
                                  disabled={comReportado}
                                  onPress={() => handleReportarComentario(p.id, c.id)}
                                >
                                  <ExploreIcon name="flag" size={16} color={colors.muted} />
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}

                        <View style={estilos.commentForm}>
                          <TextInput
                            style={[
                              estilos.commentInput,
                              {
                                backgroundColor: colors.surface2,
                                borderColor: colors.line,
                                color: colors.text,
                              },
                            ]}
                            maxLength={200}
                            placeholder="Escribe un comentario"
                            placeholderTextColor={colors.muted}
                            value={commentDrafts[p.id] || ''}
                            onChangeText={(txt) =>
                              setCommentDrafts((prev) => ({ ...prev, [p.id]: txt }))
                            }
                          />
                          <TouchableOpacity
                            style={[estilos.btnPrimary, { backgroundColor: colors.brand }]}
                            onPress={() => handleEnviarComentario(p.id)}
                          >
                            <Text style={[estilos.btnPrimaryText, { color: colors.brandInk }]}>
                              Enviar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {totalOcultos > 0 && (
              <Text style={[estilos.hiddenNote, { color: colors.muted }]}>
                {totalOcultos}{' '}
                {totalOcultos === 1
                  ? 'publicación oculta'
                  : 'publicaciones ocultas'}{' '}
                por reportes de la comunidad.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Toast Flotante de Retroalimentación */}
      {toastMsg ? (
        <View style={[estilos.toast, { backgroundColor: colors.text }]}>
          <Text style={[estilos.toastText, { color: colors.bg }]}>{toastMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 42,
    gap: 14,
  },
  header: {
    marginBottom: 2,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  sub: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  panelStack: {
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  svcHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svcTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  svcDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  btnPrimary: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnGhostText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rowButtonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    minHeight: 110,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '700',
  },
  postMeta: {
    fontSize: 13,
    marginTop: 1,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  actBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  sheet: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  commentsContainer: {
    gap: 10,
    paddingTop: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBtn: {
    padding: 6,
    borderRadius: 8,
  },
  commentForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 14.5,
  },
  hiddenNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
