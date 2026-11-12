import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import Peces from './Peces'

// jsPDF es pesado: solo se descarga cuando se abre la vista previa.
const VistaPreviaPDF = lazy(() => import('./pdf/VistaPreviaPDF'))

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Deben coincidir con los límites de server/src/validarSolicitud.js
const NOMBRE_MAX = 100
const DESCRIPCION_MIN = 20
const DESCRIPCION_MAX = 1500

const PAGINAS_MIN = 1
const PAGINAS_MAX = 20

const TIPOS_WEB = [
  { id: 'landing', nombre: 'Landing', detalle: 'Una sola página' },
  { id: 'corporativa', nombre: 'Corporativa', detalle: 'Varias páginas' }
]

const EXTRAS = [
  { id: 'formulario', nombre: 'Formulario de contacto', detalle: 'Consultas y reservas' },
  { id: 'segundoIdioma', nombre: 'Segundo idioma', detalle: 'Web bilingüe' }
]

const TIPOS_BASE = ['landing', 'corporativa']
const PAGINAS_ADICIONALES_MAX = PAGINAS_MAX - 1

const ETIQUETAS_TARIFAS = {
  landing: 'Landing',
  corporativa: 'Web corporativa',
  paginaAdicional: 'Página adicional',
  formulario: 'Formulario de contacto',
  segundoIdioma: 'Segundo idioma'
}

const formInicial = {
  tipo: 'landing',
  paginas: '1',
  formulario: false,
  segundoIdioma: false
}

const formatEuro = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

