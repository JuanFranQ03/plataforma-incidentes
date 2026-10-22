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
});