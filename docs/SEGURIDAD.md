# Unidad 6 – Seguridad e integración de la Plataforma de Incidentes

## 1. Puesta en marcha

```bash
cd BackEnd
npm install                      # instala bcryptjs, jsonwebtoken, cors, helmet, express-rate-limit
# Edite .env (use .env.example como guía); JWT_SECRET debe tener ≥ 32 caracteres
npx prisma migrate deploy --config prisma7.config.ts   # crea la tabla Usuario
npx prisma generate --config prisma7.config.ts
npm run seed                     # crea admin, analista y lector (contraseñas hasheadas)
npm start                        # http://localhost:3000
```
Frontend: servir la carpeta `FrontEnd` en `http://localhost:5500` (extensión *Live Server* de VS Code).
Si usa otro puerto, agréguelo a `CORS_ORIGINS` en `.env`.

Usuarios de prueba (seed): `admin@incidentes.local / Admin12345`, `analista@incidentes.local / Analista123`, `lector@incidentes.local / Lector12345`.

## 2. Controles implementados

| Control | Implementación | Archivo |
|---|---|---|
| Hash de contraseñas | `bcrypt` con 12 rondas de sal; solo se guarda `passwordHash` | `routes/auth.js`, `seed.js` |
| Autenticación | JWT firmado HS256, expira en 1 h, secreto en `.env` | `routes/auth.js`, `middleware/auth.js` |
| Autorización por roles | `autorizar(...roles)` devuelve 403 si el rol no corresponde | `middleware/auth.js` |
| Protección de rutas | `router.use(autenticar)` en todo `/incidentes` (401 sin token) | `routes/incidentes.js` |
| Validación | Listas blancas (tipo, prioridad, confidencialidad, estado), longitudes, fecha válida, ID entero | `middleware/validar.js` |
| Sanitización | Se eliminan etiquetas HTML y caracteres de control; el cliente además escapa al mostrar | `validar.js`, `vista.js` |
| Mass assignment | El PUT solo copia campos permitidos (no se puede cambiar `id`, `createdAt`, etc.) | `validar.js` |
| Inyección SQL | Prisma usa consultas parametrizadas | `db.js` |
| CORS | Lista blanca de orígenes (`CORS_ORIGINS`), solo métodos y cabeceras necesarios | `index.js` |
| Cabeceras seguras | `helmet` (HSTS, nosniff, frameguard, etc.) | `index.js` |
| Fuerza bruta | `express-rate-limit`: 10 intentos / 15 min en login y registro | `routes/auth.js` |
| Enumeración de usuarios | Mismo mensaje y tiempo de respuesta para email inexistente o clave incorrecta | `routes/auth.js` |
| Escalada de privilegios | El registro público siempre crea rol `lector` e ignora `rol` del body | `routes/auth.js` |
| Límite de cuerpo / errores | `express.json({limit:"10kb"})`; errores internos no se exponen al cliente | `index.js` |
| Secretos | `.env` en `.gitignore`; se entrega `.env.example` | — |

### Matriz de permisos

| Acción | Endpoint | lector | analista | admin |
|---|---|:-:|:-:|:-:|
| Consultar | `GET /incidentes`, `GET /incidentes/:id` | ✅ | ✅ | ✅ |
| Crear | `POST /incidentes` | ❌ 403 | ✅ | ✅ |
| Actualizar | `PUT /incidentes/:id` | ❌ 403 | ✅ | ✅ |
| Eliminar | `DELETE /incidentes/:id` | ❌ 403 | ❌ 403 | ✅ |

> Los botones del cliente se ocultan según el rol solo por usabilidad; la autorización real siempre se valida en el servidor.

## 3. CORS

