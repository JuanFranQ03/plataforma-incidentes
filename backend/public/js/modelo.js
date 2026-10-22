/* exported Modelo */
class Modelo {
  constructor() {
    // Mismo origen en producción y en http://localhost:3000. Solo si el HTML se abre con Live Server
    // (puertos 5500/5501) se apunta al backend local.
    const conLiveServer = ['5500', '5501'].includes(window.location.port);
    this.urlBase = conLiveServer ? 'http://localhost:3000' : '';
    this.incidentes = [];
    this.total = 0; // total de incidentes en el servidor (cabecera X-Total-Count)
    this.usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    this.token = sessionStorage.getItem('token');
  }

  // ---------- Sesión ----------
  estaAutenticado() { return Boolean(this.token && this.usuario); }

  guardarSesion(token, usuario) {
    this.token = token;
    this.usuario = usuario;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
  }

  cerrarSesion() {
    this.token = null;
    this.usuario = null;
    this.incidentes = [];
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
  }

  // ---------- Petición genérica con JWT ----------
  async solicitar(ruta, opciones = {}) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (this.token) cabeceras.Authorization = `Bearer ${this.token}`;

    const respuesta = await fetch(this.urlBase + ruta, { ...opciones, headers: cabeceras });

    const total = respuesta.headers.get('X-Total-Count');
    if (total !== null) this.total = Number(total);

    if (respuesta.status === 204) return null;
    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const detalle = Array.isArray(cuerpo.details) ? cuerpo.details.join('. ') : (cuerpo.details || cuerpo.message || '');
      const error = new Error(detalle || `Error HTTP ${respuesta.status}`);
      error.status = respuesta.status;
      throw error;
    }
    return cuerpo;
  }

  // ---------- Autenticación ----------
  async login(email, password) {
    const datos = await this.solicitar('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    this.guardarSesion(datos.token, datos.usuario);
    return datos.usuario;
  }

  registrarUsuario(nombre, email, password) {
    return this.solicitar('/auth/register', { method: 'POST', body: JSON.stringify({ nombre, email, password }) });
  }

  // ---------- CRUD de incidentes ----------
  async obtenerIncidentes(filtros = {}, pagina = 1) {
    const q = new URLSearchParams();
    if (pagina > 1) q.set('pagina', pagina);
    if (filtros.estado) q.set('estado', filtros.estado);
    if (filtros.prioridad) q.set('prioridad', filtros.prioridad);
    const sufijo = q.toString() ? `?${q}` : '';
    const datos = await this.solicitar(`/incidentes${sufijo}`);
    // pagina 1 reemplaza la lista; las siguientes se agregan al final
    this.incidentes = pagina === 1 ? datos : [...this.incidentes, ...datos];
    return this.incidentes;
  }

  crearIncidente(incidente) {
    return this.solicitar('/incidentes', { method: 'POST', body: JSON.stringify(incidente) });
  }

  actualizarIncidente(id, cambios) {
    return this.solicitar(`/incidentes/${id}`, { method: 'PUT', body: JSON.stringify(cambios) });
  }

  eliminarIncidente(id) {
    return this.solicitar(`/incidentes/${id}`, { method: 'DELETE' });
  }
}
