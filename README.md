# Presupuesta mi web — versión 2
Alumno: Samuel Martínez
Profesor: Javier Ferrer

Actividad del módulo 0613 — Desarrollo web en entorno servidor.

Aplicación para calcular presupuestos de páginas web mediante una API
desarrollada con Node.js, Express y JavaScript, con una interfaz cliente
realizada con React.

El cliente puede configurar su web directamente o **describir su proyecto con
sus propias palabras**: la aplicación le propone los servicios necesarios, el
usuario los revisa y modifica, el servidor calcula el presupuesto y, por último,
se revisa y descarga un **presupuesto en PDF**.

> **La IA propone los servicios y redacta su explicación. Nuestro servidor
> valida la selección y calcula los precios.**

Los presupuestos no se guardan en una base de datos.

Esquema del proyecto:

```text
presupuestamiweb_v2/
├── client/                              Interfaz React y configuración de Vite.
│   ├── index.html                       Página base (tipografías y metadatos).
│   ├── src/
│   │   ├── App.jsx                      Pantalla principal: configurador, resumen y asistente IA.
│   │   ├── App.css / index.css          Estilos y tokens de diseño.
│   │   ├── Hero.jsx / Hero.css          Cabecera: fondo digital animado y maqueta de web.
│   │   ├── Logo.jsx                     Monograma «sm» personalizado.
│   │   ├── Peces.jsx / Peces.css        Fondo de mar animado (olas, peces y saltos).
│   │   └── pdf/
│   │       ├── generarPresupuestoPDF.js Genera el PDF con jsPDF.
│   │       ├── MenuPDF.jsx / .css       Desplegable de descarga con miniatura del documento.
│   │       ├── VistaPreviaPDF.jsx / .css Revisión y vista previa real antes de descargar.
│   │       └── referencia.js            Referencia y validez de cada presupuesto.
│   └── .env.example                     Variables del cliente (URL de la API).
├── server/
│   ├── src/
│   │   ├── server.js                    Servidor y rutas de la API.
│   │   ├── tarifas.js                   Tarifas definidas en el servidor.
│   │   ├── validar.js                   Validación del configurador.
│   │   ├── calcular.js                  Función de cálculo independiente.
│   │   ├── catalogo.js                  Catálogo de servicios (precios leídos de tarifas.js).
│   │   ├── validarSolicitud.js          Validación de la solicitud del cliente.
│   │   ├── ia.js                        Llamada a OpenAI y procesado de la respuesta.
│   │   ├── asistente.json               Propósito, temas permitidos y ejemplos del asistente.
│   │   ├── proponer.js                  Propuesta por palabras clave (si no hay IA).
│   │   ├── limitarPeticiones.js         Límite de peticiones por IP al asistente.
│   │   └── validarSeleccion.js          Validación de la selección confirmada.
│   ├── test/                            Tests automáticos (node --test).
│   ├── .env.example                     Plantilla de variables de entorno.
│   ├── package.json
│   └── package-lock.json
├── pruebas-api.http                     Peticiones para REST Client.
├── .gitignore
└── README.md
```

## 0. Inicio rápido para instalar y abrir el proyecto

Abre en Visual Studio Code la carpeta raíz del proyecto (la que contiene
`client`, `server` y este README). Todos los comandos parten de esa carpeta.
El backend y el frontend se ejecutan en **dos terminales diferentes**.

### 1) Instalar Node.js y npm

Descarga e instala Node.js (versión 22 o superior) desde https://nodejs.org/
y comprueba que están disponibles:

```bash
node -v
npm -v
```

### 2) Instalar dependencias del backend

```bash
cd server
npm install
```

### 3) Variables de entorno del backend

Dentro de `server/`, copia la plantilla:

```bash
cp .env.example .env
```

Y rellena `server/.env` (sin comillas ni espacios):

```text
OPENAI_API_KEY=tu_clave_aqui
OPENAI_MODEL=gpt-5-mini
PORT=3001
```

- La clave se obtiene en https://platform.openai.com/api-keys.
- `server/.env` está en `.gitignore`: **nunca se sube al repositorio**.
- Sin clave la aplicación sigue funcionando: la propuesta se genera con
  reglas por palabras clave y se indica en pantalla.

