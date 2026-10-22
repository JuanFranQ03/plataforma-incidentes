// Regla de negocio: qué rol puede realizar cada acción sobre los incidentes.
const MATRIZ = {
  consultar: ["lector", "analista", "admin"],
  crear: ["analista", "admin"],
  actualizar: ["analista", "admin"],
  eliminar: ["admin"],
};

function puedeRealizar(rol, accion) {
  return Boolean(MATRIZ[accion] && MATRIZ[accion].includes(rol));
}

module.exports = { MATRIZ, puedeRealizar };
