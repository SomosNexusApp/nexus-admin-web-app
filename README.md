# Nexus Admin Web App

Panel de administración exclusivo del ecosistema **Nexus**. Aplicación Angular 21 desplegada en un **dominio separado** del marketplace público, con autenticación JWT independiente y acceso restringido a usuarios con rol `ROLE_ADMIN`.

---

## Tabla de contenidos

1. [Descripción y propósito](#descripción-y-propósito)
2. [Posición en el ecosistema Nexus](#posición-en-el-ecosistema-nexus)
3. [Stack tecnológico](#stack-tecnológico)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación y ejecución local](#instalación-y-ejecución-local)
6. [Variables de entorno](#variables-de-entorno)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Arquitectura de la aplicación](#arquitectura-de-la-aplicación)
9. [Autenticación y autorización](#autenticación-y-autorización)
10. [Módulos del panel (rutas y funcionalidad)](#módulos-del-panel-rutas-y-funcionalidad)
11. [Capa de servicios y API](#capa-de-servicios-y-api)
12. [Componentes compartidos](#componentes-compartidos)
13. [Tiempo real (WebSocket)](#tiempo-real-websocket)
14. [Build y despliegue](#build-y-despliegue)
15. [Seguridad operativa](#seguridad-operativa)
16. [Convenciones de desarrollo](#convenciones-de-desarrollo)
17. [Solución de problemas](#solución-de-problemas)
18. [Enlaces relacionados](#enlaces-relacionados)

---

## Descripción y propósito

`nexus-admin-web-app` es la interfaz web que usan los administradores de Nexus para **moderar contenido**, **gestionar usuarios**, **supervisar transacciones**, **resolver disputas**, **configurar el sistema** y **atender soporte**. No es accesible para usuarios finales ni empresas del marketplace.

Principios de diseño del panel:

- **Aislamiento de dominio**: se despliega en `admin.nexus-app.es` (producción), separado de `nexus-app.es`, para reducir la superficie de ataque si hubiera una vulnerabilidad en la app pública.
- **Sesión admin independiente**: el token JWT de administrador se almacena en `localStorage` bajo la clave `nexus_admin_jwt`, distinta de `nexus_jwt` del usuario.
- **SPA con lazy loading**: cada módulo del panel carga su código bajo demanda.
- **API centralizada**: todas las operaciones pasan por `AdminService` contra el prefijo `/api/admin` del backend Spring Boot.

El panel cubre **19 áreas funcionales** agrupadas en sidebar: analítica, usuarios y seguridad, moderación, comercio, comunicación y sistema.

---

## Posición en el ecosistema Nexus

| Componente | Repositorio | Rol |
|------------|-------------|-----|
| Backend API | `nexus-backend` | Spring Boot: expone `/api/admin/*` con `ROLE_ADMIN` |
| App pública | `nexus-web-app` | Marketplace para usuarios (`ROLE_USER`, `ROLE_EMPRESA`) |
| **Este panel** | `nexus-admin-web-app` | Gestión interna (`ROLE_ADMIN`) |
| Web corporativa | `nexus-web-about` | Documentación TFG, legal, marketing (Astro) |

Flujo típico de despliegue:

```
Usuario → nexus-app.es (Vercel)
Admin   → admin.nexus-app.es (Vercel)
API     → api.nexus-app.es (Render + Docker)
```

El botón **“Ver la app”** del sidebar abre `environment.appUrl` en una pestaña nueva para que el administrador consulte el marketplace sin salir del flujo de moderación.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | ^21.1.0 | Framework SPA, Standalone Components, Signals |
| Angular CDK | ^21.0.0 | Utilidades UI (overlays, a11y) |
| RxJS | ~7.8.0 | Streams HTTP y polling |
| TypeScript | ~5.9.2 | Tipado estricto |
| @stomp/stompjs + SockJS | ^7.3.0 / ^1.6.1 | WebSocket (soporte chat, notificaciones) |
| @stripe/stripe-js | ^8.9.0 | Operaciones Stripe desde panel (reembolsos, contratos) |
| ng-recaptcha | ^13.2.1 | Protección en login admin |
| Swiper | ^12.1.2 | Carruseles en vistas de detalle |
| Vitest | ^4.0.8 | Tests unitarios |
| Vercel | — | Hosting y CI/CD |

**No incluye Ionic ni Capacitor**: el panel está pensado solo para escritorio y tablet; en móvil el sidebar pasa a modo drawer.

---

## Requisitos previos

- **Node.js** >= 22.12.0 (recomendado alineado con el monorepo Nexus)
- **npm** >= 11.6.2 (`packageManager` en `package.json`)
- **nexus-backend** en ejecución (`http://localhost:8080` en desarrollo)
- Cuenta de administrador creada en base de datos con `ROLE_ADMIN` y nivel de acceso 1–3

---

## Instalación y ejecución local

```bash
git clone https://github.com/SomosNexusApp/nexus-admin-web-app.git
cd nexus-admin-web-app
npm install --legacy-peer-deps
npm start
```

La aplicación arranca en **http://localhost:4200** (puerto por defecto de `ng serve`).

Rutas de acceso:

| URL | Descripción |
|-----|-------------|
| `/login` | Formulario de acceso administrador |
| `/dashboard` | Home del panel (requiere sesión) |
| `/forbidden` | Acceso denegado (rol insuficiente) |
| `/not-found` | 404 del panel |

**Nota:** En local, el admin y la app pública comparten el puerto 4200 si se ejecutan a la vez. Arranca solo uno o configura `--port` en `ng serve`.

### Scripts npm

| Comando | Acción |
|---------|--------|
| `npm start` | `ng serve` — desarrollo con HMR |
| `npm run build` | Build producción → `dist/frontend-admin/browser/` |
| `npm run watch` | Build en modo development con watch |
| `npm test` | Tests con Vitest |

---

## Variables de entorno

Configuración en `src/environments/`:

| Archivo | Cuándo se usa |
|---------|----------------|
| `environment.ts` | `ng serve`, build development |
| `environment.prod.ts` | `ng build --configuration production` |
| `enviroment-test.ts` | Entorno de pruebas (nombre con typo histórico) |

### Propiedades de `environment`

| Clave | Descripción |
|-------|-------------|
| `production` | Flag de modo producción |
| `apiUrl` | Base del backend REST (`http://localhost:8080` / `https://api.nexus-app.es`) |
| `adminUrl` | URL pública del panel admin |
| `appUrl` | URL del marketplace (`nexus-web-app`) para enlaces “Ver app” |
| `wsUrl` | Endpoint WebSocket (`http://` local, `wss://` producción) |
| `stripePublicKey` | Clave pública Stripe (`pk_test_` / `pk_live_`) |
| `googleClientId` | OAuth Google (si aplica en login) |
| `recaptchaSiteKey` | Site key reCAPTCHA |
| `cloudinaryCloudName` | Cuenta Cloudinary |
| `cloudinaryUploadPreset` | Preset de subida (unsigned en dev) |

En producción, **no commits claves live reales**: inyecta `stripePublicKey` y secretos desde variables de Vercel.

---

## Estructura del proyecto

```text
nexus-admin-web-app/
├── angular.json                 # Proyecto "frontend-admin", output dist/frontend-admin
├── vercel.json                  # outputDirectory + headers MIME
├── package.json
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css               # Estilos globales del panel
    ├── environments/
    └── app/
        ├── app.routes.ts        # Rutas raíz: login, forbidden, admin lazy
        ├── app.config.ts        # Providers HTTP, interceptores, APP_INITIALIZER
        ├── admin/
        │   ├── admin.routes.ts  # Rutas hijas bajo AdminLayoutComponent
        │   ├── admin.service.ts # Cliente HTTP único /api/admin
        │   ├── admin.models.ts  # DTOs del panel
        │   ├── layout/          # Shell: sidebar, health, badges
        │   ├── login/           # AdminLoginComponent
        │   ├── dashboard/       # KPIs y resumen
        │   ├── estadisticas/    # Gráficos y métricas live
        │   ├── usuarios/        # CRUD moderación usuarios
        │   ├── fraude/          # Flags y productos sospechosos
        │   ├── sanciones/       # Historial de sanciones + export
        │   ├── reportes/        # Cola de reportes de usuarios
        │   ├── devoluciones/    # Gestión de devoluciones
        │   ├── compras/         # Pedidos, reembolsos, tracking
        │   ├── productos/       # Moderación productos
        │   ├── ofertas/         # Moderación chollos
        │   ├── vehiculos/       # Moderación vehículos
        │   ├── cupones/         # Cupones de descuento
        │   ├── soporte/         # Chat soporte humano
        │   ├── notificaciones/  # Envío masivo / avisos
        │   ├── newsletter/      # Gestión suscriptores
        │   ├── contratos/       # Contratos publicidad B2B
        │   ├── patrocinios/     # Patrocinios activos
        │   ├── configuracion/   # Parámetros globales + palabras moderación
        │   ├── audit-log/       # Registro de auditoría
        │   ├── seguridad/       # Políticas 2FA admin
        │   ├── categorias/      # Árbol de categorías
        │   └── services/        # Servicios por dominio (productos, cupones…)
        ├── core/
        │   ├── auth/            # AuthService, AuthStore, JwtService
        │   ├── guards/          # adminGuard
        │   ├── interceptors/    # JWT + manejo errores 401
        │   └── services/        # WebSocket, notificaciones, toast…
        ├── shared/              # Componentes reutilizables (avatar, cards, modales)
        ├── models/              # Interfaces TypeScript
        └── errors/              # Forbidden, NotFound
```

---

## Arquitectura de la aplicación

### Patrón Standalone (sin NgModules)

Cada feature es un componente `standalone: true` que declara sus propios `imports`. Las rutas usan `loadComponent` o `loadChildren` para code splitting.

### Layout principal

`AdminLayoutComponent` envuelve todas las rutas internas:

- **Sidebar** agrupado por `navGroups` (Analítica, Usuarios & Seguridad, Moderación, Comercio, Comunicación, Sistema).
- **Badge dinámico** en “Reportes”: polling cada 30 s a `getCountReportesPendientes()`.
- **Health check** del backend cada 60 s: versión y uptime en el footer del sidebar.
- **Responsive**: breakpoint 1024 px; drawer overlay en móvil.

### Estado reactivo

- **AuthStore** (`signal` / `computed`): usuario admin (`adminUser`), flags `isAdminLoggedIn`, `isAdmin`.
- **AdminService**: sin estado global; los componentes usan `signal` locales para loading y datos de vista.
- **RxJS** para HTTP y `interval` de refresco en dashboard y estadísticas.

### Inicialización de la app

`APP_INITIALIZER` (en `app.config.ts`) valida el JWT admin al arranque y llama a `AuthService.loadCurrentUser(true)` si el token es válido, evitando parpadeos de login en recargas.

---

## Autenticación y autorización

### Flujo de login

1. El admin accede a `/login` (`AdminLoginComponent`).
2. Credenciales + reCAPTCHA se envían a `POST /api/auth/login` con flag de contexto admin.
3. Si hay 2FA activo, el componente solicita el código TOTP/Email antes de completar.
4. El token se guarda con `JwtService.saveToken(token, true)` → clave `nexus_admin_jwt`.
5. `AuthStore.setAdminUser(usuario)` y redirección a `/dashboard`.

### adminGuard

Protege el árbol de rutas bajo `path: ''` en `app.routes.ts`:

- Comprueba `AuthStore.isAdminLoggedIn()`.
- Si no hay sesión → `router.navigate(['/login'])`.
- **No confundir** con `authGuard` de la app pública: este guard solo valida sesión **admin**.

### JwtInterceptor

Añade `Authorization: Bearer <nexus_admin_jwt>` a peticiones hacia `environment.apiUrl`. Detecta peticiones admin vs usuario si compartiera lógica con el marketplace (patrón dual-token del ecosistema).

### ErrorInterceptor

- **401**: limpia token admin, redirige a login.
- Errores 4xx/5xx: pueden propagarse a `ToastService` según implementación.

### Niveles de administrador (backend)

El backend define tres niveles de acceso admin (1 básico, 2 moderador, 3 superadmin). El frontend debe respetar restricciones devueltas por la API (403 → `/forbidden`). La lógica fina de permisos vive en Spring Security del backend.

### Impersonación

`AdminService.impersonarUsuario(id)` obtiene un token de usuario para depuración o soporte. Usar solo bajo política interna; el token resultante es de **usuario**, no de admin.

---

## Módulos del panel (rutas y funcionalidad)

Todas las rutas son hijas de `AdminLayoutComponent` (prefijo `/` tras login).

### Analítica

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/dashboard` | `DashboardComponent` | KPIs: usuarios, productos, ofertas, compras hoy, revenue mes, reportes pendientes. Top vendedores, últimas compras y reportes. Auto-refresh 60 s. |
| `/estadisticas` | `EstadisticasComponent` | Series temporales: usuarios/día, compras/día, comisiones/día, productos por categoría. Vista ampliada de métricas. |

### Usuarios y seguridad

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/usuarios` | `UsuariosAdminComponent` | Listado paginado, búsqueda, detalle. Acciones: verificar, suspender (duración en horas), banear, desbanear, enviar aviso in-app, impersonar. |
| `/seguridad` | `SeguridadComponent` | Gestión de políticas 2FA y configuración de seguridad admin (`AdminSeguridadService`). |
| `/fraude` | `FraudeComponent` | Flags de fraude por usuario, productos sospechosos, gráfico de estadísticas, marcar revisado. |
| `/sanciones` | `SancionesComponent` | Historial de sanciones aplicadas, exportación CSV/Excel vía `exportSanciones()`. |

### Moderación

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/reportes` | `ReportesComponent` | Cola de reportes (contenido, usuarios). Resolver, suspender y resolver en una acción (`suspenderYResolver`). Badge en sidebar. |
| `/devoluciones` | `DevolucionesAdminComponent` | Aceptar, rechazar o cerrar devoluciones con motivo. Vista de disputas post-compra. |

### Comercio

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/compras` | `ComprasAdminComponent` | Listado de compras, reembolso Stripe, cancelar, regenerar etiqueta envío, refrescar tracking transportista. Integración con sesiones de soporte. |
| `/productos` | `ProductosAdminComponent` | Moderar anuncios de segunda mano: ocultar, destacar, revisar imágenes Cloudinary. |
| `/ofertas` | `OfertasAdminComponent` | Moderar chollos: badges, flash sales, votos Spark/Drip. |
| `/vehiculos` | `VehiculosAdminComponent` | Moderar fichas de vehículos. |
| `/cupones` | `CuponesAdminComponent` | CRUD cupones: códigos, descuentos, vigencia, límites de uso. |

### Comunicación

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/soporte-chat` | `SoporteChatAdminComponent` | Atención de chats escalados desde IA. Reembolso de compras vinculadas a sesión de soporte. |
| `/notificaciones` | `NotificacionesAdminComponent` | Envío de notificaciones masivas o individuales (`tipo: AVISO`, etc.). |
| `/newsletter` | `NewsletterAdminComponent` | Gestión de campañas y suscriptores double opt-in. |
| `/contratos` | `ContratosAdminComponent` | Crear/editar/eliminar contratos publicitarios por empresa. Listado de empresas vía DTO dedicado. |
| `/patrocinios` | `PatrociniosAdminComponent` | Supervisión de patrocinios de productos pagados con Stripe. |

### Sistema

| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/configuracion` | `ConfiguracionAdminComponent` | Parámetros globales (`getConfigs` / `saveConfigsBatch`), lista de palabras de moderación. |
| `/audit-log` | `AuditLogComponent` | Registro de acciones admin con filtros y exportación. |

### Rutas públicas del shell

| Ruta | Componente |
|------|------------|
| `/login` | `AdminLoginComponent` |
| `/forbidden` | `ForbiddenComponent` |
| `/not-found` | `NotFoundComponent` |

---

## Capa de servicios y API

### AdminService (facade principal)

Base: `${environment.apiUrl}/api/admin`

| Área | Métodos representativos |
|------|-------------------------|
| Sistema | `getHealth()` |
| Estadísticas | `getKpis()`, `getUsuariosPorDia()`, `getComprasPorDia()`, `getComisionesPorDia()`, `getProductosPorCategoria()`, `getTopVendedores()`, `getUltimasCompras()`, `getUltimosReportes()` |
| Usuarios | `getUsuarios()`, `verificarUsuario()`, `suspenderUsuario()`, `banearUsuario()`, `desbanearUsuario()`, `impersonarUsuario()`, `enviarAviso()` |
| Reportes | `getReportes()`, `getCountReportesPendientes()`, `updateReporte()`, `suspenderYResolver()` |
| Sanciones | `getSanciones()`, `exportSanciones()` |
| Fraude | `getFraudeFlags()`, `getProductosSospechosos()`, `marcarFraudeRevisado()` |
| Devoluciones | `getDevoluciones()`, `aceptarDevolucion()`, `rechazarDevolucion()`, `cerrarDevolucion()` |
| Compras | `getCompras()`, `reembolsarCompra()`, `regenerarEtiquetaCompra()`, `refreshTrackingCompra()`, `cancelarCompra()` |
| Contratos | `getContratos()`, `createContrato()`, `updateContrato()`, `deleteContrato()`, `getEmpresas()` |
| Config | `getConfigs()`, `saveConfigsBatch()`, `getModerationWords()` |
| Audit | `getAuditLog()`, `exportAuditLog()` |
| Soporte | `getComprasSoporteSession()`, `reembolsarCompraDesdeSoporte()` |

### Servicios de dominio (`admin/services/`)

Descomponen llamadas HTTP específicas cuando la vista lo requiere:

- `admin-productos.service.ts`
- `admin-ofertas.service.ts`
- `admin-vehiculos.service.ts`
- `admin-cupones.service.ts`
- `admin-categorias.service.ts`
- `admin-newsletter.service.ts`
- `admin-seguridad.service.ts`

Patrón recomendado: lógica de listado/filtros en el componente; persistencia en servicio de dominio o `AdminService` según cohesión.

### Modelos (`admin.models.ts`)

DTOs tipados: `AdminKpis`, `AdminUsuario`, `AdminReporte`, `AdminDevolucion`, `AdminSancion`, `AdminCompra`, `AdminContrato`, `AuditLogEntry`, `PagedResult<T>`, `AdminHealth`, etc. Mantener sincronizados con respuestas del backend.

---

## Componentes compartidos

El directorio `src/app/shared/` replica parte del design system del marketplace para consistencia visual:

- **Avatar**, **ToastContainer**, **ConfirmModal**
- **ProductoCard**, **OfertaCard**, **VehiculoCard**
- **ValoracionModal**, **ReporteModal**
- **Pipes**: `timeAgo`, `currencyEs`, `discountPercent`, `truncate`, `coverImage`
- **Directives**: `imgFallback`

Estos componentes deben permanecer **agnósticos de rutas admin**; no importar lógica de `nexus-web-app` directamente, pero sí compartir convenciones de estilos.

---

## Tiempo real (WebSocket)

`WebSocketService` en `core/services/`:

- Conexión STOMP sobre SockJS a `environment.wsUrl`.
- Autenticación del handshake con el mismo JWT admin (`JwtService.getToken(true)`).
- Usado en **soporte chat** y **notificaciones** para actualizaciones sin recargar la vista.

Patrón de suscripción alineado con `nexus-web-app` para reutilizar conocimiento del protocolo `/app/*` y `/topic/*` del backend.

---

## Build y despliegue

### Build local

```bash
npm run build
# Salida: dist/frontend-admin/browser/
```

### Vercel

`vercel.json` define:

- `outputDirectory`: `dist/frontend-admin/browser`
- `installCommand`: `npm install --legacy-peer-deps` (compatibilidad `ng-recaptcha` + Angular 21)
- Headers `Content-Type` explícitos para `.js`, `.css`, `.html`

Configura en el panel de Vercel:

- Dominio personalizado: `admin.nexus-app.es`
- Variables de entorno para sustituir valores de `environment.prod.ts` si usas file replacement en CI
- Rewrites SPA: todas las rutas → `index.html` (comportamiento estándar Vercel para Angular)

### CORS y cookies

El backend debe incluir `https://admin.nexus-app.es` en orígenes CORS permitidos. El panel no usa cookies de sesión; solo Bearer JWT.

---

## Seguridad operativa

1. **Nunca** desplegar el panel en el mismo origen que la app pública sin aislamiento de rutas.
2. Rotar claves Stripe y reCAPTCHA si se filtran en commits; usar variables de CI.
3. La impersonación de usuarios debe quedar registrada en `audit-log` (responsabilidad del backend).
4. Exportaciones (`sanciones`, `audit-log`) pueden contener datos personales — cumplir RGPD en almacenamiento local.
5. Forzar HTTPS y `wss://` en producción para WebSocket.
6. Validar que cuentas admin tengan 2FA activo en entornos reales (módulo `/seguridad`).

---

## Convenciones de desarrollo

- **Standalone only**: no crear NgModules nuevos.
- **Lazy loading** en toda ruta de feature.
- **Signals** para estado de UI local; RxJS para HTTP.
- **Prettier**: `singleQuote: true`, `printWidth: 100`.
- Nuevos endpoints admin → método en `AdminService` + tipo en `admin.models.ts`.
- Nombres de archivo: `kebab-case.component.ts`.
- Estilos por componente en `.css` junto al `.html`.
- Font Awesome (`fa-solid`) en sidebar — mantener iconos consistentes con `navGroups`.

### Añadir un módulo admin nuevo

1. Crear carpeta en `src/app/admin/mi-modulo/`.
2. Registrar ruta en `admin.routes.ts` con `loadComponent`.
3. Añadir entrada en `navGroups` de `admin-layout.component.ts`.
4. Exponer métodos HTTP en `AdminService` o servicio dedicado.
5. Proteger endpoint en backend con `@PreAuthorize("hasRole('ADMIN')")` y nivel si aplica.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Redirect infinito a `/login` | Token admin expirado o malformado | Borrar `nexus_admin_jwt` en localStorage, volver a login |
| 403 en todas las peticiones | Usuario sin `ROLE_ADMIN` o nivel insuficiente | Verificar rol en BD y claims JWT |
| CORS error | Origen no permitido en backend | Añadir URL del panel en `application.properties` |
| Badge reportes en 0 siempre | Backend caído o endpoint distinto | Revisar `getCountReportesPendientes` y logs Render |
| Build falla en Vercel | Peer deps de ng-recaptcha | Usar `--legacy-peer-deps` como en `vercel.json` |
| Health “DOWN” en sidebar | Backend en hibernación (Render free) | Primera petición tras 15 min puede tardar ~60 s |

---

## Enlaces relacionados

| Recurso | URL |
|---------|-----|
| Marketplace (usuarios) | [nexus-web-app](../nexus-web-app/) |
| Documentación TFG | [nexus-web-about](../nexus-web-about/) |
| Producción admin | https://admin.nexus-app.es |
| API producción | https://api.nexus-app.es |
| Organización GitHub | https://github.com/SomosNexusApp/ |
| Contacto | somosnexusapp@gmail.com |

---

<p align="center"><sub>Panel de administración Nexus · Angular 21 · Proyecto Final DAM · IES Francisco Rodríguez Marín</sub></p>