### 4) Instalar dependencias del frontend

En otra terminal:

```bash
cd client
npm install
```

### 5) Arrancar el backend

```bash
cd server
npm run dev
```

La API queda disponible en `http://localhost:3001`. En la consola se indica si
la IA está activada («IA activada (OPENAI_API_KEY encontrada)») o no.

### 6) Arrancar el frontend

```bash
cd client
npm run dev
```

La interfaz queda disponible en **http://localhost:5173**.

### 7) Verificar funcionamiento

1. Comprueba que el backend responde en http://localhost:3001/api/estado.
2. Abre el frontend en http://localhost:5173.
3. **Configurador**: elige tipo de web, páginas y extras y pulsa «Calcular presupuesto».
4. **Asistente IA**: escribe un cliente y una descripción (o pulsa uno de los
   ejemplos) y pulsa «Analizar solicitud».
5. Revisa la propuesta, pulsa «Confirmar y calcular presupuesto» y, en el resumen,
   abre «Descargar presupuesto» para ver la miniatura, revisar y descargar el PDF.

### 8) Ejecutar los tests del servidor

```bash
cd server
npm test
```

---

## 1. Tecnologías

- Node.js, Express y JavaScript.
- React y Vite.
- CORS.
- OpenAI (paquete oficial `openai`, Responses API con salida estructurada).
- jsPDF y jspdf-autotable para generar el PDF.
- GSAP (ScrollTrigger) para las animaciones de la interfaz.
- Test runner nativo de Node (`node --test`).
- REST Client de Visual Studio Code para las pruebas de la API.

## 2. Pasos seguidos en el proyecto

Resumen del trabajo realizado, en orden:

1. **Base del ejercicio anterior**: API con Express (`/api/estado`, `/api/tarifas`,
   `/api/presupuesto`), tarifas y cálculo en el servidor, validación estricta y
   configurador en React.
2. **Catálogo de servicios** (`catalogo.js`) con identificador, nombre,
   descripción, precio y regla de cálculo, reutilizando las tarifas existentes.
3. **Formulario de solicitud** (cliente + descripción) y validación en el
   servidor (`validarSolicitud.js`).
4. **Conexión con OpenAI** desde el servidor (`ia.js`) con salida estructurada y
   comprobación de la respuesta, más una alternativa por palabras clave (`proponer.js`).
5. **Revisión de la propuesta**: aceptar, eliminar y añadir servicios, completar
   los datos que faltan y cálculo de la selección en el servidor (`validarSeleccion.js`).
6. **Presupuesto en PDF** con jsPDF: revisión editable y vista previa real antes de descargar.
7. **Trazabilidad del presupuesto**: referencia única, fecha de emisión, validez
   e historial de descargas.
8. **Rediseño de la landing page**: nueva cabecera, navegación, distribución de
   paneles, asistente a ancho completo, animaciones y fondo de mar.
9. **Revisión final** contra el enunciado: corrección de la respuesta de
   `/api/presupuesto/seleccion`, resumen y dudas también en la propuesta
   automática, aviso de servicios descartados y nuevos tests.
10. **Asistente limitado a presupuestos web** mediante `asistente.json`: los
    mensajes de otros temas reciben un aviso para intentarlo de nuevo.
11. **Refuerzo de seguridad**: errores sin detalles internos, límite de
    peticiones al asistente, tamaño máximo de petición y CORS configurable.

## 3. Cumplimiento del enunciado

