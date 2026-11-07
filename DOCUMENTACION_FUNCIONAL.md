# 📘 PawCare — Manual de Funcionamiento, Justificación y Mejoras Implementadas

> **Documento oficial de funcionamiento, alcance funcional y justificación de mejoras para presentación y entrega del proyecto PawCare.**

- **Versión de la Aplicación:** `v1.0.5` (Producción Android / Web)
- **Enlace de Descarga Directa (APK Android):**  
  👉 **[Descargar APK Oficial de PawCare](https://expo.dev/accounts/alejo1717/projects/pawcarev2/builds/512d0474-53a8-4cdf-8508-077d27de955f)**

---

## 📑 Índice del Documento

1. [Propósito y Enfoque de la Aplicación](#1-propósito-y-enfoque-de-la-aplicación)
2. [Justificación de la Documentación Base y Mejoras Aplicadas](#2-justificación-de-la-documentación-base-y-mejoras-aplicadas)
   - [2.1. Cumplimiento de los 4 Bloques de la Documentación Base](#21-cumplimiento-de-los-4-bloques-de-la-documentación-base)
   - [2.2. Justificación de Correcciones y Mejoras de Experiencia de Usuario (UX)](#22-justificación-de-correcciones-y-mejoras-de-experiencia-de-usuario-ux)
3. [Manual de Funcionamiento Paso a Paso (Con Capturas Reales)](#3-manual-de-funcionamiento-paso-a-paso-con-capturas-reales)
   - [Módulo 1: Bienvenida e Inicio](#módulo-1-bienvenida-e-inicio)
   - [Módulo 2: Gestión de Mascotas y Edición de Perfil Físico](#módulo-2-gestión-de-mascotas-y-edición-de-perfil-físico)
   - [Módulo 3: Perfil de Salud y Expediente Clínico](#módulo-3-perfil-de-salud-y-expediente-clínico)
   - [Módulo 4: Vacunas, Desparasitación, Alergias y Cirugías](#módulo-4-vacunas-desparasitación-alergias-y-cirugías)
   - [Módulo 5: Agenda, Recordatorios en Inicio y Notificaciones](#módulo-5-agenda-recordatorios-en-inicio-y-notificaciones)
   - [Módulo 6: Placa QR de Emergencia y Ficha de Salud (PDF)](#módulo-6-placa-qr-de-emergencia-y-ficha-de-salud-pdf)
   - [Módulo 7: Explorar (Servicios en Google Maps y Comunidad)](#módulo-7-explorar-servicios-en-google-maps-y-comunidad)
   - [Módulo 8: Mi Perfil, Modo Oscuro y Configuración de Rescate](#módulo-8-mi-perfil-modo-oscuro-y-configuración-de-rescate)
4. [Guion Sugerido para Demostración en Vivo (5 Minutos)](#4-guion-sugerido-para-demostración-en-vivo-5-minutos)

---

## 1. Propósito y Enfoque de la Aplicación

**PawCare** nace para resolver un problema cotidiano de los tutores de mascotas: la pérdida o dispersión de carnets físicos de vacunación, recetas médicas, fechas de próximas citas, control de peso e información de contacto en caso de extravío.

> **Enfoque clave del proyecto:**  
> PawCare **no reemplaza ni actúa como una clínica veterinaria certificadora**, sino como una **plataforma personal de registro, seguimiento preventivo y protección para el tutor responsable**, facilitando la comunicación con su médico veterinario de confianza y brindando herramientas de respuesta rápida ante emergencias.

---

## 2. Justificación de la Documentación Base y Mejoras Aplicadas

A partir de los requerimientos de la **documentación base** y las revisiones funcionales realizadas sobre los primeros prototipos, se diseñó e implementó una versión integral que cubre el **100% de los módulos solicitados**, añadiendo mejoras técnicas para garantizar rapidez, coherencia de datos y facilidad de uso.

### 2.1. Cumplimiento de los 4 Bloques de la Documentación Base

| Bloque de la Documentación Base | Qué se implementó en la App | Justificación de Diseño |
| :--- | :--- | :--- |
| **1. Perfil de la Mascota**<br>*(Nombre, foto, especie, raza, edad, sexo, fecha de nacimiento, peso, tamaño, color, características físicas, microchip, alergias, historial y datos del dueño)* | Formulario completo de creación y edición adaptable con scroll, soporte para 6 especies, selector de sexo (`♂ Macho` / `♀ Hembra`), edad en años o meses, tamaño (`Pequeño`, `Mediano`, `Grande`), color/pelaje, `N° Microchip / ID` y señas particulares. | Permite que tanto en una consulta veterinaria como en un caso de extravío se cuente con la ficha física e identificativa exacta del animal. |
| **2. Salud y Seguimiento Veterinario**<br>*(Vacunas, desparasitación interna/externa, medicamentos con dosis/frecuencia/duración, citas, diagnóstico post-consulta, cirugías, gráfica de peso y síntomas)* | 5 módulos clínicos especializados dentro del Perfil de Salud + apartado de **Diagnóstico y Seguimiento Post-Consulta** dentro de cada cita médica + confirmación de vacunas agendadas y botón diario *«✓ Ya la tomó hoy»* en medicinas. | Separa claramente el cuidado preventivo (vacunas y desparasitación) de los tratamientos activos (medicinas) y las observaciones médicas post-consulta. |
| **3. Servicios para Dueños**<br>*(Veterinarias cercanas, clínicas de emergencia 24/7, peluquerías, tiendas y parques pet-friendly)* | Pestaña **Explorar → Servicios y Mapa** con tarjetas categorizadas que conectan en un toque con **Google Maps** según la ubicación real del usuario. | En lugar de mostrar un mapa estático con pocos locales fijos, enlazar con el motor de Google Maps garantiza resultados reales, horarios actualizados y navegación GPS inmediata ante una emergencia 24/7. |
| **4. Comunidad y Personalización**<br>*(Múltiples mascotas, temas claro/oscuro, fotografías, calendario de cumpleaños y comunidad de usuarios)* | Soporte multi-mascota ilimitado, **Modo Claro / Oscuro** en toda la app, módulo exclusivo de **Cumpleaños y Fechas Especiales** con cuenta regresiva, y foro de **Comunidad** con categorías, comentarios y moderación automática. | Fomenta el intercambio de consejos y recomendaciones reales entre dueños manteniendo un entorno seguro y libre de spam. |

---

### 2.2. Justificación de Correcciones y Mejoras de Experiencia de Usuario (UX)

Durante la evolución del proyecto se identificaron puntos clave de usabilidad que fueron perfeccionados en esta entrega:

1. **Vinculación 100% Real en Tarjetas de Acceso Rápido («Sin datos» vs. Datos Reales):**
   - *Observación base:* En el prototipo inicial aparecían textos fijos de ejemplo (como *"2 activos"* en medicinas o fechas de citas) aunque el usuario aún no hubiera registrado información.
   - *Mejora aplicada y justificación:* Todas las tarjetas de **Inicio** y del **Perfil de Salud** se conectaron en tiempo real a la base de datos de la mascota seleccionada. Si una mascota recién creada no tiene registros, muestra explícitamente **`Sin datos`**, evitando confusiones al usuario.

2. **Adecuación Legal y Conceptual de la Ficha de Salud (PDF):**
   - *Observación base:* El documento exportable tenía el subtítulo *"Certificado de salud veterinaria"*, cuando la app es un registro gestionado por el dueño y no por una clínica.
   - *Mejora aplicada y justificación:* Se actualizó el encabezado oficial del documento PDF a **`PAWCARE — REGISTRO PERSONAL DE SALUD Y CUIDADO`**, reflejando con exactitud la naturaleza de la aplicación. Además, el PDF ordena cronológicamente los pesajes para mostrar siempre el peso más reciente registrado.

3. **Ingreso y Edición Clara de Edad, Especie, Sexo y Raza:**
   - *Observación base:* No quedaba claro dónde se ingresaba la edad de la mascota, y al cambiar la especie/raza en el perfil debía actualizarse limpiamente sin concatenar textos anteriores.
   - *Mejora aplicada y justificación:* Se incorporó el campo de **Edad (en Años o Meses)** tanto al registrar una mascota como en el modal **Editar a [Mascota]**, junto con selectores visuales de **Especie** y **Sexo**. El modal se diseñó con desplazamiento vertical (*scroll* responsivo) para verse completo en cualquier tamaño de pantalla móvil, y el botón de edición rápida se simplificó con un icono `✏️` limpio.

4. **Carga Instantánea (`0 ms`) sin Parpadeos al Cambiar de Pestañas:**
   - *Observación base:* Al salir o cambiar rápidamente entre las pestañas de *Mascotas*, *Agenda* o *Comunidad*, la información tardaba unos segundos en reaparecer mientras consultaba Internet.
   - *Mejora aplicada y justificación:* Se implementó una **caché en memoria RAM + almacenamiento local (`AsyncStorage`)**. De esta manera, los datos de las mascotas y publicaciones aparecen en **`0 milisegundos`** al cambiar de pestaña, mientras la sincronización con la nube ocurre de forma silenciosa en segundo plano.

5. **Recordatorios con Mascota Asociada, Fecha, Hora, Lugar y Notificación Exacta:**
   - *Observación base:* Al agendar un recordatorio hacía falta identificar claramente a qué mascota registrada pertenecía, mostrar la fecha/hora programada, indicar el lugar/clínica en vacunas o citas y asegurar que la notificación sonara a la hora programada.
   - *Mejora aplicada y justificación:* Cada evento en **Agenda** y en el banner de **Inicio** muestra el **nombre de la mascota registrada**, el **tipo de evento**, la **fecha y hora exacta** (ej. *`Vacuna: Antirrabica · Bobby · 8 nov · 10:00`*) y el lugar de la visita, programando una alarma exacta en el sistema Android (`SCHEDULE_EXACT_ALARM`).

6. **Dirección de Rescate en Perfil y Placa QR de Emergencia:**
   - *Observación base:* Era necesario poder configurar la dirección del tutor en *Mi Perfil* para que apareciera automáticamente en el código QR del collar.
   - *Mejora aplicada y justificación:* En **Mi Perfil** se añadieron los campos **`Teléfono para QR del collar`** y **`Dirección para QR de rescate`**, los cuales se reflejan de inmediato tanto en la tarjeta del **QR de Emergencia** como en la **Ficha PDF**.

7. **Control de Permisos y Moderación en Comunidad:**
   - *Observación base:* Un usuario no debe poder eliminar publicaciones o comentarios escritos por otro perfil; para contenido de terceros solo debe existir la opción de reportar.
   - *Mejora aplicada y justificación:* Se implementó validación estricta por identificador de cuenta (`uid`): **únicamente el autor original** ve el botón `🗑️ Eliminar` en sus publicaciones y comentarios. Cualquier otro usuario ve únicamente la opción `🚩 Reportar`, y al acumular **3 reportes**, el contenido se oculta automáticamente de la comunidad.

---

## 3. Manual de Funcionamiento Paso a Paso (Con Capturas Reales)

### Módulo 1: Bienvenida e Inicio

Al iniciar sesión por primera vez, el usuario recibe una guía visual con los **4 pilares de PawCare**. Posteriormente accede a la pantalla de **Inicio**, desde donde puede registrar su primera mascota y consultar los **6 Accesos Rápidos** (*Vacunas*, *Medicinas*, *Citas*, *Peso*, *QR Collar* y *Ficha PDF*).

| 1. Bienvenida Guiada | 2. Pantalla de Inicio (Estado Inicial) |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114745.jpg" width="280" alt="Bienvenida" /> | <img src="./capturas%20app/IMG_20261107_114802.jpg" width="280" alt="Inicio Claro" /> |
| *Presenta de forma resumida las funciones principales de la aplicación.* | *Muestra el estado inicial limpio («Sin datos») antes de registrar eventos.* |

---

### Módulo 2: Gestión de Mascotas y Edición de Perfil Físico

En la pestaña **Mis mascotas**, el usuario visualiza todas sus mascotas registradas (por ejemplo, **Myssi ♀** y **Bobby ♂**) con su estado de salud, indicador *«En casa»*, botón para subir foto real y accesos directos a su **QR**, **Ficha** y **Perfil de salud**.

Desde el perfil se puede abrir el formulario **Editar mascota**, el cual permite modificar especie, sexo, edad, raza, peso, tamaño, color de pelaje, número de microchip y señas particulares.

| 3. Listado de Mascotas Registradas | 4. Formulario Responsivo de Edición |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114828.jpg" width="280" alt="Mis Mascotas" /> | <img src="./capturas%20app/IMG_20261107_114915.jpg" width="280" alt="Editar a Bobby" /> |
| *Tarjetas individuales por mascota con accesos rápidos a QR, Ficha y Perfil.* | *Edición completa de especie, sexo, edad, tamaño, color y microchip.* |

---

### Módulo 3: Perfil de Salud y Expediente Clínico

Al tocar **Ver perfil** en una mascota, se abre su **Perfil de salud** dividido en bloques claros:
1. **Cabecera y métricas principales:** Peso actual, Edad calculada y Raza.
2. **Gráfica de Evolución de Peso:** Curva histórica de los pesajes registrados.
3. **Cuadro de Identificación y Características:** Resumen de tamaño, pelaje, microchip y señas físicas con el botón rápido `✏️`.
4. **Accesos a QR Collar, Ficha PDF y Cumpleaños/Fechas Especiales.**
5. **Los 5 Módulos de Registros Clínicos:** *Vacunas y Desparasitación*, *Medicamentos y Dosis*, *Citas y Seguimiento Vet*, *Control de Peso* y *Alergias, Cirugías y Síntomas*.

| 5. Perfil de Salud (Parte Superior) | 6. Perfil de Salud (Módulos Clínicos) |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114840.jpg" width="280" alt="Perfil Superior" /> | <img src="./capturas%20app/IMG_20261107_114900.jpg" width="280" alt="Perfil Inferior" /> |
| *Cabecera de Bobby ♂, métricas, gráfica de peso e identificación física (`✏️`).* | *Accesos a QR, Ficha PDF, Cumpleaños y las 5 secciones clínicas.* |

---

### Módulo 4: Vacunas, Desparasitación, Alergias y Cirugías

Dentro de los registros clínicos, el tutor puede:
- **Agendar o registrar vacunas y desparasitaciones (interna o externa):** Cuando una vacuna se programa para una fecha futura (ej. *Antirrábica — Programada: 08/11/2026, 10:00*), aparece con la etiqueta **`⏳ Agendada`** y un botón **`✓ Confirmar que ya fue aplicada`** para pasarla al historial de aplicadas con un solo toque.
- **Documentar Alergias, Dietas, Cirugías y Síntomas:** Organizado en 4 categorías claras para tener todo el antecedente médico listo ante cualquier consulta veterinaria.

| 7. Control de Vacunas y Dosis Agendadas | 8. Alergias, Dietas, Cirugías y Síntomas |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114936.jpg" width="280" alt="Vacunas" /> | <img src="./capturas%20app/IMG_20261107_114925.jpg" width="280" alt="Alergias" /> |
| *Vacuna agendada con fecha, hora exacta y botón de confirmación.* | *Clasificación estructurada de alergias, condiciones, cirugías y síntomas.* |

---

### Módulo 5: Agenda, Recordatorios en Inicio y Notificaciones

Una vez que se programa una vacuna, cita o medicamento:
1. **Se agenda automáticamente una notificación local exacta** en el teléfono para la fecha y hora indicadas.
2. **La pantalla de Inicio se actualiza automáticamente**, mostrando en el banner principal el próximo evento pendiente con el nombre de la mascota, fecha y hora (ej. *`Próximo recordatorio · Mañana — Vacuna: Antirrabica · Bobby · 8 nov · 10:00`*).

<div align="center">
  <img src="./capturas%20app/IMG_20261107_115030.jpg" width="300" alt="Inicio con Recordatorio Activo" />
  <p><i>9. Pantalla de Inicio mostrando a Myssi y Bobby junto con el banner del próximo recordatorio médico programado.</i></p>
</div>

---

### Módulo 6: Placa QR de Emergencia y Ficha de Salud (PDF)

PawCare incluye dos herramientas de protección y portabilidad médica accesibles tanto desde *Inicio* como desde el *Perfil de Salud*:
- **QR de Emergencia (Placa de identificación):** Genera un código QR único para la mascota. Si alguien encuentra a la mascota y escanea el código con la cámara de su celular, se abre **WhatsApp** directamente hacia el número del tutor con su dirección y datos de rescate.
- **Ficha de Salud (PDF):** Genera el resumen clínico oficial con código de identificación (`ID: 50RQED`), datos de la mascota, datos del tutor responsable y resumen de vacunas, medicamentos, citas y control de peso, listo para **compartir o exportar**.

| 10. Placa QR de Emergencia | 11. Ficha de Salud Exportable (PDF) |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114952.jpg" width="280" alt="QR de Emergencia" /> | <img src="./capturas%20app/IMG_20261107_115001.jpg" width="280" alt="Ficha PDF" /> |
| *Código QR escaneable con dirección del tutor y teléfono de emergencia.* | *Expediente resumido listo para enviar al veterinario o imprimir.* |

---

### Módulo 7: Explorar (Servicios en Google Maps y Comunidad)

En la pestaña inferior **Explorar (`🧭`)**, el usuario cuenta con dos apartados:
1. **📍 Servicios y Mapa:** Tarjetas de acceso directo a **Google Maps** para localizar *Veterinarias cercanas*, *Clínicas de Emergencia 24/7*, *Peluquerías caninas*, *Tiendas de mascotas* y *Parques*.
2. **💬 Comunidad:** Espacio interactivo donde los tutores publican y filtran *Consejos*, *Recomendaciones*, *Experiencias* y *Consultas*, dan *Me gusta*, comentan y cuentan con moderación comunitaria segura.

---

### Módulo 8: Mi Perfil, Modo Oscuro y Configuración de Rescate

La aplicación cuenta con **Modo Oscuro nativo** en todas sus pantallas (activable desde el botón de luna/sol en la esquina superior de *Inicio* o desde *Mi Perfil*).  
En la pestaña **Mi perfil**, el tutor verifica su estado de **Sincronización activa en la nube**, activa o desactiva notificaciones y edita en cualquier momento su **Teléfono para QR del collar**, **Dirección para QR de rescate** y los datos de **Mi veterinario**.

| 12. Pantalla de Inicio en Modo Oscuro | 13. Mi Perfil y Preferencias |
| :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114819.jpg" width="280" alt="Inicio Modo Oscuro" /> | <img src="./capturas%20app/IMG_20261107_115404.jpg" width="280" alt="Mi Perfil Modo Oscuro" /> |
| *Interfaz nocturna de alto contraste y descanso visual.* | *Configuración centralizada de cuenta, dirección QR y veterinario.* |

---

## 4. Guion Sugerido para Demostración en Vivo (5 Minutos)

Si van a presentar la aplicación frente a un evaluador, docente o audiencia, se recomienda seguir este flujo de **5 pasos en vivo**:

1. **Minuto 1 — Inicio y Modo Oscuro:** Mostrar la pantalla de *Inicio*, alternar entre Modo Claro y Modo Oscuro con el botón superior para demostrar la adaptabilidad visual y abrir la guía de bienvenida (`✨`).
2. **Minuto 2 — Registro y Edición de Mascota:** Entrar a *Mis mascotas*, mostrar las tarjetas de **Myssi** y **Bobby**, abrir el *Perfil de salud* de Bobby y tocar el botón `✏️` para enseñar cómo se edita la especie, sexo, edad, tamaño y microchip.
3. **Minuto 3 — Agendar una Vacuna y Ver el Recordatorio:** Entrar a *Vacunas y Desparasitación*, mostrar la vacuna *Antirrábica* agendada y regresar a *Inicio* para enseñar cómo el banner principal destaca automáticamente el recordatorio para mañana.
4. **Minuto 4 — QR de Emergencia y Ficha PDF:** Tocar **QR Collar** (incluso escanearlo con otro teléfono en vivo para que vean cómo abre WhatsApp con los datos de rescate) y luego abrir **Ficha PDF** para mostrar el documento clínico exportable.
5. **Minuto 5 — Explorar y Comunidad:** Entrar a *Explorar*, mostrar los accesos directos a emergencias 24/7 en Google Maps y abrir la pestaña *Comunidad* para mostrar la interacción entre usuarios.

