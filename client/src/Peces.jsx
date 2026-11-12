import { useEffect, useState } from 'react'
import './Peces.css'

const NUM_PECES = 12
const PUNTOS_POR_RUTA = 8

// Tonos de la paleta del proyecto: [claro, medio, oscuro]
const TONOS = [
  ['#e0e1dd', '#778da9', '#415a77'],
  ['#778da9', '#415a77', '#1b263b'],
  ['#9fb6d3', '#415a77', '#0d1b2a']
]

const aleatorio = (min, max) => min + Math.random() * (max - min)

// Ruta cerrada con curvas suaves que recorre toda la ventana.
function crearRuta(ancho, alto) {
  const margen = 40
  const punto = () => [
    Math.round(aleatorio(margen, ancho - margen)),
    Math.round(aleatorio(margen, alto - margen))
  ]

  const inicio = punto()
  let d = `M ${inicio[0]} ${inicio[1]}`
  const [c1, c2, p1] = [punto(), punto(), punto()]
  d += ` C ${c1.join(' ')} ${c2.join(' ')} ${p1.join(' ')}`

  for (let i = 1; i < PUNTOS_POR_RUTA; i++) {
    d += ` S ${punto().join(' ')} ${punto().join(' ')}`
  }

  d += ` S ${punto().join(' ')} ${inicio.join(' ')}`
  return d
}

function crearPeces() {
  const ancho = window.innerWidth
  const alto = window.innerHeight

  return Array.from({ length: NUM_PECES }, (_, indice) => {
    const duracion = aleatorio(55, 95)
    const [claro, medio, oscuro] = TONOS[indice % TONOS.length]

    return {
      id: indice,
      estilo: {
        offsetPath: `path("${crearRuta(ancho, alto)}")`,
        animationDuration: `${duracion}s`,
        animationDelay: `${-aleatorio(0, duracion)}s`,
        '--pez-escala': aleatorio(0.8, 1.4).toFixed(2),
        '--pez-opacidad': aleatorio(0.4, 0.7).toFixed(2),
        '--pez-cola': `${Math.round(aleatorio(420, 700))}ms`,
        '--pez-claro': claro,
        '--pez-medio': medio,
        '--pez-oscuro': oscuro
      }
    }
  })
}

function Peces() {
  const [peces, setPeces] = useState(crearPeces)

  useEffect(() => {
    let temporizador
    const alRedimensionar = () => {
      clearTimeout(temporizador)
      temporizador = setTimeout(() => setPeces(crearPeces()), 300)
    }

    window.addEventListener('resize', alRedimensionar)
    return () => {
      clearTimeout(temporizador)
      window.removeEventListener('resize', alRedimensionar)
    }
  }, [])

  return (
    <div className="peces" aria-hidden="true">
      <div className="olas">
        <span className="ola ola-fondo" />
        <span className="ola ola-media" />
        <span className="ola ola-frente" />
      </div>
      {peces.map((pez) => (
        <div key={pez.id} className="pez" style={pez.estilo}>
          <span className="pez-cola" />
          <span className="pez-aleta-dorsal" />
          <span className="pez-cuerpo">
            <span className="pez-aleta" />
            <span className="pez-ojo" />
          </span>
        </div>
      ))}
    </div>
  )
}

export default Peces
