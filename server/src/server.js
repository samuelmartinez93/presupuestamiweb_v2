const express = require("express");
const cors = require("cors");

const tarifas = require("./tarifas");
const validarPresupuesto = require("./validar");
const calcularPresupuesto = require("./calcular");
const { serviciosCatalogo } = require("./catalogo");
const { proponerServiciosDesdeTexto, esSolicitudWeb } = require("./proponer");
const { mensajeFueraDeTema } = require("./asistente.json");
const { validarSolicitud } = require("./validarSolicitud");
const { generarPropuestaIA, iaDisponible } = require("./ia");
const validarSeleccion = require("./validarSeleccion");
const { crearLinea } = require("./catalogo");
const limitarPeticiones = require("./limitarPeticiones");

// Líneas del presupuesto con nombre y descripción del catálogo (para mostrar y para el PDF).
function construirLineas(datos) {
  const lineas = [crearLinea(datos.tipo)];
  if (datos.paginas > 1) lineas.push(crearLinea("paginaAdicional", datos.paginas - 1));
  if (datos.formulario) lineas.push(crearLinea("formulario"));
  if (datos.segundoIdioma) lineas.push(crearLinea("segundoIdioma"));
  return lineas;
}

const app = express();
const PORT = process.env.PORT || 3001;

// No revelamos la tecnología del servidor en las cabeceras.
app.disable("x-powered-by");
// Detrás de un proxy (Vercel) para conocer la IP real del cliente.
app.set("trust proxy", 1);

// En producción se puede limitar qué web puede llamar a la API (CORS_ORIGIN).
const origenesPermitidos = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origen) => origen.trim())
  : null;
app.use(cors(origenesPermitidos ? { origin: origenesPermitidos } : undefined));

app.use(express.json({ limit: "20kb" }));

// Cada IP puede pedir como máximo 20 propuestas cada 15 minutos.
app.use("/api/propuesta", limitarPeticiones({ maximo: 20, ventanaMs: 15 * 60 * 1000 }));

// Raíz de la API: confirma que el servicio está en marcha.
app.get("/", (req, res) => {
  res.status(200).json({ servicio: "API Presupuesta mi web", estado: "/api/estado" });
});

app.get("/api/estado", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/tarifas", (req, res) => {
  res.status(200).json(tarifas);
});

app.get("/api/catalogo", (req, res) => {
  res.status(200).json({ servicios: serviciosCatalogo });
});

// El asistente solo sirve para presupuestos web: el resto de temas se rechaza con un aviso.
function responderFueraDeTema(res) {
  return res.status(422).json({ error: mensajeFueraDeTema, codigo: "FUERA_DE_TEMA" });
}

app.post("/api/propuesta", async (req, res) => {
  try {
    const validacion = validarSolicitud(req.body);

    if (!validacion.valido) {
      return res.status(400).json({
        error: validacion.errores.join(" "),
        errores: validacion.errores
      });
    }

    const { nombre, descripcion } = validacion.datos;

    if (iaDisponible()) {
      try {
        const propuesta = await generarPropuestaIA({ nombre, descripcion });
        if (propuesta.fueraDeTema) {
          return responderFueraDeTema(res);
        }
        return res.status(200).json({ cliente: nombre, ...propuesta });
      } catch (error) {
        console.error("Error al consultar la IA:", error.message);
        if (!esSolicitudWeb(descripcion)) {
          return responderFueraDeTema(res);
        }
        const propuesta = proponerServiciosDesdeTexto(descripcion);
        return res.status(200).json({
          cliente: nombre,
          origen: "reglas",
          ...propuesta,
          aviso: "No se pudo contactar con la IA. Se muestra una propuesta automática por palabras clave."
        });
      }
    }

    if (!esSolicitudWeb(descripcion)) {
      return responderFueraDeTema(res);
    }

    const propuesta = proponerServiciosDesdeTexto(descripcion);
    return res.status(200).json({ cliente: nombre, origen: "reglas", ...propuesta });
  } catch (error) {
    console.error("Error al generar la propuesta:", error);
    return res.status(500).json({
      error: "Error interno del servidor al generar la propuesta."
    });
  }
});

app.post("/api/presupuesto", (req, res) => {
  try {
    const validacion = validarPresupuesto(req.body);

    if (!validacion.ok) {
      return res.status(400).json({
        error: validacion.mensaje
      });
    }

    const presupuesto = calcularPresupuesto(validacion.datos);

    return res.status(200).json({ ...presupuesto, lineas: construirLineas(validacion.datos) });
  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

// Calcula el presupuesto a partir de la selección de servicios confirmada por el usuario.
app.post("/api/presupuesto/seleccion", (req, res) => {
  try {
    const validacion = validarSeleccion(req.body);

    if (!validacion.ok) {
      return res.status(400).json({
        error: validacion.errores.join(" "),
        errores: validacion.errores
      });
    }

    const datos = validacion.datos;
    const presupuesto = calcularPresupuesto(datos);

    // La selección va aparte para no pisar los importes (formulario, segundoIdioma) del cálculo.
    return res.status(200).json({ ...presupuesto, seleccion: datos, lineas: construirLineas(datos) });
  } catch (error) {
    console.error("Error al calcular la selección:", error);
    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

// Rutas inexistentes: respuesta JSON neutra.
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

// Errores no controlados (por ejemplo, JSON mal formado): nunca se envían
// detalles internos ni rutas de archivos al cliente.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "La petición es demasiado grande." });
  }
  console.error("Error no controlado:", error.message);
  return res.status(500).json({ error: "Error interno del servidor." });
});

// En local (npm start / npm run dev) se arranca el servidor en un puerto.
// En Vercel no: la plataforma importa la app exportada y la ejecuta como función.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
    console.log(
      iaDisponible()
        ? "IA activada (OPENAI_API_KEY encontrada)."
        : "IA desactivada: falta OPENAI_API_KEY en server/.env. Se usarán reglas por palabras clave."
    );
  });
}

module.exports = app;