const test = require('node:test');
const assert = require('node:assert/strict');

const tarifas = require('../src/tarifas');
const { serviciosCatalogo } = require('../src/catalogo');
const { ESQUEMA_RESPUESTA, construirInstrucciones, procesarRespuestaIA } = require('../src/ia');

// Respuesta ficticia con la forma que devuelve el modelo.
const RESPUESTA_RESTAURANTE = {
  resumen: 'Web para un restaurante con carta, reservas y dos idiomas.',
  paginas: 3,
  servicios: [
    { id: 'corporativa', justificacion: 'Necesita varias páginas.' },
    { id: 'paginaAdicional', justificacion: 'Carta y contacto en páginas propias.' },
    { id: 'formulario', justificacion: 'Para solicitar reservas.' },
    { id: 'segundoIdioma', justificacion: 'Contenido en dos idiomas.' }
  ],
  dudas: ['¿Qué segundo idioma necesita?'],
  pendientes: []
};

test('las instrucciones incluyen todos los servicios del catálogo', () => {
  const instrucciones = construirInstrucciones();

  for (const servicio of serviciosCatalogo) {
    assert.ok(instrucciones.includes(servicio.id));
  }
});

test('el esquema solo permite identificadores del catálogo', () => {
  const ids = ESQUEMA_RESPUESTA.properties.servicios.items.properties.id.enum;
  assert.deepEqual(ids, serviciosCatalogo.map((servicio) => servicio.id));
});

test('procesa una respuesta válida con precios del servidor', () => {
  const propuesta = procesarRespuestaIA(RESPUESTA_RESTAURANTE);

  assert.equal(propuesta.origen, 'ia');
  assert.equal(propuesta.tipo, 'corporativa');
  assert.equal(propuesta.paginas, 3);
  assert.equal(propuesta.formulario, true);
  assert.equal(propuesta.segundoIdioma, true);
  assert.deepEqual(propuesta.dudas, ['¿Qué segundo idioma necesita?']);
  assert.deepEqual(propuesta.idsDescartados, []);

  const adicional = propuesta.servicios.find((s) => s.id === 'paginaAdicional');
  assert.equal(adicional.cantidad, 2);
  assert.equal(adicional.subtotal, tarifas.paginaAdicional * 2);
  assert.equal(adicional.justificacion, 'Carta y contacto en páginas propias.');
});

test('descarta identificadores que no pertenecen al catálogo', () => {
  const propuesta = procesarRespuestaIA({
    ...RESPUESTA_RESTAURANTE,
    servicios: [
      ...RESPUESTA_RESTAURANTE.servicios,
      { id: 'tiendaOnline', justificacion: 'Inventado.' },
      { id: 'reservas', justificacion: 'Inventado.' }
    ]
  });

  assert.deepEqual(propuesta.idsDescartados, ['tiendaOnline', 'reservas']);
  for (const servicio of propuesta.servicios) {
    assert.ok(serviciosCatalogo.some((s) => s.id === servicio.id));
  }
});

test('deja un solo tipo de web y usa landing si no propone ninguno', () => {
  const dosTipos = procesarRespuestaIA({
    ...RESPUESTA_RESTAURANTE,
    servicios: [{ id: 'landing', justificacion: '' }, { id: 'corporativa', justificacion: '' }]
  });
  assert.deepEqual(
    dosTipos.servicios.filter((s) => ['landing', 'corporativa'].includes(s.id)).map((s) => s.id),
    ['landing']
  );

  const sinTipo = procesarRespuestaIA({ ...RESPUESTA_RESTAURANTE, paginas: 1, servicios: [] });
  assert.deepEqual(sinTipo.servicios.map((s) => s.id), ['landing']);
});

test('ajusta el número de páginas a los límites', () => {
  assert.equal(procesarRespuestaIA({ ...RESPUESTA_RESTAURANTE, paginas: 50 }).paginas, 20);
  assert.equal(procesarRespuestaIA({ ...RESPUESTA_RESTAURANTE, paginas: 0 }).paginas, 1);
  assert.equal(procesarRespuestaIA({ ...RESPUESTA_RESTAURANTE, paginas: 'tres' }).paginas, 1);
});

test('conserva las necesidades pendientes de valorar', () => {
  const propuesta = procesarRespuestaIA({
    ...RESPUESTA_RESTAURANTE,
    pendientes: [{ necesidad: 'Tienda online', motivo: 'No está en el catálogo.' }]
  });
  assert.deepEqual(propuesta.pendientes, [{ necesidad: 'Tienda online', motivo: 'No está en el catálogo.' }]);
});

test('rechaza una respuesta sin el formato esperado', () => {
  assert.throws(() => procesarRespuestaIA(null));
  assert.throws(() => procesarRespuestaIA({ resumen: 'x' }));
});

test('las instrucciones prohíben inventar servicios, precios y compromisos de entrega', () => {
  const instrucciones = construirInstrucciones();
  assert.match(instrucciones, /No inventes servicios/);
  assert.match(instrucciones, /No menciones precios/);
  assert.match(instrucciones, /No adquieras compromisos de entrega/);
});

test('elimina las frases con precios o plazos de entrega', () => {
  const { limpiarCompromisos } = require('../src/ia');

  assert.equal(
    limpiarCompromisos('Web para un restaurante. Costará 900 €. Estará lista en 3 semanas. Incluye reservas.'),
    'Web para un restaurante. Incluye reservas.'
  );
  assert.equal(limpiarCompromisos('Necesita 4 páginas: carta y contacto.'), 'Necesita 4 páginas: carta y contacto.');

  const propuesta = procesarRespuestaIA({
    ...RESPUESTA_RESTAURANTE,
    resumen: 'Web para un restaurante. Te la entregaremos el lunes.'
  });
  assert.equal(propuesta.resumen, 'Web para un restaurante.');
});