| Paso del enunciado | Cómo se cumple | Dónde |
|---|---|---|
| **1. Catálogo de servicios** | 5 servicios con `id`, nombre, descripción, precio y regla. Los precios salen de `tarifas.js`. Lo que no está en el catálogo se marca como **pendiente de valorar**. | `server/src/catalogo.js`, `GET /api/catalogo` |
| **2. Recoger la solicitud** | Formulario con cliente o empresa y descripción. El servidor rechaza la descripción vacía o solo con espacios y aplica límites (20–1500 caracteres; nombre hasta 100). Pruebas con datos ficticios. | `server/src/validarSolicitud.js`, `POST /api/propuesta` |
| **3. API de OpenAI** | Llamada desde el servidor con la clave en `OPENAI_API_KEY` (fuera del repositorio). Se envían la descripción y el catálogo. Respuesta en JSON Schema estricto con resumen, ids, justificación, dudas y pendientes. Se comprueba que cada id existe y se filtran precios y plazos. | `server/src/ia.js` |
| **4. Revisar y calcular** | Se muestran los servicios con su explicación. Se pueden aceptar, quitar y añadir del catálogo. Si falta un dato (tipo de web o número de páginas adicionales), no se puede continuar. El servidor calcula con las tarifas programadas. | `client/src/App.jsx`, `server/src/validarSeleccion.js`, `POST /api/presupuesto/seleccion` |
| **5. PDF** | Botón de descarga con miniatura del documento, revisión editable y vista previa real antes de aceptar. Incluye cliente, fecha, resumen, servicios con descripción, desglose, total y aclaraciones. Estudio de librerías en el apartado 13. | `client/src/pdf/` |

## 4. Organización y responsabilidades

- **server.js** recibe las peticiones y gestiona las respuestas HTTP.
- **tarifas.js** contiene los precios (única fuente de precios).
- **calcular.js** aplica las reglas del presupuesto a datos ya validados.
- **validar.js / validarSolicitud.js / validarSeleccion.js** comprueban los datos de entrada.
- **catalogo.js** describe los servicios que se pueden ofrecer.
- **ia.js** prepara las instrucciones, llama a OpenAI y comprueba la respuesta.
- **proponer.js** genera una propuesta por palabras clave si la IA no está disponible.
- **La interfaz React** recoge los datos, muestra la propuesta y genera el PDF.

La función `calcularPresupuesto` está separada del manejador HTTP y se
reutiliza tanto en el configurador como en la selección del asistente.
**Ni el cliente ni la IA deciden precios ni totales.**

## 5. Tarifas

| Concepto | Precio |
|---|---:|
| Landing, incluida la primera página | 300 EUR |
| Web corporativa, incluida la primera página | 600 EUR |
| Cada página adicional a la primera | 50 EUR |
| Formulario de contacto | 80 EUR |
| Segundo idioma | 150 EUR |

No se aplican impuestos, descuentos ni otros conceptos.

```text
Coste de páginas adicionales = (paginas - 1) × 50
Total = base + páginas adicionales + formulario + segundo idioma
```

## 6. Rutas de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estado` | Comprueba que el servicio está funcionando. |
| GET | `/api/tarifas` | Devuelve las tarifas del servidor. |
| GET | `/api/catalogo` | Devuelve el catálogo de servicios. |
| POST | `/api/presupuesto` | Calcula un presupuesto a partir del configurador. |
| POST | `/api/propuesta` | Analiza la solicitud del cliente y propone servicios. |
| POST | `/api/presupuesto/seleccion` | Calcula el presupuesto de la selección confirmada. |

Estados HTTP: **200** operación correcta, **400** datos que incumplen el
contrato (con un mensaje comprensible), **422** solicitud al asistente que no
trata de un proyecto web, **429** demasiadas solicitudes, **500** fallo interno
(mensaje genérico, sin detalles internos).

### POST /api/presupuesto (configurador)

```json
{ "tipo": "corporativa", "paginas": 4, "formulario": true, "segundoIdioma": false }
```

Respuesta 200:

```json
{
  "base": 600,
  "paginasAdicionales": 150,
  "formulario": 80,
  "segundoIdioma": 0,
  "total": 830,
  "moneda": "EUR",
  "lineas": [
    { "id": "corporativa", "nombre": "Web corporativa", "cantidad": 1, "precio": 600, "subtotal": 600 },
    { "id": "paginaAdicional", "nombre": "Página adicional", "cantidad": 3, "precio": 50, "subtotal": 150 },
    { "id": "formulario", "nombre": "Formulario de contacto", "cantidad": 1, "precio": 80, "subtotal": 80 }
  ]
}
```

`paginasAdicionales` es el coste, no la cantidad. Cada línea incluye también
la descripción del servicio (omitida aquí), que se usa en el PDF.

