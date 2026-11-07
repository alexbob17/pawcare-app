// Utilidades de fechas y edades para PawCare
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatearFechaCorta = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
};

export const formatearFechaLarga = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-NI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatearHora = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  const hrs = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hrs}:${mins}`;
};

export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;

  let anos = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();

  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
    anos--;
    meses += 12;
  }

  return { anos: Math.max(0, anos), meses: Math.max(0, meses) };
};

/**
 * Calcula una fecha de nacimiento aproximada a partir de un valor y unidad ('anos' | 'meses').
 */
export const calcularFechaDesdeEdad = (valor, unidad = 'anos') => {
  const num = parseInt(valor, 10);
  const fecha = new Date();
  if (isNaN(num) || num <= 0) return fecha.toISOString();
  if (unidad === 'meses') {
    fecha.setMonth(fecha.getMonth() - num);
  } else {
    fecha.setFullYear(fecha.getFullYear() - num);
  }
  return fecha.toISOString();
};

/**
 * Devuelve un texto legible para la edad de la mascota (ej. "2 años", "6 meses").
 */
export const obtenerTextoEdad = (mascota) => {
  if (!mascota) return 'Sin edad';
  if (mascota.edadTexto) return mascota.edadTexto;
  if (mascota.edadValor !== undefined && mascota.edadValor !== null && mascota.edadValor !== '') {
    const v = Number(mascota.edadValor);
    const u = mascota.edadUnidad === 'meses' ? (v === 1 ? 'mes' : 'meses') : (v === 1 ? 'año' : 'años');
    return `${v} ${u}`;
  }
  if (mascota.fechaNacimiento) {
    const calc = calcularEdad(mascota.fechaNacimiento);
    if (calc) {
      if (calc.anos > 0) return `${calc.anos} ${calc.anos === 1 ? 'año' : 'años'}`;
      if (calc.meses > 0) return `${calc.meses} ${calc.meses === 1 ? 'mes' : 'meses'}`;
      return 'Recién nacido';
    }
  }
  return '1 año';
};

export const obtenerAnioNacimiento = (mascota) => {
  if (mascota?.fechaNacimiento) {
    const d = new Date(mascota.fechaNacimiento);
    if (!isNaN(d.getTime())) return `Desde ${d.getFullYear()}`;
  }
  if (mascota?.edadValor) {
    const v = Number(mascota.edadValor);
    const hoy = new Date();
    if (mascota.edadUnidad === 'meses') {
      hoy.setMonth(hoy.getMonth() - v);
    } else {
      hoy.setFullYear(hoy.getFullYear() - v);
    }
    return `Desde ${hoy.getFullYear()}`;
  }
  return `Desde ${new Date().getFullYear()}`;
};

export const diasHasta = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fecha);
  if (isNaN(objetivo.getTime())) return null;
  objetivo.setHours(0, 0, 0, 0);
  const diff = Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
  return diff;
};

export const esFuturo = (fecha) => {
  if (!fecha) return false;
  return new Date(fecha) > new Date();
};

export const fechaISO = (fecha) => {
  if (!fecha) return new Date().toISOString();
  return new Date(fecha).toISOString();
};

export const generarId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
