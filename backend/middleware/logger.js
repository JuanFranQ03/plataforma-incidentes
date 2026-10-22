// Log de acceso: método, ruta (sin query string), estado y duración.
// Nunca registra cuerpos, cabeceras ni tokens (evita filtrar contraseñas o JWT).
const logger = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};

module.exports = logger;
