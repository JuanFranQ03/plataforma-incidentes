/* exported Controlador */
class Controlador {
  constructor(modelo, vista) {
    this.modelo = modelo;
    this.vista = vista;
    this.formulario = document.querySelector('#formulario-incidente');
    this.idEnEdicion = null;
    this.pagina = 1;
  }

  async inicializar() {
    this.vincularEventos();
    this.vista.actualizarSesion(this.modelo.usuario);
    if (this.modelo.estaAutenticado()) await this.cargarIncidentes();
  }

  vincularEventos() {
    this.formulario.addEventListener('submit', (e) => { e.preventDefault(); this.validarYProcesar(); });

    document.querySelector('#formulario-login').addEventListener('submit', (e) => { e.preventDefault(); this.iniciarSesion(); });
    document.querySelector('#formulario-registro-usuario').addEventListener('submit', (e) => { e.preventDefault(); this.registrarUsuario(); });
    document.querySelector('#btn-logout').addEventListener('click', () => this.cerrarSesion());
    document.querySelector('#btn-cancelar-edicion').addEventListener('click', () => this.cancelarEdicion());

    document.querySelector('#filtro-estado').addEventListener('change', () => this.cargarIncidentes());
    document.querySelector('#filtro-prioridad').addEventListener('change', () => this.cargarIncidentes());

    // Delegación de eventos para Editar / Eliminar
    this.vista.contenedor.addEventListener('click', (e) => {
      const boton = e.target.closest('button[data-accion]');
      if (!boton) return;
      if (boton.dataset.accion === 'mas') return this.cargarMas();
      const id = Number(boton.dataset.id);
      if (boton.dataset.accion === 'editar') this.iniciarEdicion(id);
      if (boton.dataset.accion === 'eliminar') this.eliminar(id);
    });
  }

  // Manejo común de errores de la API
  manejarError(error, mensajePorDefecto) {
    if (error.status === 401 && this.modelo.estaAutenticado()) {
      this.cerrarSesion();
      this.vista.mostrarAlerta('Su sesión expiró o es inválida. Inicie sesión nuevamente', 'error');
    } else if (error.status === 403) {
      this.vista.mostrarAlerta('No tiene permisos para realizar esta acción', 'error');
    } else if (error.status) {
      this.vista.mostrarAlerta(error.message, 'error');
    } else {
      this.vista.mostrarAlerta(mensajePorDefecto, 'error');
    }
  }

  // ---------- Sesión ----------
  async iniciarSesion() {
    try {
      const email = document.querySelector('#login-email').value.trim();
      const password = document.querySelector('#login-password').value;
      const usuario = await this.modelo.login(email, password);
      document.querySelector('#formulario-login').reset();
      this.vista.actualizarSesion(usuario);
      this.vista.mostrarAlerta(`Bienvenido, ${usuario.nombre}`, 'exito');
      await this.cargarIncidentes();
    } catch (error) {
      this.manejarError(error, 'No se pudo conectar con el servidor');
    }
  }

  async registrarUsuario() {
    try {
      await this.modelo.registrarUsuario(
        document.querySelector('#reg-nombre').value,
        document.querySelector('#reg-email').value,
        document.querySelector('#reg-password').value
      );
      document.querySelector('#formulario-registro-usuario').reset();
      this.vista.mostrarAlerta('Cuenta creada. Ya puede iniciar sesión', 'exito');
    } catch (error) {
      this.manejarError(error, 'No se pudo conectar con el servidor');
    }
  }

  cerrarSesion() {
    this.modelo.cerrarSesion();
    this.cancelarEdicion();
    this.vista.contenedor.innerHTML = '';
    this.vista.actualizarSesion(null);
  }

  // ---------- Consultar ----------
  async cargarIncidentes(pagina = 1) {
    try {
      this.pagina = pagina;
      const filtros = {
        estado: document.querySelector('#filtro-estado').value,
        prioridad: document.querySelector('#filtro-prioridad').value
      };
      const datos = await this.modelo.obtenerIncidentes(filtros, pagina);
      this.vista.renderizarLista(datos, this.modelo.usuario.rol, this.modelo.total);
    } catch (error) {
      this.manejarError(error, 'No se pudieron cargar los incidentes');
    }
  }

  cargarMas() {
    return this.cargarIncidentes(this.pagina + 1);
  }

  // ---------- Crear / Actualizar ----------
  async validarYProcesar() {
    const campos = {
      tipo: document.querySelector('#tipo'),
      fecha: document.querySelector('#fecha'),
      prioridad: document.querySelector('#prioridad'),
      sistema: document.querySelector('#sistema'),
      confidencialidad: document.querySelector('#confidencialidad'),
      descripcion: document.querySelector('#descripcion')
    };
    this.vista.limpiarErrores(Object.values(campos));

    if (campos.descripcion.value.trim().length < 30) {
      campos.descripcion.classList.add('input-error');
      this.vista.mostrarAlerta('Error: La descripcion debe contener un minimo de 30 caracteres', 'error');
      return;
    }

    const datos = {
      tipo: campos.tipo.value,
      fecha: campos.fecha.value,
      prioridad: campos.prioridad.value,
      sistemaAfectado: campos.sistema.value,
      confidencialidad: campos.confidencialidad.value,
      descripcion: campos.descripcion.value
    };

    // Evita el doble envío: con dos clics rápidos se creaban incidentes duplicados (2 POST en Network)
    const boton = document.querySelector('#btn-guardar');
    if (boton.disabled) return;
    boton.disabled = true;

    try {
      if (this.idEnEdicion) {
        await this.modelo.actualizarIncidente(this.idEnEdicion, datos);
        this.vista.mostrarAlerta('Incidente actualizado correctamente', 'exito');
        this.cancelarEdicion();
      } else {
        await this.modelo.crearIncidente(datos);
        this.vista.mostrarAlerta('Incidente registrado correctamente en el servidor', 'exito');
        this.formulario.reset();
      }
      await this.cargarIncidentes();
    } catch (error) {
      this.manejarError(error, 'Fallo de red al intentar guardar');
    } finally {
      boton.disabled = false;
    }
  }

  iniciarEdicion(id) {
    const incidente = this.modelo.incidentes.find(i => i.id === id);
    if (!incidente) return;
    this.idEnEdicion = id;
    this.vista.modoEdicion(true, incidente);
  }

  cancelarEdicion() {
    this.idEnEdicion = null;
    this.formulario.reset();
    this.vista.modoEdicion(false);
  }

  // ---------- Eliminar ----------
  async eliminar(id) {
    const confirmado = await this.vista.confirmar(
      `¿Está seguro de eliminar el incidente #${id}?`,
      'Esta acción no se puede deshacer.',
      'Sí, eliminar'
    );
    if (!confirmado) return;
    try {
      await this.modelo.eliminarIncidente(id);
      this.vista.mostrarAlerta('Incidente eliminado', 'exito');
      await this.cargarIncidentes();
    } catch (error) {
      this.manejarError(error, 'Fallo de red al eliminar');
    }
  }
}
