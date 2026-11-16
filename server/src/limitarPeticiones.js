// Limita cuántas peticiones puede hacer cada IP en una ventana de tiempo.
// Protege las rutas que llaman a la IA para que nadie pueda gastar el crédito de la clave.
function limitarPeticiones({ maximo, ventanaMs }) {
  const registros = new Map();

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip || 'desconocida';
    const registro = registros.get(ip);

    if (!registro || ahora > registro.reinicio) {
      registros.set(ip, { cuenta: 1, reinicio: ahora + ventanaMs });
    } else if (registro.cuenta >= maximo) {
      res.set('Retry-After', String(Math.ceil((registro.reinicio - ahora) / 1000)));
      return res.status(429).json({
        error: 'Has hecho demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.'
      });
    } else {
      registro.cuenta += 1;
    }

    // Limpieza ocasional para que el mapa no crezca sin límite.
    if (registros.size > 5000) {
      for (const [clave, valor] of registros) {
        if (ahora > valor.reinicio) registros.delete(clave);
      }
    }

    next();
  };
}

module.exports = limitarPeticiones;
