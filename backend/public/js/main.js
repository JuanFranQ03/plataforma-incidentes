/* global Modelo, Vista, Controlador */
// Arranque de la aplicación (archivo externo: la CSP no permite scripts en línea).
document.addEventListener('DOMContentLoaded', () => {
  const app = new Controlador(new Modelo(), new Vista());
  app.inicializar();

  const boton = document.getElementById('btn-menu');
  const nav = document.querySelector('.site-nav');
  boton.addEventListener('click', () => {
    nav.classList.toggle('open');
    boton.textContent = nav.classList.contains('open') ? '✕ Menú' : '☰ Menú';
  });

  // Botón "Mostrar / Ocultar" de las contraseñas (por defecto siempre ocultas)
  const ocultarClave = (btn) => {
    document.getElementById(btn.dataset.destino).type = 'password';
    btn.title = 'Mostrar contraseña';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Mostrar contraseña');
  };
  document.querySelectorAll('.ver-clave').forEach((btn) => {
    btn.addEventListener('click', () => {
      const campo = document.getElementById(btn.dataset.destino);
      if (campo.type === 'password') {
        campo.type = 'text';
        btn.title = 'Ocultar contraseña';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        ocultarClave(btn);
      }
    });
    // al enviar el formulario la contraseña vuelve a quedar oculta
    btn.closest('form').addEventListener('submit', () => ocultarClave(btn));
  });
});
