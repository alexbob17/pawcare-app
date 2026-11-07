<div align="center">

# 🐾 PawCare — Plataforma Móvil de Salud y Bienestar para Mascotas

**Aplicación móvil multiplataforma para la gestión integral del expediente clínico, esquema de vacunación, recordatorios inteligentes, placa QR de emergencia y comunidad para tutores de mascotas.**

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-51.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.74.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Platform](https://img.shields.io/badge/Plataforma-Android_%7C_iOS_%7C_Web-2E9E86?style=for-the-badge)](#descarga-e-instalación-apk-android)
[![QA Tests](https://img.shields.io/badge/Pruebas_QA-29_PASS-22C55E?style=for-the-badge)](#calidad-y-pruebas-automatizadas)

<br />

### 📲 [Descargar APK Oficial para Android (v1.0.5 — EAS Build)](https://expo.dev/accounts/alejo1717/projects/pawcarev2/builds/512d0474-53a8-4cdf-8508-077d27de955f)

</div>

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Descarga e Instalación (APK Android)](#-descarga-e-instalación-apk-android)
3. [Galería de Capturas Reales](#-galería-de-capturas-reales)
4. [Características Principales](#-características-principales)
5. [Especificaciones Técnicas](#-especificaciones-técnicas)
6. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
7. [Instalación y Ejecución en Entorno Local](#-instalación-y-ejecución-en-entorno-local)
8. [Calidad y Pruebas Automatizadas](#-calidad-y-pruebas-automatizadas)

---

## 📌 Descripción General

**PawCare** es una solución móvil desarrollada con **React Native y Expo** que permite a los dueños de mascotas centralizar toda la información médica, preventiva y de identificación de sus animales de compañía en un solo lugar.

La aplicación implementa una arquitectura **Offline-First con sincronización en la nube**, garantizando tiempos de respuesta instantáneos (`0 ms` mediante caché en memoria y almacenamiento local persistente) junto con respaldo automático en **Cloud Firestore**.

---

## 📲 Descarga e Instalación (APK Android)

Puedes descargar e instalar directamente la versión compilada para dispositivos Android desde el servidor oficial de **Expo Application Services (EAS)**:

- **Enlace directo de descarga (Build v1.0.5):**  
  👉 **[Descargar PawCare APK en Expo.dev](https://expo.dev/accounts/alejo1717/projects/pawcarev2/builds/512d0474-53a8-4cdf-8508-077d27de955f)**
- **Requisitos del dispositivo:** Android 8.0 (Oreo) o superior.
- **Permisos utilizados:**
  - `POST_NOTIFICATIONS` y `SCHEDULE_EXACT_ALARM`: Para emitir recordatorios locales exactos de vacunas, citas veterinarias y toma de medicamentos.
  - Acceso opcional a Galería/Cámara (`expo-image-picker`): Para personalizar la fotografía de perfil de cada mascota.

---

## 📸 Galería de Capturas Reales

### 1. Bienvenida, Pantalla de Inicio y Tema Oscuro
| Bienvenida Guiada | Inicio (Tema Claro) | Inicio (Tema Oscuro) | Inicio con Recordatorio Activo |
| :---: | :---: | :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114745.jpg" width="200" alt="Bienvenida" /> | <img src="./capturas%20app/IMG_20261107_114802.jpg" width="200" alt="Inicio Claro" /> | <img src="./capturas%20app/IMG_20261107_114819.jpg" width="200" alt="Inicio Oscuro" /> | <img src="./capturas%20app/IMG_20261107_115030.jpg" width="200" alt="Inicio Recordatorio" /> |

### 2. Gestión de Mascotas y Expediente Clínico
| Mis Mascotas | Perfil de Salud (Métricas y Peso) | Perfil de Salud (Módulos Clínicos) | Edición de Mascota |
| :---: | :---: | :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114828.jpg" width="200" alt="Mis Mascotas" /> | <img src="./capturas%20app/IMG_20261107_114840.jpg" width="200" alt="Perfil Salud 1" /> | <img src="./capturas%20app/IMG_20261107_114900.jpg" width="200" alt="Perfil Salud 2" /> | <img src="./capturas%20app/IMG_20261107_114915.jpg" width="200" alt="Editar Mascota" /> |

### 3. Vacunas, Alergias, Placa QR, Ficha PDF y Perfil de Usuario
| Vacunas Programadas | Alergias y Cirugías | QR de Emergencia | Ficha de Salud (PDF) | Mi Perfil (Modo Oscuro) |
| :---: | :---: | :---: | :---: | :---: |
| <img src="./capturas%20app/IMG_20261107_114936.jpg" width="160" alt="Vacunas" /> | <img src="./capturas%20app/IMG_20261107_114925.jpg" width="160" alt="Alergias" /> | <img src="./capturas%20app/IMG_20261107_114952.jpg" width="160" alt="QR Emergencia" /> | <img src="./capturas%20app/IMG_20261107_115001.jpg" width="160" alt="Ficha PDF" /> | <img src="./capturas%20app/IMG_20261107_115404.jpg" width="160" alt="Mi Perfil" /> |

---

## ✨ Características Principales

### 🐾 1. Gestión Multi-Mascota e Identificación Física
- Registro ilimitado de mascotas por cuenta con soporte para **6 especies** (Perro, Gato, Ave/Loro, Conejo, Hámster y Tortuga).
- Avatar dinámico por especie con opción de subir fotografía real desde la galería.
- Ficha técnica completa: **nombre, especie, raza, sexo (`♂ Macho` / `♀ Hembra`), edad en años o meses, peso actual, tamaño (`Pequeño`, `Mediano`, `Grande`), color/pelaje, número de microchip/ID y señas particulares**.

### 🩺 2. Expediente Clínico y Seguimiento Veterinario
- **Vacunas y Desparasitación:** Clasificación por *Vacuna*, *Desparasitación Interna* y *Desparasitación Externa*, programación de próximas dosis y confirmación en un toque cuando una dosis agendada ya fue aplicada.
- **Medicamentos y Dosis:** Registro de dosis prescrita, frecuencia, duración del tratamiento (`5` a `30 días` o `Continuo`) y botón diario **«✓ Ya la tomó hoy»** con contador de tomas.
- **Citas y Seguimiento Post-Consulta:** Agenda de visitas con clínica/veterinario e historial de **Diagnóstico y Seguimiento Post-Consulta** (diagnóstico médico, receta indicada, evolución y fecha de próximo control).
- **Control de Peso con Gráfica Interactiva:** Historial cronológico en kilogramos (`kg`) con curva de evolución SVG.
- **Alergias, Cirugías y Síntomas:** Registro categorizado de alergias alimentarias/ambientales, enfermedades o dietas especiales, cirugías previas y cambios de comportamiento.

### 🔔 3. Agenda y Notificaciones Locales Exactas
- Banner prioritario en la pantalla de **Inicio** que destaca el próximo evento médico programado.
- Programación automática de notificaciones nativas en el dispositivo (`expo-notifications`) en la fecha y hora exacta de cada vacuna, cita o tratamiento.

### 🆔 4. Placa QR de Emergencia y Ficha de Salud (PDF)
- **QR de Emergencia para el Collar:** Genera un código QR único que, al ser escaneado con cualquier cámara móvil, abre WhatsApp directamente hacia el número del tutor con un mensaje prellenado, dirección de rescate e identificación de la mascota.
- **Ficha de Salud Exportable (PDF):** Resumen clínico estructurado con código de registro único, datos del tutor responsable, características físicas e historial médico listo para compartir o imprimir.

### 🗺️ 5. Servicios Cercanos, Comunidad y Personalización
- **Servicios y Mapa (`Explorar`):** Accesos directos geolocalizados en Google Maps para buscar *Veterinarias cercanas*, *Emergencias 24/7*, *Peluquerías*, *Tiendas de mascotas* y *Parques*.
- **Comunidad con Moderación Automática:** Foro interactivo dividido en *Consejos*, *Recomendaciones*, *Experiencias* y *Consultas*, con validación anti-spam, control de autoría para eliminación y ocultamiento automático al acumular 3 reportes.
- **Cumpleaños y Fechas Especiales:** Módulo dedicado con cuenta regresiva anual y bitácora de recuerdos de la mascota.
- **Modo Claro y Modo Oscuro Nativo:** Tema visual adaptable en tiempo real y persistente en el dispositivo.

---

## 🛠️ Especificaciones Técnicas

| Componente | Tecnología / Librería | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework Base** | Expo SDK / React Native | `~51.0.28` / `0.74.5` | Desarrollo móvil nativo multiplataforma |
| **Enrutamiento** | Expo Router | `~3.5.23` | Navegación declarativa basada en archivos (`app/`) |
| **Autenticación** | Firebase Auth + Google Sign-In | `^10.13.0` / `^13.1.0` | Inicio de sesión con Email/Password y Google OAuth nativo |
| **Base de Datos Nube** | Cloud Firestore | `^10.13.0` | Sincronización de perfiles, mascotas, registros clínicos y comunidad |
| **Persistencia Local** | AsyncStorage + RAM Cache | `1.23.1` | Arquitectura *Offline-First* con lectura en `0 ms` |
| **Notificaciones** | Expo Notifications | `~0.28.19` | Alertas locales programadas con canal prioritario Android |
| **Gráficos Vectoriales** | React Native SVG | `15.2.0` | Iconografía propia y gráfica interactiva de evolución de peso |
| **Multimedia** | Expo Image Picker & Manipulator | `~15.1.0` | Captura y optimización de fotografías de mascotas |
| **Pruebas** | Jest / Testing Library / QA Runner | `^29.7.0` | Pruebas unitarias y verificación estática/funcional |

---

## 🏗️ Arquitectura del Proyecto

```text
pawcarev2/
├── app/                              # Rutas y pantallas (Expo Router v3)
│   ├── _layout.jsx                   # Layout raíz, proveedores de contexto y AuthGate
│   ├── (auth)/                       # Flujo de autenticación
│   │   ├── login.jsx                 # Inicio de sesión (Correo y Google nativo)
│   │   └── register.jsx              # Creación de cuenta
│   ├── (tabs)/                       # Navegación principal de 5 pestañas
│   │   ├── index.jsx                 # Inicio: carrusel de mascotas, próximo aviso y accesos rápidos
│   │   ├── pets.jsx                  # Mis Mascotas: listado, creación y accesos a QR/PDF
│   │   ├── reminders.jsx             # Agenda: calendario de eventos médicos con filtros
│   │   ├── explore.jsx               # Explorar: directorio hacia Google Maps y Comunidad
│   │   └── profile.jsx               # Mi Perfil: tema oscuro, datos de rescate QR y veterinario
│   └── pet/[id]/                     # Expediente clínico por mascota
│       ├── index.jsx                 # Perfil de salud, gráfica de peso y edición completa
│       ├── vaccines.jsx              # Vacunas y desparasitación interna/externa
│       ├── medications.jsx           # Medicamentos, dosis y control de toma diaria
│       ├── appointments.jsx          # Citas veterinarias y diagnóstico post-consulta
│       ├── weight.jsx                # Historial cronológico de peso
│       └── health.jsx                # Alergias, dietas, cirugías y síntomas
├── src/
│   ├── components/                   # Componentes modulares reutilizables
│   │   ├── auth/                     # Selector y flujo de acceso con Google
│   │   ├── common/                   # Iconos SVG, Splash animado y Modal de Bienvenida
│   │   ├── home/                     # Cabecera, carrusel, tarjeta hero y cuadrícula 3x2
│   │   ├── pet-profile/              # Cabecera de salud y gráfica SVG de peso
│   │   └── pets/                     # Modales de QR de Emergencia, Ficha PDF y Cumpleaños
│   ├── constants/                    # Paleta de colores, especies y textos base
│   ├── hooks/                        # Custom Hooks (useAuth, usePets, useReminders, useTheme)
│   ├── services/                     # Capa de datos (Firebase, Firestore Offline-First, Notificaciones)
│   └── utils/                        # Formateadores de fechas, cálculo de edades y diálogos
├── assets/                           # Iconos de aplicación y recursos estáticos
├── capturas app/                     # Capturas de pantalla reales de la aplicación en producción
└── app.json                          # Configuración de compilación Expo / Android / iOS
```

---

## 🚀 Instalación y Ejecución en Entorno Local

### 1. Prerrequisitos
- **Node.js** `v18+` instalado.
- **npm** o **yarn**.
- Dispositivo físico Android/iOS con **Expo Go** o un emulador configurado.

### 2. Clonar el repositorio e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd pawcarev2
npm install
```

### 3.Variables de Entorno / Configuración Firebase
La aplicación se conecta a Firebase a través de `src/services/firebase.js`. Si deseas conectarla a tu propio proyecto de Firebase en un entorno de desarrollo independiente, configura tus credenciales públicas de cliente web de Firebase (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### 4. Ejecutar el servidor de desarrollo
```bash
# Iniciar Metro Bundler
npx expo start

# Ejecutar directamente en Android
npm run android

# Ejecutar en navegador Web
npm run web
```

---

## 🧪 Calidad y Pruebas Automatizadas

El proyecto cuenta con pruebas automatizadas para validar utilidades de fechas, constantes de especies, servicios de datos y flujos críticos de interfaz:

```bash
# Ejecutar suite de pruebas unitarias con Jest
npm test

# Ejecutar script de verificación integral QA (29 comprobaciones)
node scripts/qa-runner.mjs
```

---

<div align="center">
  <b>Desarrollado con dedicación para el cuidado y bienestar de las mascotas 🐾</b>
</div>
