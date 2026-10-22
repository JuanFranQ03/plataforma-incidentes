const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres-123456";
const { autenticar, autorizar, autorizarAccion } = require("../middleware/auth");

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const firmar = (opciones = {}, payload = { rol: "analista", nombre: "Ana" }) =>
  jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", subject: "5", ...opciones });

describe("autenticar (JWT)", () => {
  test("sin cabecera Authorization -> 401", () => {
    const res = crearRes();
    const next = jest.fn();
    autenticar({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("esquema distinto de Bearer -> 401", () => {
    const res = crearRes();
    autenticar({ headers: { authorization: `Basic ${firmar()}` } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("token manipulado -> 401 'Token inválido'", () => {
    const res = crearRes();
    autenticar({ headers: { authorization: `Bearer ${firmar()}x` } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized", details: "Token inválido" });
  });

  test("token firmado con otro secreto -> 401", () => {
    const res = crearRes();
    const token = jwt.sign({ rol: "admin" }, "otro-secreto-distinto", { algorithm: "HS256" });
    autenticar({ headers: { authorization: `Bearer ${token}` } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("token expirado -> 401 'Token expirado'", () => {
    const res = crearRes();
    autenticar({ headers: { authorization: `Bearer ${firmar({ expiresIn: -10 })}` } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized", details: "Token expirado" });
  });

  test("token válido -> carga req.usuario y continúa", () => {
    const req = { headers: { authorization: `Bearer ${firmar()}` } };
    const next = jest.fn();
    autenticar(req, crearRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.usuario).toEqual({ id: "5", rol: "analista", nombre: "Ana" });
  });
});

describe("autorizar / autorizarAccion", () => {
  test("autorizar: rol permitido continúa", () => {
    const next = jest.fn();
    autorizar("admin")({ usuario: { rol: "admin" } }, crearRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test("autorizar: rol no permitido -> 403", () => {
    const res = crearRes();
    autorizar("admin")({ usuario: { rol: "lector" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("autorizarAccion: analista no puede eliminar -> 403", () => {
    const res = crearRes();
    const next = jest.fn();
    autorizarAccion("eliminar")({ usuario: { rol: "analista" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("autorizarAccion: sin usuario -> 403", () => {
    const res = crearRes();
    autorizarAccion("consultar")({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
