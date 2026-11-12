const test = require('node:test');
const assert = require('node:assert/strict');

const tarifas = require('../src/tarifas');
const { serviciosCatalogo, buscarServicioPorId } = require('../src/catalogo');
const { proponerServiciosDesdeTexto } = require('../src/proponer');

const EJEMPLO_RESTAURANTE =
  'Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.';

test('cada servicio del catálogo tiene id, nombre, descripción, precio y regla', () => {
  assert.ok(serviciosCatalogo.length > 0);

  for (const servicio of serviciosCatalogo) {
    assert.equal(typeof servicio.id, 'string');
    assert.ok(servicio.nombre);
    assert.ok(servicio.descripcion);
    assert.equal(typeof servicio.precio, 'number');
    assert.ok(servicio.regla);
  }
});

test('el catálogo es el del ejercicio anterior y sus precios salen de tarifas.js', () => {
  const ids = serviciosCatalogo.map((servicio) => servicio.id).sort();
  assert.deepEqual(ids, ['corporativa', 'formulario', 'landing', 'paginaAdicional', 'segundoIdioma']);

  for (const servicio of serviciosCatalogo) {
    assert.equal(servicio.precio, tarifas[servicio.id]);
  }
});

test('buscarServicioPorId devuelve null si el servicio no existe', () => {
  assert.equal(buscarServicioPorId('landing').nombre, 'Landing');
  assert.equal(buscarServicioPorId('tiendaOnline'), null);
});

test('la propuesta del restaurante usa solo servicios del catálogo', () => {
  const propuesta = proponerServiciosDesdeTexto(EJEMPLO_RESTAURANTE);

  assert.equal(propuesta.tipo, 'corporativa');
  assert.equal(propuesta.paginas, 2);
  assert.equal(propuesta.formulario, true);
  assert.equal(propuesta.segundoIdioma, true);
  assert.deepEqual(
    propuesta.servicios.map((servicio) => servicio.id),
    ['corporativa', 'paginaAdicional', 'formulario', 'segundoIdioma']
  );
  assert.deepEqual(propuesta.pendientes, []);

  for (const servicio of propuesta.servicios) {
    assert.ok(buscarServicioPorId(servicio.id));
    assert.equal(servicio.precio, tarifas[servicio.id]);
  }
});

test('lo que no está en el catálogo se marca como pendiente de valorar', () => {
  const propuesta = proponerServiciosDesdeTexto(
    'Quiero una tienda online con pasarela de pago y un blog.'
  );

  const necesidades = propuesta.pendientes.map((item) => item.necesidad);
  assert.deepEqual(necesidades, ['Tienda online', 'Pagos online', 'Blog']);

  for (const servicio of propuesta.servicios) {
    assert.ok(buscarServicioPorId(servicio.id));
  }
});

test('una petición sencilla propone una landing sin pendientes', () => {
  const propuesta = proponerServiciosDesdeTexto('Quiero una página para presentar mi nuevo libro.');

  assert.equal(propuesta.tipo, 'landing');
  assert.equal(propuesta.paginas, 1);
  assert.deepEqual(propuesta.servicios.map((servicio) => servicio.id), ['landing']);
  assert.deepEqual(propuesta.pendientes, []);
});