El navegador bloquea las peticiones entre orígenes distintos (`:5500` → `:3000`) salvo que el servidor lo autorice. Se configuró una **lista blanca**: si el `Origin` no está en `CORS_ORIGINS`, la API responde 403. No se usa `*`, porque con credenciales/tokens abriría la API a cualquier sitio. CORS protege al usuario en el navegador; **no sustituye** la autenticación (un cliente como curl no lo respeta).

## 4. HTTPS (documentación)

HTTP envía contraseñas y JWT en texto plano, por lo que puede interceptarse con un ataque de intermediario (MITM). **En producción todo el tráfico debe ir por HTTPS (TLS 1.2+).**

**Desarrollo local:** certificado de confianza con [mkcert](https://github.com/FiloSottile/mkcert):
```bash
mkcert -install
mkcert localhost 127.0.0.1      # genera localhost+1.pem y localhost+1-key.pem
```
```js
// Alternativa directa en Node (reemplaza app.listen)
const https = require("https"), fs = require("fs");
https.createServer({ key: fs.readFileSync("localhost+1-key.pem"), cert: fs.readFileSync("localhost+1.pem") }, app)
     .listen(3443);
```

**Producción (recomendado):** Node escucha solo en `127.0.0.1:3000` y **Nginx** como proxy inverso termina TLS con un certificado gratuito de Let's Encrypt (`certbot --nginx -d ejemplo.com`):
```nginx
server { listen 80; server_name ejemplo.com; return 301 https://$host$request_uri; }
server {
  listen 443 ssl http2;
  server_name ejemplo.com;
  ssl_certificate     /etc/letsencrypt/live/ejemplo.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/ejemplo.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header X-Forwarded-Proto https; proxy_set_header Host $host; }
}
```
Además: cambiar `urlBase` en `FrontEnd/js/modelo.js` a `https://...`, actualizar `CORS_ORIGINS` con el origen `https://` real y, detrás del proxy, usar `app.set("trust proxy", 1)`. `helmet` ya envía la cabecera HSTS.

## 5. Registro de pruebas

Automatizadas con `node pruebas.js` (servidor encendido y seed ejecutado); el script genera `pruebas-resultados.md`. También pueden hacerse manualmente con Postman/curl y desde el cliente web.

| # | Caso | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| 1 | Acceso **sin token** | `GET /incidentes` sin cabecera | 401 Unauthorized | |
| 2 | **Token inválido** | `Authorization: Bearer abc.def.ghi` | 401 Unauthorized | |
| 3 | Login incorrecto | Contraseña errónea | 401 "Credenciales incorrectas" | |
| 4 | **Permisos insuficientes** (crear) | Token de *lector* en `POST /incidentes` | 403 Forbidden | |
| 5 | **Permisos insuficientes** (eliminar) | Token de *analista* en `DELETE /incidentes/:id` | 403 Forbidden | |
| 6 | **Datos inválidos** | `descripcion:"corta"`, `tipo:"hack"` | 400 con lista de errores | |
| 7 | Crear válido + XSS | `<script>` en descripción (analista) | 201; etiqueta eliminada | |
| 8 | Consultar | `GET /incidentes` (lector) | 200 + lista | |
| 9 | Consultar por ID inexistente | `GET /incidentes/999999` | 404 Not Found | |
| 10 | Actualizar | `PUT` `{estado:"En proceso"}` (analista) | 200; `id` y `rol` del body ignorados | |
| 11 | Actualizar inválido | `{estado:"Hackeado"}` | 400 | |
| 12 | Eliminar | `DELETE` (admin) | 204 No Content | |
| 13 | Escalada de rol | Registro con `rol:"admin"` | Usuario creado como `lector` | |
| 14 | CORS | Cabecera `Origin: http://sitio-malicioso.com` | 403 | |

**Pruebas desde el cliente web:** iniciar sesión como lector (no aparece el formulario ni botones), como analista (puede crear y editar, sin botón Eliminar) y como admin (crear, editar, eliminar); filtrar por estado/prioridad; cerrar sesión y verificar que desaparece la lista.
