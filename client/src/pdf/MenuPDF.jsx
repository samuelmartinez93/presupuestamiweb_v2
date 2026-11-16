import { useEffect, useId, useRef, useState } from 'react'
import './MenuPDF.css'

const formatEuro = (valor) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor) || 0)

const fechaCorta = (fecha) =>
  fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

// Desplegable con una miniatura del documento y dos caminos:
// revisar/editar en la vista previa completa o descargar directamente.
function MenuPDF({ datos, onRevisar, onDescargado }) {
  const [abierto, setAbierto] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState('')
  const contenedor = useRef(null)
  const boton = useRef(null)
  const idPanel = useId()

  const { cliente, resumen, referencia, fecha, lineas, total, aclaraciones } = datos
  const puedeDescargarDirecto = Boolean(cliente.trim())

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (event) => {
      if (!contenedor.current?.contains(event.target)) setAbierto(false)
    }
    const alPulsarTecla = (event) => {
      if (event.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }

    document.addEventListener('pointerdown', alPulsarFuera)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('pointerdown', alPulsarFuera)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [abierto])

  const revisar = () => {
    setAbierto(false)
    onRevisar()
  }

  const descargarDirecto = async () => {
    if (!puedeDescargarDirecto || descargando) return

    setDescargando(true)
    setError('')
    try {
      // jsPDF solo se descarga cuando hace falta.
      const { generarPresupuestoPDF, nombreArchivo } = await import('./generarPresupuestoPDF')
      generarPresupuestoPDF(datos).save(nombreArchivo(cliente, fecha, referencia))
      onDescargado('directa')
      setAbierto(false)
    } catch {
      setError('No se pudo generar el PDF. Prueba desde la vista previa.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="menu-pdf" ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="primary-button menu-pdf-toggle"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((actual) => !actual)}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
          <path
            d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Descargar presupuesto
        <svg className="menu-pdf-flecha" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
          <path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div className="menu-pdf-panel" id={idPanel} role="region" aria-label="Opciones de descarga del PDF">
          <button
            type="button"
            className="miniatura"
            onClick={revisar}
            aria-label="Abrir la vista previa completa del PDF"
          >
            <span className="miniatura-hoja" aria-hidden="true">
              <span className="miniatura-cabecera">
                <span>
                  <b>Presupuesto</b>
                  <i>Presupuesta mi web</i>
                </span>
                <span className="miniatura-ref">{referencia}</span>
              </span>
              <span className="miniatura-cliente">
                <span>
                  <small>Cliente</small>
                  <b>{cliente.trim() || 'Sin indicar'}</b>
                </span>
                <span>
                  <small>Fecha</small>
                  <b>{fechaCorta(fecha)}</b>
                </span>
              </span>
              <small className="miniatura-titulo">Resumen del proyecto</small>
              <span className="miniatura-texto">{resumen}</span>
              <small className="miniatura-titulo">Servicios</small>
              <span className="miniatura-tabla">
                {lineas.map((linea) => (
                  <span key={linea.id}>
                    <span>
                      {linea.nombre}
                      {linea.cantidad > 1 && ` × ${linea.cantidad}`}
                    </span>
                    <span>{formatEuro(linea.subtotal)}</span>
                  </span>
                ))}
                <span className="miniatura-total">
                  <span>Total</span>
                  <span>{formatEuro(total)}</span>
                </span>
              </span>
              {aclaraciones.length > 0 && (
                <>
                  <small className="miniatura-titulo">Aclaraciones</small>
                  <span className="miniatura-texto">{aclaraciones.length} punto(s) pendientes</span>
                </>
              )}
            </span>
            <span className="miniatura-lupa">Ver a tamaño completo</span>
          </button>

          <dl className="menu-pdf-meta">
            <div>
              <dt>Referencia</dt>
              <dd>{referencia}</dd>
            </div>
            <div>
              <dt>Formato</dt>
              <dd>PDF · A4</dd>
            </div>
          </dl>

          <div className="menu-pdf-acciones">
            <button type="button" className="secondary-button" onClick={revisar}>
              Revisar y editar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={descargarDirecto}
              disabled={!puedeDescargarDirecto || descargando}
              aria-busy={descargando}
              aria-describedby={puedeDescargarDirecto ? undefined : `${idPanel}-aviso`}
            >
              {descargando ? 'Generando…' : 'Descargar directamente'}
            </button>
          </div>

          {!puedeDescargarDirecto && (
            <p className="menu-pdf-aviso" id={`${idPanel}-aviso`}>
              Falta el nombre del cliente. Añádelo desde «Revisar y editar».
            </p>
          )}
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuPDF
