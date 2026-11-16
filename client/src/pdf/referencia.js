// Utilidades ligeras de trazabilidad (sin jsPDF, para poder usarlas en la página).
export const DIAS_VALIDEZ = 30

export const fechaValidez = (fecha) => {
  const validez = new Date(fecha)
  validez.setDate(validez.getDate() + DIAS_VALIDEZ)
  return validez
}

// Referencia única para poder identificar cada presupuesto (p. ej. PMW-261116-4K7Q).
export function crearReferencia(fecha = new Date()) {
  const dia = fecha.toISOString().slice(2, 10).replace(/-/g, '')
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')
  return `PMW-${dia}-${sufijo}`
}
