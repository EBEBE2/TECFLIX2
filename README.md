# 🎬 TECFLIX - Plataforma de Streaming de Video Full-Stack

**TECFLIX** es una plataforma moderna de streaming de video inspirada en Netflix, construida con arquitectura full-stack modular (**Node.js, Express, PostgreSQL, Google Cloud Storage, React, Vite y Tailwind CSS**). Cuenta con una identidad visual en morado oscuro, violeta profundo y acentos de neón de alto contraste.

---

## 📁 1. Estructura del Proyecto

El proyecto está organizado de manera modular y limpia en:
`C:\Users\eve_a\Downloads\Agosto2026 -Enero2027\SIMON\TECFLIX`

```text
TECFLIX/
├── .vscode/                     # Configuración y tareas para Visual Studio Code
│   ├── settings.json            # Ajustes de formateo y conexión PostgreSQL
│   └── tasks.json               # Tareas de PowerShell para arranque en 1 clic
├── backend/                     # API RESTful (Node.js + Express)
│   ├── src/
│   │   ├── config/              # Conexión a PostgreSQL (db.js) e inicializador (initDb.js)
│   │   ├── controllers/         # Lógica de Auth, Videos, Perfiles, Facturación y Categorías
│   │   ├── middleware/          # JWT Auth Guard y validación de roles
│   │   ├── routes/              # Enrutadores API (/api/auth, /api/videos, etc.)
│   │   ├── services/            # Servicio Google Cloud Storage y Local fallback
│   │   └── server.js            # Punto de entrada Express
│   ├── uploads/                 # Almacenamiento local de videos y miniaturas
│   ├── package.json
│   └── .env                     # Variables de entorno del backend
├── frontend/                    # Cliente Web (React 18 + Vite + Tailwind CSS)
│   ├── public/
│   │   └── videos/              # Video de intro estilo Netflix (intro.mp4)
│   ├── src/
│   │   ├── components/          # IntroScreen, Navbar, Player, Skins, Billing, Studio, Auth
│   │   ├── context/             # AuthContext (Sesión, Perfil activo, Suscripción)
│   │   ├── pages/               # HomePage con Hero Banner y Carrousels
│   │   ├── services/            # Cliente HTTP api.js
│   │   ├── styles/              # CSS de Tailwind y animaciones de marcos de skin
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── database/                    # Scripts de Base de Datos PostgreSQL
│   ├── schema.sql               # Esquema DDL de tablas, índices y restricciones
│   └── seed.sql                 # Datos iniciales (usuarios, videos, skins, tarjetas)
├── install-all.ps1              # Script PowerShell para instalar dependencias
├── setup-database.ps1           # Script PowerShell para inicializar PostgreSQL
├── start-all.ps1                # Script PowerShell para arrancar Backend y Frontend
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore
└── README.md                    # Documentación técnica completa
```

---

## 🎨 2. Identidad Visual y Experiencia de Intro

- **Paleta de Colores:**
  - Fondo espacial: `#080312` y `#120726` (Morado oscuro / carbón)
  - Superficies y tarjetas: `#16092d` y `#1d0c3d` (Violeta profundo)
  - Bordes y líneas: `#3b1875`
  - Acentos de neón: `#a855f7` (Neón Violeta), `#c084fc` (Glow Neón), `#8b5cf6` (Púrpura Eléctrico)
- **Intro tipo Netflix en Video:**
  - Al abrir la aplicación se reproduce un video cinemático (`frontend/public/videos/intro.mp4`) acompañado de un acorde de sintetizador espacial generado con Web Audio API.
  - Incluye botón **"Saltar intro"** en la esquina inferior derecha y control de audio.
  - Al concluir o saltar, navega a la pantalla de autenticación con selector de rol o al catálogo principal si ya existe una sesión activa.

---

## 👥 3. Roles, Accesos y Contraseñas Separadas

La autenticación está estrictamente dividida por rol, cada uno con credenciales y contraseñas independientes:

### 🌟 Creador de Contenido (`role = 'creator'`)
- Portal propio para login y registro de creadores.
- Acceso a **Creator Studio**:
  - Subida de videos a **Google Cloud Storage** con metadata en PostgreSQL.
  - Gestión de videos propios publicados y conteo de visualizaciones en tiempo real.
  - Configuración de tarjeta de débito o crédito para liquidación de regalías ($0.05 USD por reproducción).

### 🍿 Suscriptor / Espectador (`role = 'subscriber'`)
- Portal propio para login y registro de espectadores.
- Acceso al catálogo completo de streaming con Hero Banner interactivo y carrousels.
- Selector de perfiles familiares y personalizador de skins.
- Reproductor de video cinema con controles personalizados.
- Panel de suscripción y registro de tarjetas de crédito/débito.

---

## 🎭 4. Perfiles y Skins de Perfil

