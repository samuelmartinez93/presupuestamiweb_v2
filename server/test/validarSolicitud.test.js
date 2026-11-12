const test = require('node:test');
const assert = require('node:assert/strict');

const { validarSolicitud, LIMITES } = require('../src/validarSolicitud');

// Datos ficticios para las pruebas.
const SOLICITUD_VALIDA = {
  nombre: 'Restaurante La Brasa (ficticio)',
  descripcion: 'Necesito una web para un restaurante con la carta y un formulario de reservas.'
};

test('acepta una solicitud válida y recorta los espacios', () => {
  const resultado = validarSolicitud({
    nombre: `  ${SOLICITUD_VALIDA.nombre}  `,
    descripcion: `  ${SOLICITUD_VALIDA.descripcion}\n`
  });

  assert.equal(resultado.valido, true);
  assert.deepEqual(resultado.datos, SOLICITUD_VALIDA);
});

test('rechaza una descripción vacía o solo con espacios', () => {
  for (const descripcion of [undefined, '', '    ', 123]) {
    const resultado = validarSolicitud({ ...SOLICITUD_VALIDA, descripcion });
    assert.equal(resultado.valido, false);
    assert.match(resultado.errores[0], /no puede estar vacía/);
  }
});

test('rechaza una descripción demasiado corta', () => {
  const resultado = validarSolicitud({ ...SOLICITUD_VALIDA, descripcion: 'Una web' });
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores[0], /al menos/);
});

test('rechaza una descripción que supera el límite de longitud', () => {
  const resultado = validarSolicitud({
    ...SOLICITUD_VALIDA,
    descripcion: 'a'.repeat(LIMITES.descripcionMax + 1)
  });
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores[0], /no puede superar/);
});

test('acepta una descripción justo en el límite', () => {
  const resultado = validarSolicitud({
    ...SOLICITUD_VALIDA,
    descripcion: 'a'.repeat(LIMITES.descripcionMax)
  });
  assert.equal(resultado.valido, true);
});

test('exige el nombre del cliente y limita su longitud', () => {
  assert.equal(validarSolicitud({ ...SOLICITUD_VALIDA, nombre: '  ' }).valido, false);
  assert.equal(
    validarSolicitud({ ...SOLICITUD_VALIDA, nombre: 'x'.repeat(LIMITES.nombreMax + 1) }).valido,
    false
  );
});

test('rechaza un cuerpo que no es un objeto', () => {
  assert.equal(validarSolicitud(null).valido, false);
  assert.equal(validarSolicitud([]).valido, false);
});
