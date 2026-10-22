const {
  limpiar, validarFecha, validarIncidente, validarCredenciales, validarConsulta, validarId,
} = require("../middleware/validar");

const incidenteValido = () => ({
  tipo: "phishing",
  fecha: "2026-10-01",
  prioridad: "alta",
  sistemaAfectado: "Servidor de correo",
  confidencialidad: "restringido",
  descripcion: "Correos fraudulentos dirigidos al área financiera con enlaces maliciosos.",
});

describe("limpiar (sanitización)", () => {
  test("elimina etiquetas HTML y recorta espacios", () => {
    expect(limpiar("  <script>alert(1)</script>Hola  ")).toBe("alert(1)Hola");
  });
  test("elimina caracteres de control", () => {
    expect(limpiar("a\u0000b\u0007c")).toBe("abc");
  });
  test("elimina signos < y > sueltos", () => {
    expect(limpiar("5 > 3")).toBe("5  3");
  });
});

describe("validarFecha", () => {
  test("acepta una fecha pasada con formato AAAA-MM-DD", () => {
    expect(validarFecha("2026-10-01")).toBeInstanceOf(Date);
  });
  test("rechaza formatos inválidos", () => {
    expect(validarFecha("01/10/2026")).toBeNull();
    expect(validarFecha("abc")).toBeNull();
    expect(validarFecha("2026-13-45")).toBeNull();
  });
  test("rechaza fechas futuras (más de un día)", () => {
    expect(validarFecha("2099-01-01")).toBeNull();
  });
  test("tolera hoy (diferencia de zona horaria)", () => {
    const hoy = new Date().toISOString().slice(0, 10);
    expect(validarFecha(hoy)).toBeInstanceOf(Date);
  });
});

describe("validarIncidente - creación", () => {
  test("acepta un incidente válido", () => {
    const { datos, errores } = validarIncidente(incidenteValido());
    expect(errores).toHaveLength(0);
    expect(datos.tipo).toBe("phishing");
  });
  test("exige todos los campos", () => {
    const { errores } = validarIncidente({});
    expect(errores).toHaveLength(6);
  });
  test.each([
    ["tipo", "hack"],
    ["prioridad", "urgente"],
    ["confidencialidad", "publico"],
  ])("rechaza %s fuera de la lista blanca", (campo, valor) => {
    const { errores } = validarIncidente({ ...incidenteValido(), [campo]: valor });
    expect(errores.join(" ")).toContain(campo);
  });
  test("rechaza descripción menor a 30 y mayor a 400 caracteres", () => {
    expect(validarIncidente({ ...incidenteValido(), descripcion: "corta" }).errores).toHaveLength(1);
    expect(validarIncidente({ ...incidenteValido(), descripcion: "x".repeat(401) }).errores).toHaveLength(1);
  });
  test("rechaza tipos no string (inyección de objetos)", () => {
    const { errores } = validarIncidente({ ...incidenteValido(), tipo: { $ne: null } });
    expect(errores.length).toBeGreaterThan(0);
  });
  test("limpia HTML de la descripción", () => {
    const { datos } = validarIncidente({
      ...incidenteValido(),
      descripcion: "<script>alert(1)</script> Ataque de phishing detectado en el correo corporativo",
    });
    expect(datos.descripcion).not.toContain("<");
  });
  test("ignora campos no permitidos (asignación masiva)", () => {
    const { datos } = validarIncidente({ ...incidenteValido(), id: 99, rol: "admin", estado: "Cerrado" });
    expect(datos).not.toHaveProperty("id");
    expect(datos).not.toHaveProperty("rol");
    expect(datos).not.toHaveProperty("estado");
  });
});

describe("validarIncidente - actualización parcial", () => {
  test("acepta solo el estado", () => {
    const { datos, errores } = validarIncidente({ estado: "Cerrado" }, true);
    expect(errores).toHaveLength(0);
    expect(datos).toEqual({ estado: "Cerrado" });
  });
  test("rechaza estado inválido", () => {
    expect(validarIncidente({ estado: "Hackeado" }, true).errores).toHaveLength(1);
  });
  test("rechaza un cuerpo sin campos válidos", () => {
    expect(validarIncidente({}, true).errores).toContain("No se enviaron campos válidos para actualizar");
  });
});

describe("validarCredenciales", () => {
  test("login válido normaliza el correo", () => {
    const { datos, errores } = validarCredenciales({ email: " Admin@Test.com ", password: "x" });
    expect(errores).toHaveLength(0);
    expect(datos.email).toBe("admin@test.com");
  });
  test("rechaza email inválido", () => {
    expect(validarCredenciales({ email: "no-es-email", password: "x" }).errores).toContain("email inválido");
  });
  test("registro exige contraseña de 8+ caracteres con letras y números", () => {
    const base = { nombre: "Ana", email: "ana@test.com" };
    expect(validarCredenciales({ ...base, password: "abc" }, { registro: true }).errores.length).toBeGreaterThan(0);
    expect(validarCredenciales({ ...base, password: "sololetras" }, { registro: true }).errores.length).toBeGreaterThan(0);
    expect(validarCredenciales({ ...base, password: "Clave12345" }, { registro: true }).errores).toHaveLength(0);
  });
  test("rechaza contraseñas de más de 72 caracteres (límite de bcrypt)", () => {
    expect(validarCredenciales({ email: "a@b.co", password: "a".repeat(73) }).errores).toContain("password inválida");
  });
});

describe("validarConsulta (filtros y paginación)", () => {
  test("usa valores por defecto", () => {
    expect(validarConsulta({})).toEqual({ filtro: {}, pagina: 1, limite: 50, errores: [] });
  });
  test("acepta filtros y paginación válidos (los query llegan como texto)", () => {
    const r = validarConsulta({ estado: "Abierto", prioridad: "alta", pagina: "2", limite: "20" });
    expect(r.filtro).toEqual({ estado: "Abierto", prioridad: "alta" });
    expect(r.pagina).toBe(2);
    expect(r.limite).toBe(20);
  });
  test("rechaza estado, página y límite inválidos", () => {
    expect(validarConsulta({ estado: "x" }).errores).toHaveLength(1);
    expect(validarConsulta({ pagina: "0" }).errores).toHaveLength(1);
    expect(validarConsulta({ pagina: "abc" }).errores).toHaveLength(1);
    expect(validarConsulta({ limite: "1000" }).errores).toHaveLength(1);
  });
});

describe("validarId (middleware)", () => {
  const ejecutar = (id) => {
    const req = { params: { id } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    validarId(req, res, next);
    return { req, res, next };
  };
  test("acepta un entero positivo", () => {
    const { req, next } = ejecutar("7");
    expect(next).toHaveBeenCalled();
    expect(req.id).toBe(7);
  });
  test.each(["abc", "-1", "0", "1.5"])("rechaza %s con 400", (id) => {
    const { res, next } = ejecutar(id);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
