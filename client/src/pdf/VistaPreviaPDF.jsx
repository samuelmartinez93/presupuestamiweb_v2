import { useEffect, useRef, useState } from 'react'
import {
  euros,
  fechaLarga,
  fechaValidez,
  generarPresupuestoPDF,
  nombreArchivo
} from './generarPresupuestoPDF'
import './VistaPreviaPDF.css'

const separarLineas = (texto) =>
  texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)

// Ventana para revisar el contenido del presupuesto antes de descargar el PDF.
function VistaPreviaPDF({ inicial, lineas, total, fecha, referencia, onCerrar, onDescargado }) {
  const dialogo = useRef(null)
  const [cliente, setCliente] = useState(inicial.cliente)
  const [resumen, setResumen] = useState(inicial.resumen)
  const [aclaraciones, setAclaraciones] = useState(inicial.aclaraciones)
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('')

  const faltaCliente = !cliente.trim()
  const faltaResumen = !resumen.trim()
  const puedeDescargar = !faltaCliente && !faltaResumen

  const datosPDF = () => ({
    cliente: cliente.trim() || 'Cliente sin indicar',
    fecha,
    referencia,
    resumen: resumen.trim() || 'Sin resumen.',
    lineas,
    total,
    aclaraciones: separarLineas(aclaraciones)
  })

  useEffect(() => {
    dialogo.current?.showModal()
  }, [])

  // Regenera la vista previa (con una pequeña espera mientras se escribe).
  useEffect(() => {
    let url = ''
    const temporizador = setTimeout(() => {
      const blob = generarPresupuestoPDF(datosPDF()).output('blob')
      url = URL.createObjectURL(blob)
      setUrlVistaPrevia(url)
    }, 350)

    return () => {
      clearTimeout(temporizador)
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, resumen, aclaraciones])

  const descargar = () => {
    if (!puedeDescargar) return
    generarPresupuestoPDF(datosPDF()).save(nombreArchivo(cliente, fecha, referencia))
    onDescargado('revisada')
    onCerrar()
  }

  return (
    <dialog
      ref={dialogo}
      className="vista-pdf"
      aria-labelledby="vista-pdf-titulo"
      aria-describedby="vista-pdf-desc"
      onCancel={(event) => {
        event.preventDefault()
        onCerrar()
      }}
    >
      <header className="vista-pdf-cabecera">
        <div>
          <span className="panel-kicker">Vista previa · {referencia}</span>
          <h2 id="vista-pdf-titulo">Revisa tu presupuesto</h2>
          <p id="vista-pdf-desc">
            Comprueba el contenido y corrige lo que necesites. La vista previa se actualiza al escribir.
          </p>
        </div>
        <button
          type="button"
          className="vista-pdf-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar la vista previa"
        >
          ×
        </button>
      </header>

      <div className="vista-pdf-cuerpo">
        <div className="vista-pdf-campos">
          <dl className="vista-pdf-meta">
            <div>
              <dt>Referencia</dt>
              <dd>{referencia}</dd>
            </div>
            <div>
              <dt>Emitido</dt>
              <dd>{fechaLarga(fecha)}</dd>
            </div>
            <div>
              <dt>Válido hasta</dt>
              <dd>{fechaLarga(fechaValidez(fecha))}</dd>
            </div>
          </dl>

          <div className="field">
            <label htmlFor="pdf-cliente">Cliente o empresa</label>
            <input
              id="pdf-cliente"
              type="text"
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              maxLength={100}
              placeholder="EJ: Restaurante La Brasa"
              aria-invalid={faltaCliente}
            />
          </div>

          <div className="field">
            <label htmlFor="pdf-resumen">Resumen del proyecto</label>
            <textarea
              id="pdf-resumen"
              rows="5"
              value={resumen}
              onChange={(event) => setResumen(event.target.value)}
              maxLength={1200}
              aria-invalid={faltaResumen}
            />
          </div>

          <div className="field">
            <label htmlFor="pdf-aclaraciones">Aclaraciones y aspectos pendientes</label>
            <textarea
              id="pdf-aclaraciones"
              rows="6"
              value={aclaraciones}
              onChange={(event) => setAclaraciones(event.target.value)}
              maxLength={3000}
              placeholder="EJ: Confirmar el segundo idioma (inglés o francés)."
              aria-describedby="pdf-aclaraciones-ayuda"
            />
            <small id="pdf-aclaraciones-ayuda">Una aclaración por línea.</small>
          </div>

          <div className="vista-pdf-servicios">
            <span className="mini-label">Servicios y total (calculados por el servidor)</span>
            <ul>
              {lineas.map((linea) => (
                <li key={linea.id}>
                  <span>
                    {linea.nombre}
                    {linea.cantidad > 1 && ` × ${linea.cantidad}`}
                  </span>
                  <strong>{euros(linea.subtotal)}</strong>
                </li>
              ))}
            </ul>
            <p>
              Total <strong>{euros(total)}</strong>
            </p>
          </div>

          {!puedeDescargar && (
            <p className="alert alert-suave" role="status">
              {faltaCliente
                ? 'Indica el nombre del cliente o empresa para poder descargar.'
                : 'Escribe un resumen del proyecto para poder descargar.'}
            </p>
          )}
        </div>

        <div className="vista-pdf-preview">
          {urlVistaPrevia ? (
            <iframe title={`Vista previa del PDF ${referencia}`} src={`${urlVistaPrevia}#view=FitH`} />
          ) : (
            <p className="vista-pdf-cargando" role="status">
              Generando vista previa…
            </p>
          )}
          {urlVistaPrevia && (
            <a href={urlVistaPrevia} target="_blank" rel="noreferrer" className="vista-pdf-abrir">
              Abrir la vista previa en otra pestaña
            </a>
          )}
        </div>
      </div>

      <footer className="vista-pdf-acciones">
        <button type="button" className="secondary-button" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={descargar}
          disabled={!puedeDescargar}
        >
          Aceptar y descargar PDF
        </button>
      </footer>
    </dialog>
  )
}

export default VistaPreviaPDF
