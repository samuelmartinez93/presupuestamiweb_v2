const tarifas = require('./tarifas');

// Catálogo de servicios del ejercicio anterior. Los precios se leen siempre de
// tarifas.js para que el catálogo y el cálculo del presupuesto no se desincronicen.
const serviciosCatalogo = [
  {
    id: 'landing',
    nombre: 'Landing',
    descripcion: 'Web de una sola página con diseño enfocado a conversión y llamada a la acción.',
    precio: tarifas.landing,
    regla: 'Precio base. Incluye la primera página.'
  },
  {
    id: 'corporativa',
    nombre: 'Web corporativa',
    descripcion: 'Sitio web para presentar la empresa, sus servicios y su información de contacto.',
    precio: tarifas.corporativa,
    regla: 'Precio base. Incluye la primera página.'
  },
  {
    id: 'paginaAdicional',
    nombre: 'Página adicional',
    descripcion: 'Cada página extra a partir de la primera: servicios, carta, galería, contacto…',
    precio: tarifas.paginaAdicional,
    regla: 'Precio por página, a partir de la segunda (máximo 20 páginas en total).'
  },
  {
    id: 'formulario',
    nombre: 'Formulario de contacto',
    descripcion: 'Formulario para que el visitante envíe consultas o solicitudes (por ejemplo, de reserva).',
    precio: tarifas.formulario,
    regla: 'Precio fijo si se incluye.'
  },
  {
    id: 'segundoIdioma',
    nombre: 'Segundo idioma',
    descripcion: 'Versión del contenido de la web en un segundo idioma.',
    precio: tarifas.segundoIdioma,
    regla: 'Precio fijo si se incluye.'
  }
];

function buscarServicioPorId(id) {
  return serviciosCatalogo.find((servicio) => servicio.id === id) || null;
}

// Solo se aceptan servicios que existen en el catálogo; el precio sale siempre
// del catálogo del servidor, nunca de la propuesta.
function crearLinea(id, cantidad = 1) {
  const servicio = buscarServicioPorId(id);

  if (!servicio) {
    return null;
  }

  return {
    id: servicio.id,
    nombre: servicio.nombre,
    descripcion: servicio.descripcion,
    precio: servicio.precio,
    cantidad,
    subtotal: servicio.precio * cantidad
  };
}

module.exports = {
  serviciosCatalogo,
  buscarServicioPorId,
  crearLinea
};
