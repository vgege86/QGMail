# QGMail

Aplicación web para gestionar Gmail desde tu QNAP NAS. Despliégala en Container Station y accede desde cualquier navegador de tu red.

## Funcionalidades

- **Bandeja de entrada** con paginación y búsqueda
- **Redactar, responder y reenviar** correos con adjuntos
- **Gestión de etiquetas**: archivar, eliminar, marcar leído/no leído
- **Adjuntos**: ver y descargar archivos adjuntos
- Soporte para etiquetas personalizadas de Gmail

## Requisitos previos

1. **QNAP Container Station** instalado en tu NAS
2. **Proyecto en Google Cloud Console** con la Gmail API activada

## 1. Configurar Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto (ej. "QGMail")
3. Activa la **Gmail API**: _APIs y Servicios → Biblioteca → busca "Gmail API"_
4. Crea credenciales: _APIs y Servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0_
   - Tipo de aplicación: **Aplicación web**
   - URI de redirección autorizada: `http://TU-IP-QNAP:3000/auth/callback`
5. Descarga el Client ID y Client Secret

## 2. Configurar el archivo `.env`

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://192.168.1.100:3000/auth/callback
SESSION_SECRET=una-cadena-aleatoria-larga
PORT=3000
```

## 3. Despliegue en QNAP Container Station

```bash
# Clona el repositorio en tu QNAP (vía SSH)
git clone https://github.com/vgege86/QGMail /share/Container/qgmail
cd /share/Container/qgmail

# Crea el archivo .env con tus credenciales
cp .env.example .env
nano .env

# Levanta el contenedor
docker compose up -d
```

La app estará disponible en `http://TU-IP-QNAP:3000`

## 4. Desarrollo local

```bash
# Terminal 1 — backend (con hot-reload)
cd backend && npm install && npm run dev

# Terminal 2 — frontend (con hot-reload)
cd frontend && npm install && npm run dev
```

El frontend Vite proxea `/api` y `/auth` al backend (puerto 3000).
Accede en `http://localhost:5173`

## Arquitectura

```
QGMail/
├── backend/          Node.js + Express + googleapis
│   └── src/
│       ├── routes/   auth, messages, labels, send, attachments
│       └── lib/      oauth client, types
└── frontend/         React 18 + Vite + Tailwind CSS
    └── src/
        ├── pages/    LoginPage, InboxPage, EmailPage
        ├── components/ Sidebar, EmailList, EmailDetail, ComposeModal
        └── hooks/    useAuth, useEmails, useLabels
```

## Seguridad

- El OAuth client secret se queda en el servidor (nunca llega al navegador)
- Las sesiones se almacenan en disco (carpeta `sessions/`) cifradas con SESSION_SECRET
- El HTML de los emails se sanitiza con DOMPurify antes de renderizar
