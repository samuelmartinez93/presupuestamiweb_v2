import { useEffect, useState } from 'react'
import './Peces.css'

const NUM_PECES = 10
const NUM_SALTOS = 3
const PUNTOS_POR_RUTA = 7

// Tonos de la paleta del proyecto: [claro, medio, oscuro]
const TONOS = [
  ['#e0e1dd', '#778da9', '#415a77'],
  ['#778da9', '#415a77', '#1b263b'],
  ['#9fb6d3', '#415a77', '#0d1b2a']
]

const aleatorio = (min, max) => min + Math.random() * (max - min)

// Ruta cerrada con curvas suaves por debajo de la superficie del agua.
function crearRuta(ancho, alto) {
  const punto = () => [
    Math.round(aleatorio(40, ancho - 40)),
    Math.round(aleatorio(alto * 0.08, alto * 0.75))
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

const colores = (indice) => {
  const [claro, medio, oscuro] = TONOS[indice % TONOS.length]
  return { '--pez-claro': claro, '--pez-medio': medio, '--pez-oscuro': oscuro }
}

function crearPeces() {
  const ancho = window.innerWidth
  const alto = window.innerHeight

  return Array.from({ length: NUM_PECES }, (_, indice) => {
    const duracion = aleatorio(55, 95)
    return {
      id: indice,
      estilo: {
        offsetPath: `path("${crearRuta(ancho, alto)}")`,
        animationDuration: `${duracion}s`,
        animationDelay: `${-aleatorio(0, duracion)}s`,
        '--pez-escala': aleatorio(0.75, 1.3).toFixed(2),
        '--pez-opacidad': aleatorio(0.35, 0.6).toFixed(2),
        '--pez-cola': `${Math.round(aleatorio(420, 700))}ms`,
        ...colores(indice)
      }
    }
  })
}

// Cada salto ocurre en un punto distinto de la superficie y con su propio ritmo.
function crearSaltos() {
  return Array.from({ length: NUM_SALTOS }, (_, indice) => {
    const ciclo = aleatorio(9, 15)
    return {
      id: indice,
      estilo: {
        left: `${Math.round(aleatorio(8, 82))}%`,
        '--salto-ciclo': `${ciclo.toFixed(1)}s`,
        '--salto-retraso': `${(indice * 4.3 + aleatorio(0, 3)).toFixed(1)}s`,
        '--salto-escala': `${Math.random() < 0.5 ? -1 : 1}`,
        ...colores(indice + 1)
      }
    }
  })
}

function Pez({ estilo, className = 'pez' }) {
  return (
    <div className={className} style={estilo}>
      <span className="pez-cola" />
      <span className="pez-aleta-dorsal" />
      <span className="pez-cuerpo">
        <span className="pez-aleta" />
        <span className="pez-ojo" />
      </span>
    </div>
  )
}

// Fondo de mar: luz que se mueve, olas con desenfoque y peces nadando y saltando.
function Peces() {
  const [peces, setPeces] = useState(crearPeces)
  const [saltos] = useState(crearSaltos)

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
    <div className="mar" aria-hidden="true">
      <span className="mar-luz mar-luz-1" />
      <span className="mar-luz mar-luz-2" />
      <span className="mar-luz mar-luz-3" />

      <div className="mar-agua">
        <div className="saltos">
          {saltos.map((salto) => (
            <div key={salto.id} className="salto" style={salto.estilo}>
              <Pez className="pez pez-saltando" />
              <span className="salpicadura salpicadura-salida" />
              <span className="salpicadura salpicadura-entrada" />
            </div>
          ))}
        </div>

        <div className="olas">
          <span className="ola ola-fondo" />
          <span className="ola ola-media" />
          <span className="ola ola-frente" />
        </div>

        <div className="mar-fondo">
          <span className="reflejos" />
          {peces.map((pez) => (
            <Pez key={pez.id} estilo={pez.estilo} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Peces
