const { buscarServicioPorId } = require('./catalogo');
const { MAX_PAGINAS } = require('./proponer');

const TIPOS_BASE = ['landing', 'corporativa'];
const MAX_SERVICIOS = 10;

// Valida la selección de servicios confirmada por el usuario y la convierte
// en los datos que necesita calcularPresupuesto.
function validarSeleccion(body) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.servicios)) {
    return { ok: false, errores: ['Debes enviar la lista de servicios seleccionados.'] };
  }

  const { servicios } = body;
  const errores = [];

  if (servicios.length === 0) {
    return { ok: false, errores: ['La selección no puede estar vacía.'] };
  }

  if (servicios.length > MAX_SERVICIOS) {
    return { ok: false, errores: ['La selección tiene demasiados servicios.'] };
  }

  const ids = new Set();
  let cantidadPaginas = 0;

  for (const item of servicios) {
    const id = item && item.id;

    if (!buscarServicioPorId(id)) {
      errores.push(`El servicio "${id}" no existe en el catálogo.`);
      continue;
    }

    if (ids.has(id)) {
      errores.push(`El servicio "${id}" está repetido.`);
      continue;
    }

    ids.add(id);

    if (id === 'paginaAdicional') {
      const cantidad = item.cantidad;
      const maximo = MAX_PAGINAS - 1;

      if (cantidad === undefined || cantidad === null || cantidad === '') {
        errores.push('Indica cuántas páginas adicionales necesitas.');
      } else if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > maximo) {
        errores.push(`Las páginas adicionales deben ser un número entero entre 1 y ${maximo}.`);
      } else {
        cantidadPaginas = cantidad;
      }
    }
  }

  const tipos = TIPOS_BASE.filter((tipo) => ids.has(tipo));

  if (tipos.length === 0) {
    errores.push('Elige un tipo de web: Landing o Web corporativa.');
  } else if (tipos.length > 1) {
    errores.push('Elige solo un tipo de web: Landing o Web corporativa.');
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      tipo: tipos[0],
      paginas: 1 + cantidadPaginas,
      formulario: ids.has('formulario'),
      segundoIdioma: ids.has('segundoIdioma')
    }
  };
}

module.exports = validarSeleccion;
