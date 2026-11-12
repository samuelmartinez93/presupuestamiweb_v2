const test = require('node:test');
const assert = require('node:assert/strict');

const tarifas = require('../src/tarifas');
const validarSeleccion = require('../src/validarSeleccion');
const calcularPresupuesto = require('../src/calcular');

test('acepta una selección completa y la convierte en datos de cálculo', () => {
  const resultado = validarSeleccion({
    servicios: [
      { id: 'corporativa' },
      { id: 'paginaAdicional', cantidad: 3 },
      { id: 'formulario' }
    ]
  });

  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.datos, {
    tipo: 'corporativa',
    paginas: 4,
    formulario: true,
    segundoIdioma: false
  });

  const presupuesto = calcularPresupuesto(resultado.datos);
  assert.equal(presupuesto.total, tarifas.corporativa + 3 * tarifas.paginaAdicional + tarifas.formulario);
});

test('exige un tipo de web', () => {
  const resultado = validarSeleccion({ servicios: [{ id: 'formulario' }] });
  assert.equal(resultado.ok, false);
  assert.match(resultado.errores.join(' '), /Elige un tipo de web/);
});

test('no permite dos tipos de web a la vez', () => {
  const resultado = validarSeleccion({ servicios: [{ id: 'landing' }, { id: 'corporativa' }] });
  assert.equal(resultado.ok, false);
  assert.match(resultado.errores.join(' '), /solo un tipo/);
});

test('pide la cantidad de páginas adicionales si falta o no es válida', () => {
  const sinCantidad = validarSeleccion({ servicios: [{ id: 'landing' }, { id: 'paginaAdicional' }] });
  assert.equal(sinCantidad.ok, false);
  assert.match(sinCantidad.errores.join(' '), /cuántas páginas adicionales/);

  for (const cantidad of [0, 20, 2.5, '3']) {
    const resultado = validarSeleccion({ servicios: [{ id: 'landing' }, { id: 'paginaAdicional', cantidad }] });
    assert.equal(resultado.ok, false);
  }
});

test('rechaza servicios fuera del catálogo y repetidos', () => {
  const inventado = validarSeleccion({ servicios: [{ id: 'landing' }, { id: 'tiendaOnline' }] });
  assert.equal(inventado.ok, false);
  assert.match(inventado.errores.join(' '), /no existe en el catálogo/);

  const repetido = validarSeleccion({ servicios: [{ id: 'landing' }, { id: 'formulario' }, { id: 'formulario' }] });
  assert.equal(repetido.ok, false);
  assert.match(repetido.errores.join(' '), /repetido/);
});

test('rechaza una selección vacía o con formato incorrecto', () => {
  assert.equal(validarSeleccion({ servicios: [] }).ok, false);
  assert.equal(validarSeleccion({}).ok, false);
  assert.equal(validarSeleccion(null).ok, false);
});
