# Guía de defensa (video máx. 10 min)

## Guion cronometrado
| Min | Contenido | Evidencia en pantalla |
|---|---|---|
| 0:00–1:00 | **Problema y usuario**: equipos que registran incidentes sin trazabilidad ni control de permisos | Diapositiva 2 |
| 1:00–2:00 | **Arquitectura**: cliente → API → BD + monitoreo + CI/CD | Diagrama (docs técnica §2) |
| 2:00–6:30 | **Demo en la URL real**: ① login (credencial incorrecta → 401, luego correcta) ② crear incidente (y uno inválido → 400) ③ consultar con filtros ④ actualizar estado ⑤ permisos: lector no crea (403), analista no elimina (403), admin elimina (204) | Navegador + DevTools/Network |
| 6:30–7:30 | **Producción**: candado HTTPS, `/salud`, Render Logs sin datos sensibles, Actions en verde | Render + GitHub |
| 7:30–8:30 | **Pruebas**: `npm test` y `pruebas.js` contra producción (20/20) | Terminal |
| 8:30–9:30 | **Decisiones, alternativas y límites**: Postgres vs MySQL, monolito vs frontend separado, JWT vs sesión; plan gratuito, BD que caduca, sin MFA | Diapositiva |
| 9:30–10:00 | Lecciones aprendidas y cierre | Diapositiva |

## Preparación (10 min antes)
1. Abrir `/salud` hasta ver 200 (despierta el servicio).
2. Iniciar sesión una vez para comprobar, cerrar sesión.
3. Tener abiertas: URL, Render Logs, GitHub Actions, terminal con `$env:API` configurado.

## Plan de contingencia
| Falla | Plan B |
|---|---|
| Servicio dormido o lento | Mostrar `/salud` y esperar; mientras, explicar la arquitectura |
| BD caducada o caída | `/salud` devuelve 503: mostrar la degradación controlada; demo en local (`npm start`) + capturas de producción |
| Sin internet | Demo local y video/capturas previas |
| Falla en vivo | Mostrar la pestaña de pruebas ya ejecutadas (`pruebas-resultados.md`) |

## Preguntas probables
- *¿Por qué JWT y no sesiones?* API sin estado, fácil de escalar; costo: no se puede revocar antes de expirar (mitigado con 1 h).
- *¿Por qué Postgres?* Render no ofrece MySQL gestionado; Prisma lo soporta con migración limpia.
- *¿Qué haría con más tiempo?* MFA, recuperación de contraseña, cookie HttpOnly, E2E, respaldos automáticos.

## Matriz de retroalimentación (completar con la real)
| Comentario | Clasificación | Impacto | Urgencia | Esfuerzo | Decisión |
|---|---|---|---|---|---|
| Primera carga tarda ~50 s | Defecto/limitación | Alto | Media | Bajo (pinger) o pago | Planificar |
| Falta recuperación de contraseña | Mejora | Medio | Baja | Alto | Planificar |
| Preferir otro color de banner | Preferencia | Bajo | Baja | Bajo | No aplicar |
| Logs mostraban demasiada info | Defecto | Alto | Alta | Bajo | Actuar ya (hecho: logger sin query ni cuerpos) |

## Lecciones aprendidas (cada una con acción)
1. **Config por entorno desde el día 1** (la URL `localhost` fija impedía desplegar) → acción: URL relativa y `.env.example` documentado.
2. **El CI debe probar migraciones, no solo código** → acción: job con Postgres limpio y `npm run build`.
3. **El plan gratuito duerme** → acción: `/salud` en el guion de preparación y plan B en la defensa.
4. **Los secretos se filtran fácil** → acción: `.env` ignorado, secretos en Render/GitHub, rotar `JWT_SECRET` expuesto antes.
