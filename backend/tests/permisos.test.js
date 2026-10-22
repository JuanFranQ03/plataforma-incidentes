const { puedeRealizar, MATRIZ } = require("../reglas/permisos");

describe("matriz de permisos por rol", () => {
  test.each([
    ["lector", "consultar", false],
    ["lector", "crear", false],
    ["lector", "actualizar", false],
    ["lector", "eliminar", false],
    ["analista", "consultar", true],
    ["analista", "crear", true],
    ["analista", "actualizar", true],
    ["analista", "eliminar", false],
    ["admin", "consultar", true],
    ["admin", "crear", true],
    ["admin", "actualizar", true],
    ["admin", "eliminar", true],
  ])("%s / %s -> %s", (rol, accion, esperado) => {
    expect(puedeRealizar(rol, accion)).toBe(esperado);
  });

  test("deniega roles y acciones desconocidos", () => {
    expect(puedeRealizar("invitado", "consultar")).toBe(false);
    expect(puedeRealizar("admin", "formatear")).toBe(false);
    expect(puedeRealizar(undefined, "consultar")).toBe(false);
  });

  test("solo el admin puede eliminar", () => {
    expect(MATRIZ.eliminar).toEqual(["admin"]);
  });
});
