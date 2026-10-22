// CONTROLADOR (MVC): traduce HTTP <-> modelo. Recibe el modelo por parámetro
// (inyección de dependencias) para poder probarlo con Jest sin base de datos.
const { validarIncidente, validarConsulta } = require("../middleware/validar");

function crearControlador(modelo) {
  const noEncontrado = (res) => res.status(404).json({ error: "Not Found", details: "Incidente inexistente" });
  const invalido = (res, details) => res.status(400).json({ error: "Validation failed", details });

  return {
    async listar(req, res, next) {
      try {
        const { filtro, pagina, limite, errores } = validarConsulta(req.query);
        if (errores.length) return invalido(res, errores);
        const { items, total } = await modelo.listar({ filtro, pagina, limite });
        res.set("X-Total-Count", String(total));
        res.status(200).json(items);
      } catch (error) {
        next(error);
      }
    },

    async obtener(req, res, next) {
      try {
        const incidente = await modelo.obtener(req.id);
        if (!incidente) return noEncontrado(res);
        res.status(200).json(incidente);
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const { datos, errores } = validarIncidente(req.body, false);
        if (errores.length) return invalido(res, errores);
        res.status(201).json(await modelo.crear(datos));
      } catch (error) {
        next(error);
      }
    },

    async actualizar(req, res, next) {
      try {
        const { datos, errores } = validarIncidente(req.body, true);
        if (errores.length) return invalido(res, errores);
        res.status(200).json(await modelo.actualizar(req.id, datos));
      } catch (error) {
        if (error.code === "P2025") return noEncontrado(res);
        next(error);
      }
    },

    async eliminar(req, res, next) {
      try {
        await modelo.eliminar(req.id);
        res.status(204).send();
      } catch (error) {
        if (error.code === "P2025") return noEncontrado(res);
        next(error);
      }
    },
  };
}

module.exports = { crearControlador };
