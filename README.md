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

## 3. Despliegue en QNAP Container Station (sin comandos)

GitHub Actions construye la imagen automáticamente en cada push y la publica en `ghcr.io/vgege86/qgmail:latest`.

### Opción A — Container Station (interfaz web, recomendada)

1. Abre **Container Station** en tu QNAP
2. _Crear_ → _Crear aplicación_
3. Pega este docker-compose en el editor:

```yaml
version: "3.9"
services:
  qgmail:
    image: ghcr.io/vgege86/qgmail:latest
    ports:
      - "3000:3000"
    environment:
      GOOGLE_CLIENT_ID: TU_CLIENT_ID
      GOOGLE_CLIENT_SECRET: TU_CLIENT_SECRET
      GOOGLE_REDIRECT_URI: http://TU-IP-QNAP:3000/auth/callback
      SESSION_SECRET: una-cadena-aleatoria-larga
      PORT: "3000"
    volumes:
      - /share/Container/qgmail/sessions:/app/sessions
    restart: unless-stopped
```

4. Sustituye los valores en `environment` y pulsa **Crear**

### Opción B — SSH en el QNAP (si tienes acceso)

```bash
# Solo necesitas descargar dos archivos, sin git
mkdir -p /share/Container/qgmail/sessions
cd /share/Container/qgmail

# Descarga la configuración (solo wget, sin git)
wget -O docker-compose.yml https://raw.githubusercontent.com/vgege86/QGMail/claude/gmail-management-app-QPZMB/docker-compose.yml
wget -O .env https://raw.githubusercontent.com/vgege86/QGMail/claude/gmail-management-app-QPZMB/.env.example

# Edita .env con tus credenciales
vi .env

# Arranca
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
