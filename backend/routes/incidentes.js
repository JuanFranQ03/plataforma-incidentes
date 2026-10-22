// RUTAS (MVC): solo declaran endpoints y encadenan middlewares; no contienen lógica.
const express = require("express");
const { autenticar, autorizarAccion } = require("../middleware/auth");
const { validarId } = require("../middleware/validar");
const { crearControlador } = require("../controllers/incidentesController");
const modelo = require("../models/incidenteModel");

const router = express.Router();
const c = crearControlador(modelo);

router.use(autenticar); // todas las rutas exigen JWT válido

router.get("/", autorizarAccion("consultar"), c.listar);
router.get("/:id", autorizarAccion("consultar"), validarId, c.obtener);
router.post("/", autorizarAccion("crear"), c.crear);
router.put("/:id", autorizarAccion("actualizar"), validarId, c.actualizar);
router.delete("/:id", autorizarAccion("eliminar"), validarId, c.eliminar);

module.exports = router;