Validación: el cuerpo debe ser un objeto; `tipo` solo `"landing"` o
`"corporativa"`; `paginas` entero entre 1 y 20; `formulario` y `segundoIdioma`
booleanos. No se convierten tipos (`"4"` o `"false"` se rechazan) y las
propiedades adicionales (precios, totales) se ignoran.

### POST /api/propuesta (asistente)

```json
{
  "nombre": "Restaurante La Brasa (ficticio)",
  "descripcion": "Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas."
}
```

Devuelve el resumen, los servicios del catálogo con su justificación y precio
del servidor, las dudas y las necesidades pendientes de valorar.

### POST /api/presupuesto/seleccion (selección confirmada)

```json
{
  "servicios": [
    { "id": "corporativa" },
    { "id": "paginaAdicional", "cantidad": 3 },
    { "id": "formulario" },
    { "id": "segundoIdioma" }
  ]
}
```

Respuesta 200 con el desglose, `total: 980`, las `lineas` y la `seleccion`
interpretada (tipo, páginas y extras). Se rechazan servicios inexistentes o
repetidos, la falta de tipo de web o más de uno, y la cantidad de páginas
ausente o fuera de rango.

## 7. Paso 1 — Catálogo de servicios

| id | Nombre | Precio | Regla |
|---|---|---:|---|
| `landing` | Landing | 300 EUR | Precio base. Incluye la primera página. |
| `corporativa` | Web corporativa | 600 EUR | Precio base. Incluye la primera página. |
| `paginaAdicional` | Página adicional | 50 EUR | Por página, a partir de la segunda (máx. 20 en total). |
| `formulario` | Formulario de contacto | 80 EUR | Precio fijo si se incluye. |
| `segundoIdioma` | Segundo idioma | 150 EUR | Precio fijo si se incluye. |

Es el mismo catálogo del ejercicio anterior. Los precios se leen de
`tarifas.js`, así catálogo y cálculo nunca se desincronizan. Lo que el cliente
pida fuera del catálogo (tienda online, pagos, blog, más de dos idiomas, SEO…)
aparece como **necesidad pendiente de valorar**, sin precio.

## 8. Paso 2 — Solicitud del cliente

El asistente tiene un formulario con **Cliente o empresa** (obligatorio, máximo
100 caracteres) y **Descripción del proyecto** (obligatoria, 20–1500
caracteres, con contador). El servidor repite la comprobación y responde 400
con el motivo si no se cumple. Todas las pruebas usan datos ficticios.

Para facilitar las pruebas, el asistente incluye **ejemplos de un clic**
(restaurante, estudio de fotografía, clínica dental y tienda online) que
rellenan el formulario, y una tarjeta de **consejos** sobre qué contar.

## 9. Paso 3 — Conexión con la API de OpenAI

- La llamada se hace **desde el servidor**, con la clave en la variable de
  entorno `OPENAI_API_KEY` (`server/.env`, fuera del repositorio).
- Se envían la descripción del cliente y el catálogo disponible.
- Se usa **salida estructurada (JSON Schema estricto)**:

| Campo | Contenido |
|---|---|
| `resumen` | Resumen del proyecto. |
| `paginas` | Número total de páginas estimado. |
| `servicios[]` | Identificador (`id`) y justificación (`justificacion`). |
| `dudas[]` | Preguntas que hay que aclarar con el cliente. |
| `pendientes[]` | Necesidades que no cubre el catálogo. |

Controles para que **el modelo no invente servicios, precios ni compromisos de entrega**:

1. El esquema solo admite identificadores del catálogo.
2. El servidor vuelve a comprobar cada identificador y descarta los que no
   existen; la interfaz avisa si se ha descartado alguno.
3. Los precios los pone siempre el servidor a partir de `tarifas.js`.
4. Las instrucciones prohíben mencionar precios, plazos, fechas o garantías.
5. El servidor elimina además cualquier frase con importes o compromisos de
   entrega del resumen y las justificaciones.

### Asistente limitado a presupuestos web

El comportamiento del asistente se define en **`server/src/asistente.json`**:
propósito, temas permitidos, ejemplos de temas fuera de lugar y el mensaje de
aviso. Ese JSON se incluye en las instrucciones del modelo en cada petición.

