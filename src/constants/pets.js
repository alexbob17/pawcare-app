// Constantes de especies, emojis, degradados de portada y fotos para PawCare
export const FOTO_PERRO_DEFAULT =
  'https://images.unsplash.com/photo-1693615775129-f2004d6e3e0b?crop=faces&fit=crop&w=600&h=600&q=85';
export const FOTO_GATO_DEFAULT =
  'https://images.unsplash.com/photo-1668979323445-11d84f1be907?crop=faces&fit=crop&w=600&h=600&q=85';
export const FOTO_AVE_DEFAULT =
  'https://images.unsplash.com/photo-1552728089-57bdde30beb3?crop=faces&fit=crop&w=600&h=600&q=85';
export const FOTO_CONEJO_DEFAULT =
  'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?crop=faces&fit=crop&w=600&h=600&q=85';
export const FOTO_ROEDOR_DEFAULT =
  'https://images.unsplash.com/photo-1548767797-d8c844163c4c?crop=faces&fit=crop&w=600&h=600&q=85';
export const FOTO_OTRO_DEFAULT =
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?crop=faces&fit=crop&w=600&h=600&q=85';

export const ESPECIES_DISPONIBLES = [
  { id: 'perro', etiqueta: 'Perro', emoji: '🐶', foto: FOTO_PERRO_DEFAULT, cover: ['#F6D68B', '#E3A74F'] },
  { id: 'gato', etiqueta: 'Gato', emoji: '🐱', foto: FOTO_GATO_DEFAULT, cover: ['#F2B880', '#D98B5F'] },
  { id: 'ave', etiqueta: 'Ave / Loro', emoji: '🦜', foto: FOTO_AVE_DEFAULT, cover: ['#8FD8C8', '#4BA9C4'] },
  { id: 'conejo', etiqueta: 'Conejo', emoji: '🐰', foto: FOTO_CONEJO_DEFAULT, cover: ['#F3B7C8', '#D97B93'] },
  { id: 'roedor', etiqueta: 'Hamster', emoji: '🐹', foto: FOTO_ROEDOR_DEFAULT, cover: ['#E6C9A2', '#C29565'] },
  { id: 'otro', etiqueta: 'Otro', emoji: '🐾', foto: FOTO_OTRO_DEFAULT, cover: ['#9BC4E2', '#5FB8D6'] },
];

export const fotoPredeterminada = (especie) => {
  switch (especie) {
    case 'gato':
      return FOTO_GATO_DEFAULT;
    case 'ave':
      return FOTO_AVE_DEFAULT;
    case 'conejo':
      return FOTO_CONEJO_DEFAULT;
    case 'roedor':
      return FOTO_ROEDOR_DEFAULT;
    case 'otro':
      return FOTO_OTRO_DEFAULT;
    case 'perro':
    default:
      return FOTO_PERRO_DEFAULT;
  }
};

export const emojiEspecie = (especie) => {
  switch (especie) {
    case 'gato':
      return '🐱 Gato';
    case 'ave':
      return '🦜 Ave';
    case 'conejo':
      return '🐰 Conejo';
    case 'roedor':
      return '🐹 Hamster';
    case 'otro':
      return '🐾 Mascota';
    case 'perro':
    default:
      return '🐶 Perro';
  }
};

export const emojiSoloEspecie = (especie) => {
  switch (especie) {
    case 'gato':
      return '🐱';
    case 'ave':
      return '🦜';
    case 'conejo':
      return '🐰';
    case 'roedor':
      return '🐹';
    case 'otro':
      return '🐾';
    case 'perro':
    default:
      return '🐶';
  }
};

export const nombreEspecie = (especie, sexo = 'macho') => {
  const esHembra = sexo === 'hembra';
  switch (especie) {
    case 'gato':
      return esHembra ? 'Gata' : 'Gato';
    case 'ave':
      return 'Ave';
    case 'conejo':
      return esHembra ? 'Coneja' : 'Conejo';
    case 'roedor':
      return 'Hamster';
    case 'otro':
      return 'Mascota';
    case 'perro':
    default:
      return esHembra ? 'Perra' : 'Perro';
  }
};

export const simboloSexo = (sexo) => (sexo === 'hembra' ? '♀' : '♂');

export const coloresPortadaEspecie = (especie) => {
  const encontrada = ESPECIES_DISPONIBLES.find((e) => e.id === especie);
  return encontrada ? encontrada.cover : ['#F6D68B', '#E3A74F'];
};

/** Devuelve la foto propia de la mascota o la predeterminada según especie. */
export const obtenerFotoMascota = (mascota) =>
  mascota?.foto || fotoPredeterminada(mascota?.especie);

/** Indica si la mascota tiene una foto personalizada subida por el usuario (no las predeterminadas de stock). */
const TODAS_DEFAULT = [
  FOTO_PERRO_DEFAULT,
  FOTO_GATO_DEFAULT,
  FOTO_AVE_DEFAULT,
  FOTO_CONEJO_DEFAULT,
  FOTO_ROEDOR_DEFAULT,
  FOTO_OTRO_DEFAULT,
];

export const tieneFotoPersonalizada = (mascota) =>
  !!mascota?.foto && !TODAS_DEFAULT.includes(mascota.foto);
