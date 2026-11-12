const { OpenAI } = require('openai');

const { serviciosCatalogo, buscarServicioPorId, crearLinea } = require('./catalogo');
const { MAX_PAGINAS } = require('./proponer');

const MODELO_POR_DEFECTO = 'gpt-5-mini';
const TIPOS_BASE = ['landing', 'corporativa'];

// Esquema de la respuesta estructurada que debe devolver el modelo.
const ESQUEMA_RESPUESTA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'paginas', 'servicios', 'dudas', 'pendientes'],
  properties: {
    resumen: {
      type: 'string',
      description: 'Resumen breve del proyecto del cliente (2-3 frases).'
    },
    paginas: {
      type: 'integer',
      description: `Número total de páginas estimado, entre 1 y ${MAX_PAGINAS}.`
    },
    servicios: {
      type: 'array',
      description: 'Servicios del catálogo propuestos.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'justificacion'],
        properties: {
          id: {
            type: 'string',
            enum: serviciosCatalogo.map((servicio) => servicio.id)
          },
          justificacion: {
            type: 'string',
            description: 'Por qué este servicio encaja con lo que pide el cliente (una frase).'
          }
        }
      }
    },
    dudas: {
      type: 'array',
      description: 'Preguntas que habría que aclarar con el cliente.',
      items: { type: 'string' }
    },
    pendientes: {
      type: 'array',
      description: 'Necesidades del cliente que no cubre ningún servicio del catálogo.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['necesidad', 'motivo'],
        properties: {
          necesidad: { type: 'string' },
          motivo: { type: 'string' }
        }
      }
    }
  }
};

function construirInstrucciones() {
  const catalogo = serviciosCatalogo
    .map((s) => `- ${s.id}: ${s.nombre}. ${s.descripcion} Precio: ${s.precio} €. Regla: ${s.regla}`)
    .join('\n');

  return `Eres un asistente comercial de una agencia de desarrollo web. Analizas la solicitud de un cliente y propones servicios de nuestro catálogo.

CATÁLOGO DISPONIBLE (usa solo estos identificadores):
${catalogo}

REGLAS:
- Propón exactamente un tipo de web: "landing" (una sola página) o "corporativa" (varias páginas).
- Estima el número total de páginas (entre 1 y ${MAX_PAGINAS}). Si es mayor que 1, incluye "paginaAdicional".
- Incluye "formulario" si el cliente necesita que los visitantes le envíen consultas, reservas o solicitudes.
- Incluye "segundoIdioma" si pide la web en dos idiomas.
- No inventes servicios. Si el cliente pide algo que no cubre el catálogo (tienda online, pagos, blog, más de dos idiomas, etc.), añádelo a "pendientes" como necesidad pendiente de valorar.
- En "dudas" anota las preguntas que habría que aclarar con el cliente. Puede ir vacío.
- No inventes servicios: usa solo los identificadores del catálogo.
- No menciones precios, importes, descuentos ni presupuestos: los calcula nuestro servidor.
- No adquieras compromisos de entrega: no indiques plazos, fechas, duraciones ni garantías. Si el cliente pregunta por plazos, anótalo en "dudas".
- Responde en español.`;
}

// Frases que el modelo no debe incluir: importes o compromisos de entrega.
const PATRON_PRECIO = /\d[\d.,]*\s*(€|euros?\b|eur\b)|€\s*\d/i;
const PATRON_COMPROMISO =
  /(plazo de entrega|entregaremos|estar[aá] (lista|listo|terminad[ao])|en \d+\s*(d[ií]as|semanas|meses)|garantiz)/i;

// Elimina las frases con precios o compromisos de entrega.
function limpiarCompromisos(texto) {
  const frases = String(texto || '')
    .split(/(?<=[.!?])\s+/)
    .filter((frase) => !PATRON_PRECIO.test(frase) && !PATRON_COMPROMISO.test(frase));

  return frases.join(' ').trim();
}

