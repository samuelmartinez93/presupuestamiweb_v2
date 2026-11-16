import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './Hero.css'

const DISTANCIA_UNION = 140

// Red de puntos conectados que se mueve despacio: da el toque "digital" al fondo del hero.
export function HeroFondo() {
  const lienzo = useRef(null)

  useEffect(() => {
    const canvas = lienzo.current
    const ctx = canvas.getContext('2d')
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let puntos = []
    let ancho = 0
    let alto = 0
    let frame = 0
    let visible = true

    const crearPuntos = () => {
      const cantidad = Math.round(Math.min(90, (ancho * alto) / 14000))
      puntos = Array.from({ length: cantidad }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.6
      }))
    }

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto)

      for (const p of puntos) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > ancho) p.vx *= -1
        if (p.y < 0 || p.y > alto) p.vy *= -1
      }

      for (let i = 0; i < puntos.length; i++) {
        for (let j = i + 1; j < puntos.length; j++) {
          const dx = puntos[i].x - puntos[j].x
          const dy = puntos[i].y - puntos[j].y
          const distancia = Math.hypot(dx, dy)
          if (distancia < DISTANCIA_UNION) {
            ctx.strokeStyle = `rgba(159, 182, 211, ${0.16 * (1 - distancia / DISTANCIA_UNION)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(puntos[i].x, puntos[i].y)
            ctx.lineTo(puntos[j].x, puntos[j].y)
            ctx.stroke()
          }
        }
      }

      for (const p of puntos) {
        ctx.fillStyle = 'rgba(183, 200, 220, 0.55)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const bucle = () => {
      if (visible) dibujar()
      frame = requestAnimationFrame(bucle)
    }

    const redimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ancho = canvas.offsetWidth
      alto = canvas.offsetHeight
      canvas.width = ancho * dpr
      canvas.height = alto * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      crearPuntos()
      if (reducido) dibujar()
    }

    const observadorTamano = new ResizeObserver(redimensionar)
    observadorTamano.observe(canvas)

    // No gastamos CPU cuando el hero no se ve.
    const observadorVisible = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting
    })
    observadorVisible.observe(canvas)

    redimensionar()
    if (!reducido) frame = requestAnimationFrame(bucle)

    return () => {
      cancelAnimationFrame(frame)
      observadorTamano.disconnect()
      observadorVisible.disconnect()
    }
  }, [])

  return (
    <div className="hero-fondo" aria-hidden="true">
      <canvas ref={lienzo} className="hero-red" />
      <span className="hero-rejilla" />
      <span className="hero-escaner" />
    </div>
  )
}

// Maqueta de una web que se va "construyendo", con los servicios sumándose al total.
export function HeroMockup() {
  const total = useRef(null)

  useEffect(() => {
    const elemento = total.current
    const contador = { valor: 0 }
    const formato = (valor) => `${Math.round(valor).toLocaleString('es-ES')} €`

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elemento.textContent = formato(880)
      return
    }

    const animacion = gsap.to(contador, {
      valor: 880,
      duration: 2.4,
      delay: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        elemento.textContent = formato(contador.valor)
      }
    })
    return () => animacion.kill()
  }, [])

  return (
    <div className="hero-mockup" aria-hidden="true">
      <div className="mockup-ventana">
        <div className="mockup-barra">
          <i />
          <i />
          <i />
          <span className="mockup-url">
            <svg viewBox="0 0 16 16" width="10" height="10">
              <path
                d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7M3.5 7h9v6.5h-9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            labrasa.com
          </span>
        </div>
        <div className="mockup-cuerpo">
          <span className="mk mk-nav" style={{ '--i': 0 }} />
          <span className="mk mk-portada" style={{ '--i': 1 }} />
          <span className="mk mk-linea" style={{ '--i': 2 }} />
          <span className="mk mk-linea corta" style={{ '--i': 3 }} />
          <span className="mk-tarjetas">
            <span className="mk" style={{ '--i': 4 }} />
            <span className="mk" style={{ '--i': 5 }} />
            <span className="mk" style={{ '--i': 6 }} />
          </span>
          <span className="mk mk-boton" style={{ '--i': 7 }} />
        </div>
      </div>

      <div className="mockup-chip chip-1">
        <span className="chip-check">✓</span>
        Formulario de contacto <b>+80 €</b>
      </div>
      <div className="mockup-chip chip-2">
        <span className="chip-check">✓</span>
        Segundo idioma <b>+150 €</b>
      </div>
      <div className="mockup-total">
        <small>Total estimado</small>
        <strong ref={total}>0 €</strong>
      </div>
    </div>
  )
}
