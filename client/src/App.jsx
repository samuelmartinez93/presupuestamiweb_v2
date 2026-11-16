import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import Peces from './Peces'
import Logo from './Logo'
import { HeroFondo, HeroMockup } from './Hero'
import MenuPDF from './pdf/MenuPDF'
import { crearReferencia, fechaValidez } from './pdf/referencia'

gsap.registerPlugin(ScrollTrigger)

// jsPDF es pesado: solo se descarga cuando se abre la vista previa.
const VistaPreviaPDF = lazy(() => import('./pdf/VistaPreviaPDF'))

// En Vercel la web y la API comparten dominio (/api); en local la API está en el puerto 3001.
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

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

// Proyectos de ejemplo para probar el asistente sin tener una idea clara.
const EJEMPLOS = [
  {
    icono: '🍽️',
    titulo: 'Restaurante',
    nombre: 'Restaurante La Brasa',
    descripcion:
      'Necesito una web para mi restaurante. Quiero mostrar la carta, que los clientes puedan pedir reserva con un formulario y tenerla en español e inglés.'
  },
  {
    icono: '📷',
    titulo: 'Estudio de fotografía',
    nombre: 'Estudio Lumen',
    descripcion:
      'Somos un estudio de fotografía y queremos una web sencilla de una sola página para enseñar nuestro trabajo y que nos contacten.'
  },
  {
    icono: '🦷',
    titulo: 'Clínica dental',
    nombre: 'Clínica Dental Sonrisa',
    descripcion:
      'Queremos una web corporativa con varias páginas: servicios, equipo, tarifas, blog y contacto, con formulario para pedir cita.'
  },
  {
    icono: '🏺',
    titulo: 'Tienda online',
    nombre: 'Cerámica Aura',
    descripcion:
      'Hago cerámica artesanal y quiero vender mis piezas por internet con carrito y pago con tarjeta, además de una página sobre mí.'
  }
]

const CONSEJOS = [
  { icono: '🏷️', titulo: 'Qué es tu negocio. ', texto: 'A qué te dedicas y a quién te diriges.' },
  { icono: '🗂', titulo: 'Qué secciones quieres. ', texto: 'Inicio, servicios, carta, blog… o una sola página.' },
  { icono: '✉️', titulo: 'Cómo te contactarán. ', texto: 'Formulario, reservas, citas o solo un teléfono.' },
  { icono: '🌍', titulo: 'Idiomas y extras. ', texto: 'Si necesitas otro idioma, tienda online, etc.' }
]

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

const formatFecha = (fecha, conHora = false) =>
  fecha.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(conHora && { hour: '2-digit', minute: '2-digit' })
  })

