const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const prisma = require("../db");
const { validarCredenciales } = require("../middleware/validar");

const router = express.Router();
const SALT_ROUNDS = 12;
// Hash de relleno: evita diferencias de tiempo cuando el email no existe
const HASH_FALSO = bcrypt.hashSync("relleno-no-valido", SALT_ROUNDS);

// Fuerza bruta: máx. 10 intentos por IP cada 15 minutos
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_LIMIT) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too Many Requests", details: "Demasiados intentos, intente más tarde" },
});

function firmarToken(u) {
  return jwt.sign({ rol: u.rol, nombre: u.nombre }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(u.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

// Registro público: SIEMPRE crea rol "lector" (se ignora cualquier "rol" del body)
router.post("/register", limitador, async (req, res, next) => {
  try {
    const { datos, errores } = validarCredenciales(req.body, { registro: true });
    if (errores.length) return res.status(400).json({ error: "Validation failed", details: errores });

    const existe = await prisma.usuario.findUnique({ where: { email: datos.email } });
    if (existe) return res.status(409).json({ error: "Conflict", details: "El email ya está registrado" });

    const passwordHash = await bcrypt.hash(datos.password, SALT_ROUNDS);
    const u = await prisma.usuario.create({
      data: { nombre: datos.nombre, email: datos.email, passwordHash, rol: "lector" },
    });
    res.status(201).json({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol });
  } catch (error) {
    next(error);
  }
});

router.post("/login", limitador, async (req, res, next) => {
  try {
    const { datos, errores } = validarCredenciales(req.body);
    if (errores.length) return res.status(400).json({ error: "Validation failed", details: errores });

    const u = await prisma.usuario.findUnique({ where: { email: datos.email } });
    const ok = await bcrypt.compare(datos.password, u ? u.passwordHash : HASH_FALSO);
    if (!u || !ok) {
      // Mensaje genérico: no revela si el email existe
      return res.status(401).json({ error: "Unauthorized", details: "Credenciales incorrectas" });
    }
    res.status(200).json({
      token: firmarToken(u),
      usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
