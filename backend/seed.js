// Crea usuarios iniciales con contraseña hasheada: npm run seed
// En producción las contraseñas se leen de variables de entorno (nunca quedan en el repositorio).
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("./db");

const produccion = process.env.NODE_ENV === "production";

function clave(nombreVariable, porDefecto) {
  const v = process.env[nombreVariable];
  if (v) return v;
  if (produccion) {
    console.error(`En producción defina ${nombreVariable} antes de ejecutar el seed.`);
    process.exit(1);
  }
  return porDefecto; // solo para desarrollo local
}

const usuarios = [
  { nombre: "Administrador", email: "admin@incidentes.local", password: clave("SEED_ADMIN_PASSWORD", "Admin12345"), rol: "admin" },
  { nombre: "Analista SOC", email: "analista@incidentes.local", password: clave("SEED_ANALISTA_PASSWORD", "Analista123"), rol: "analista" },
  { nombre: "Lector", email: "lector@incidentes.local", password: clave("SEED_LECTOR_PASSWORD", "Lector12345"), rol: "lector" },
];

(async () => {
  for (const u of usuarios) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { passwordHash, rol: u.rol },
      create: { nombre: u.nombre, email: u.email, passwordHash, rol: u.rol },
    });
    console.log(`OK ${u.rol}: ${u.email}`);
  }
  await prisma.$disconnect();
})();
