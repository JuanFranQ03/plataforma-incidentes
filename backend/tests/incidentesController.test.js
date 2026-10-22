const { crearControlador } = require("../controllers/incidentesController");

const body = () => ({
  tipo: "malware",
  fecha: "2026-10-01",
  prioridad: "media",
  sistemaAfectado: "Servidor web",
  confidencialidad: "interno",
  descripcion: "Se detectó un proceso sospechoso consumiendo CPU en el servidor web.",
});

const crearRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const crearModelo = (extra = {}) => ({
  listar: jest.fn().mockResolvedValue({ items: [{ id: 1 }], total: 120 }),
  obtener: jest.fn().mockResolvedValue({ id: 1 }),
  crear: jest.fn().mockResolvedValue({ id: 2, estado: "Abierto" }),
  actualizar: jest.fn().mockResolvedValue({ id: 1, estado: "Cerrado" }),
  eliminar: jest.fn().mockResolvedValue(undefined),
  ...extra,
});

describe("controlador de incidentes", () => {
  test("listar: devuelve 200, el total en X-Total-Count y usa paginación por defecto", async () => {
    const modelo = crearModelo();
    const res = crearRes();
    await crearControlador(modelo).listar({ query: {} }, res, jest.fn());
    expect(modelo.listar).toHaveBeenCalledWith({ filtro: {}, pagina: 1, limite: 50 });
    expect(res.set).toHaveBeenCalledWith("X-Total-Count", "120");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("listar: parámetros inválidos -> 400 sin consultar el modelo", async () => {
    const modelo = crearModelo();
    const res = crearRes();
    await crearControlador(modelo).listar({ query: { estado: "x" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(modelo.listar).not.toHaveBeenCalled();
  });

  test("obtener: inexistente -> 404", async () => {
    const modelo = crearModelo({ obtener: jest.fn().mockResolvedValue(null) });
    const res = crearRes();
    await crearControlador(modelo).obtener({ id: 99 }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("crear: datos válidos -> 201", async () => {
    const modelo = crearModelo();
    const res = crearRes();
    await crearControlador(modelo).crear({ body: body() }, res, jest.fn());
    expect(modelo.crear).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("crear: datos inválidos -> 400 y no guarda", async () => {
    const modelo = crearModelo();
    const res = crearRes();
    await crearControlador(modelo).crear({ body: { ...body(), tipo: "hack" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(modelo.crear).not.toHaveBeenCalled();
  });

  test("actualizar: solo envía al modelo los campos permitidos", async () => {
    const modelo = crearModelo();
    await crearControlador(modelo).actualizar({ id: 1, body: { estado: "Cerrado", id: 77 } }, crearRes(), jest.fn());
    expect(modelo.actualizar).toHaveBeenCalledWith(1, { estado: "Cerrado" });
  });

  test("actualizar: registro inexistente (P2025) -> 404", async () => {
    const modelo = crearModelo({ actualizar: jest.fn().mockRejectedValue({ code: "P2025" }) });
    const res = crearRes();
    await crearControlador(modelo).actualizar({ id: 5, body: { estado: "Cerrado" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("eliminar: éxito -> 204", async () => {
    const res = crearRes();
    await crearControlador(crearModelo()).eliminar({ id: 1 }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test("error inesperado -> se delega a next (manejador central)", async () => {
    const fallo = new Error("BD caída");
    const modelo = crearModelo({ eliminar: jest.fn().mockRejectedValue(fallo) });
    const next = jest.fn();
    await crearControlador(modelo).eliminar({ id: 1 }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });
});
