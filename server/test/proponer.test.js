const test = require('node:test');
const assert = require('node:assert/strict');

const { proponerServiciosDesdeTexto } = require('../src/proponer');

const ENUNCIADO =
  'Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.';

test('el texto del enunciado propone corporativa, página de carta, formulario y segundo idioma', () => {
  const propuesta = proponerServiciosDesdeTexto(ENUNCIADO);
  const ids = propuesta.servicios.map((servicio) => servicio.id);

  assert.deepEqual(ids, ['corporativa', 'paginaAdicional', 'formulario', 'segundoIdioma']);
  assert.equal(propuesta.paginas, 2);
});

test('la propuesta automática incluye resumen y dudas, como la de la IA', () => {
  const propuesta = proponerServiciosDesdeTexto(ENUNCIADO);

  assert.match(propuesta.resumen, /web corporativa/);
  assert.ok(propuesta.dudas.includes('¿Qué segundo idioma se necesita?'));
});

test('lo que no está en el catálogo queda pendiente de valorar, sin precio', () => {
  const propuesta = proponerServiciosDesdeTexto('Quiero una tienda online con pasarela de pago y un blog.');
  const necesidades = propuesta.pendientes.map((item) => item.necesidad);

  assert.ok(necesidades.includes('Tienda online'));
  assert.ok(necesidades.includes('Pagos online'));
  assert.ok(necesidades.includes('Blog'));
  assert.ok(propuesta.servicios.every((servicio) => !/tienda|blog|pago/i.test(servicio.id)));
});
