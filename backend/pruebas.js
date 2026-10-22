// Ejecutar con el servidor encendido y tras "npm run seed":  node pruebas.js
// Genera la tabla de resultados en pruebas-resultados.md
const fs = require("fs");
const BASE = process.env.API || "http://localhost:3000";
const resultados = [];

async function api(ruta, { metodo = "GET", token, body, headers = {} } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + ruta, { method: metodo, headers: h, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  let json = null;
  try { json = JSON.parse(txt); } catch { json = null; /* respuesta sin cuerpo JSON (p. ej. 204) */ }
  return { status: r.status, json };
}
const login = async (email, password) => (await api("/auth/login", { metodo: "POST", body: { email, password } })).json?.token;

function caso(id, descripcion, esperado, obtenido, extra = "") {
  const ok = esperado === obtenido;
  resultados.push({ id, descripcion, esperado, obtenido, ok, extra });
  console.log(`${ok ? "OK  " : "FAIL"} #${id} ${descripcion} -> esperado ${esperado}, obtenido ${obtenido}`);
}

const valido = {
  tipo: "phishing", fecha: "2026-10-01", prioridad: "alta", sistemaAfectado: "Servidor de correo",
  confidencialidad: "restringido", descripcion: "Correos fraudulentos dirigidos al área financiera con enlaces maliciosos.",
};

(async () => {
  const cred = (v, d) => process.env[v] || d;
  const admin = await login("admin@incidentes.local", cred("SEED_ADMIN_PASSWORD", "Admin12345"));
  const analista = await login("analista@incidentes.local", cred("SEED_ANALISTA_PASSWORD", "Analista123"));
  const lector = await login("lector@incidentes.local", cred("SEED_LECTOR_PASSWORD", "Lector12345"));
  if (!admin || !analista || !lector) { console.error("No se pudo iniciar sesión con los usuarios del seed. ¿Ejecutó npm run seed?"); process.exit(1); }

  let r = await api("/incidentes");
  caso(1, "Consultar incidentes SIN token", 401, r.status);

  r = await api("/incidentes", { token: "abc.def.ghi" });
  caso(2, "Consultar con token inválido/manipulado", 401, r.status);

  r = await api("/auth/login", { metodo: "POST", body: { email: "admin@incidentes.local", password: "incorrecta1" } });
  caso(3, "Login con contraseña incorrecta", 401, r.status);

  r = await api("/incidentes", { metodo: "POST", token: lector, body: valido });
  caso(4, "Lector intenta CREAR (permisos insuficientes)", 403, r.status);

  r = await api("/incidentes", { metodo: "POST", token: analista, body: { ...valido, descripcion: "corta", tipo: "hack" } });
  caso(5, "Crear con datos inválidos (descripción corta, tipo fuera de lista)", 400, r.status);

  r = await api("/incidentes", { metodo: "POST", token: analista, body: { ...valido, descripcion: "<script>alert(1)</script> Ataque de phishing detectado en el correo corporativo" } });
  caso(6, "Crear válido con intento de XSS (analista)", 201, r.status);
  const id = r.json?.id;
  caso(7, "El HTML malicioso fue eliminado de la descripción", true, !/<script/i.test(r.json?.descripcion || "<script"));

  r = await api("/incidentes", { token: lector });
  caso(8, "Lector CONSULTA lista de incidentes", 200, r.status);

  r = await api(`/incidentes/${id}`, { token: lector });
  caso(9, "Consultar incidente por ID", 200, r.status);

  r = await api(`/incidentes/${id}`, { metodo: "PUT", token: analista, body: { estado: "En proceso", id: 9999, rol: "admin" } });
  caso(10, "Analista ACTUALIZA estado (campos extra ignorados)", 200, r.status);
  caso(11, "El id enviado en el body NO se modificó (mass assignment)", id, r.json?.id);

  r = await api(`/incidentes/${id}`, { metodo: "PUT", token: analista, body: { estado: "Hackeado" } });
  caso(12, "Actualizar con estado inválido", 400, r.status);

  r = await api(`/incidentes/${id}`, { metodo: "DELETE", token: analista });
  caso(13, "Analista intenta ELIMINAR (solo admin)", 403, r.status);

  r = await api("/incidentes/abc", { token: admin });
  caso(14, "ID no numérico", 400, r.status);

  r = await api("/incidentes/999999", { token: admin });
  caso(15, "Incidente inexistente", 404, r.status);

  r = await api(`/incidentes/${id}`, { metodo: "DELETE", token: admin });
  caso(16, "Admin ELIMINA incidente", 204, r.status);

  const email = `prueba${Date.now()}@test.com`;
  r = await api("/auth/register", { metodo: "POST", body: { nombre: "Intruso", email, password: "Clave12345", rol: "admin" } });
  caso(17, "Registro público con rol=admin: debe crearse como lector", "lector", r.json?.rol);

  r = await api("/auth/register", { metodo: "POST", body: { nombre: "X", email: "no-es-email", password: "123" } });
  caso(18, "Registro con datos inválidos", 400, r.status);

  r = await api("/incidentes", { headers: { Origin: "http://sitio-malicioso.com" }, token: admin });
  caso(19, "CORS: origen no permitido", 403, r.status);

  r = await api("/salud");
  caso(20, "Health check /salud responde con la base de datos conectada", "200:conectada", `${r.status}:${r.json?.baseDeDatos}`);

  const md = ["| # | Caso | Esperado | Obtenido | Resultado |", "|---|------|----------|----------|-----------|",
    ...resultados.map(c => `| ${c.id} | ${c.descripcion} | ${c.esperado} | ${c.obtenido} | ${c.ok ? "✅ Pasó" : "❌ Falló"} |`)].join("\n");
  fs.writeFileSync("pruebas-resultados.md", md + "\n");
  console.log(`\n${resultados.filter(c => c.ok).length}/${resultados.length} casos pasaron. Tabla en pruebas-resultados.md`);
})();
