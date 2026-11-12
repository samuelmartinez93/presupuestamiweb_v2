const express = require("express");
const cors = require("cors");

const tarifas = require("./tarifas");
const validarPresupuesto = require("./validar");
const calcularPresupuesto = require("./calcular");
const { serviciosCatalogo } = require("./catalogo");
const { proponerServiciosDesdeTexto } = require("./proponer");
const { validarSolicitud } = require("./validarSolicitud");
const { generarPropuestaIA, iaDisponible } = require("./ia");
const validarSeleccion = require("./validarSeleccion");
const { crearLinea } = require("./catalogo");

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

app.use(cors());
app.use(express.json());

app.get("/api/estado", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/tarifas", (req, res) => {
  res.status(200).json(tarifas);
});

app.get("/api/catalogo", (req, res) => {
  res.status(200).json({ servicios: serviciosCatalogo });
});

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
        return res.status(200).json({ cliente: nombre, ...propuesta });
      } catch (error) {
        console.error("Error al consultar la IA:", error.message);
        const propuesta = proponerServiciosDesdeTexto(descripcion);
        return res.status(200).json({
          cliente: nombre,
          origen: "reglas",
          ...propuesta,
          aviso: "No se pudo contactar con la IA. Se muestra una propuesta automática por palabras clave."
        });
      }
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

    return res.status(200).json({ ...presupuesto, ...datos, lineas: construirLineas(datos) });
  } catch (error) {
    console.error("Error al calcular la selección:", error);
    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
  console.log(
    iaDisponible()
      ? "IA activada (OPENAI_API_KEY encontrada)."
      : "IA desactivada: falta OPENAI_API_KEY en server/.env. Se usarán reglas por palabras clave."
  );
});