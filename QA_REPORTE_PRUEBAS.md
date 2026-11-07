# 🧪 Manual y Reporte de Auditoría QA — PawCare v2

Este documento detalla **cómo funciona el proceso de QA Tester** dentro de **PawCare v2**, qué pruebas automatizadas y de flujo se ejecutan sobre cada módulo, el análisis de casos borde (**"¿Qué pasa si...?"**), las **12 mejoras de seguridad/validación aplicadas** y el nuevo **Onboarding interactivo en 5 pasos**.

---

## ⚙️ 1. ¿Cómo funciona nuestro Sistema de QA Tester?

El proceso de aseguramiento de calidad (**QA**) de PawCare se divide en **3 capas complementarias**:

| Capa de Prueba | Comando / Herramienta | ¿Qué evalúa exactamente? |
| :--- | :--- | :--- |
| **1. Suite Automatizada de QA (Lógica + Seguridad)** | `node scripts/qa-runner.mjs` | Ejecuta **19 pruebas automáticas** sobre el código fuente y las funciones de negocio: filtros anti-spam/insultos de la comunidad, regla de auto-ocultamiento a los 3 reportes, bloqueo de multi-reporte por un mismo usuario, validaciones de formularios, ausencia de credenciales quemadas, privacidad en Firestore, limpieza de registros huérfanos y el popup de bienvenida en 5 pasos. |
| **2. Compilación en Seco (Dry-Run Bundle Test)** | `npx expo export --platform android --output-dir .expo-export-test` | Corre el compilador real de Android (**Metro Bundler**) localmente para verificar con **0 errores** que todos los imports, iconos SVG, componentes React Native y rutas de `expo-router` compilen antes de subir cualquier APK a EAS. |
| **3. Auditoría de Casos Borde ("¿Qué pasa si...?")** | Inspección de Flujos E2E | Evalúa qué ocurre cuando dos personas usan el mismo teléfono, cuando se instala en un teléfono nuevo, cuando hay doble registro (Email vs Google), cuando se ingresan datos negativos/erróneos o cuando se borra una mascota con citas pendientes. |

---

## 📊 2. Estado Actual de Ejecución QA (`22 / 22 PASS ✅`)

Al ejecutar `node scripts/qa-runner.mjs` tras aplicar las correcciones y las nuevas características:

- **Total de escenarios auditados:** `22 casos de prueba`
- **Pruebas superadas (`PASS ✅`):** **`22 / 22 (100%)`**
- **Fallos pendientes (`FAIL ❌`):** **`0`**
- **Compilación en seco Android:** **`Metro Bundled 1168 modules (0 errores) ✅`**

---

## ✅ 3. Las Mejoras Aplicadas

