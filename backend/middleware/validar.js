// Listas blancas (coinciden con los <option> del formulario)
const TIPOS = ["malware", "phishing", "ddos", "brute-force", "data-leak", "unauthorized-access"];
const PRIORIDADES = ["alta", "media", "baja"];
const CONFIDENCIALIDAD = ["critico", "restringido", "interno"];
const ESTADOS = ["Abierto", "En proceso", "Cerrado"];

// Limpieza: quita caracteres de control y etiquetas HTML, y recorta espacios
function limpiar(valor) {
  // Los caracteres de control se eliminan a propósito (sanitización de entrada)
  /* eslint-disable no-control-regex */
  return String(valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
  /* eslint-enable no-control-regex */
}

function validarFecha(valor) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(valor))) return null;
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return null;
  const manana = Date.now() + 24 * 60 * 60 * 1000; // tolera diferencia de zona horaria
  if (f.getTime() > manana) return null;
  return f;
}

/**
 * Valida y sanea los datos de un incidente.
 * parcial=true (PUT): solo se validan los campos presentes.
 * Devuelve { datos, errores }. Solo se copian campos permitidos (evita mass assignment).
 */
function validarIncidente(body, parcial = false) {
  const b = body && typeof body === "object" ? body : {};
  const datos = {};
  const errores = [];

  const presente = (c) => b[c] !== undefined;
  const requerido = (c) => !parcial && !presente(c);

  // Texto: enumeraciones
  const enumerado = (campo, lista) => {
    if (requerido(campo)) return errores.push(`${campo} es obligatorio`);
    if (!presente(campo)) return;
    if (typeof b[campo] !== "string" || !lista.includes(b[campo])) {
      errores.push(`${campo} inválido (permitidos: ${lista.join(", ")})`);
    } else datos[campo] = b[campo];
  };
  enumerado("tipo", TIPOS);
  enumerado("prioridad", PRIORIDADES);
  enumerado("confidencialidad", CONFIDENCIALIDAD);
  if (parcial) enumerado("estado", ESTADOS);

  // Fecha
  if (requerido("fecha")) errores.push("fecha es obligatoria");
  else if (presente("fecha")) {
    const f = validarFecha(b.fecha);
    if (!f) errores.push("fecha inválida o futura (formato AAAA-MM-DD)");
    else datos.fecha = f;
  }

  // Sistema afectado
  if (requerido("sistemaAfectado")) errores.push("sistemaAfectado es obligatorio");
  else if (presente("sistemaAfectado")) {
    const s = typeof b.sistemaAfectado === "string" ? limpiar(b.sistemaAfectado) : "";
    if (s.length < 2 || s.length > 100) errores.push("sistemaAfectado debe tener entre 2 y 100 caracteres");
    else datos.sistemaAfectado = s;
  }

  // Descripción
  if (requerido("descripcion")) errores.push("descripcion es obligatoria");
  else if (presente("descripcion")) {
    const d = typeof b.descripcion === "string" ? limpiar(b.descripcion) : "";
    if (d.length < 30 || d.length > 400) errores.push("descripcion debe tener entre 30 y 400 caracteres");
    else datos.descripcion = d;
  }

  if (parcial && errores.length === 0 && Object.keys(datos).length === 0) {
    errores.push("No se enviaron campos válidos para actualizar");
  }

  return { datos, errores };
}

function validarCredenciales(body, { registro = false } = {}) {
  const b = body && typeof body === "object" ? body : {};
  const errores = [];
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const nombre = typeof b.nombre === "string" ? limpiar(b.nombre) : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) errores.push("email inválido");
  if (!password || password.length > 72) errores.push("password inválida");
  if (registro) {
    if (nombre.length < 2 || nombre.length > 60) errores.push("nombre debe tener entre 2 y 60 caracteres");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errores.push("password debe tener mínimo 8 caracteres, con letras y números");
    }
  }
  return { datos: { email, password, nombre }, errores };
}

/**
 * Valida los parámetros de consulta del listado: filtros y paginación.
 * pagina >= 1; limite entre 1 y LIMITE_MAXIMO (por defecto 50).
 */
const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 100;

function validarConsulta(query) {
  const q = query && typeof query === "object" ? query : {};
  const errores = [];
  const filtro = {};

  if (q.estado !== undefined) {
    if (!ESTADOS.includes(q.estado)) errores.push("estado inválido");
    else filtro.estado = q.estado;
  }
  if (q.prioridad !== undefined) {
    if (!PRIORIDADES.includes(q.prioridad)) errores.push("prioridad inválida");
    else filtro.prioridad = q.prioridad;
  }

  let pagina = 1;
  if (q.pagina !== undefined) {
    pagina = Number(q.pagina);
    if (!Number.isInteger(pagina) || pagina < 1) errores.push("pagina debe ser un entero >= 1");
  }

  let limite = LIMITE_POR_DEFECTO;
  if (q.limite !== undefined) {
    limite = Number(q.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAXIMO) {
      errores.push(`limite debe ser un entero entre 1 y ${LIMITE_MAXIMO}`);
    }
  }

  return { filtro, pagina, limite, errores };
}

function validarId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Validation failed", details: "ID inválido" });
  }
  req.id = id;
  next();
}

module.exports = {
  limpiar,
  validarFecha,
  validarIncidente,
  validarCredenciales,
  validarConsulta,
  validarId,
  TIPOS,
  PRIORIDADES,
  CONFIDENCIALIDAD,
  ESTADOS,
};
