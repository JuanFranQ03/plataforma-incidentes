// Health check para Render y monitoreo: GET /salud (sin autenticación, sin datos sensibles).
// Recibe `prisma` por parámetro para poder probarlo sin base de datos real.
function crearSalud(prisma) {
  return async function salud(_req, res) {
    const base = { estado: "ok", uptimeSegundos: Math.round(process.uptime()), entorno: process.env.NODE_ENV || "development" };
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ ...base, baseDeDatos: "conectada" });
    } catch (error) {
      console.error("Health check: fallo de base de datos:", error.message);
      res.status(503).json({ ...base, estado: "degradado", baseDeDatos: "desconectada" });
    }
  };
}

module.exports = { crearSalud };
