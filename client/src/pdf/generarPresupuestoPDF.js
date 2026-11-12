import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

// Paleta del proyecto
const COLOR = {
  navy: [13, 27, 42],
  azul: [27, 38, 59],
  acero: [65, 90, 119],
  gris: [119, 141, 169],
  claro: [224, 225, 221],
  texto: [33, 41, 54],
  suave: [96, 108, 124],
  linea: [216, 222, 230]
}

const MARGEN = 18
const ANCHO_PAGINA = 210
const ALTO_PAGINA = 297
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2
const LIMITE_INFERIOR = ALTO_PAGINA - 24

// jsPDF no dibuja bien los espacios especiales que usa Intl (p. ej. "1.200 €").
export const euros = (valor) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
    .format(Number(valor) || 0)
    .replace(/\s/g, ' ')

export const fechaLarga = (fecha) =>
  fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export function nombreArchivo(cliente, fecha) {
  const limpio = String(cliente || 'cliente')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `presupuesto-${limpio || 'cliente'}-${fecha.toISOString().slice(0, 10)}.pdf`
}

function titulo(doc, texto, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR.acero)
  doc.text(texto.toUpperCase(), MARGEN, y)
  doc.setDrawColor(...COLOR.gris)
  doc.setLineWidth(0.4)
  doc.line(MARGEN, y + 2, MARGEN + 14, y + 2)
  return y + 9
}

// Añade una página nueva si el bloque no cabe.
function asegurarEspacio(doc, y, alto) {
  if (y + alto > LIMITE_INFERIOR) {
    doc.addPage()
    return MARGEN + 6
  }
  return y
}

function parrafo(doc, texto, y) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...COLOR.texto)
  const lineas = doc.splitTextToSize(texto, ANCHO_UTIL)

  for (const linea of lineas) {
    y = asegurarEspacio(doc, y, 6)
    doc.text(linea, MARGEN, y)
    y += 5.4
  }
  return y
}

/**
 * Genera el PDF del presupuesto.
 * @param {object} datos
 * @param {string} datos.cliente
 * @param {Date} datos.fecha
 * @param {string} datos.resumen
 * @param {Array<{nombre, descripcion, cantidad, precio, subtotal}>} datos.lineas
 * @param {number} datos.total
 * @param {string[]} datos.aclaraciones
 */
export function generarPresupuestoPDF({ cliente, fecha, resumen, lineas, total, aclaraciones }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title: `Presupuesto - ${cliente}`, creator: 'Presupuesta mi web' })

  // Cabecera
  doc.setFillColor(...COLOR.navy)
  doc.rect(0, 0, ANCHO_PAGINA, 38, 'F')
  doc.setFillColor(...COLOR.acero)
  doc.rect(0, 38, ANCHO_PAGINA, 1.2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Presupuesto', MARGEN, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR.gris)
  doc.text('Presupuesta mi web', MARGEN, 28)

  // Cliente
  let y = 54
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR.gris)
  doc.text('CLIENTE', MARGEN, y)
  doc.text('FECHA', ANCHO_PAGINA - MARGEN, y, { align: 'right' })

  y += 7
  doc.setFontSize(14)
  doc.setTextColor(...COLOR.navy)
  doc.text(doc.splitTextToSize(cliente, ANCHO_UTIL - 50)[0], MARGEN, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.text(fechaLarga(fecha), ANCHO_PAGINA - MARGEN, y, { align: 'right' })

  // Resumen
  y += 16
  y = titulo(doc, 'Resumen del proyecto', y)
  y = parrafo(doc, resumen, y)

  // Servicios y desglose
  y = asegurarEspacio(doc, y + 8, 40)
  y = titulo(doc, 'Servicios confirmados y desglose', y)

  autoTable(doc, {
    startY: y,
    margin: { left: MARGEN, right: MARGEN, bottom: 26 },
    head: [['Servicio', 'Cant.', 'Precio', 'Importe']],
    body: lineas.map((linea) => [
      { content: linea.descripcion, nombre: linea.nombre },
      String(linea.cantidad),
      euros(linea.precio),
      euros(linea.subtotal)
    ]),
    foot: [[{ content: 'Total', colSpan: 3, styles: { halign: 'right' } }, euros(total)]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      textColor: COLOR.texto,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      lineColor: COLOR.linea,
      valign: 'top'
    },
    headStyles: {
      fillColor: COLOR.azul,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    footStyles: {
      fillColor: [236, 240, 245],
      textColor: COLOR.navy,
      fontStyle: 'bold',
      fontSize: 12
    },
    bodyStyles: { lineWidth: { bottom: 0.2 } },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    },
    // Descripción en gris; dejamos hueco arriba para el nombre en negrita.
    didParseCell: (data) => {
      if (data.section !== 'body' && data.column.index > 0) {
        data.cell.styles.halign = data.column.index === 1 ? 'center' : 'right'
      }
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.styles.textColor = COLOR.suave
        data.cell.styles.fontSize = 8.8
        data.cell.styles.cellPadding = { top: 9, bottom: 3.5, left: 3, right: 3 }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.8)
        doc.setTextColor(...COLOR.navy)
        doc.text(data.cell.raw.nombre, data.cell.x + 3, data.cell.y + 6.5)
      }
    }
  })

  y = doc.lastAutoTable.finalY + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR.suave)
  doc.text('Importes calculados con las tarifas vigentes de Presupuesta mi web.', MARGEN, y)

  // Aclaraciones y pendientes
  y = asegurarEspacio(doc, y + 12, 24)
  y = titulo(doc, 'Aclaraciones y aspectos pendientes', y)

  const puntos = aclaraciones.length > 0 ? aclaraciones : ['No hay aspectos pendientes de concretar.']
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...COLOR.texto)

  for (const punto of puntos) {
    const lineasPunto = doc.splitTextToSize(punto, ANCHO_UTIL - 6)
    y = asegurarEspacio(doc, y, lineasPunto.length * 5.4 + 2)
    doc.setFillColor(...COLOR.gris)
    doc.circle(MARGEN + 1.2, y - 1.3, 0.9, 'F')
    lineasPunto.forEach((linea, indice) => doc.text(linea, MARGEN + 6, y + indice * 5.4))
    y += lineasPunto.length * 5.4 + 2.5
  }

  // Pie en todas las páginas
  const paginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina)
    doc.setDrawColor(...COLOR.linea)
    doc.setLineWidth(0.3)
    doc.line(MARGEN, ALTO_PAGINA - 16, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.suave)
    doc.text(
      'Presupuesto orientativo. No incluye compromisos de plazos de entrega.',
      MARGEN,
      ALTO_PAGINA - 10
    )
    doc.text(`Página ${pagina} de ${paginas}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 10, {
      align: 'right'
    })
  }

  return doc
}
