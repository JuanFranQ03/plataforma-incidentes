# Plataforma de Gestión de Incidentes de Ciberseguridad

Aplicación web para registrar, consultar, actualizar y eliminar incidentes de ciberseguridad, con autenticación JWT y permisos por rol. Desplegada en Render con base de datos PostgreSQL y CI/CD en GitHub Actions.

- **URL en producción:** `https://plataforma-incidentes-hc5j.onrender.com/`
- **Health check:** `https://plataforma-incidentes-hc5j.onrender.com/salud`


## Ejecución local
Requisitos: Node.js 20+, PostgreSQL 14+.

```bash
npm install                      # raíz: ESLint
cd backend
npm install
cp .env.example .env             # PowerShell: Copy-Item .env.example .env  → complete DATABASE_URL y JWT_SECRET
npm run build                    # prisma generate + migrate deploy
npm run seed                     # usuarios admin / analista / lector
npm start                        # http://localhost:3000  (API + interfaz)
npm test                         # pruebas unitarias (Jest)
```

Pruebas de API (con el servidor encendido): `npm run pruebas:api`. Contra producción: `$env:API="https://plataforma-incidentes-hc5j.onrender.com/"; npm run pruebas:api`.

## Estructura
```
.github/workflows/ci-cd.yml   # pruebas → despliegue (Deploy Hook de Render)
backend/                      # Root Directory en Render
  index.js                    # Express: helmet+CSP, CORS, /salud, estáticos, errores
  routes/ controllers/ models/ reglas/ middleware/
  public/                     # frontend MVC (HTML, CSS, JS)
  prisma/                     # schema y migraciones PostgreSQL
  tests/                      # Jest
docs/                         # documentación técnica, manual, seguridad, guía de defensa
```
