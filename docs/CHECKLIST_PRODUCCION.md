# Checklist de producción (marcar con evidencia)

- [ ] 1. La URL abre con **https://** y candado
- [ ] 2. `/salud` devuelve 200 con `"baseDeDatos":"conectada"`
- [ ] 3. CRUD funciona en producción y las validaciones devuelven 400
- [ ] 4. Los datos persisten tras reiniciar el servicio (Manual Deploy / Restart)
- [ ] 5. No hay `.env` en ningún commit (`git log --all -- backend/.env` vacío)
- [ ] 6. Los logs de Render no muestran cuerpos, contraseñas ni tokens
- [ ] 7. Último workflow en verde y el commit desplegado coincide con `main`

## Cierre Tema 16.1–16.5
- [ ] Presentación (problema → arquitectura → flujo → seguridad → límites)
- [ ] Pruebas CRUD finales con sus 5 negativos (sin token, rol insuficiente, datos inválidos, id inexistente, credenciales inválidas)
- [ ] Documentación técnica y manual de usuario probados sobre el sitio real
- [ ] Guion de defensa con plan principal y plan de contingencia
- [ ] Retroalimentación clasificada y ≥ 3 lecciones con acción concreta
