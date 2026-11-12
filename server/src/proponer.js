const { crearLinea } = require('./catalogo');

const MAX_PAGINAS = 20;

// Secciones que justifican una página propia en una web corporativa.
const SECCIONES = [
  { nombre: 'Carta / menú', patron: /\b(carta|menu|platos|bebidas)\b/ },
  { nombre: 'Servicios', patron: /\bservicios\b/ },
  { nombre: 'Galería', patron: /\b(galeria|fotos|imagenes|portfolio)\b/ },
  { nombre: 'Sobre nosotros', patron: /\b(sobre nosotros|quienes somos|historia|equipo)\b/ },
  { nombre: 'Ubicación', patron: /\b(ubicacion|mapa|como llegar|donde estamos)\b/ }
];

// Necesidades habituales que NO cubre ningún servicio del catálogo.
const NECESIDADES_FUERA_DE_CATALOGO = [
  { necesidad: 'Tienda online', patron: /\b(tienda online|ecommerce|e commerce|carrito|vender online)\b/ },
  { necesidad: 'Pagos online', patron: /\b(pago online|pagos online|pasarela|pagar online)\b/ },
  {
    necesidad: 'Sistema de reservas con gestión de disponibilidad',
    patron: /\b(sistema de reservas|gestion de reservas|reservas en tiempo real|calendario de reservas|disponibilidad)\b/
  },
  { necesidad: 'Blog', patron: /\b(blog|noticias|articulos)\b/ },
  { necesidad: 'Área privada de clientes', patron: /\b(area privada|area de clientes|login|registro de usuarios|iniciar sesion)\b/ },
  { necesidad: 'Más de dos idiomas', patron: /\b(tres idiomas|cuatro idiomas|varios idiomas|multiidioma|multidioma)\b/ },
  { necesidad: 'Posicionamiento SEO', patron: /\b(seo|posicionamiento)\b/ },
  { necesidad: 'Dominio y hosting', patron: /\b(dominio|hosting|alojamiento)\b/ },
  { necesidad: 'Logotipo o identidad visual', patron: /\b(logo|logotipo|branding|identidad visual)\b/ },
  { necesidad: 'Mantenimiento', patron: /\bmantenimiento\b/ },
  { necesidad: 'Newsletter', patron: /\b(newsletter|boletin)\b/ },
  { necesidad: 'Chat en directo', patron: /\b(chat|whatsapp)\b/ },
  { necesidad: 'Redacción de textos', patron: /\b(redaccion|copywriting|escribir los textos)\b/ },
  { necesidad: 'Gestión de redes sociales', patron: /\b(redes sociales|instagram|facebook|tiktok)\b/ }
];

function limpiarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function proponerServiciosDesdeTexto(textoCliente) {
  const texto = limpiarTexto(textoCliente);

  const secciones = SECCIONES.filter((seccion) => seccion.patron.test(texto));
  const pideVariasPaginas = /\b(paginas|secciones|corporativa|empresa|negocio|restaurante|hotel|tienda|clinica)\b/.test(texto);

  const tipo = pideVariasPaginas || secciones.length > 0 ? 'corporativa' : 'landing';
  const paginas = tipo === 'corporativa' ? Math.min(1 + secciones.length, MAX_PAGINAS) : 1;
  const formulario = /\b(formulario|contacto|reservas?|consultas?|presupuestos?|solicitar)\b/.test(texto);
  const segundoIdioma = /\b(dos idiomas|segundo idioma|bilingue|ingles|frances|aleman|traduccion|traducida|idiomas)\b/.test(texto);

  const servicios = [crearLinea(tipo)];

  if (paginas > 1) {
    servicios.push(crearLinea('paginaAdicional', paginas - 1));
  }

  if (formulario) {
    servicios.push(crearLinea('formulario'));
  }

  if (segundoIdioma) {
    servicios.push(crearLinea('segundoIdioma'));
  }

  const pendientes = NECESIDADES_FUERA_DE_CATALOGO
    .filter((item) => item.patron.test(texto))
    .map((item) => ({
      necesidad: item.necesidad,
      motivo: 'No está incluido en el catálogo. Pendiente de valorar.'
    }));

  return {
    tipo,
    paginas,
    formulario,
    segundoIdioma,
    secciones: secciones.map((seccion) => seccion.nombre),
    servicios: servicios.filter(Boolean),
    pendientes,
    nota: 'Propuesta orientativa generada a partir del texto del cliente. Revisa los servicios antes de calcular el presupuesto.'
  };
}

module.exports = {
  proponerServiciosDesdeTexto,
  MAX_PAGINAS
};
