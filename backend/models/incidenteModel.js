// MODELO (MVC): único punto de acceso a datos de incidentes.
const prisma = require("../db");

async function listar({ filtro, pagina, limite }) {
  const [items, total] = await Promise.all([
    prisma.incidente.findMany({
      where: filtro,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.incidente.count({ where: filtro }),
  ]);
  return { items, total };
}

const obtener = (id) => prisma.incidente.findUnique({ where: { id } });
const crear = (datos) => prisma.incidente.create({ data: { ...datos, estado: "Abierto" } });
const actualizar = (id, datos) => prisma.incidente.update({ where: { id }, data: datos });
const eliminar = (id) => prisma.incidente.delete({ where: { id } });

module.exports = { listar, obtener, crear, actualizar, eliminar };
