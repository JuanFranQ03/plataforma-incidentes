/* exported Vista */
class Vista {
  constructor() {
    this.contenedor = document.querySelector('#contenedor-incidentes');
    this.mensajes = document.querySelector('#mensajes-sistema');
    this.temporizadorAlerta = null;
  }

  // Escapa HTML para evitar XSS al mostrar datos
  escapar(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // rol: 'lector' | 'analista' | 'admin' (solo controla qué botones se muestran;
  // la autorización real la hace el servidor)
  renderizarLista(incidentes, rol, total = incidentes.length) {
    this.contenedor.innerHTML = '';
    if (!incidentes.length) {
      this.contenedor.innerHTML = '<p>No hay incidentes para mostrar.</p>';
      return;
    }
    const puedeEditar = rol === 'analista' || rol === 'admin';
    const puedeEliminar = rol === 'admin';

    incidentes.forEach(inc => {
      const e = (v) => this.escapar(v);
      const articulo = document.createElement('article');
      articulo.classList.add('incidente-dinamico');
      articulo.innerHTML = `
  <h3>Incidente #${e(inc.id)} - ${e(inc.tipo)}</h3>
  <p><strong>Fecha:</strong> ${e(this.formatearFecha(inc.fecha))} | <strong>Prioridad:</strong> ${e(inc.prioridad)} | <strong>Estado:</strong> ${e(inc.estado)}</p>
  <p><strong>Sistema:</strong> ${e(inc.sistemaAfectado)} | <strong>Confidencialidad:</strong> ${e(inc.confidencialidad)}</p>
  <p>${e(inc.descripcion)}</p>
  <div class="acciones">
    ${puedeEditar ? `<button type="button" data-accion="editar" data-id="${Number(inc.id)}">Editar</button>` : ''}
    ${puedeEliminar ? `<button type="button" class="peligro" data-accion="eliminar" data-id="${Number(inc.id)}">Eliminar</button>` : ''}
  </div>`;
      this.contenedor.appendChild(articulo);
    });

    this.contenedor.insertAdjacentHTML('beforeend', `
  <div class="paginacion">
    <span>Mostrando ${incidentes.length} de ${Number(total)} incidentes</span>
    ${incidentes.length < total ? '<button type="button" data-accion="mas">Cargar más</button>' : ''}
  </div>`);

    $('.incidente-dinamico').hide().fadeIn(500);
  }

  // La fecha se guarda a medianoche UTC; formatearla en la zona local mostraba el día anterior
  // en zonas UTC-5 (ej. Ecuador). Se formatea en UTC para mostrar el día guardado.
  formatearFecha(valor) {
    return new Date(valor).toLocaleDateString('es-EC', { timeZone: 'UTC' });
  }

  mostrarAlerta(mensaje, tipo) {
    this.mensajes.textContent = mensaje;
    this.mensajes.className = `alerta ${tipo}`;
    $(this.mensajes).stop(true, true).slideDown(300);
    // Se cancela el temporizador anterior: si no, una alerta nueva se ocultaba antes de tiempo
    clearTimeout(this.temporizadorAlerta);
    this.temporizadorAlerta = setTimeout(() => $(this.mensajes).slideUp(300), 5000);
  }

  limpiarErrores(campos) {
    campos.forEach(campo => campo.classList.remove('input-error'));
  }

  // Muestra u oculta paneles según la sesión y el rol
  actualizarSesion(usuario) {
    const logueado = Boolean(usuario);
    const rol = usuario ? usuario.rol : null;
    document.querySelector('#panel-login').classList.toggle('oculta', logueado);
    document.querySelector('#panel-sesion').classList.toggle('oculta', !logueado);
    document.querySelector('#incidentes').classList.toggle('oculta', !logueado);
    document.querySelector('#registro').classList.toggle('oculta', !(rol === 'analista' || rol === 'admin'));
    if (logueado) {
      document.querySelector('#sesion-nombre').textContent = usuario.nombre;
      document.querySelector('#sesion-rol').textContent = usuario.rol;
    }
  }

  modoEdicion(activo, incidente) {
    document.querySelector('#titulo-formulario').textContent = activo ? `Editando incidente #${incidente.id}` : 'Registro accesible de incidentes';
    document.querySelector('#btn-guardar').textContent = activo ? 'Guardar cambios' : 'Registrar incidente';
    document.querySelector('#btn-cancelar-edicion').classList.toggle('oculta', !activo);
    if (activo) {
      document.querySelector('#tipo').value = incidente.tipo;
      document.querySelector('#fecha').value = String(incidente.fecha).slice(0, 10);
      document.querySelector('#prioridad').value = incidente.prioridad;
      document.querySelector('#sistema').value = incidente.sistemaAfectado;
      document.querySelector('#confidencialidad').value = incidente.confidencialidad;
      document.querySelector('#descripcion').value = incidente.descripcion;
      document.querySelector('#registro').scrollIntoView({ behavior: 'smooth' });
    }
  }
}