function App() {
  const [formData, setFormData] = useState(formInicial)
  const [tarifas, setTarifas] = useState(null)
  const [tarifasError, setTarifasError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [presupuesto, setPresupuesto] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [solicitudCliente, setSolicitudCliente] = useState('')
  const [propuesta, setPropuesta] = useState(null)
  const [propuestaError, setPropuestaError] = useState('')
  const [isAnalizando, setIsAnalizando] = useState(false)
  const [detallePresupuesto, setDetallePresupuesto] = useState(false)
  const [formularioDesdeIA, setFormularioDesdeIA] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [seleccion, setSeleccion] = useState([])
  const [seleccionError, setSeleccionError] = useState('')
  const [isConfirmando, setIsConfirmando] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)

  useEffect(() => {
    const cargarTarifas = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/tarifas`)

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar las tarifas del servidor.')
        }

        const datos = await respuesta.json()

        if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
          throw new Error('La respuesta de tarifas no es válida.')
        }

        setTarifas(datos)
      } catch {
        setTarifasError(
          'No se pudo cargar la información de tarifas. Puedes seguir usando el formulario.'
        )
      }
    }

    const cargarCatalogo = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/catalogo`)
        const datos = await respuesta.json()
        if (respuesta.ok && Array.isArray(datos?.servicios)) {
          setCatalogo(datos.servicios)
        }
      } catch {
        // Sin catálogo no se pueden añadir servicios, pero el resto funciona.
      }
    }

    cargarTarifas()
    cargarCatalogo()
  }, [])

  const manejarCambio = (event) => {
    const { name, value, type, checked } = event.target

    setPresupuesto(null)
    setError('')
    setFormularioDesdeIA(false)

    setFormData((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const cambiarPaginas = (delta) => {
    setPresupuesto(null)
    setError('')
    setFormularioDesdeIA(false)

    setFormData((anterior) => {
      const actual = Number(anterior.paginas) || PAGINAS_MIN
      const siguiente = Math.min(Math.max(actual + delta, PAGINAS_MIN), PAGINAS_MAX)
      return { ...anterior, paginas: String(siguiente) }
    })
  }

  const manejarPropuesta = async (event) => {
    event.preventDefault()

    if (isAnalizando) {
      return
    }

    if (!nombreCliente.trim()) {
      setPropuestaError('Indica el nombre del cliente o empresa.')
      return
    }

    if (!solicitudCliente.trim()) {
      setPropuestaError('Explica el proyecto para poder analizarlo.')
      return
    }

    if (solicitudCliente.trim().length < DESCRIPCION_MIN) {
      setPropuestaError(`La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.`)
      return
    }

    setPropuestaError('')
    setIsAnalizando(true)

    try {
      const respuesta = await fetch(`${API_URL}/propuesta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: nombreCliente, descripcion: solicitudCliente })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos?.error || 'No se pudo generar la propuesta.')
      }

      setPropuesta(datos)
      setSeleccion(
        datos.servicios.map((servicio) => ({
          id: servicio.id,
          cantidad: servicio.id === 'paginaAdicional' ? String(servicio.cantidad) : '',
          justificacion: servicio.justificacion || '',
          origen: 'ia',
          aceptado: true
        }))
      )
      setSeleccionError('')
    } catch (error) {
      setPropuestaError(error.message || 'No se pudo analizar la solicitud.')
    } finally {
      setIsAnalizando(false)
    }
  }

  const infoServicio = (id) =>
    catalogo.find((servicio) => servicio.id === id) ||
    propuesta?.servicios.find((servicio) => servicio.id === id) ||
    { id, nombre: id, descripcion: '', precio: 0 }

  // Si se acepta un tipo de web, el otro se desmarca: solo puede haber uno.
  const desmarcarOtroTipo = (lista, id) =>
    TIPOS_BASE.includes(id)
      ? lista.map((item) =>
          TIPOS_BASE.includes(item.id) && item.id !== id ? { ...item, aceptado: false } : item
        )
      : lista

  const alternarServicio = (id) => {
    setSeleccionError('')
    setSeleccion((anterior) => {
      const actual = anterior.find((item) => item.id === id)
      const lista = anterior.map((item) =>
        item.id === id ? { ...item, aceptado: !item.aceptado } : item
      )
      return actual && !actual.aceptado ? desmarcarOtroTipo(lista, id) : lista
    })
  }

  const anadirServicio = (id) => {
    setSeleccionError('')
    setSeleccion((anterior) =>
      desmarcarOtroTipo(
        [...anterior, { id, cantidad: '', justificacion: '', origen: 'usuario', aceptado: true }],
        id
      )
    )
  }

  const quitarServicio = (id) => {
    setSeleccionError('')
    setSeleccion((anterior) => anterior.filter((item) => item.id !== id))
  }

  const cambiarCantidad = (id, cantidad) => {
    setSeleccionError('')
    setSeleccion((anterior) =>
      anterior.map((item) => (item.id === id ? { ...item, cantidad } : item))
    )
  }

  const aceptados = seleccion.filter((item) => item.aceptado)
  const disponibles = catalogo.filter(
    (servicio) => !seleccion.some((item) => item.id === servicio.id)
  )

  // Datos que faltan para poder calcular el presupuesto de la selección.
  const datosFaltantes = []
  const tiposAceptados = aceptados.filter((item) => TIPOS_BASE.includes(item.id))

  if (tiposAceptados.length === 0) {
    datosFaltantes.push('Elige un tipo de web: Landing o Web corporativa.')
  }

  const paginasExtra = aceptados.find((item) => item.id === 'paginaAdicional')
  if (paginasExtra) {
    const cantidad = Number(paginasExtra.cantidad)
    if (
      paginasExtra.cantidad === '' ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > PAGINAS_ADICIONALES_MAX
    ) {
      datosFaltantes.push(
        `Indica cuántas páginas adicionales necesitas (entre 1 y ${PAGINAS_ADICIONALES_MAX}).`
      )
    }
  }

  const confirmarSeleccion = async () => {
    if (isConfirmando || datosFaltantes.length > 0) {
      return
    }

    setSeleccionError('')
    setIsConfirmando(true)

    try {
      const respuesta = await fetch(`${API_URL}/presupuesto/seleccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicios: aceptados.map((item) =>
            item.id === 'paginaAdicional'
              ? { id: item.id, cantidad: Number(item.cantidad) }
              : { id: item.id }
          )
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos?.error || 'No se pudo calcular el presupuesto.')
      }

      setPresupuesto(datos)
      setDetallePresupuesto(true)
      setError('')
      setFormData({
        tipo: datos.tipo,
        paginas: String(datos.paginas),
        formulario: datos.formulario,
        segundoIdioma: datos.segundoIdioma
      })
      setFormularioDesdeIA(true)
    } catch (error) {
      setSeleccionError(
        error instanceof TypeError
          ? 'No se puede conectar con el servidor. Comprueba que la API está iniciada.'
          : error.message
      )
    } finally {
      setIsConfirmando(false)
    }
  }

  // Contenido inicial del PDF: lo que sabemos del cliente y de la propuesta.
  const datosInicialesPDF = () => {
    const servicios = (presupuesto?.lineas || [])
      .map((linea) => (linea.cantidad > 1 ? `${linea.nombre} (× ${linea.cantidad})` : linea.nombre))
      .join(', ')

    const aclaraciones = [
      ...(propuesta?.pendientes || []).map((item) => `${item.necesidad}: ${item.motivo}`),
      ...(propuesta?.dudas || [])
    ]

    return {
      cliente: propuesta?.cliente || nombreCliente.trim(),
      resumen: propuesta?.resumen || `Presupuesto de desarrollo web que incluye: ${servicios}.`,
      aclaraciones: aclaraciones.join('\n')
    }
  }

  const manejarSubmit = async (event) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    if (formData.paginas === '' || formData.paginas === null) {
      setPresupuesto(null)
      setError('Debes introducir el número de páginas.')
      return
    }

    const paginas = Number(formData.paginas)

    if (!Number.isInteger(paginas) || paginas < 1 || paginas > 20) {
      setPresupuesto(null)
      setError('El número de páginas debe ser un entero entre 1 y 20.')
      return
    }

    setError('')
    setPresupuesto(null)
    setIsLoading(true)

    try {
      const payload = {
        tipo: formData.tipo,
        paginas,
        formulario: Boolean(formData.formulario),
        segundoIdioma: Boolean(formData.segundoIdioma)
      }

      const respuesta = await fetch(`${API_URL}/presupuesto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const texto = await respuesta.text()
      let datos = null

      if (texto) {
        try {
          datos = JSON.parse(texto)
        } catch {
          datos = null
        }
      }

      if (!respuesta.ok) {
        const mensaje =
          datos && typeof datos.error === 'string' && datos.error.trim()
            ? datos.error
            : 'No se pudo procesar la solicitud.'

        if (respuesta.status === 400) {
          setError(mensaje)
        } else if (respuesta.status === 500) {
          setError('Ha ocurrido un error interno del servidor.')
        } else {
          setError(mensaje)
        }

        return
      }

      if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        setError('Respuesta no válida del servicio.')
        return
      }

      setPresupuesto(datos)
      setDetallePresupuesto(false)
    } catch {
      setError('No se puede conectar con el servidor. Comprueba que la API está iniciada.')
    } finally {
      setIsLoading(false)
    }
  }

  const paginasActuales = Number(formData.paginas) || PAGINAS_MIN

  return (
    <>
      <Peces />
      <div className="app-shell">
      <header className="page-header">
        <div className="header-glow" aria-hidden="true" />
        <h1>Presupuesta mi web</h1>
        <p className="subtitle">
          Calcula un presupuesto rápido para tu sitio web y revisa el desglose detallado.
        </p>
      </header>

      <main className="main-layout">
        <section
          className={`panel resultado-panel${presupuesto ? ' con-presupuesto' : ''}`}
          aria-labelledby="titulo-resumen"
          aria-live="polite"
        >
          <header className="panel-header">
            <span className="panel-kicker">Resumen</span>
            <h2 id="titulo-resumen">Precios base</h2>
          </header>

          <div className="resumen-cuerpo">
            {tarifas && (
              <div className="tarifas-box">
                <ul>
                  {Object.entries(tarifas)
                    .filter(([clave]) => clave !== 'moneda')
                    .map(([clave, valor]) => (
                      <li key={clave}>
                        <span>{ETIQUETAS_TARIFAS[clave] || clave}</span>
                        <strong>{formatEuro(valor)}</strong>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {tarifasError && <p className="info-message">{tarifasError}</p>}

            {!presupuesto && (
              <p className="resumen-pista">
                Configura tu web y pulsa <strong>Calcular presupuesto</strong> para ver aquí el total.
              </p>
            )}
          </div>

          {presupuesto && (
            <div className="presupuesto-actual">
              <div className="presupuesto-actual-header">
                <span>Presupuesto estimado</span>
                <button
                  type="button"
                  className="mini-toggle"
                  onClick={() => setDetallePresupuesto((actual) => !actual)}
                  aria-expanded={detallePresupuesto}
                  aria-controls="detalle-presupuesto"
                >
                  {detallePresupuesto ? 'Ocultar desglose' : 'Ver desglose'}
                </button>
              </div>

              <p className="presupuesto-actual-total">{formatEuro(presupuesto.total)}</p>

              {detallePresupuesto && (
                <div className="presupuesto-detalle" id="detalle-presupuesto">
                  <div className="linea">
                    <span>Precio base</span>
                    <strong>{formatEuro(presupuesto.base)}</strong>
                  </div>
                  <div className="linea">
                    <span>Páginas adicionales</span>
                    <strong>{formatEuro(presupuesto.paginasAdicionales)}</strong>
                  </div>
                  <div className="linea">
                    <span>Formulario de contacto</span>
                    <strong>{formatEuro(presupuesto.formulario)}</strong>
                  </div>
                  <div className="linea">
                    <span>Segundo idioma</span>
                    <strong>{formatEuro(presupuesto.segundoIdioma)}</strong>
                  </div>
                </div>
              )}

              {presupuesto.lineas && (
                <button
                  type="button"
                  className="primary-button boton-pdf"
                  onClick={() => setMostrarPDF(true)}
                >
                  Descargar presupuesto (PDF)
                </button>
              )}
            </div>
          )}
        </section>

        <section className="panel panel-formulario" aria-labelledby="titulo-formulario">
          <header className="panel-header">
            <span className="panel-kicker">Configurador</span>
            <h2 id="titulo-formulario">Solicita tu presupuesto</h2>
          </header>

          {formularioDesdeIA && (
            <p className="aviso-ia" role="status">
              Presupuesto calculado con la selección confirmada en el asistente. Puedes seguir ajustándolo aquí.
            </p>
          )}

          <form className="presupuesto-form" onSubmit={manejarSubmit} noValidate>
            <fieldset className="grupo">
              <legend>Tipo de web</legend>
              <div className="opciones-tipo">
                {TIPOS_WEB.map((tipo) => (
                  <label
                    key={tipo.id}
                    className={`opcion${formData.tipo === tipo.id ? ' activa' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo.id}
                      checked={formData.tipo === tipo.id}
                      onChange={manejarCambio}
                    />
                    <span className="opcion-nombre">{tipo.nombre}</span>
                    <span className="opcion-detalle">{tipo.detalle}</span>
                    {tarifas && <span className="opcion-precio">{formatEuro(tarifas[tipo.id])}</span>}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <label htmlFor="paginas">Número de páginas</label>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => cambiarPaginas(-1)}
                  disabled={paginasActuales <= PAGINAS_MIN}
                  aria-label="Quitar una página"
                >
                  −
                </button>
                <input
                  id="paginas"
                  name="paginas"
                  type="number"
                  inputMode="numeric"
                  min={PAGINAS_MIN}
                  max={PAGINAS_MAX}
                  step="1"
                  value={formData.paginas}
                  onChange={manejarCambio}
                  aria-describedby="paginas-ayuda"
                  required
                />
                <button
                  type="button"
                  onClick={() => cambiarPaginas(1)}
                  disabled={paginasActuales >= PAGINAS_MAX}
                  aria-label="Añadir una página"
                >
                  +
                </button>
              </div>
              <small id="paginas-ayuda">La primera página está incluida. Máximo {PAGINAS_MAX}.</small>
            </div>

            <fieldset className="grupo">
              <legend>Extras</legend>
              <div className="opciones-extra">
                {EXTRAS.map((extra) => (
                  <label
                    key={extra.id}
                    className={`extra${formData[extra.id] ? ' activa' : ''}`}
                    htmlFor={extra.id}
                  >
                    <input
                      id={extra.id}
                      name={extra.id}
                      type="checkbox"
                      checked={formData[extra.id]}
                      onChange={manejarCambio}
                    />
                    <span className="extra-texto">
                      <span className="extra-nombre">{extra.nombre}</span>
                      <span className="extra-detalle">{extra.detalle}</span>
                    </span>
                    {tarifas && <span className="extra-precio">+{formatEuro(tarifas[extra.id])}</span>}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="alert" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="primary-button" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? 'Calculando…' : 'Calcular presupuesto'}
            </button>
          </form>
        </section>

        <section className="panel panel-ai" aria-labelledby="titulo-ia">
          <header className="panel-header">
            <span className="panel-kicker">Asistente IA</span>
            <h2 id="titulo-ia">¿No sabes qué necesitas?</h2>
            <p className="panel-intro">
              Cuéntanos tu proyecto y te proponemos los servicios. El formulario se rellenará solo.
            </p>
          </header>

          <form className="propuesta-form" onSubmit={manejarPropuesta} noValidate>
            <div className="field">
              <label htmlFor="nombre-cliente">Cliente o empresa</label>
              <input
                id="nombre-cliente"
                type="text"
                autoComplete="organization"
                value={nombreCliente}
                onChange={(event) => setNombreCliente(event.target.value)}
                maxLength={NOMBRE_MAX}
                placeholder="EJ: Restaurante La Brasa"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="solicitud-cliente">Describe el proyecto</label>
              <textarea
                id="solicitud-cliente"
                value={solicitudCliente}
                onChange={(event) => setSolicitudCliente(event.target.value)}
                rows="5"
                maxLength={DESCRIPCION_MAX}
                placeholder="EJ: Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas."
                aria-describedby="contador-descripcion"
                required
              />
              <small className="contador" id="contador-descripcion">
                {solicitudCliente.length} / {DESCRIPCION_MAX}
              </small>
            </div>

            {propuestaError && (
              <p className="alert" role="alert">
                {propuestaError}
              </p>
            )}

            <button className="primary-button" type="submit" disabled={isAnalizando} aria-busy={isAnalizando}>
              {isAnalizando ? 'Analizando…' : 'Analizar solicitud'}
            </button>
          </form>

          {propuesta && (
            <div className="propuesta-resumen" aria-live="polite">
              <div className="propuesta-titulo">
                <span className="mini-label">Propuesta para {propuesta.cliente}</span>
                <span className={`chip${propuesta.origen === 'ia' ? ' chip-ia' : ''}`}>
                  {propuesta.origen === 'ia' ? 'Generada con IA' : 'Automática'}
                </span>
              </div>

              {propuesta.aviso && <p className="alert alert-suave">{propuesta.aviso}</p>}

              {propuesta.resumen && <p className="propuesta-resumen-texto">{propuesta.resumen}</p>}

              <div className="propuesta-bloque">
                <span className="mini-label">Servicios propuestos</span>
                <p className="propuesta-ayuda">
                  Desmarca los que no quieras y añade otros del catálogo. Después confirma para calcular.
                </p>

                <ul className="seleccion-list">
                  {seleccion.map((item) => {
                    const info = infoServicio(item.id)
                    const idCheck = `seleccion-${item.id}`

                    return (
                      <li
                        key={item.id}
                        className={`seleccion-item${item.aceptado ? '' : ' descartado'}`}
                      >
                        <div className="seleccion-fila">
                          <input
                            id={idCheck}
                            type="checkbox"
                            checked={item.aceptado}
                            onChange={() => alternarServicio(item.id)}
                          />
                          <label htmlFor={idCheck} className="seleccion-texto">
                            <strong>{info.nombre}</strong>
                            <span>
                              {item.origen === 'ia'
                                ? item.justificacion || info.descripcion
                                : `Añadido por ti. ${info.descripcion}`}
                            </span>
                          </label>
                          <span className="seleccion-precio">
                            {formatEuro(info.precio)}
                            {item.id === 'paginaAdicional' && <small> / pág.</small>}
                          </span>
                          {item.origen === 'usuario' && (
                            <button
                              type="button"
                              className="seleccion-quitar"
                              onClick={() => quitarServicio(item.id)}
                              aria-label={`Quitar ${info.nombre}`}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {item.id === 'paginaAdicional' && item.aceptado && (
                          <div className="seleccion-cantidad">
                            <label htmlFor="cantidad-paginas">¿Cuántas páginas adicionales?</label>
                            <input
                              id="cantidad-paginas"
                              type="number"
                              inputMode="numeric"
                              min="1"
                              max={PAGINAS_ADICIONALES_MAX}
                              value={item.cantidad}
                              onChange={(event) => cambiarCantidad(item.id, event.target.value)}
                              placeholder="EJ: 3"
                            />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {disponibles.length > 0 && (
                <div className="propuesta-bloque">
                  <span className="mini-label">Añadir del catálogo</span>
                  <div className="catalogo-anadir">
                    {disponibles.map((servicio) => (
                      <button
                        key={servicio.id}
                        type="button"
                        className="anadir-servicio"
                        onClick={() => anadirServicio(servicio.id)}
                        title={servicio.descripcion}
                      >
                        <span aria-hidden="true">+</span> {servicio.nombre}
                        <small>{formatEuro(servicio.precio)}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {propuesta.pendientes?.length > 0 && (
                <div className="propuesta-bloque">
                  <span className="mini-label">Pendiente de valorar</span>
                  <ul className="propuesta-list">
                    {propuesta.pendientes.map((item) => (
                      <li key={item.necesidad} className="pendiente">
                        <div>
                          <strong>{item.necesidad}</strong>
                          <p>{item.motivo}</p>
                        </div>
                        <span>A valorar</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {propuesta.dudas?.length > 0 && (
                <div className="propuesta-bloque">
                  <span className="mini-label">Dudas a aclarar</span>
                  <ul className="propuesta-dudas">
                    {propuesta.dudas.map((duda) => (
                      <li key={duda}>{duda}</li>
                    ))}
                  </ul>
                </div>
              )}

              {datosFaltantes.length > 0 && (
                <div className="alert alert-suave" role="status">
                  <strong>Completa estos datos para continuar:</strong>
                  <ul className="faltantes">
                    {datosFaltantes.map((dato) => (
                      <li key={dato}>{dato}</li>
                    ))}
                  </ul>
                </div>
              )}

              {seleccionError && (
                <p className="alert" role="alert">
                  {seleccionError}
                </p>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={confirmarSeleccion}
                disabled={datosFaltantes.length > 0 || isConfirmando}
                aria-busy={isConfirmando}
              >
                {isConfirmando ? 'Calculando…' : 'Confirmar y calcular presupuesto'}
              </button>

              <p className="propuesta-nota">{propuesta.nota}</p>
            </div>
          )}

        </section>
      </main>

      <footer className="page-footer">
        <span>Samuel Martínez</span>
      </footer>
      </div>

      {mostrarPDF && presupuesto?.lineas && (
        <Suspense fallback={null}>
          <VistaPreviaPDF
            inicial={datosInicialesPDF()}
            lineas={presupuesto.lineas}
            total={presupuesto.total}
            onCerrar={() => setMostrarPDF(false)}
          />
        </Suspense>
      )}
    </>
  )
}

export default App