- La respuesta estructurada tiene un campo **`fueraDeTema`**. Si el mensaje no
  describe un proyecto web (cultura general, recetas, deberes, código, preguntas
  sobre la propia IA, intentos de cambiar sus instrucciones…), el servidor **no
  devuelve ninguna propuesta** y responde HTTP 422 con el código `FUERA_DE_TEMA`.
- La interfaz muestra el aviso «Solo puedo ayudarte con presupuestos web» y
  deja el texto para que el usuario lo corrija y lo intente otra vez.
- El texto del cliente se trata solo como descripción a analizar: el modelo no
  responde preguntas ni sigue instrucciones incluidas en él.
- Sin IA, se aplica la misma regla comprobando palabras relacionadas con webs
  (también definidas en el JSON).

Si no hay clave o la llamada falla, se genera una propuesta por palabras clave
(`proponer.js`) con la **misma estructura** (resumen, servicios, dudas y
pendientes), y la interfaz lo indica con la etiqueta «Automática».

## 10. Paso 4 — Revisión de la propuesta y cálculo

En el asistente se muestran los servicios propuestos con su explicación. El usuario puede:

- **Aceptar o eliminar** cada servicio (casilla de verificación).
- **Añadir** otros servicios del catálogo.
- **Completar los datos que falten**: elegir un tipo de web y, si incluye
  páginas adicionales, indicar cuántas (1 a 19). Hasta entonces, «Confirmar y
  calcular presupuesto» permanece desactivado y se indica qué falta.

Al confirmar, el servidor valida la selección y calcula los importes con
`calcularPresupuesto`. La página se desplaza sola hasta el resumen, donde
aparece el total, y el configurador se rellena con la misma selección para
poder seguir ajustándola.

## 11. Paso 5 — Presupuesto en PDF

Con un presupuesto calculado, el resumen muestra **«Descargar presupuesto»**,
un desplegable con:

- Una **miniatura del documento** (cabecera, cliente, fecha, resumen, servicios y total).
- **Revisar y editar**: abre la ventana «Revisa tu presupuesto», donde se
  corrigen el cliente, el resumen y las aclaraciones, con la **vista previa real
  del PDF** actualizándose al escribir. «Aceptar y descargar PDF» descarga el archivo.
- **Descargar directamente**: genera el mismo PDF sin pasar por la edición.

El documento incluye:

- Nombre del cliente o empresa y fecha.
- Resumen del proyecto.
- Servicios confirmados y su descripción.
- Desglose de importes y total.
- Aclaraciones o aspectos pendientes de concretar (dudas y pendientes de la propuesta).

## 12. Trazabilidad del presupuesto

Cada cálculo recibe:

- Una **referencia única** (por ejemplo `PMW-261116-N4A5`).
- **Fecha y hora de emisión** y **validez de 30 días**.

La referencia aparece en el resumen, en la vista previa, en la cabecera y el pie
de cada página del PDF y en el nombre del archivo
(`presupuesto-restaurante-la-brasa-pmw-261116-n4a5.pdf`). El resumen guarda
además un **historial de descargas** de la sesión con referencia, hora, importe
y si se descargó revisado o directamente.

## 13. Librerías PDF estudiadas

| Librería | Dónde | Valoración |
|---|---|---|
| **jsPDF + jspdf-autotable** (elegida) | Navegador | Muy usada, texto real seleccionable, archivos ligeros y tablas con saltos de página. |
| pdfmake | Navegador / Node | Buena alternativa declarativa, pero más pesada y menos flexible en diseño. |
| @react-pdf/renderer | Navegador / Node | Cómoda con componentes React, pero pesada y con estilos propios. |
| PDFKit | Node | Base de pdfmake; de bajo nivel. |
| pdf-lib | Ambos | Ideal para modificar PDFs existentes, no para crearlos desde cero. |
| Puppeteer / Playwright | Servidor | HTML a PDF perfecto, pero requiere un Chrome completo; problemático en Vercel. |
| html2pdf.js / html2canvas | Navegador | **No recomendable**: convierte la página en imagen (texto no seleccionable, borroso y pesado). |
| `window.print()` | Navegador | Sin librerías, pero depende del diálogo de impresión de cada navegador. |