// Cada cálculo recibe fecha de emisión y referencia propia para poder identificarlo.
const conTrazabilidad = (datos) => {
  const emitido = new Date()
  return { ...datos, emitido, referencia: crearReferencia(emitido) }
}

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
  const [fueraDeTema, setFueraDeTema] = useState(false)
  const [isAnalizando, setIsAnalizando] = useState(false)
  const [detallePresupuesto, setDetallePresupuesto] = useState(false)
  const [formularioDesdeIA, setFormularioDesdeIA] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [seleccion, setSeleccion] = useState([])
  const [seleccionError, setSeleccionError] = useState('')
  const [isConfirmando, setIsConfirmando] = useState(false)
  const [mostrarPDF, setMostrarPDF] = useState(false)
  const [descargas, setDescargas] = useState([])
  const [navClara, setNavClara] = useState(false)
  const hero = useRef(null)

  // Al salir del hero, la barra de navegación pasa a cristal claro.
  useEffect(() => {
    const observador = new IntersectionObserver(
      ([entrada]) => setNavClara(!entrada.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' }
    )
    observador.observe(hero.current)
    return () => observador.disconnect()
  }, [])

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

  // Animaciones suaves al cargar y al hacer scroll (desactivadas si se pide menos movimiento).
  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.hero-texto > *, .hero-mockup', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.09
      })

      gsap.to('.hero-contenido', {
        yPercent: 14,
        opacity: 0.5,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      })

      gsap.utils.toArray('.revelar').forEach((elemento, indice) => {
        gsap.from(elemento, {
          y: 56,
          opacity: 0,
          duration: 1,
          delay: indice < 2 ? 0.25 + indice * 0.12 : 0,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: elemento, start: 'top 90%', once: true }
        })
      })

      gsap.from('.ejemplo, .ai-consejos li', {
        y: 14,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.panel-ai', start: 'top 75%', once: true }
      })

      // El mar sube despacio al bajar por la página.
      gsap.to('.mar-agua', {
        y: () => -window.innerHeight * 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      })
    })

    return () => mm.revert()
  }, [])

  const usarEjemplo = (ejemplo) => {
    setNombreCliente(ejemplo.nombre)
    setSolicitudCliente(ejemplo.descripcion)
    setPropuestaError('')
    document.getElementById('solicitud-cliente')?.focus({ preventScroll: true })
  }

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

  // Se llama desde el formulario o desde «Reintentar con IA» (sin evento).
  const manejarPropuesta = async (event) => {
    event?.preventDefault()

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
    setFueraDeTema(false)
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

      // El asistente solo atiende presupuestos web: avisamos y dejamos el texto para corregirlo.
      if (datos?.codigo === 'FUERA_DE_TEMA') {
        setFueraDeTema(true)
        setPropuestaError(datos.error)
        document.getElementById('solicitud-cliente')?.focus({ preventScroll: true })
        return
      }

      if (!respuesta.ok) {
        throw new Error(datos?.error || 'No se pudo generar la propuesta.')
      }

      setPropuesta(datos)
      // Una propuesta nueva invalida el presupuesto anterior: así el PDF nunca mezcla dos clientes.
      setPresupuesto(null)
      setFormularioDesdeIA(false)
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
      setPropuestaError(
        error instanceof TypeError
          ? 'No se puede conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
          : `${error.message || 'No se pudo analizar la solicitud.'} Inténtalo de nuevo.`
      )
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

      setPresupuesto(conTrazabilidad(datos))
      setDetallePresupuesto(true)
      setError('')
      setFormData({
        tipo: datos.seleccion.tipo,
        paginas: String(datos.seleccion.paginas),
        formulario: datos.seleccion.formulario,
        segundoIdioma: datos.seleccion.segundoIdioma
      })
      setFormularioDesdeIA(true)
      // El resultado aparece arriba, en el resumen: llevamos allí al usuario.
      requestAnimationFrame(() =>
        document.getElementById('resumen')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
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

    // Si el cliente cambió la propuesta, se indica para que el resumen y la tabla sean coherentes.
    const cambios = []
    if (propuesta && presupuesto?.lineas) {
      const propuestos = new Map(propuesta.servicios.map((servicio) => [servicio.id, servicio]))
      const finales = new Map(presupuesto.lineas.map((linea) => [linea.id, linea]))
      const nombres = (ids) => ids.map((id) => infoServicio(id).nombre).join(', ')

      const anadidos = [...finales.keys()].filter((id) => !propuestos.has(id))
      const descartados = [...propuestos.keys()].filter((id) => !finales.has(id))
      const paginasPropuestas = propuestos.get('paginaAdicional')?.cantidad
      const paginasFinales = finales.get('paginaAdicional')?.cantidad

      if (anadidos.length > 0) {
        cambios.push(`Servicios añadidos por el cliente a la propuesta: ${nombres(anadidos)}.`)
      }
      if (descartados.length > 0) {
        cambios.push(`Servicios propuestos que el cliente ha descartado: ${nombres(descartados)}.`)
      }
      if (paginasPropuestas && paginasFinales && paginasPropuestas !== paginasFinales) {
        cambios.push(`Páginas adicionales ajustadas por el cliente: de ${paginasPropuestas} a ${paginasFinales}.`)
      }
    }

    const aclaraciones = [
      ...cambios,
      ...(propuesta?.pendientes || []).map((item) => `${item.necesidad}: ${item.motivo}`),
      ...(propuesta?.dudas || [])
    ]

    return {
      cliente: propuesta?.cliente || nombreCliente.trim(),
      resumen: propuesta?.resumen || `Presupuesto de desarrollo web que incluye: ${servicios}.`,
      aclaraciones: aclaraciones.join('\n')
    }
  }

  // Datos completos para la descarga directa (sin pasar por la revisión).
  const datosPDF = () => {
    const inicial = datosInicialesPDF()
    return {
      cliente: inicial.cliente,
      resumen: inicial.resumen,
      aclaraciones: inicial.aclaraciones
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean),
      fecha: presupuesto.emitido,
      referencia: presupuesto.referencia,
      lineas: presupuesto.lineas,
      total: presupuesto.total
    }
  }

  const registrarDescarga = (modo) => {
    setDescargas((anteriores) => [
      { referencia: presupuesto.referencia, total: presupuesto.total, modo, fecha: new Date() },
      ...anteriores
    ])
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

      setPresupuesto(conTrazabilidad(datos))
      setDetallePresupuesto(true)
    } catch {
      setError('No se puede conectar con el servidor. Comprueba que la API está iniciada.')
    } finally {
      setIsLoading(false)
    }
  }

  const paginasActuales = Number(formData.paginas) || PAGINAS_MIN

  const pasos = [
    { id: 'configurador', titulo: 'Configura tu web', hecho: Boolean(presupuesto) },
    { id: 'resumen', titulo: 'Revisa y descarga', hecho: descargas.length > 0 }
  ]
  const pasoActual = pasos.find((paso) => !paso.hecho)?.id

  return (
    <>
      <Peces />
      <div className="app-shell">
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>

        <nav className={`topbar${navClara ? ' topbar-clara' : ''}`} aria-label="Principal">
          <a className="marca" href="#">
            <Logo />
            <span className="marca-texto">
              Presupuesta mi web
              <small>por Samuel Martínez</small>
            </span>
          </a>
          <ul className="topbar-enlaces">
            <li>
              <a href="#configurador">Configurador</a>
            </li>
            <li>
              <a href="#resumen">Tu presupuesto</a>
            </li>
            <li>
              <a href="#asistente">Asistente IA</a>
            </li>
          </ul>
          <a className="topbar-cta" href="#configurador">
            Calcular
          </a>
        </nav>

        <header className="hero" ref={hero}>
          <HeroFondo />
          <div className="hero-contenido">
            <div className="hero-texto">
              <span className="eyebrow">Presupuestos web claros y sin sorpresas</span>
              <h1>
                <span className="titulo-linea">Presupuesta tu web</span>
                <span className="titulo-acento">
                  en minutos
                  <svg
                    className="titulo-subrayado"
                    viewBox="0 0 300 18"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 13C60 5 140 3 297 9" />
                  </svg>
                </span>
              </h1>
              <p className="subtitle">
                Configura tu web y verás el precio al momento, con el desglose de cada servicio y un PDF listo
                para compartir. ¿No lo tienes claro? El asistente te orienta.
              </p>

              <ol className="pasos" aria-label="Pasos para obtener el presupuesto">
                {pasos.map((paso, indice) => (
                  <li
                    key={paso.id}
                    className={`paso${paso.hecho ? ' hecho' : ''}${paso.id === pasoActual ? ' actual' : ''}`}
                    aria-current={paso.id === pasoActual ? 'step' : undefined}
                  >
                    <a href={`#${paso.id}`}>
                      <span className="paso-numero" aria-hidden="true">
                        {paso.hecho ? '✓' : indice + 1}
                      </span>
                      <span>
                        {paso.titulo}
                        {paso.hecho && <span className="sr-only"> (completado)</span>}
                      </span>
                    </a>
                  </li>
                ))}
                <li className="paso paso-ayuda">
                  <a href="#asistente">
                    <span className="paso-numero" aria-hidden="true">
                      ✦
                    </span>
                    <span>¿Dudas? Pregunta al asistente IA</span>
                  </a>
                </li>
              </ol>
            </div>
            <HeroMockup />
          </div>
        </header>

        <main className="main-layout" id="contenido">
          <div className="fila-superior">
            <section
              id="configurador"
              className="panel panel-formulario revelar"
              aria-labelledby="titulo-formulario"
            >
              <header className="panel-header">
                <span className="panel-kicker">
                  <span className="kicker-numero">1</span> Configurador
                </span>
                <h2 id="titulo-formulario">Configura tu web</h2>
                <p className="panel-intro">
                  Elige el tipo de web, las páginas y los extras. El precio se calcula al momento.
                </p>
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

            <aside
              id="resumen"
              className={`panel resultado-panel revelar${presupuesto ? ' con-presupuesto' : ''}`}
              aria-labelledby="titulo-resumen"
            >
              <header className="panel-header">
                <span className="panel-kicker">
                  <span className="kicker-numero">2</span> Resumen
                </span>
                <h2 id="titulo-resumen">Tu presupuesto</h2>
              </header>

              <div className="resumen-cuerpo" aria-live="polite">
                {presupuesto ? (
                  <div className="presupuesto-actual">
                    <div className="total-bloque">
                      <span>Total estimado</span>
                      <p className="presupuesto-actual-total">{formatEuro(presupuesto.total)}</p>
                    </div>

                    <dl className="traza">
                      <div>
                        <dt>Referencia</dt>
                        <dd>{presupuesto.referencia}</dd>
                      </div>
                      <div>
                        <dt>Emitido</dt>
                        <dd>
                          <time dateTime={presupuesto.emitido.toISOString()}>
                            {formatFecha(presupuesto.emitido, true)}
                          </time>
                        </dd>
                      </div>
                      <div>
                        <dt>Válido hasta</dt>
                        <dd>{formatFecha(fechaValidez(presupuesto.emitido))}</dd>
                      </div>
                    </dl>

                    <div className="presupuesto-actual-header">
                      <span className="mini-label">Desglose</span>
                      <button
                        type="button"
                        className="mini-toggle"
                        onClick={() => setDetallePresupuesto((actual) => !actual)}
                        aria-expanded={detallePresupuesto}
                        aria-controls="detalle-presupuesto"
                      >
                        {detallePresupuesto ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>

                    {detallePresupuesto && (
                      <ul className="presupuesto-detalle" id="detalle-presupuesto">
                        {(presupuesto.lineas || []).map((linea) => (
                          <li className="linea" key={linea.id}>
                            <span>
                              {linea.nombre}
                              {linea.cantidad > 1 && <small> × {linea.cantidad}</small>}
                            </span>
                            <strong>{formatEuro(linea.subtotal)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}

                    {presupuesto.lineas && (
                      <MenuPDF
                        key={presupuesto.referencia}
                        datos={datosPDF()}
                        onRevisar={() => setMostrarPDF(true)}
                        onDescargado={registrarDescarga}
                      />
                    )}
                  </div>
                ) : (
                  <div className="resumen-vacio">
                    <p className="resumen-pista">
                      Calcula con el configurador o confirma una propuesta del asistente y aquí verás el
                      total, el desglose y la descarga en PDF.
                    </p>
                    {tarifas && (
                      <div className="tarifas-box">
                        <span className="mini-label">Precios base</span>
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
                  </div>
                )}
              </div>

              {descargas.length > 0 && (
                <div className="historial">
                  <span className="mini-label">Historial de descargas</span>
                  <ol>
                    {descargas.map((descarga) => (
                      <li key={descarga.fecha.getTime()}>
                        <span>
                          <strong>{descarga.referencia}</strong>
                          <small>
                            <time dateTime={descarga.fecha.toISOString()}>
                              {descarga.fecha.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </time>
                            {descarga.modo === 'revisada' ? ' · Revisado' : ' · Directo'}
                          </small>
                        </span>
                        <span>{formatEuro(descarga.total)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <ul className="garantias">
                <li>Precios calculados con las tarifas vigentes</li>
                <li>Sin compromiso: presupuesto orientativo</li>
                <li>Validez de 30 días desde la emisión</li>
              </ul>
            </aside>
          </div>

          <section id="asistente" className="panel panel-ai revelar" aria-labelledby="titulo-ia">
            <div className="ai-columna">
              <header className="panel-header">
                <span className="panel-kicker">
                  <span className="kicker-ia" aria-hidden="true">
                    ✦
                  </span>{' '}
                  Asistente IA
                </span>
                <h2 id="titulo-ia">¿No sabes qué necesitas?</h2>
                <p className="panel-intro">
                  Cuéntanos tu idea con tus palabras. El asistente te propone los servicios, te avisa de lo
                  que queda por concretar y tú decides qué incluir.
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

                {propuestaError &&
                  (fueraDeTema ? (
                    <div className="aviso-tema" role="alert">
                      <span className="aviso-tema-icono" aria-hidden="true">
                        ✦
                      </span>
                      <div>
                        <strong>Solo puedo ayudarte con presupuestos web</strong>
                        <p>{propuestaError}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="alert" role="alert">
                      {propuestaError}
                    </p>
                  ))}

                <button className="primary-button" type="submit" disabled={isAnalizando} aria-busy={isAnalizando}>
                  {isAnalizando ? 'Analizando…' : 'Analizar solicitud'}
                </button>
              </form>

              <div className="ejemplos">
                <span className="mini-label" id="ejemplos-titulo">
                  ¿Quieres probar? Usa un ejemplo
                </span>
                <div className="ejemplos-lista" role="group" aria-labelledby="ejemplos-titulo">
                  {EJEMPLOS.map((ejemplo) => (
                    <button
                      key={ejemplo.nombre}
                      type="button"
                      className="ejemplo"
                      onClick={() => usarEjemplo(ejemplo)}
                    >
                      <span aria-hidden="true">{ejemplo.icono}</span>
                      {ejemplo.titulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ai-resultado">
              {isAnalizando && (
                <div className="ai-cargando" role="status">
                  <span className="ai-cargando-punto" aria-hidden="true" />
                  Analizando tu proyecto…
                  <span className="esqueleto" aria-hidden="true" />
                  <span className="esqueleto corto" aria-hidden="true" />
                  <span className="esqueleto" aria-hidden="true" />
                </div>
              )}

              {!propuesta && !isAnalizando && (
                <div className="ai-consejos">
                  <h3>Consejos para una buena propuesta</h3>
                  <ul>
                    {CONSEJOS.map((consejo) => (
                      <li key={consejo.titulo}>
                        <span className="consejo-icono" aria-hidden="true">
                          {consejo.icono}
                        </span>
                        <span>
                          <strong>{consejo.titulo}</strong>
                          {consejo.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="ai-nota">
                    Lo que el asistente no pueda presupuestar aparecerá como «pendiente de valorar», nunca con
                    un precio inventado.
                  </p>
                </div>
              )}

              {propuesta && (
                <div className="propuesta-resumen" aria-live="polite">
                  <div className="propuesta-titulo">
                    <span className="mini-label">Propuesta para {propuesta.cliente}</span>
                    <span className={`chip${propuesta.origen === 'ia' ? ' chip-ia' : ''}`}>
                      {propuesta.origen === 'ia' ? 'Generada con IA' : 'Automática'}
                    </span>
                  </div>

                  {propuesta.aviso && (
                    <div className="alert alert-suave aviso-reintentar" role="status">
                      <span>{propuesta.aviso}</span>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => manejarPropuesta()}
                        disabled={isAnalizando}
                        aria-busy={isAnalizando}
                      >
                        {isAnalizando ? 'Reintentando…' : 'Reintentar con IA'}
                      </button>
                    </div>
                  )}

              {propuesta.idsDescartados?.length > 0 && (
                <p className="alert alert-suave">
                  Se han descartado {propuesta.idsDescartados.length} servicio(s) propuestos por la IA que no
                  existen en el catálogo.
                </p>
              )}

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
            </div>
          </section>
        </main>

        <footer className="page-footer">
          <div className="footer-marca">
            <span className="marca">
              <Logo tamano={40} />
              <span className="marca-texto">
                Presupuesta mi web
                <small>por Samuel Martínez</small>
              </span>
            </span>
            <p>Presupuestos web claros, al momento y sin sorpresas.</p>
          </div>
          <nav className="footer-enlaces" aria-label="Secciones">
            <a href="#configurador">Configurador</a>
            <a href="#resumen">Tu presupuesto</a>
            <a href="#asistente">Asistente IA</a>
          </nav>
          <p className="footer-firma">
            © {new Date().getFullYear()} · Diseñado y desarrollado por <strong>Samuel Martínez</strong>
          </p>
        </footer>
      </div>

      {mostrarPDF && presupuesto?.lineas && (
        <Suspense fallback={null}>
          <VistaPreviaPDF
            inicial={datosInicialesPDF()}
            lineas={presupuesto.lineas}
            total={presupuesto.total}
            fecha={presupuesto.emitido}
            referencia={presupuesto.referencia}
            onCerrar={() => setMostrarPDF(false)}
            onDescargado={registrarDescarga}
          />
        </Suspense>
      )}
    </>
  )
}

export default App
