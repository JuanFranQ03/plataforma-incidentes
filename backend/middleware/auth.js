const jwt = require("jsonwebtoken");
const { puedeRealizar } = require("../reglas/permisos");

// Verifica el JWT enviado en "Authorization: Bearer <token>"
function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || "";
  const [esquema, token] = cabecera.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized", details: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.usuario = { id: payload.sub, rol: payload.rol, nombre: payload.nombre };
    next();
  } catch (err) {
    const details = err.name === "TokenExpiredError" ? "Token expirado" : "Token inválido";
    return res.status(401).json({ error: "Unauthorized", details });
  }
}

// Autorización por rol: autorizar("admin", "analista")
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "Forbidden", details: "Permisos insuficientes para esta acción" });
    }
    next();
  };
}

// Autorización por acción, apoyada en la matriz de permisos: autorizarAccion("eliminar")
function autorizarAccion(accion) {
  return (req, res, next) => {
    if (!req.usuario || !puedeRealizar(req.usuario.rol, accion)) {
      return res.status(403).json({ error: "Forbidden", details: "Permisos insuficientes para esta acción" });
    }
    next();
  };
}

module.exports = { autenticar, autorizar, autorizarAccion };
