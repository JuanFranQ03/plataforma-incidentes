# Documentación técnica

## 1. Problema y usuarios
Los equipos de ciberseguridad registran incidentes en hojas sueltas y correos: no hay trazabilidad, ni control de quién puede cambiar o borrar un registro. La plataforma centraliza los incidentes y limita las acciones por rol (lector, analista, administrador).

## 2. Arquitectura
```
Navegador (HTML/CSS/JS MVC)
      │  HTTPS (TLS en el proxy de Render)
      ▼
Render Web Service ── Express 5 (helmet/CSP, rate limit, JWT, validación) ──┐
      │  /salud, logs                                                       │ Internal Database URL
      ▼                                                                     ▼
Render Logs / Events / Metrics                                      PostgreSQL (Render)

GitHub ── push a main ──► GitHub Actions (lint + migraciones + pruebas) ──► Deploy Hook ──► Render
```
El backend sirve también el frontend (`backend/public`): una sola URL HTTPS, mismo origen, sin CORS entre capas.

## 3. Stack y justificación
| Pieza | Elección | Por qué |
|---|---|---|
| API | Express 5 | Ya dominado en el curso; middlewares claros |
| ORM | Prisma 7 + adaptador `pg` | Consultas parametrizadas (previene inyección SQL) y migraciones versionadas |
| BD | PostgreSQL en Render | Render no ofrece MySQL gestionado; Postgres tiene plan gratuito |
| Auth | JWT HS256, 1 h, bcrypt (12 rondas) | Sin estado en el servidor; hash lento para contraseñas |
| CI/CD | GitHub Actions + Deploy Hook | El despliegue solo ocurre si las pruebas pasan |

## 4. Configuración por entorno
| Variable | Local | Producción (Render) |
|---|---|---|
| `NODE_ENV` | development | production |
| `DATABASE_URL` | PostgreSQL local | *Internal Database URL* de Render |
| `JWT_SECRET` | aleatorio ≥ 32 | aleatorio distinto, ≥ 32 |
| `PORT` | 3000 | lo asigna Render (no definir) |
| `CORS_ORIGINS` | `http://localhost:3000` | solo si el frontend vive en otro origen |
Los secretos solo están en `.env` (ignorado por Git) y en el panel de Render / GitHub Secrets.

## 5. API
| Método y ruta | Rol mínimo | Respuestas |
|---|---|---|
| `GET /salud` | público | 200 (`baseDeDatos: conectada`) / 503 |
| `POST /auth/register` | público (crea siempre *lector*) | 201, 400, 409, 429 |
| `POST /auth/login` | público | 200 con token, 400, 401, 429 |
| `GET /incidentes?estado&prioridad&pagina&limite` | lector | 200 + `X-Total-Count`, 401 |
| `GET /incidentes/:id` | lector | 200, 400, 404 |
| `POST /incidentes` | analista | 201, 400, 403 |
| `PUT /incidentes/:id` | analista | 200, 400, 403, 404 |
| `DELETE /incidentes/:id` | admin | 204, 403, 404 |

## 6. Seguridad aplicada
Hash bcrypt; JWT con expiración; autorización por matriz rol→acción (`reglas/permisos.js`); validación y sanitización de entrada; *mass assignment* bloqueado; rate limit en login; Helmet con CSP sin `unsafe-inline`; HTTPS gestionado por Render (HSTS); errores 500 sin detalle interno; logs sin cuerpos ni tokens; `.env` fuera del repositorio. Detalle en `SEGURIDAD.md`.

## 7. Observabilidad
- `/salud`: comprueba el proceso y `SELECT 1` en la BD. Render lo usa como *Health Check Path*.
- Logs de acceso: `fecha MÉTODO ruta estado duración` (sin query string ni cuerpos).
- Render: Logs, Events (despliegues) y Metrics. GitHub: pestaña Actions.

## 8. Pruebas
Unitarias (Jest): autenticación, permisos, validación, controlador, health y logger. De integración (`backend/pruebas.js`): 20 casos contra la API real, incluidos sin token, token inválido, credenciales incorrectas, rol insuficiente, datos inválidos, id inexistente y CORS.

## 9. Despliegue (resumen)
1. Repositorio en GitHub (rama `main`). 2. PostgreSQL en Render. 3. Web Service: Root Directory `backend`, Build `npm ci && npm run build`, Start `npm start`, Health Check `/salud`, Auto-Deploy **Off**. 4. Deploy Hook como secreto `RENDER_DEPLOY_HOOK_URL`. 5. Seed de usuarios desde la PC con la *External Database URL*.

## 10. Limitaciones y plan de contingencia
| Limitación | Impacto | Mitigación |
|---|---|---|
| Plan gratuito duerme tras ~15 min | Primera petición tarda 30–60 s | Abrir `/salud` antes de la demo |
| BD gratuita de Render caduca | Pérdida de datos pasado el plazo | Respaldo con `pg_dump`; pasar a plan de pago en uso real |
| Token en `sessionStorage` | Riesgo ante XSS | CSP estricta + sanitización; evaluar cookie `HttpOnly` |
| Sin recuperación de contraseña ni MFA | Cuentas dependen del admin | Planificado como mejora |
| Sin pruebas E2E automatizadas | Regresiones de interfaz | `pruebas.js` cubre la API; E2E como mejora |
