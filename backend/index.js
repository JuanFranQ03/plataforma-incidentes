require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const logger = require("./middleware/logger");

// Configuración por entorno: falla rápido si falta algo crítico
const faltantes = [];
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) faltantes.push("JWT_SECRET (mínimo 32 caracteres)");
if (!process.env.DATABASE_URL) faltantes.push("DATABASE_URL");
if (faltantes.length) {
  console.error(`Configuración incompleta, falta: ${faltantes.join(", ")}. Abortando.`);
  process.exit(1);
}

const prisma = require("./db");
const { crearSalud } = require("./routes/salud");

const produccion = process.env.NODE_ENV === "production";
const app = express();

// Render termina el HTTPS en su proxy: confiar en 1 salto para que req.ip y el rate limit usen la IP real
app.set("trust proxy", 1);

// Cabeceras de seguridad (HSTS, nosniff, X-Frame-Options, CSP, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://code.jquery.com"], // sin 'unsafe-inline': los scripts viven en archivos .js
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      // En local (http://localhost) este directivo rompería la carga de recursos
      upgradeInsecureRequests: produccion ? [] : null,
    },
  },
}));

// Compresión gzip de las respuestas (reduce los bytes transferidos)
app.use(compression({ threshold: 1024 }));

// CORS: solo orígenes de la lista blanca
const origenesPermitidos = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Sin Origin (curl, Postman, mismo origen) se permite; los navegadores siempre lo envían
    if (!origin || origenesPermitidos.includes(origin)) return cb(null, true);
    cb(new Error("Origen no permitido por CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"], // permite al cliente leer el total para paginar
  maxAge: 600,
}));

app.use(logger);
app.use(express.json({ limit: "10kb" })); // limita el tamaño del cuerpo

app.get("/salud", crearSalud(prisma));

// Frontend estático (mismo origen que la API: una sola URL HTTPS, sin CORS)
app.use(express.static(path.join(__dirname, "public"), { maxAge: produccion ? "1h" : 0 }));

app.use("/auth", require("./routes/auth"));
app.use("/incidentes", require("./routes/incidentes"));

app.use((req, res) => res.status(404).json({ error: "Not Found", details: "Ruta inexistente" }));

// Manejo centralizado de errores
app.use((err, req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Bad Request", details: "JSON malformado" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload Too Large" });
  }
  if (err.message === "Origen no permitido por CORS") {
    return res.status(403).json({ error: "Forbidden", details: err.message });
  }
  console.error("System Error:", err); // el detalle solo va al log, nunca al cliente
  res.status(500).json({ error: "Internal Server Error", message: "Fallo crítico en el servidor" });
});

const PORT = process.env.PORT || 3000;
const servidor = app.listen(PORT, () => console.log(`Servidor (${process.env.NODE_ENV || "development"}) escuchando en el puerto ${PORT}`));

// Cierre ordenado: Render envía SIGTERM en cada despliegue o reinicio
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido: cerrando servidor...");
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