// Comprueba la respuesta del modelo y la convierte en una propuesta con
// precios del servidor. Los identificadores que no estén en el catálogo se descartan.
function procesarRespuestaIA(respuesta) {
  if (!respuesta || typeof respuesta !== 'object' || !Array.isArray(respuesta.servicios)) {
    throw new Error('La respuesta de la IA no tiene el formato esperado.');
  }

  const justificaciones = new Map();
  const idsDescartados = [];

  for (const item of respuesta.servicios) {
    const id = item && item.id;

    if (!buscarServicioPorId(id)) {
      idsDescartados.push(String(id));
      continue;
    }

    if (!justificaciones.has(id)) {
      justificaciones.set(id, limpiarCompromisos(item.justificacion));
    }
  }

  // Exactamente un tipo de web: el primero que haya propuesto, o landing por defecto.
  const tipo = TIPOS_BASE.find((id) => justificaciones.has(id)) || 'landing';
  const otroTipo = TIPOS_BASE.find((id) => id !== tipo);
  justificaciones.delete(otroTipo);

  let paginas = Number.isInteger(respuesta.paginas) ? respuesta.paginas : 1;
  paginas = Math.min(Math.max(paginas, 1), MAX_PAGINAS);

  const formulario = justificaciones.has('formulario');
  const segundoIdioma = justificaciones.has('segundoIdioma');

  const conJustificacion = (linea) => ({
    ...linea,
    justificacion: justificaciones.get(linea.id) || ''
  });

  const servicios = [conJustificacion(crearLinea(tipo))];

  if (paginas > 1) {
    servicios.push(conJustificacion(crearLinea('paginaAdicional', paginas - 1)));
  }

  if (formulario) {
    servicios.push(conJustificacion(crearLinea('formulario')));
  }

  if (segundoIdioma) {
    servicios.push(conJustificacion(crearLinea('segundoIdioma')));
  }

  const textos = (lista) =>
    Array.isArray(lista) ? lista.map((texto) => String(texto).trim()).filter(Boolean) : [];

  const pendientes = Array.isArray(respuesta.pendientes)
    ? respuesta.pendientes
        .filter((item) => item && item.necesidad)
        .map((item) => ({
          necesidad: String(item.necesidad).trim(),
          motivo:
            limpiarCompromisos(item.motivo) || 'No está incluido en el catálogo. Pendiente de valorar.'
        }))
    : [];

  return {
    origen: 'ia',
    resumen: limpiarCompromisos(respuesta.resumen),
    tipo,
    paginas,
    formulario,
    segundoIdioma,
    servicios,
    dudas: textos(respuesta.dudas),
    pendientes,
    idsDescartados,
    nota: 'Propuesta generada con IA. Los servicios y precios se han comprobado contra el catálogo del servidor.'
  };
}

let cliente = null;

function obtenerCliente() {
  if (!cliente) {
    cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cliente;
}

function iaDisponible() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function generarPropuestaIA({ nombre, descripcion }) {
  const respuesta = await obtenerCliente().responses.create({
    model: process.env.OPENAI_MODEL || MODELO_POR_DEFECTO,
    instructions: construirInstrucciones(),
    input: `Cliente: ${nombre}\n\nDescripción del proyecto:\n${descripcion}`,
    text: {
      format: {
        type: 'json_schema',
        name: 'propuesta_servicios',
        schema: ESQUEMA_RESPUESTA,
        strict: true
      }
    }
  });

  let datos;
  try {
    datos = JSON.parse(respuesta.output_text);
  } catch {
    throw new Error('La IA no devolvió un JSON válido.');
  }

  return procesarRespuestaIA(datos);
}

module.exports = {
  ESQUEMA_RESPUESTA,
  construirInstrucciones,
  limpiarCompromisos,
  procesarRespuestaIA,
  generarPropuestaIA,
  iaDisponible
};
