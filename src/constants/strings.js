// Todas las cadenas de texto en español para PawCare
export const Strings = {
  // App general
  app: {
    nombre: 'PawCare',
    slogan: 'La salud de tu mascota, en un solo lugar',
  },

  // Autenticación
  auth: {
    iniciarSesion: 'Iniciar Sesión',
    registrarse: 'Registrarse',
    correo: 'Correo electrónico',
    contrasena: 'Contraseña',
    confirmarContrasena: 'Confirmar contraseña',
    nombre: 'Nombre completo',
    yaEresMiembro: '¿Ya tienes una cuenta?',
    noEresMiembro: '¿No tienes cuenta?',
    cerrarSesion: 'Cerrar sesión',
    bienvenido: '¡Bienvenido/a de vuelta!',
    cuentaCreada: '¡Cuenta creada!',
    errorCorreo: 'Ingresa un correo válido',
    errorContrasena: 'La contraseña debe tener al menos 6 caracteres',
    errorContrasenaNoCoincide: 'Las contraseñas no coinciden',
    errorNombre: 'Ingresa tu nombre',
    correoYaRegistrado: 'Este correo ya está registrado',
    credencialesInvalidas: 'Correo o contraseña incorrectos',
  },

  // Mascotas
  mascotas: {
    misMascotas: 'Mis Mascotas',
    agregarMascota: 'Agregar mascota',
    editarMascota: 'Editar mascota',
    sinMascotas: 'Aún no tienes mascotas registradas',
    agregarPrimera: 'Agrega tu primera mascota',
    nombre: 'Nombre de la mascota',
    especie: 'Especie',
    raza: 'Raza',
    fechaNacimiento: 'Fecha de nacimiento',
    perro: 'Perro 🐶',
    gato: 'Gato 🐱',
    foto: 'Foto (opcional)',
    seleccionarFoto: 'Seleccionar foto',
    tomarFoto: 'Tomar foto',
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    eliminar: 'Eliminar mascota',
    confirmarEliminar: '¿Eliminar esta mascota y todos sus registros?',
    edadAnos: (anos) => `${anos} año${anos !== 1 ? 's' : ''}`,
    edadMeses: (meses) => `${meses} mes${meses !== 1 ? 'es' : ''}`,
  },

  // Vacunas
  vacunas: {
    titulo: 'Vacunas',
    agregar: 'Agregar vacuna',
    nombre: 'Nombre de la vacuna',
    fecha: 'Fecha de aplicación',
    proximaDosis: 'Próxima dosis',
    veterinario: 'Veterinario que aplicó',
    notas: 'Notas adicionales',
    sinVacunas: 'No hay vacunas registradas',
  },

  // Medicamentos
  medicamentos: {
    titulo: 'Medicamentos y tratamientos',
    agregar: 'Agregar medicamento',
    nombre: 'Nombre del medicamento',
    dosis: 'Dosis',
    frecuencia: 'Frecuencia',
    fechaInicio: 'Fecha de inicio',
    fechaFin: 'Fecha de fin',
    motivo: 'Motivo del tratamiento',
    sinMedicamentos: 'No hay medicamentos registrados',
  },

  // Citas
  citas: {
    titulo: 'Citas veterinarias',
    agregar: 'Agendar cita',
    fecha: 'Fecha de la cita',
    hora: 'Hora',
    veterinario: 'Veterinario / Clínica',
    motivo: 'Motivo de la consulta',
    notas: 'Notas',
    sinCitas: 'No hay citas programadas',
    proximas: 'Próximas citas',
    pasadas: 'Citas pasadas',
  },

  // Peso
  peso: {
    titulo: 'Historial de peso',
    agregar: 'Registrar peso',
    pesoKg: 'Peso (kg)',
    fecha: 'Fecha del registro',
    notas: 'Observaciones',
    sinPeso: 'No hay registros de peso',
  },

  // Salud
  salud: {
    titulo: 'Salud',
    enfermedades: 'Enfermedades',
    alergias: 'Alergias',
    agregarEnfermedad: 'Agregar enfermedad',
    agregarAlergia: 'Agregar alergia',
    nombre: 'Nombre / descripción',
    fechaDiagnostico: 'Fecha de diagnóstico',
    notas: 'Notas',
    sinEnfermedades: 'No hay enfermedades registradas',
    sinAlergias: 'No hay alergias registradas',
  },

  // Recordatorios
  recordatorios: {
    titulo: 'Recordatorios',
    proximos: 'Próximos recordatorios',
    sinRecordatorios: 'No tienes recordatorios próximos',
    activar: 'Activar recordatorio',
    fecha: 'Fecha del recordatorio',
    hora: 'Hora',
    hoy: 'Hoy',
    manana: 'Mañana',
    diasRestantes: (n) => `En ${n} día${n !== 1 ? 's' : ''}`,
    pasado: 'Pasado',
  },

  // Navegación
  nav: {
    inicio: 'Inicio',
    mascotas: 'Mascotas',
    perfil: 'Perfil',
  },

  // Acciones generales
  general: {
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    eliminar: 'Eliminar',
    editar: 'Editar',
    agregar: 'Agregar',
    ver: 'Ver',
    cargando: 'Cargando...',
    error: 'Ocurrió un error',
    exito: '¡Guardado correctamente!',
    confirmar: 'Confirmar',
    volver: 'Volver',
    si: 'Sí',
    no: 'No',
  },
};

export default Strings;