Cada cuenta puede tener múltiples perfiles (por ejemplo: "Principal", "Pekes Kids", etc.).
- **Catálogo de Skins Oficiales:**
  - *Violeta Neón Imperial* (Borde morado brillante con pulso)
  - *Matriz Cuántica Cian* (Efecto resplandor cian)
  - *Corona Dorada VIP* (Acento dorado de lujo)
  - *Llama Carmesí Estelar* (Neón rojo fuego)
  - *Nebulosa Holográfica* (Gradiente animado multicolor)
  - *Sombra Obsidiana* (Estilo minimalista oscuro)
- **Creador de Skins Personalizadas:**
  - Los usuarios pueden crear sus propias skins seleccionando su avatar favorito, estilo de marco, color de glow neón interactivo y nombre personalizado. Se guarda en la base de datos y se aplica inmediatamente.

---

## ☁️ 5. Subida y Almacenamiento en Google Cloud Storage

- Backend integrado con `@google-cloud/storage`.
- Los videos subidos desde el Creator Studio se envían a través de `POST /api/videos/upload`.
- **Modo Híbrido:**
  - Si se proporciona un archivo de credenciales de Google Cloud (`GCS_KEY_FILE` o `GOOGLE_APPLICATION_CREDENTIALS`), los videos se transfieren al bucket de Google Cloud Storage.
  - Si se trabaja en entorno local sin credenciales en la nube, opera con fallback local en `backend/uploads/` con soporte nativo de **HTTP Range Requests** (`bytes=...`), permitiendo adelantar y retrasar el video sin interrupciones.

---

## 💳 6. Métodos de Pago y Reglas de Cobro

- Soporte para **Tarjetas de Crédito** y **Tarjetas de Débito** para ambos roles:
  - Creadores: Tarjeta vinculada para recibir transferencias por visualizaciones.
  - Suscriptores: Tarjeta vinculada para cobro de membresía mensual ($9.99 USD).
- **Reglas del Suscriptor:**
  1. El suscriptor inicia en periodo de prueba con cuota de hasta **2 videos permitidos**.
  2. Su periodo de prueba dura **1 día** (`trial_ends_at = NOW() + INTERVAL '1 day'`).
  3. **Paywall Gatekeeper:** Al intentar reproducir un 3er video o una vez transcurrido el primer día, el reproductor bloquea la visualización y muestra el modal de cobro para activar la Membresía VIP ($9.99 USD) con su tarjeta de crédito o débito registrada.
  4. Una vez cobrado y activado el plan (`status = 'active'`), el acceso a todo el catálogo pasa a ser ilimitado.

---

## 🗄️ 7. Base de Datos PostgreSQL

Archivo de esquema: `database/schema.sql`  
Archivo de datos iniciales: `database/seed.sql`

### Tablas Principales:
1. `users`: Creadores y suscriptores con contraseñas hasheadas en bcrypt.
2. `profile_skins`: Skins predefinidas y personalizadas con marcos y colores.
3. `profiles`: Perfiles de usuario asociados a una cuenta.
4. `payment_methods`: Tarjetas de crédito y débito tokenizadas (tipo, marca, last4, exp).
5. `subscriptions`: Estado de membresía, cuota de videos vistos (`videos_watched_count`), fechas de cobro (`trial_ends_at`, `billing_starts_at`).
6. `billing_transactions`: Historial de facturas y cobros procesados.
7. `categories`: Géneros y clasificaciones de streaming.
8. `videos`: Título, sinopsis, duración, miniaturas, URLs y almacenamiento GCS/Local.
9. `user_video_views`: Registro de reproducciones y contador para paywall.
10. `creator_payouts`: Liquidaciones para creadores de contenido.

---

## ⚡ 8. Guía Rápida de Ejecución en Visual Studio Code

### Opción A: Mediante Tareas de Visual Studio Code
1. Abre la carpeta `C:\Users\eve_a\Downloads\Agosto2026 -Enero2027\SIMON\TECFLIX` en **Visual Studio Code**.
2. Presiona `Ctrl + Shift + P` y escribe **Tasks: Run Task**.
3. Selecciona **🚀 Iniciar TECFLIX Fullstack (Backend + Frontend)**.

### Opción B: Mediante PowerShell en Windows

1. **Instalar Dependencias:**
   ```powershell
   .\install-all.ps1
   ```

2. **Inicializar Base de Datos PostgreSQL:**
   ```powershell
   .\setup-database.ps1
   ```

3. **Arrancar la Plataforma:**
   ```powershell
   .\start-all.ps1
   ```

- Frontend Cliente: **http://localhost:3000**
- Backend API REST: **http://localhost:5000/api**

---

## 🔑 9. Cuentas de Demostración para Pruebas

| Rol | Correo Electrónico | Contraseña | Estado de Cuenta |
| :--- | :--- | :--- | :--- |
| **Creador** | `creador@tecflix.com` | `TecflixCreator2026!` | Panel de Creator Studio con videos en GCS y ganancias |
| **Suscriptor VIP** | `suscriptor@tecflix.com` | `TecflixUser2026!` | Membresía Activa (Visualización ilimitada) |
| **Suscriptor Prueba** | `nuevo@tecflix.com` | `TecflixUser2026!` | En Periodo de Prueba (1 de 2 videos vistos) |
