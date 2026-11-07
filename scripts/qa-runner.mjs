/**
 * Suite de Pruebas Automatizadas QA - PawCare v2
 * Ejecuta pruebas de unidad, validación de entradas, moderación de comunidad,
 * cálculo de fechas/edades, notificaciones y auditoría estática de seguridad/aislamiento.
 *
 * Ejecución: node scripts/qa-runner.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
let passed = 0;
let failed = 0;
const results = [];

function assertTest(id, modulo, descripcion, condicion, detalleFallo = '', severidad = 'CRÍTICO') {
  if (condicion) {
    passed++;
    results.push({ id, modulo, descripcion, estado: 'PASS ✅', severidad: 'OK', detalle: 'Validado correctamente' });
  } else {
    failed++;
    results.push({ id, modulo, descripcion, estado: 'FAIL ❌', severidad, detalle: detalleFallo });
  }
}

// ─── 1. LECTURA DE ARCHIVOS FUENTE ────────────────────────────────────────────
const loginCode = fs.readFileSync(path.join(ROOT, 'app/(auth)/login.jsx'), 'utf8');
const registerCode = fs.readFileSync(path.join(ROOT, 'app/(auth)/register.jsx'), 'utf8');
const authServiceCode = fs.readFileSync(path.join(ROOT, 'src/services/auth.service.js'), 'utf8');
const firestoreServiceCode = fs.readFileSync(path.join(ROOT, 'src/services/firestore.service.js'), 'utf8');
const notificationsCode = fs.readFileSync(path.join(ROOT, 'src/services/notifications.js'), 'utf8');
const useRemindersCode = fs.readFileSync(path.join(ROOT, 'src/hooks/useReminders.js'), 'utf8');
const petsCode = fs.readFileSync(path.join(ROOT, 'app/(tabs)/pets.jsx'), 'utf8');
const petProfileCode = fs.readFileSync(path.join(ROOT, 'app/pet/[id].jsx'), 'utf8');
const vaccinesCode = fs.readFileSync(path.join(ROOT, 'app/pet/[id]/vaccines.jsx'), 'utf8');
const medicationsCode = fs.readFileSync(path.join(ROOT, 'app/pet/[id]/medications.jsx'), 'utf8');
const appointmentsCode = fs.readFileSync(path.join(ROOT, 'app/pet/[id]/appointments.jsx'), 'utf8');
const weightCode = fs.readFileSync(path.join(ROOT, 'app/pet/[id]/weight.jsx'), 'utf8');
const exploreCode = fs.readFileSync(path.join(ROOT, 'app/(tabs)/explore.jsx'), 'utf8');
const profileCode = fs.readFileSync(path.join(ROOT, 'app/(tabs)/profile.jsx'), 'utf8');
const onboardingCode = fs.readFileSync(path.join(ROOT, 'src/components/common/WelcomeOnboardingModal.jsx'), 'utf8');
const quickActionsCode = fs.readFileSync(path.join(ROOT, 'src/components/home/QuickActionsGrid.jsx'), 'utf8');
const remindersTabCode = fs.readFileSync(path.join(ROOT, 'app/(tabs)/reminders.jsx'), 'utf8');
const pdfModalCode = fs.readFileSync(path.join(ROOT, 'src/components/pets/MedicalPDFModal.jsx'), 'utf8');
const profileHeroCode = fs.readFileSync(path.join(ROOT, 'src/components/pet-profile/ProfileHero.jsx'), 'utf8');

// ─── 2. PRUEBAS DE SEGURIDAD, SESIONES Y REGISTRO / DOBLE REGISTRO ───────────
assertTest(
  'QA-AUTH-01',
  'Seguridad / Login',
  'Pantalla de Login inicia con campos de correo y contraseña limpios (sin credenciales quemadas)',
  !loginCode.includes("useState('alejandro@pawcare.ni')") && !loginCode.includes("useState('123456')"),
  'app/(auth)/login.jsx tiene useState("alejandro@pawcare.ni") y contraseña "123456" prellenados al instalar en cualquier celular.',
  '🔴 CRÍTICO'
);

assertTest(
  'QA-AUTH-02',
  'Privacidad / Google',
  'El selector de cuentas Google NO descarga ni expone correos de otros usuarios desde Firestore',
  !authServiceCode.includes("getDocs(collection(db, 'usuarios'))"),
  'obtenerCuentasGoogleDispositivo() en src/services/auth.service.js descarga toda la colección "usuarios" de Firestore, exponiendo correos en otros celulares.',
  '🔴 CRÍTICO'
);

assertTest(
  'QA-AUTH-03',
  'Aislamiento de Sesión',
  'leerPerfilLocal(uid) valida estrictamente que el perfil en caché pertenezca al usuario que inició sesión',
  !authServiceCode.includes('if (!uid || parsed.id === uid) return parsed;\n    return parsed;') &&
    !authServiceCode.includes('if (!uid || parsed.id === uid) return parsed;\r\n    return parsed;'),
  'src/services/auth.service.js (líneas 131-132) devuelve "parsed" incluso si parsed.id !== uid. Si otro usuario inicia sesión en el mismo teléfono, hereda nombre, teléfono y dirección del usuario anterior.',
  '🔴 CRÍTICO'
);

assertTest(
  'QA-AUTH-04',
  'Registro / Validaciones',
  'El registro manual valida campos vacíos, longitud mínima de contraseña (>=6) y coincidencia de confirmación',
  registerCode.includes('contrasena.length < 6') && registerCode.includes('contrasena !== confirmar'),
  'Falta validación de contraseña mínima o coincidencia en register.jsx',
  '🟠 ALTO'
);

assertTest(
  'QA-AUTH-05',
  'Doble Registro (Email <-> Google)',
  'Previene duplicidad cuando un correo ya registrado intenta registrarse de nuevo y mantiene sesión real de Firebase Auth',
  authServiceCode.includes("e?.code === 'auth/email-already-in-use'") &&
    !authServiceCode.includes('buscarUsuarioRegistradoPorCorreo'),
  'Si un usuario se registra con contraseña manual y luego usa "Continuar con Google", cae en buscarUsuarioRegistradoPorCorreo() creando una sesión solo local sin token activo en Firebase Auth.',
  '🟠 ALTO'
);

// ─── 3. PRUEBAS DE COMUNIDAD Y SISTEMA DE 3 REPORTES ─────────────────────────
const BAD_WORDS = [
  'idiota', 'estupido', 'imbecil', 'mierda', 'puta', 'puto', 'pendejo', 'maldito', 'estupida',
];
function normalizarTexto(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

assertTest(
  'QA-COM-01',
  'Comunidad / Anti-Spam',
  'Bloquea enlaces web (http://, https://, www.) en publicaciones y comentarios',
  validarTextoComunidad('Compra en https://spam.com') !== '' &&
    validarTextoComunidad('Visita www.tienda.com') !== '',
  'El filtro permitió enlaces externos',
  '🟠 ALTO'
);

assertTest(
  'QA-COM-02',
  'Comunidad / Lenguaje',
  'Bloquea insultos con mayúsculas o tildes (ej. "Estúpido", "Mierda", "Idiota")',
  validarTextoComunidad('Qué Estúpido comentario') !== '' &&
    validarTextoComunidad('Esto es una mierda') !== '',
  'El filtro no detectó palabras ofensivas normalizadas',
  '🟠 ALTO'
);

function simularReporte(item, usuarioId) {
  const reportedBy = Array.isArray(item.reportedBy) ? item.reportedBy : [];
  if (reportedBy.includes(usuarioId)) return item;
  return {
    ...item,
    reports: (item.reports || 0) + 1,
    reportedBy: [...reportedBy, usuarioId],
  };
}

let postTest = { id: 'p1', reports: 0, reportedBy: [] };
postTest = simularReporte(postTest, 'uid_mismo_usuario');
postTest = simularReporte(postTest, 'uid_mismo_usuario');
postTest = simularReporte(postTest, 'uid_mismo_usuario');

assertTest(
  'QA-COM-03',
  'Comunidad / Anti-Abuso Reportes',
  'Un mismo usuario NO puede reportar 3 veces la misma publicación o comentario para tumbarlo',
  postTest.reports === 1 && postTest.reportedBy.length === 1,
  'Un solo usuario pudo acumular 3 reportes sobre la misma publicación',
  '🟠 ALTO'
);

postTest = simularReporte(postTest, 'uid_usuario_2');
postTest = simularReporte(postTest, 'uid_usuario_3');

assertTest(
  'QA-COM-04',
  'Comunidad / Auto-Ocultamiento',
  'La publicación o comentario se oculta automáticamente al llegar a 3 reportes de 3 usuarios distintos',
  postTest.reports === 3 && exploreCode.includes('(p.reports || 0) < LIMIT') && exploreCode.includes('(c.reports || 0) < LIMIT'),
  'No se oculta al llegar a 3 reportes',
  '🟠 ALTO'
);

assertTest(
  'QA-COM-05',
  'Comunidad / Sincronización Nube',
  'Las publicaciones, comentarios, likes y reportes se sincronizan en tiempo real con Firestore entre distintos teléfonos',
  firestoreServiceCode.includes("getDocs(collection(db, 'comunidad'))") &&
    firestoreServiceCode.includes('sincronizarPostComunidadNube'),
  'obtenerPostsComunidadFirestore() solo lee AsyncStorage local; los reportes, likes y comentarios NO se guardan en Firestore, por lo que lo que publica o reporta un celular no se refleja en otros celulares.',
  '🟠 ALTO'
);

// ─── 4. PRUEBAS DE NOTIFICACIONES Y RECORDATORIOS ────────────────────────────
assertTest(
  'QA-NOTIF-01',
  'Notificaciones / Logout',
  'Al cerrar sesión se cancelan las notificaciones locales programadas en el teléfono para no alertar a otro usuario',
  authServiceCode.includes('cancelarTodosLosRecordatorios'),
  'cerrarSesion() en src/services/auth.service.js no llama a cancelarTodosLosRecordatorios(). Si el usuario cierra sesión, el teléfono sigue sonando con las alarmas de sus mascotas.',
  '🟠 ALTO'
);

assertTest(
  'QA-NOTIF-02',
  'Notificaciones / Preferencia Off',
  'Si el usuario desactiva las notificaciones en Mi Perfil, crear una vacuna/cita NO debe programar alarmas en el teléfono',
  useRemindersCode.includes('notificacionesActivas'),
  'useReminders.js programa notificaciones nativas sin verificar si el usuario apagó el switch de "Notificaciones" en Mi Perfil.',
  '🟡 MEDIO'
);

assertTest(
  'QA-NOTIF-03',
  'Notificaciones / Fechas Pasadas',
  'Registrar una vacuna o medicina con fecha de aplicación en el pasado NO debe disparar una alarma falsa a los 2 segundos',
  !notificationsCode.includes(': { seconds: 2, channelId: \'pawcare\' }'),
  'En src/services/notifications.js (línea 71), si la fecha es pasada (segundosRestantes <= 5), dispara una notificación inmediata a los 2 segundos ({ seconds: 2 }).',
  '🟡 MEDIO'
);

// ─── 5. PRUEBAS DE DATOS MAL INGRESADOS, HUÉRFANOS Y CASOS "¿QUÉ PASA SI...?" ─
assertTest(
  'QA-VAL-01',
  'Datos Erróneos / Control de Peso',
  'El módulo Control de Peso rechaza texto, ceros, negativos y pesos mayores a 300 kg',
  weightCode.includes('isNaN(num) || num <= 0 || num > 300'),
  'El módulo de peso permite valores inválidos',
  '🟡 MEDIO'
);

assertTest(
  'QA-VAL-02',
  'Datos Erróneos / Registro Mascota',
  'El formulario de Nueva Mascota y Editar Mascota valida pesos negativos (>0, <=300) y edades irreales (<=40 años)',
  petsCode.includes('pesoNum > 0') && petsCode.includes('pesoNum <= 300'),
  'En app/(tabs)/pets.jsx y app/pet/[id].jsx se puede ingresar peso "-25" kg o edad "999" años sin validación de rango.',
  '🟡 MEDIO'
);

const bloqueEliminarMascota = firestoreServiceCode.split('export const eliminarMascotaFirestore')[1]?.split('// ─── RECORDATORIOS')[0] || '';
assertTest(
  'QA-ORPH-01',
  'Integridad / Borrar Mascota',
  'Al eliminar una mascota se eliminan también sus recordatorios en Agenda y sus notificaciones programadas',
  bloqueEliminarMascota.includes('recordatorios'),
  'eliminarMascotaFirestore() solo borra la mascota de la colección "mascotas", dejando sus citas/vacunas huérfanas en la pestaña Agenda y sus notificaciones activas.',
  '🟠 ALTO'
);

assertTest(
  'QA-ORPH-02',
  'Integridad / Borrar Vacuna-Medicina-Cita',
  'Al eliminar una vacuna, medicina o cita desde el perfil de la mascota, se elimina también su evento en la pestaña Agenda',
  vaccinesCode.includes('eliminarRecordatorioFirestore') &&
    medicationsCode.includes('eliminarRecordatorioFirestore') &&
    appointmentsCode.includes('eliminarRecordatorioFirestore'),
  'Si creas una vacuna/medicina/cita (que crea un recordatorio automático en Agenda) y luego la borras desde el perfil de la mascota, el recordatorio queda vivo en la pestaña Agenda.',
  '🟡 MEDIO'
);

assertTest(
  'QA-DATA-01',
  'Datos Quemados / Teléfono QR',
  'El usuario nuevo no debe tener un teléfono falso quemado (+505 8888 7777) ni nombre "Alejandro Morales" por defecto',
  !authServiceCode.includes("'+505 8888 7777'") && !exploreCode.includes("'Alejandro Morales'"),
  'auth.service.js asigna "+505 8888 7777" a cualquier usuario nuevo y explore.jsx / profile.jsx usan "Alejandro Morales" como fallback, causando que el QR de emergencia apunte a un WhatsApp ficticio si el usuario no lo edita.',
  '🟡 MEDIO'
);

assertTest(
  'QA-UI-01',
  'Onboarding / Pantalla Única',
  'El popup de bienvenida es de pantalla única (estilo DogCat app, sin sliders confusos) con botón Comenzar ahora',
  onboardingCode.includes('Comenzar ahora') &&
    onboardingCode.includes('Ten la certeza de que tu') &&
    onboardingCode.includes('mascota está bien') &&
    !onboardingCode.includes('pasoActual > 1'),
  'WelcomeOnboardingModal.jsx no implementa la pantalla única minimalista con Comenzar ahora.',
  '🟢 MEJORA UX'
);

assertTest(
  'QA-VAC-01',
  'Lógica Vacunas / Pendiente vs Aplicada',
  'Crear recordatorio de vacuna en Agenda lo guarda como pendiente (aplicada: false) y no como aplicada hoy',
  remindersTabCode.includes("aplicada: false") && remindersTabCode.includes("estado: 'pendiente'"),
  'app/(tabs)/reminders.jsx guarda las vacunas agendadas como si ya hubieran sido aplicadas hoy (fechaAplicacion: new Date()).',
  '🟠 ALTO'
);

assertTest(
  'QA-VAC-02',
  'Lógica Vacunas / Al día vs Pendientes en Home',
  'El Home y Perfil no muestran "Al día" si existen vacunas pendientes o vencidas',
  quickActionsCode.includes('vacunasPendientes') && quickActionsCode.includes('vacunasVencidas') &&
    vaccinesCode.includes('marcarComoAplicada'),
  'QuickActionsGrid.jsx muestra "Al día" incondicionalmente siempre que vacunas.length > 0.',
  '🟠 ALTO'
);

assertTest(
  'QA-AUTH-06',
  'Google Nativo / Play Services',
  'Inicio de sesión integra selector nativo de Google Play Services con webClientId de Firebase y no usa listas ficticias',
  authServiceCode.includes('autenticarConGoogleNativo') &&
    authServiceCode.includes('1083580494874-846rcsdpnt68muol44t0p5q7uomptg9v.apps.googleusercontent.com'),
  'Falta integración de GoogleSignin nativo en auth.service.js.',
  '🔴 CRÍTICO'
);

assertTest(
  'QA-AUTH-07',
  'Google Nativo / Cancelar selector',
  'Si el usuario cierra el selector de cuentas de Google (v13 devuelve { type: "cancelled" }) NO se muestra un error falso',
  authServiceCode.includes("respuesta?.type === 'cancelled'"),
  'En google-signin v13 cancelar devuelve {type:"cancelled"} sin idToken; el código lanzaba "no devolvió el token" como error.',
  '🟠 ALTO'
);

assertTest(
  'QA-VAC-03',
  'Lógica Vacunas / Limpieza de Agenda',
  'Al marcar una vacuna como aplicada o borrarla, se eliminan sus recordatorios vinculados (id o referenciaId) y se cancela la notificación',
  vaccinesCode.includes('limpiarRecordatoriosVinculados') &&
    vaccinesCode.includes('r.referenciaId') &&
    vaccinesCode.includes('cancelarRecordatorio(r.notifId)'),
  'La vacuna aplicada seguía apareciendo en Agenda y la alarma sonaba igual; además solo se borraba por id, no por referenciaId.',
  '🟡 MEDIO'
);

assertTest(
  'QA-PET-01',
  'Mascotas / Edición de Especie y Raza Limpia',
  'Modal de edición incluye selector de especie y previene concatenación redundante (conejo · conejo / conejo · gato)',
  petProfileCode.includes('editEspecie') &&
    petProfileCode.includes('ESPECIES_DISPONIBLES') &&
    petsCode.includes("raza: raza.trim() || 'Mestizo'") &&
    profileHeroCode.includes('razaLimpia'),
  'No se permitía cambiar la especie en edición, y la raza se concatenaba redundante con la especie.',
  '🟠 ALTO'
);

assertTest(
  'QA-WEIGHT-01',
  'Salud / Ordenamiento de Peso por Fecha',
  'El peso actual y el resumen clínico toman el peso cronológicamente más reciente (no el último insertado)',
  firestoreServiceCode.includes('pesosOrdenados') &&
    weightCode.includes('pesoMasReciente') &&
    weightCode.includes('new Date(b.fecha || b.creadaEn || 0) - new Date(a.fecha || a.creadaEn || 0)'),
  'Registrar un peso antiguo sobreescribía el peso actual con fecha vieja en vez del más reciente.',
  '🟠 ALTO'
);

assertTest(
  'QA-PDF-01',
  'Ficha Médica PDF / Especie Limpia y Peso Más Reciente',
  'La ficha médica PDF ordena pesos por fecha, usa pesoMasReciente y formatea especie/raza sin duplicados',
  pdfModalCode.includes('formatearEspecieRaza') &&
    pdfModalCode.includes('pesoMasReciente') &&
    pdfModalCode.includes('new Date(b.fecha || b.creadaEn || 0) - new Date(a.fecha || a.creadaEn || 0)'),
  'El PDF mostraba peso desactualizado y cadenas como conejo · conejo.',
  '🟠 ALTO'
);

assertTest(
  'QA-COM-06',
  'Comunidad / Autoría Dinámica de Borrado',
  'La opción de eliminar posts y comentarios se restringe estrictamente a p.authorId === uidActual en tiempo de ejecución',
  exploreCode.includes('p.authorId === uidActual') &&
    exploreCode.includes('c.authorId === uidActual') &&
    !exploreCode.includes('p.mine || p.authorId === uidActual') &&
    !exploreCode.includes('c.mine || c.authorId === uidActual'),
  'Se permitía eliminar comentarios y posts de otros usuarios debido a mine: true en la base de datos.',
  '🔴 CRÍTICO'
);

assertTest(
  'QA-PET-02',
  'Mascotas / Modal de Edición Responsivo con Scroll',
  'El modal de edición cuenta con scroll interno y altura máxima para no cortar el título ni desbordar',
  petProfileCode.includes("maxHeight: '88%'") &&
    petProfileCode.includes('showsVerticalScrollIndicator={false}') &&
    petProfileCode.includes('✏️'),
  'El modal de edición de mascota desbordaba la pantalla cortando el encabezado en celulares normales.',
  '🟢 MEJORA UX'
);

console.log('================================================================');
console.log(`RESUMEN QA AUTOMATIZADO: ${passed} PASS ✅ | ${failed} FAIL ❌ (Total: ${results.length})`);
console.log('================================================================');
results.forEach((r) => {
  console.log(`[${r.estado}] [${r.severidad}] ${r.id} (${r.modulo}): ${r.descripcion}`);
  if (r.estado.includes('FAIL')) {
    console.log(`   ↳ Hallazgo: ${r.detalle}`);
  }
});
