const { crearSalud } = require("../routes/salud");
const logger = require("../middleware/logger");

const crearRes = () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), on: jest.fn() };
  return res;
};

describe("GET /salud", () => {
  test("base de datos disponible -> 200 y baseDeDatos=conectada", async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]) };
    const res = crearRes();
    await crearSalud(prisma)({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: "ok", baseDeDatos: "conectada" }));
  });

  test("base de datos caída -> 503 y no filtra el detalle del error", async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error("password authentication failed for user x")) };
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = crearRes();
    await crearSalud(prisma)({}, res);
    expect(res.status).toHaveBeenCalledWith(503);
    const cuerpo = res.json.mock.calls[0][0];
    expect(cuerpo.baseDeDatos).toBe("desconectada");
    expect(JSON.stringify(cuerpo)).not.toMatch(/password/i);
    spy.mockRestore();
  });
});

describe("logger de acceso", () => {
  test("registra método, ruta sin query, estado y duración; nunca el token ni el cuerpo", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const res = crearRes();
    res.statusCode = 401;
    const req = { method: "POST", path: "/auth/login", url: "/auth/login?x=1", headers: { authorization: "Bearer SECRETO" }, body: { password: "Clave12345" } };
    const next = jest.fn();
    logger(req, res, next);
    expect(next).toHaveBeenCalled();
    res.on.mock.calls[0][1](); // dispara el evento "finish"
    const linea = spy.mock.calls[0][0];
    expect(linea).toMatch(/POST \/auth\/login 401 [\d.]+ms/);
    expect(linea).not.toMatch(/SECRETO|Clave12345|x=1/);
    spy.mockRestore();
  });
});