Se eligió jsPDF porque el PDF se genera en el navegador (no necesita nada en el
servidor) y la vista previa y la descarga usan exactamente el mismo documento.
La librería solo se descarga cuando se genera el PDF, así la página carga más rápido.

## 14. Diseño de la landing page

La interfaz se rediseñó para que el flujo sea más claro y tenga un aspecto más
profesional, inspirado en configuradores de presupuestos web.

**Estructura**

- **Navegación flotante tipo iOS** con efecto cristal (*glassmorphism*): cápsula
  translúcida y desenfocada que pasa de cristal oscuro sobre la cabecera a
  cristal claro sobre el contenido. Incluye enlaces a cada sección y un botón «Calcular».
- **Logo personalizado**: monograma «sm» (Samuel Martínez) con una ola, a juego
  con el fondo de mar, en la navegación y en el pie.
- **Cabecera (hero)**: título en dos niveles, «Presupuesta tu web» y debajo
  «*en minutos*» destacado en cursiva con degradado y un subrayado que se dibuja
  al cargar. Indicador de pasos que marca los completados.
- **Fondo digital del hero**: red de puntos conectados en movimiento (canvas),
  rejilla tipo plano técnico y un haz de luz. A la derecha, una **maqueta de web
  que se va construyendo** con etiquetas de servicios y un total que cuenta hasta 880 €.
- **Configurador (1) y Resumen (2) lado a lado**; el resumen se queda fijo al
  hacer scroll y muestra total, referencia, desglose y descarga.
- **Asistente IA a ancho completo** debajo, para quien no sepa qué necesita:
  formulario y ejemplos a la izquierda; consejos, carga y propuesta a la derecha.
- **Pie** con marca, enlaces a las secciones y firma.

**Movimiento**

- **GSAP + ScrollTrigger**: entrada escalonada de la cabecera, paneles que
  aparecen al hacer scroll, ejemplos y consejos en cascada y un leve parallax.
- **Fondo de mar**: luces difuminadas, olas con desenfoque, destellos bajo el
  agua y peces que nadan bajo la superficie y **saltan de vez en cuando** con
  una pequeña salpicadura. El agua sube despacio al bajar por la página y los
  paneles son ligeramente translúcidos para intuirla detrás.

**Accesibilidad**

- Enlace «Saltar al contenido», foco visible en todos los controles y etiquetas
  asociadas a cada campo.
- Desplegables y ventanas accesibles por teclado (Escape cierra y devuelve el
  foco), con `aria-expanded`, `aria-live` y `role="alert"` en los mensajes.
- Con «reducir movimiento» activado en el sistema se desactivan las animaciones.
- Diseño adaptado a móvil: una columna, título escalado y navegación simplificada.

## 15. Seguridad

- **Ninguna clave en el código ni en el repositorio**: la clave de OpenAI solo
  existe como variable de entorno del servidor (`server/.env`, excluido por
  `.gitignore`). El navegador nunca la recibe.
- **Precios solo en el servidor**: se ignoran precios o totales enviados por el cliente.
- **Errores sin detalles internos**: los fallos (JSON mal formado, rutas
  inexistentes, errores inesperados) devuelven un mensaje genérico en JSON, sin
  trazas ni rutas de archivos.
- **Sin cabecera `X-Powered-By`**, para no revelar la tecnología del servidor.
- **Tamaño máximo de petición** de 20 KB.
- **Límite de peticiones al asistente**: 20 propuestas cada 15 minutos por IP
  (HTTP 429 al superarlo), para evitar abusos de la API de IA.
- **CORS configurable**: con `CORS_ORIGIN` solo la web indicada puede llamar a la API.

## 16. Pruebas

### Tests automáticos

`npm test` en `server/`: **36 tests, todos correctos**.

| Archivo | Qué comprueba |
|---|---|
| `test/catalogo.test.js` | Campos del catálogo, precios iguales a las tarifas, propuesta y pendientes. |
| `test/validarSolicitud.test.js` | Descripción vacía, demasiado corta o larga, nombre obligatorio. |
| `test/ia.test.js` | Esquema, procesado de la respuesta, ids fuera del catálogo, filtro de precios y plazos, mensajes fuera de tema. |
| `test/validarSeleccion.test.js` | Tipo de web obligatorio y único, cantidad de páginas, servicios inventados o repetidos. |
| `test/proponer.test.js` | Texto del enunciado, resumen y dudas de la propuesta automática, pendientes sin precio, detección de temas ajenos. |