### 🔴 Autenticación Nativa de Google y Privacidad Total
1. **`QA-AUTH-06` (Selector Nativo de Cuentas de Google Play Services):**
   - **Archivos:** [`src/services/auth.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/auth.service.js), [`app/(auth)/login.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(auth)/login.jsx), [`app/(auth)/register.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(auth)/register.jsx)
   - **Mejora:** Se integró `@react-native-google-signin/google-signin` conectado con `google-services.json` (`webClientId: 1083580494874-846rcsdpnt68muol44t0p5q7uomptg9v.apps.googleusercontent.com`). Ahora al pulsar "Continuar con Google" en Android, el sistema operativo despliega el selector nativo oficial de Google (igual a apps como Claude) con las cuentas asociadas en el teléfono del usuario, sin filtrar correos de otros teléfonos.
2. **`QA-AUTH-01` (Login limpio sin credenciales fijas):**
   - **Archivo:** [`app/(auth)/login.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(auth)/login.jsx#L21-L22)
   - **Mejora:** Los campos `correo` y `contrasena` ahora inician en blanco (`useState('')`) al instalar la app en cualquier teléfono.
3. **`QA-AUTH-02` y `QA-AUTH-03` (Aislamiento y privacidad entre dispositivos y usuarios):**
   - **Archivo:** [`src/services/auth.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/auth.service.js)
   - **Mejora:** Se eliminaron llamadas globales que exponían cuentas a otros dispositivos y se garantizó aislamiento de sesión por `uid`.

### 💉 Lógica de Vacunas: Pendientes / Agendadas vs Aplicadas
4. **`QA-VAC-01` (Creación en Agenda como Pendiente):**
   - **Archivo:** [`app/(tabs)/reminders.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(tabs)/reminders.jsx)
   - **Mejora:** Programar una vacuna desde Agenda la guarda con `aplicada: false` y `estado: 'pendiente'`. Ya no se guarda como aplicada hoy automáticamente.
5. **`QA-VAC-02` (Diferenciación visual y estado en Home / Perfil):**
   - **Archivos:** [`app/pet/[id]/vaccines.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/[id]/vaccines.jsx), [`src/components/home/QuickActionsGrid.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/home/QuickActionsGrid.jsx), [`app/pet/[id].jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/[id].jsx)
   - **Mejora:**
     - Si una vacuna está agendada para el futuro → muestra badge `⏳ Agendada` y fecha programada.
     - Si la fecha programada ya pasó (ej. eran las 3:00 PM y son las 8:00 PM) → muestra badge `⚠️ Pendiente (Vencida)` en rojo.
     - Cada tarjeta de vacuna pendiente incluye el botón `✓ Confirmar que ya fue aplicada` para actualizarla con 1 toque.
     - En el Home (`QuickActionsGrid`) y Perfil de mascota, **NUNCA** dice "Al día" si hay vacunas pendientes o vencidas; muestra `X pendientes` (en alerta si están vencidas) o `Próx. dd/mm`.

### ✨ Experiencia de Usuario: Onboarding, Notificaciones y Animaciones Modernas
6. **`QA-UI-01` (Bienvenida Única estilo DogCat App):**
   - **Archivos:** [`src/components/common/WelcomeOnboardingModal.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/common/WelcomeOnboardingModal.jsx), [`src/components/home/HomeTopline.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/home/HomeTopline.jsx), [`app/(tabs)/index.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(tabs)/index.jsx)
   - **Mejora:** Se eliminó el wizard de 5 pestañas y el botón `✨` del Home. Ahora el modal es una pantalla única elegante con logo de PawCare, 4 beneficios con iconos vectoriales y botón principal `Comenzar ahora`. Se muestra **solo una vez** en el primer inicio de sesión del usuario.
7. **Permiso de Notificaciones al inicio:**
   - **Archivo:** [`app/(tabs)/index.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(tabs)/index.jsx)
   - **Mejora:** Al cerrar el modal de bienvenida en la primera instalación, la aplicación solicita inmediatamente los permisos nativos de notificaciones al usuario.
8. **Iconos Vectoriales Modernos (`Feather`) y Animaciones:**
   - **Archivos:** [`src/components/home/QuickActionsGrid.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/home/QuickActionsGrid.jsx), [`src/components/home/ReminderHeroCard.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/home/ReminderHeroCard.jsx), [`src/components/home/HomeTopline.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/home/HomeTopline.jsx)
   - **Mejora:** Se reemplazaron emojis rígidos por iconos vectoriales `Feather` estilizados con fondos suaves de color y micro-animaciones elásticas (`Animated.spring`) al presionar cada acceso rápido.

### 🟠 Doble Registro, Comunidad en la Nube, Notificaciones y Huérfanos
4. **`QA-AUTH-05` (Manejo seguro de Doble Registro Email ↔ Google):**
   - **Archivo:** [`src/services/auth.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/auth.service.js#L186-L246)
   - **Mejora:** Se eliminó la creación de sesiones locales simuladas sin token de Firebase. Si un correo fue registrado con contraseña manual y el usuario intenta entrar con el botón de Google, recibe un aviso claro indicando que su cuenta usa contraseña manual.
5. **`QA-COM-05` (Sincronización en la nube de Comunidad y 3 Reportes):**
   - **Archivo:** [`src/services/firestore.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/firestore.service.js#L581-L720)
   - **Mejora:** `obtenerPostsComunidadFirestore()` ahora descarga y combina `collection(db, 'comunidad')`, y cada nuevo post, comentario, like o reporte se sincroniza en Firestore mediante `sincronizarPostComunidadNube()`.
6. **`QA-NOTIF-01` (Limpieza de alarmas al Cerrar Sesión):**
   - **Archivo:** [`src/services/auth.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/auth.service.js#L287-L304)
   - **Mejora:** `cerrarSesion()` ahora ejecuta automáticamente `await cancelarTodosLosRecordatorios()`.
7. **`QA-ORPH-01` (Eliminación en cascada al borrar una mascota):**
   - **Archivo:** [`src/services/firestore.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/firestore.service.js#L187-L227)
   - **Mejora:** Al eliminar una mascota con `eliminarMascotaFirestore(mascotaId)`, se eliminan automáticamente todos sus recordatorios en Agenda, se cancelan sus notificaciones activas y se limpian sus subcolecciones clínicas.

### 🟡 Validaciones de Datos Erróneos y Consistencia
8. **`QA-NOTIF-02` (Respeto al switch de Notificaciones en Mi Perfil):**
   - **Archivo:** [`src/hooks/useReminders.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/hooks/useReminders.js#L16-L38)
   - **Mejora:** Antes de programar una notificación en el sistema, verifica `notificacionesActivas !== false` en el perfil del usuario.
9. **`QA-NOTIF-03` (Sin alarmas falsas al registrar fechas pasadas):**
   - **Archivo:** [`src/services/notifications.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/notifications.js#L65-L71)
   - **Mejora:** Si `segundosRestantes <= 0` (fecha en el pasado), retorna `null` sin disparar una notificación falsa a los 2 segundos.
10. **`QA-VAL-02` (Validación de rangos de Edad y Peso en Mascotas):**
    - **Archivos:** [`app/(tabs)/pets.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(tabs)/pets.jsx#L143-L162) y [`app/pet/[id].jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/%5Bid%5D.jsx#L123-L139)
    - **Mejora:** Bloquea edades negativas o mayores a `40 años` (`480 meses`) y pesos `<= 0` o `> 300 kg`.
11. **`QA-ORPH-02` (Sincronización bidireccional al borrar Vacuna / Medicina / Cita):**
    - **Archivos:** [`src/services/firestore.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/firestore.service.js#L449-L480), [`vaccines.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/%5Bid%5D/vaccines.jsx#L149-L153), [`medications.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/%5Bid%5D/medications.jsx#L149-L153), [`appointments.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/pet/%5Bid%5D/appointments.jsx#L135-L139)
    - **Mejora:** Eliminar una vacuna, medicina o cita desde el perfil de la mascota también elimina su evento asociado en la pestaña `Agenda y citas` y cancela su notificación.
12. **`QA-DATA-01` (Eliminación de teléfono y nombre quemados por defecto):**
    - **Archivos:** [`src/services/auth.service.js`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/services/auth.service.js#L138), [`app/(tabs)/profile.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/app/(tabs)/profile.jsx#L31-L60), [`src/components/pets/EmergencyQRModal.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/pets/EmergencyQRModal.jsx#L19-L34)
    - **Mejora:** Las cuentas nuevas ya no traen el teléfono falso `+505 8888 7777` ni el nombre `"Alejandro Morales"`.

### 🟢 Nueva Experiencia de Bienvenida Interactiva (5 Pasos)
13. **`QA-UI-01` (Popup de Bienvenida paso a paso):**
    - **Archivo:** [`src/components/common/WelcomeOnboardingModal.jsx`](file:///d:/Users/morales.alejandro.CLAROGT/OneDrive%20-%20Claro%20Cenam/4.Orquestaciones/pawcarev2/src/components/common/WelcomeOnboardingModal.jsx)
    - **Mejora:** En lugar de mostrar una lista larga en un solo bloque, ahora guía al usuario en **5 tarjetas resumidas e interactivas** con controles **`← Anterior`**, **`Siguiente →`**, **`Saltar ✕`** y **`¡Comenzar ahora! 🐾`**:
      1. **Paso 1 de 5 (`🐾 El perfil completo de tus mascotas`):** Foto real o emoji, raza, tamaño, color, microchip y cumpleaños.
      2. **Paso 2 de 5 (`💊 Vacunas, desparasitación y medicinas`):** Vacunas, pipetas, gráfica de peso y toma diaria con un toque.
      3. **Paso 3 de 5 (`🩺 Citas, alarmas y seguimiento Vet`):** Recordatorios en el celular, clínica veterinaria y diagnóstico post-consulta.
      4. **Paso 4 de 5 (`▦ Placa QR de collar y Ficha PDF`):** QR directo a tu WhatsApp con dirección de rescate y expediente PDF.
      5. **Paso 5 de 5 (`🗺️ Mapa de servicios y Comunidad`):** Veterinarias, emergencias 24/7 y parques en Google Maps + comunidad moderada.
