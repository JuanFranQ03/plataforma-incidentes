| # | Caso | Esperado | Obtenido | Resultado |
|---|------|----------|----------|-----------|
| 1 | Consultar incidentes SIN token | 401 | 401 | ✅ Pasó |
| 2 | Consultar con token inválido/manipulado | 401 | 401 | ✅ Pasó |
| 3 | Login con contraseña incorrecta | 401 | 401 | ✅ Pasó |
| 4 | Lector intenta CREAR (permisos insuficientes) | 403 | 403 | ✅ Pasó |
| 5 | Crear con datos inválidos (descripción corta, tipo fuera de lista) | 400 | 400 | ✅ Pasó |
| 6 | Crear válido con intento de XSS (analista) | 201 | 201 | ✅ Pasó |
| 7 | El HTML malicioso fue eliminado de la descripción | true | true | ✅ Pasó |
| 8 | Lector CONSULTA lista de incidentes | 200 | 200 | ✅ Pasó |
| 9 | Consultar incidente por ID | 200 | 200 | ✅ Pasó |
| 10 | Analista ACTUALIZA estado (campos extra ignorados) | 200 | 200 | ✅ Pasó |
| 11 | El id enviado en el body NO se modificó (mass assignment) | 2 | 2 | ✅ Pasó |
| 12 | Actualizar con estado inválido | 400 | 400 | ✅ Pasó |
| 13 | Analista intenta ELIMINAR (solo admin) | 403 | 403 | ✅ Pasó |
| 14 | ID no numérico | 400 | 400 | ✅ Pasó |
| 15 | Incidente inexistente | 404 | 404 | ✅ Pasó |
| 16 | Admin ELIMINA incidente | 204 | 204 | ✅ Pasó |
| 17 | Registro público con rol=admin: debe crearse como lector | lector | lector | ✅ Pasó |
| 18 | Registro con datos inválidos | 400 | 400 | ✅ Pasó |
| 19 | CORS: origen no permitido | 403 | 403 | ✅ Pasó |
| 20 | Health check /salud responde con la base de datos conectada | 200:conectada | 200:conectada | ✅ Pasó |