### Peticiones de `pruebas-api.http` (REST Client)

1. Iniciar el backend.
2. Abrir `pruebas-api.http` en Visual Studio Code con REST Client.
3. Pulsar «Send Request» y comprobar el estado y la respuesta.

| Nº | Petición | Resultado esperado |
|---|---|---|
| 1–2 | GET /api/estado y /api/tarifas | 200 |
| 3 | Landing básica | 200, total 300 EUR |
| 4 | Corporativa, 4 páginas y formulario | 200, total 830 EUR |
| 5 | Landing, 2 páginas y ambos extras | 200, total 580 EUR |
| 6 | Landing con 20 páginas | 200, total 1250 EUR |
| 7–11 | Páginas 0, 21 o decimales, tipo no permitido, booleano como cadena | 400 |
| 12–17 | Precio impuesto por el cliente, páginas como cadena, campo ausente, array, cadenas | 400 o precio ignorado |
| 18 | GET /api/catalogo | 200 y los 5 servicios |
| 19 | Propuesta del restaurante del enunciado | 200, servicios del catálogo |
| 20 | Propuesta con tienda online, pagos y blog | 200, pendientes de valorar |
| 21–22 | Propuesta con descripción vacía o sin nombre | 400 |
| 23 | Selección confirmada | 200, total 980 EUR |
| 24 | Selección sin cantidad de páginas | 400 |
| 25 | Selección con un servicio inventado | 400 |

Un 400 en una prueba diseñada con datos inválidos es el resultado correcto de
la validación, no un fallo.

### Pruebas de la interfaz

Se ha recorrido el flujo completo en navegador, en escritorio y en móvil:
asistente con ejemplo → propuesta → confirmación → resumen → miniatura del PDF →
descarga directa → revisión y descarga, sin errores en consola.

## 17. Dependencias y entrega

Se incluyen el código fuente, `package.json` y `package-lock.json` de `server`
y `client`, la configuración de Vite, `pruebas-api.http`, este README y las
plantillas `.env.example` (sin claves).

No se incluyen `node_modules`, credenciales, archivos `.env` ni archivos de
compilación. Las dependencias se reconstruyen con `npm install` dentro de
`server` y de `client`.

## 18. Despliegue en Vercel

El repositorio contiene dos aplicaciones, así que en Vercel se crean **dos
proyectos** conectados al mismo repositorio de GitHub, cada uno con su carpeta raíz.

| Proyecto | Root Directory | Framework | Qué despliega |
|---|---|---|---|
| API | `server` | Express (detectado automáticamente) | `server/src/server.js` como función de Vercel |
| Web | `client` | Vite (detectado automáticamente) | La interfaz React (`npm run build` → `dist`) |

`server.js` exporta la aplicación (`module.exports = app`): Vercel la ejecuta
como función y en local se sigue arrancando con `npm run dev`.

### Orden recomendado

1. **API**: crear el proyecto con Root Directory `server` y añadir en
   Settings → Environment Variables:
   - `OPENAI_API_KEY` = la clave de OpenAI.
   - `OPENAI_MODEL` (opcional, por defecto `gpt-5-mini`).
   - Desplegar y comprobar `https://<api>.vercel.app/api/estado`.
2. **Web**: crear el proyecto con Root Directory `client` y añadir:
   - `VITE_API_URL` = `https://<api>.vercel.app/api`.
   - Desplegar.
3. **Cerrar la API a la web**: en el proyecto de la API añadir
   `CORS_ORIGIN` = `https://<web>.vercel.app` y volver a desplegar (Redeploy).

Tras cambiar cualquier variable hay que volver a desplegar para que se aplique.

> Las variables de `.env` **no se suben** con el código: solo existen en local
> y en la configuración de Vercel. Todo lo que empieza por `VITE_` se incluye en
> el JavaScript que descarga el navegador, por eso **la clave de OpenAI nunca
> lleva ese prefijo** y solo se configura en el proyecto de la API.
