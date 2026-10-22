# Manual de usuario

**Dirección:** `https://TU-SERVICIO.onrender.com`
> Si la página tarda hasta un minuto en abrir, es normal: el servicio gratuito se "despierta" tras un rato sin uso.

## 1. Roles
| Rol | Puede |
|---|---|
| Lector | Ver incidentes |
| Analista | Ver, registrar y actualizar incidentes |
| Administrador | Todo lo anterior y eliminar |
Una cuenta nueva siempre es **Lector**; solo un administrador entrega más permisos.

## 2. Ingresar
1. Abra la dirección. 2. Escriba su correo y contraseña. 3. Pulse **Ingresar**. Verá su nombre y rol arriba.
- *Credenciales incorrectas*: revise correo y contraseña. Tras 10 intentos fallidos debe esperar 15 minutos.
- *Crear cuenta*: despliegue "¿No tiene cuenta?", complete nombre, correo y contraseña (mínimo 8, con letras y números).
- Su sesión dura 1 hora; después vuelva a ingresar.

## 3. Registrar un incidente (Analista / Admin)
Complete tipo, fecha, prioridad, sistema afectado, confidencialidad y descripción (30 a 400 caracteres) y pulse **Registrar incidente**. Aparecerá en la lista con estado *Abierto*.
*"Faltan datos" / error 400*: algún campo está vacío o no cumple el formato; el mensaje indica cuál.

## 4. Consultar
En "Incidentes recientes" use los filtros de **Estado** y **Prioridad**. Pulse **Cargar más** para ver más resultados.

## 5. Actualizar (Analista / Admin)
Pulse **Editar** en el incidente, cambie los datos o el estado (Abierto, En proceso, Cerrado) y guarde.

## 6. Eliminar (solo Admin)
Pulse **Eliminar** y confirme. La acción no se puede deshacer.

## 7. Problemas frecuentes
| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| "Sesión expirada" / 401 | Token vencido o ausente | Ingrese de nuevo |
| "No tiene permisos" / 403 | Su rol no permite la acción | Pida cambio de rol al administrador |
| "Demasiados intentos" / 429 | Límite de intentos de login | Espere 15 minutos |
| Página en blanco o muy lenta | Servicio en reposo | Espere 1 minuto y recargue |

## 8. Cerrar sesión
Pulse **Cerrar sesión**, especialmente en equipos compartidos.
