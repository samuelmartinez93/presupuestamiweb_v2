const LIMITES = {
  nombreMax: 100,
  descripcionMin: 20,
  descripcionMax: 1500
};

function validarSolicitud(body) {
  const errores = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valido: false, errores: ['El cuerpo de la petición debe ser un objeto JSON.'] };
  }

  const { nombre, descripcion } = body;

  if (typeof nombre !== 'string' || !nombre.trim()) {
    errores.push('Debes indicar el nombre del cliente o empresa.');
  } else if (nombre.trim().length > LIMITES.nombreMax) {
    errores.push(`El nombre no puede superar los ${LIMITES.nombreMax} caracteres.`);
  }

  if (typeof descripcion !== 'string' || !descripcion.trim()) {
    errores.push('La descripción del proyecto no puede estar vacía.');
  } else if (descripcion.trim().length < LIMITES.descripcionMin) {
    errores.push(`La descripción debe tener al menos ${LIMITES.descripcionMin} caracteres.`);
  } else if (descripcion.trim().length > LIMITES.descripcionMax) {
    errores.push(`La descripción no puede superar los ${LIMITES.descripcionMax} caracteres.`);
  }

  if (errores.length > 0) {
    return { valido: false, errores };
  }

  return {
    valido: true,
    datos: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim()
    }
  };
}

module.exports = {
  validarSolicitud,
  LIMITES
};
