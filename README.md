# Presupuesta mi web
Alumno: Samuel Martínez
Profesor: Javier Ferrer

Actividad del módulo 0613 — Desarrollo web en entorno servidor.

Aplicación para calcular presupuestos de páginas web mediante una API
desarrollada con Node.js, Express y JavaScript. Incluye una interfaz
cliente realizada con React.

El cliente selecciona las características de la web y envía una solicitud
JSON al servidor. El servidor valida los datos, aplica sus propias
tarifas y devuelve un presupuesto desglosado.

Los presupuestos no se guardan en una base de datos.

### Ampliación: propuesta con IA y presupuesto en PDF

La aplicación se ha ampliado para que un cliente pueda explicar qué necesita,
recibir una propuesta de servicios, revisarla y descargar un presupuesto en PDF.

Se utiliza la API de OpenAI para interpretar la solicitud del cliente y
relacionarla con los servicios del catálogo. **La IA propone los servicios y
redacta su explicación; el servidor valida la selección y calcula los precios.**

Esquema proyecto:

```text
presupuestamiweb_v2/
├── client/                          Interfaz React y configuración de Vite.
│   ├── src/
│   │   ├── App.jsx                  Pantalla principal (resumen, configurador y asistente IA).
│   │   ├── App.css                  Estilos de la interfaz.
│   │   ├── Peces.jsx / Peces.css    Fondo animado (peces y olas).
│   │   └── pdf/
│   │       ├── generarPresupuestoPDF.js   Genera el PDF con jsPDF.
│   │       └── VistaPreviaPDF.jsx         Revisión y vista previa antes de descargar.
│   └── .env.example                 Variables del cliente (URL de la API).
├── server/
│   ├── src/
│   │   ├── server.js                Servidor y rutas de la API.
│   │   ├── tarifas.js               Tarifas definidas en el servidor.
│   │   ├── validar.js               Validación de las solicitudes de presupuesto.
│   │   ├── calcular.js              Función de cálculo independiente.
│   │   ├── catalogo.js              Catálogo de servicios (precios leídos de tarifas.js).
│   │   ├── validarSolicitud.js      Validación de la solicitud del cliente.
│   │   ├── ia.js                    Llamada a OpenAI y procesado de la respuesta.
│   │   ├── proponer.js              Propuesta por palabras clave (si no hay IA).
│   │   └── validarSeleccion.js      Validación de la selección confirmada.
│   ├── test/                        Tests automáticos (node --test).
│   ├── .env.example                 Plantilla de variables de entorno.
│   ├── package.json
│   └── package-lock.json
├── docs/                            Informe y capturas de las pruebas.
│   └── pruebas-api.md
├── pruebas-api.http                 Peticiones para REST Client.
├── .gitignore
└── README.md
```

## 0. Inicio rápido para instalar y abrir el proyecto

Sigue estos pasos desde cero para que el profesor pueda poner en marcha la
aplicación sin tener que descargar manualmente todos los paquetes del proyecto:

¡Recuerda! --> Abre la carpeta raíz del proyecto en Visual Studio Code: la que contiene client, server y este readme.

Todos los comandos siguientes parten de esa carpeta.
El backend y el frontend se ejecutan en dos terminales diferentes.

### 1) Instalar Node.js y npm

Descarga e instala Node.js (versión 22 o superior) desde la página oficial:

https://nodejs.org/

Comprueba que quedan disponibles ejecutando:

```bash
node -v
npm -v
```

### 2) Instalar dependencias del backend

En la carpeta del proyecto, entra en la carpeta del servidor:

```bash
cd server
npm install
```

### 3) Configurar la clave de OpenAI (backend)

Dentro de `server/`, copia la plantilla de variables de entorno:

```bash
cp .env.example .env
```

Abre `server/.env` y pega la clave secreta de OpenAI después del `=`,
sin comillas ni espacios:

```text
OPENAI_API_KEY=sk-proj-tu-clave
OPENAI_MODEL=gpt-5-mini
PORT=3001
```

- La clave se obtiene en https://platform.openai.com/api-keys.
- `server/.env` está en `.gitignore`: **nunca se sube al repositorio**.
- Si no se configura la clave, la aplicación sigue funcionando: la propuesta
  se genera con reglas por palabras clave y se indica en pantalla.

### 4) Instalar dependencias del frontend

Abre otra terminal y entra en la carpeta cliente:

```bash
cd client
npm install
```

### 5) Arrancar el backend

En la terminal del servidor:

```bash
npm start
```

O, para que se reinicie solo al guardar cambios:

```bash
npm run dev
```

La API quedará disponible en:

```text
http://localhost:3001
```

En la consola aparecerá si la IA está activada
(«IA activada (OPENAI_API_KEY encontrada)») o desactivada.

### 6) Arrancar el frontend

En la terminal del cliente:

```bash
npm run dev
```

La interfaz quedará disponible en:

```text
http://localhost:5173
```

> Enlace para revisarlo desde el navegador: http://localhost:5173

### 7) Verificar funcionamiento

1. Comprueba que el backend responde en http://localhost:3001/api/estado.
2. Abre el frontend en http://localhost:5173.
3. Rellena el formulario y pulsa «Calcular presupuesto».
4. En el asistente IA, escribe un cliente y una descripción y pulsa «Analizar solicitud».
5. Revisa la propuesta, pulsa «Confirmar y calcular presupuesto» y después
   «Descargar presupuesto (PDF)».

### 8) Ejecutar los tests del servidor

```bash
cd server
npm test
```

---

## 1. Tecnologías

- Node.js.
- Express.
- JavaScript.
- React.
- Vite.
- CORS.
- OpenAI (paquete oficial `openai`, Responses API con salida estructurada).
- jsPDF y jspdf-autotable para generar el PDF.
- Test runner nativo de Node (`node --test`).
- REST Client de Visual Studio Code para realizar las pruebas.

## 2. Organización del proyecto

Ver el esquema del principio. Resumen de responsabilidades:

- **server.js** recibe las peticiones y gestiona las respuestas HTTP.
- **tarifas.js** contiene los precios del servidor (única fuente de precios).
- **calcular.js** aplica las reglas del presupuesto a datos ya validados.
- **validar.js / validarSolicitud.js / validarSeleccion.js** comprueban los datos de entrada.
- **catalogo.js** describe los servicios que se pueden ofrecer.
- **ia.js** prepara las instrucciones, llama a OpenAI y comprueba la respuesta.
- **proponer.js** genera una propuesta por palabras clave si la IA no está disponible.
- **La interfaz React** recoge las opciones, muestra la propuesta y genera el PDF.

## 3. Requisitos

- Node.js 22 o superior y npm instalados.
- Una terminal.
- Un navegador para utilizar la interfaz.
- Una clave de API de OpenAI (opcional: sin ella se usan reglas por palabras clave).
- Opcionalmente, Visual Studio Code con REST Client para repetir
  las peticiones del archivo pruebas-api.http.

## 4. Instalación y ejecución del backend

Abre una terminal en la carpeta raíz del proyecto.

Ejecuta:

```bash
cd server
npm install
npm start
```

La API utiliza por defecto el puerto 3001:

```text
http://localhost:3001
```

Mantén esta terminal abierta mientras utilizas o pruebas la aplicación.

Si se ha configurado la variable de entorno PORT, el servidor utilizará
el puerto indicado en ella. La interfaz está preparada para llamar al
puerto 3001, por lo que ambos deben coincidir (o configurar `VITE_API_URL`
en el cliente, ver apartado 24).

### Variables de entorno del servidor (`server/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | No | Clave secreta de OpenAI. Sin ella se usan reglas por palabras clave. |
| `OPENAI_MODEL` | No | Modelo a utilizar. Por defecto `gpt-5-mini`. |
| `PORT` | No | Puerto del servidor. Por defecto `3001`. |

## 5. Instalación y ejecución del frontend

Abre una segunda terminal en la carpeta raíz del proyecto.

Ejecuta:

```bash
cd client
npm install
npm run dev
```

Abre en el navegador la dirección que indique Vite, normalmente:

```text
http://localhost:5173
```

El backend y el frontend deben permanecer encendidos para utilizar
el formulario completo. Si el backend no está arrancado, la interfaz
muestra «No se puede conectar con el servidor» y no cargan los precios base.

## 6. Funcionamiento

### Configurador (cálculo directo)

1. El usuario selecciona el tipo de web.
2. Indica el número de páginas.
3. Selecciona si necesita formulario de contacto.
4. Selecciona si necesita un segundo idioma.
5. La interfaz envía una petición POST con JSON a la API.
6. El servidor valida los datos.
7. Si los datos son válidos, calcula el presupuesto.
8. La interfaz muestra el desglose devuelto por el servidor.

### Asistente IA (propuesta, revisión y PDF)

1. El cliente escribe su nombre o empresa y describe el proyecto.
2. El servidor valida la solicitud y la envía a OpenAI junto con el catálogo.
3. La IA devuelve un resumen, los servicios propuestos con su justificación
   y las dudas o necesidades pendientes.
4. El servidor comprueba que los servicios existen en el catálogo y calcula los precios.
5. El usuario acepta o elimina servicios y añade otros del catálogo.
6. Si faltan datos (tipo de web, número de páginas adicionales), debe completarlos.
7. Al confirmar, el servidor calcula los importes con las tarifas programadas.
8. El usuario revisa el contenido del PDF en una vista previa y lo descarga.

Las tarifas y el cálculo se mantienen en el servidor.
El cliente no decide el precio ni el total, y la IA tampoco.

## 7. Tarifas

| Concepto | Precio |
|---|---:|
| Landing, incluida la primera página | 300 EUR |
| Web corporativa, incluida la primera página | 600 EUR |
| Cada página adicional a la primera | 50 EUR |
| Formulario de contacto | 80 EUR |
| Segundo idioma | 150 EUR |

No se aplican impuestos, descuentos ni otros conceptos.

## 8. Rutas de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estado` | Comprueba que el servicio está funcionando. |
| GET | `/api/tarifas` | Devuelve las tarifas del servidor. |
| GET | `/api/catalogo` | Devuelve el catálogo de servicios. |
| POST | `/api/presupuesto` | Calcula un presupuesto a partir del configurador. |
| POST | `/api/propuesta` | Analiza la solicitud del cliente y propone servicios. |
| POST | `/api/presupuesto/seleccion` | Calcula el presupuesto de la selección confirmada. |

### GET /api/estado

URL:

```text
http://localhost:3001/api/estado
```

Respuesta correcta: HTTP 200.

```json
{
  "status": "ok"
}
```

### GET /api/tarifas

URL:

```text
http://localhost:3001/api/tarifas
```

Respuesta correcta: HTTP 200.

```json
{
  "landing": 300,
  "corporativa": 600,
  "paginaAdicional": 50,
  "formulario": 80,
  "segundoIdioma": 150,
  "moneda": "EUR"
}
```

### POST /api/presupuesto

Recibe las características de la web y devuelve el presupuesto calculado.

URL:

```text
http://localhost:3001/api/presupuesto
```

Cabecera:

```http
Content-Type: application/json
```

Los cuatro campos son obligatorios.

Ejemplo de solicitud:

```json
{
  "tipo": "corporativa",
  "paginas": 4,
  "formulario": true,
  "segundoIdioma": false
}
```

Respuesta correcta: HTTP 200.

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

El campo paginasAdicionales representa el coste de las páginas
adicionales, no su cantidad. El campo `lineas` (con nombre y descripción
de cada servicio, omitida aquí) se añadió en la ampliación para el PDF.

Las rutas de la ampliación (`/api/catalogo`, `/api/propuesta` y
`/api/presupuesto/seleccion`) se explican en los apartados 18 a 21.

## 9. Validación

Antes de calcular, el servidor comprueba que:

- El cuerpo sea un objeto, no null ni un array.
- Existan tipo, paginas, formulario y segundoIdioma.
- tipo sea exactamente "landing" o "corporativa".
- paginas sea un número entero entre 1 y 20.
- formulario sea un booleano.
- segundoIdioma sea un booleano.

No se convierten automáticamente los tipos recibidos por la API:

- 4 es un número válido.
- "4" es una cadena y debe rechazarse.
- false es un booleano válido.
- "false" es una cadena y debe rechazarse.

Las propiedades adicionales se ignoran y no deben modificar las tarifas
ni imponer un total.

Cuando la validación falla, se devuelve HTTP 400 con un mensaje
comprensible y no se calcula el presupuesto.

Ejemplo observado:

```json
{
  "error": "El campo \"paginas\" debe ser un número entero entre 1 y 20."
}
```

## 10. Separación de responsabilidades

- server.js recibe las peticiones y gestiona las respuestas HTTP.
- validar.js comprueba los datos de entrada.
- tarifas.js contiene los precios del servidor.
- calcular.js aplica las reglas del presupuesto a datos ya validados.
- La interfaz React recoge las opciones y presenta el resultado.

La función calcularPresupuesto está separada del manejador HTTP.
La ampliación reutiliza esta misma función para calcular la selección
confirmada en el asistente IA.

## 11. Regla de cálculo

```text
Coste de páginas adicionales = (paginas - 1) × 50

Total = base + coste de páginas adicionales
        + coste de formulario + coste de segundo idioma
```

Ejemplo: corporativa con 4 páginas y formulario de contacto.

```text
Base corporativa:                   600 EUR
3 páginas adicionales × 50 EUR:      150 EUR
Formulario de contacto:               80 EUR
Segundo idioma no seleccionado:       0 EUR
Total:                              830 EUR
```

La primera página está incluida en la tarifa base.

## 12. Estados HTTP

| Estado | Significado |
|---|---|
| 200 | Operación realizada correctamente. |
| 400 | Solicitud con datos que incumplen el contrato. |
| 500 | Fallo interno inesperado del servidor. |

Las capturas realizadas hasta el momento muestran respuestas 200 y 400.

La prueba específica del estado 500 está pendiente de documentar.
No se considera verificada únicamente por disponer de un bloque try/catch.

## 13. Cómo reproducir las pruebas

1. Iniciar el backend.
2. Instalar REST Client en Visual Studio Code.
3. Abrir pruebas-api.http.
4. Pulsar Send Request sobre la petición correspondiente.
5. Comprobar el estado HTTP y el cuerpo de la respuesta.

Las peticiones POST incluyen Content-Type: application/json.

Abrir una URL en la barra del navegador no sustituye el envío de un
POST con cuerpo JSON.

El informe detallado y las evidencias de las pruebas se encuentran en
[docs/pruebas-api.md](docs/pruebas-api.md).

Las capturas están guardadas dentro de la carpeta `docs`.

Las pruebas de la ampliación son las peticiones 18 a 25 del archivo
pruebas-api.http (apartado 23).

## 14. Pruebas de las rutas GET

| Ruta | Resultado esperado | Resultado obtenido |
|---|---|---|
| GET /api/estado | 200 y {"status":"ok"} | 200 y {"status":"ok"} |
| GET /api/tarifas | 200 y tarifas del servidor | 200 y tarifas correctas |

## 15. Casos de prueba del presupuesto

En todos los casos se utiliza:

```http
POST http://localhost:3001/api/presupuesto
Content-Type: application/json
```

| Caso del enunciado | Solicitud JSON enviada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200, total 300 EUR | 200, total 300 EUR |
| 2 | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200, total 830 EUR | 200, total 830 EUR |
| 3 | `{"tipo":"landing","paginas":2,"formulario":true,"segundoIdioma":true}` | 200, total 580 EUR | 200, total 580 EUR |
| 4 | `{"tipo":"landing","paginas":20,"formulario":false,"segundoIdioma":false}` | 200, total 1250 EUR | 200, total 1250 EUR |
| 5 | `{"tipo":"landing","paginas":0,"formulario":false,"segundoIdioma":false}` | 400 | 400, error sobre paginas |
| 6 | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | 400 | 400, error sobre paginas |
| 7 | `{"tipo":"landing","paginas":2.5,"formulario":false,"segundoIdioma":false}` | 400 | 400, error sobre paginas |
| 8 | `{"tipo":"tienda","paginas":3,"formulario":false,"segundoIdioma":false}` | 400 | 400, error sobre tipo |
| 9 | `{"tipo":"landing","paginas":3,"formulario":"false","segundoIdioma":false}` | 400 | 400, error sobre formulario |

Los casos 1 a 9 del enunciado corresponden a las peticiones 3 a 11
del archivo pruebas-api.http, porque sus dos primeras peticiones
comprueban las rutas GET.

## 16. Interpretación de los resultados

Los cuatro presupuestos válidos devolvieron los totales esperados.

Las entradas inválidas devolvieron HTTP 400 y mensajes relacionados
con el campo incorrecto, sin devolver un desglose de presupuesto.

Un HTTP 400 en una prueba diseñada para enviar datos inválidos es
un resultado correcto de la validación, no un fallo de la aplicación.

## 17. Dependencias y entrega

Se incluyen en el repositorio:

- Código fuente.
- package.json de server y client.
- package-lock.json de server y client.
- Configuración de Vite y demás archivos necesarios.
- pruebas-api.http.
- README.md.
- Documentación y capturas de pruebas.
- Plantillas `.env.example` (sin claves).

No se incluyen:

- node_modules.
- Credenciales.
- Archivos .env con datos privados (la clave de OpenAI).
- Archivos de compilación generados que no sean necesarios.

Las dependencias se reconstruyen ejecutando npm install
dentro de server y de client.

---

# Ampliación: asistente IA y presupuesto en PDF

## 18. Paso 1 — Catálogo de servicios

Archivo: `server/src/catalogo.js`. Ruta: `GET /api/catalogo`.

Se reutiliza el catálogo del ejercicio anterior. Cada servicio tiene
identificador, nombre, descripción, precio y regla de cálculo:

| id | Nombre | Precio | Regla |
|---|---|---:|---|
| `landing` | Landing | 300 EUR | Precio base. Incluye la primera página. |
| `corporativa` | Web corporativa | 600 EUR | Precio base. Incluye la primera página. |
| `paginaAdicional` | Página adicional | 50 EUR | Por página, a partir de la segunda (máx. 20 en total). |
| `formulario` | Formulario de contacto | 80 EUR | Precio fijo si se incluye. |
| `segundoIdioma` | Segundo idioma | 150 EUR | Precio fijo si se incluye. |

- Los precios **se leen de `tarifas.js`**, así el catálogo y el cálculo nunca se desincronizan.
- La IA solo puede seleccionar estos servicios. Lo que el cliente pida y no
  esté en el catálogo (tienda online, pagos, blog, más de dos idiomas…)
  se marca como **necesidad pendiente de valorar**.

## 19. Paso 2 — Solicitud del cliente

Archivo: `server/src/validarSolicitud.js`. Ruta: `POST /api/propuesta`.

El asistente IA tiene un formulario con:

- **Cliente o empresa** (obligatorio, máximo 100 caracteres).
- **Descripción del proyecto** (obligatoria, entre 20 y 1500 caracteres, con contador).

El servidor comprueba que la descripción no esté vacía (ni solo con espacios)
y que respete el límite de longitud. Si no, responde HTTP 400 con el motivo.
Las pruebas se hacen con datos ficticios (por ejemplo, «Restaurante La Brasa (ficticio)»).

Ejemplo de solicitud:

```json
{
  "nombre": "Restaurante La Brasa (ficticio)",
  "descripcion": "Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas."
}
```

## 20. Paso 3 — Conexión con la API de OpenAI

Archivo: `server/src/ia.js`.

- La llamada se hace **desde el servidor**. La clave está en la variable de
  entorno `OPENAI_API_KEY` (`server/.env`), fuera del repositorio.
- Se envían al modelo la descripción del cliente y el catálogo disponible.
- Se usa **salida estructurada (JSON Schema estricto)** para que la respuesta
  se pueda procesar desde el código:

| Campo | Contenido |
|---|---|
| `resumen` | Resumen del proyecto. |
| `paginas` | Número total de páginas estimado. |
| `servicios[]` | Identificadores propuestos (`id`) y su justificación (`justificacion`). |
| `dudas[]` | Preguntas que hay que aclarar con el cliente. |
| `pendientes[]` | Necesidades que no cubre el catálogo. |

Controles para que **el modelo no invente servicios, precios ni compromisos de entrega**:

1. El esquema solo admite identificadores del catálogo.
2. El servidor comprueba de nuevo cada identificador y descarta los que no existen
   (se devuelven en `idsDescartados`).
3. Los precios los pone siempre el servidor a partir de `tarifas.js`.
4. Las instrucciones prohíben mencionar precios, plazos, fechas o garantías.
5. Además, el servidor elimina cualquier frase con importes o compromisos de
   entrega del resumen y las justificaciones.

Si no hay clave o la llamada a OpenAI falla, se genera una propuesta por
palabras clave (`proponer.js`) y la interfaz lo indica con un aviso.

## 21. Paso 4 — Revisión de la propuesta y cálculo

Archivo: `server/src/validarSeleccion.js`. Ruta: `POST /api/presupuesto/seleccion`.

En el asistente IA se muestran los servicios propuestos con su explicación. El usuario puede:

- **Aceptar o eliminar** cada servicio (casilla de verificación).
- **Añadir** otros servicios del catálogo.
- **Completar los datos que falten**: elegir un tipo de web y, si incluye
  páginas adicionales, indicar cuántas (1 a 19). Hasta que estén completos,
  el botón «Confirmar y calcular presupuesto» permanece desactivado.

Con la selección confirmada, el servidor valida que todos los servicios existan,
que no haya repetidos, que haya exactamente un tipo de web y que la cantidad
sea correcta, y calcula los importes con `calcularPresupuesto` y las tarifas programadas.

Ejemplo de solicitud:

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

Respuesta: HTTP 200 con el desglose y `total: 980`.

## 22. Paso 5 — Presupuesto en PDF

Archivos: `client/src/pdf/generarPresupuestoPDF.js` y `client/src/pdf/VistaPreviaPDF.jsx`.

Con un presupuesto calculado aparece el botón **«Descargar presupuesto (PDF)»**,
que abre la ventana **«Revisa tu presupuesto»**:

- A la izquierda se pueden revisar y corregir el cliente, el resumen y las aclaraciones.
- A la derecha se ve la **vista previa real del PDF**, que se actualiza al escribir.
- «Aceptar y descargar PDF» descarga el archivo; «Cancelar» cierra sin descargar.

El documento incluye:

- Nombre del cliente o empresa y fecha.
- Resumen del proyecto.
- Servicios confirmados y su descripción.
- Desglose de importes y total.
- Aclaraciones o aspectos pendientes de concretar.

### Librerías PDF estudiadas

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
servidor de Vercel) y la vista previa y la descarga usan exactamente el mismo documento.
La librería solo se descarga al abrir la vista previa.

## 23. Pruebas de la ampliación

Tests automáticos del servidor (`npm test` en `server/`): **29 tests**, todos correctos.

| Archivo | Qué comprueba |
|---|---|
| `test/catalogo.test.js` | Campos del catálogo, precios iguales a las tarifas, propuesta y pendientes. |
| `test/validarSolicitud.test.js` | Descripción vacía, demasiado corta o larga, nombre obligatorio. |
| `test/ia.test.js` | Esquema, procesado de la respuesta, ids fuera del catálogo, filtro de precios y plazos. |
| `test/validarSeleccion.test.js` | Tipo de web obligatorio y único, cantidad de páginas, servicios inventados o repetidos. |

Peticiones añadidas en `pruebas-api.http`:

| Nº | Petición | Resultado esperado |
|---|---|---|
| 18 | GET /api/catalogo | 200 y los 5 servicios |
| 19 | POST /api/propuesta (restaurante) | 200 y propuesta con servicios del catálogo |
| 20 | POST /api/propuesta (tienda online, pagos, blog) | 200 y esas necesidades como pendientes |
| 21 | POST /api/propuesta con descripción vacía | 400 |
| 22 | POST /api/propuesta sin nombre | 400 |
| 23 | POST /api/presupuesto/seleccion válida | 200, total 980 EUR |
| 24 | POST /api/presupuesto/seleccion sin cantidad de páginas | 400 |
| 25 | POST /api/presupuesto/seleccion con servicio inventado | 400 |

## 24. Despliegue en Vercel y variables de entorno

Las variables de `.env` **no se suben** con el código: hay que crearlas en Vercel.

**API (`server/`)**: Project → Settings → Environment Variables:

- `OPENAI_API_KEY` = tu clave (solo en el proyecto del servidor).
- `OPENAI_MODEL` (opcional).
- También se puede hacer desde la terminal: `npx vercel env add OPENAI_API_KEY`.
- Tras cambiar una variable hay que volver a desplegar (Redeploy).

**Cliente (`client/`)**:

- `VITE_API_URL` = `https://tu-api.vercel.app/api` (ver `client/.env.example`).
- En local no hace falta: se usa `http://localhost:3001/api`.

> Importante: todo lo que empieza por `VITE_` se incluye en el JavaScript que
> descarga el navegador. **La clave de OpenAI nunca debe llevar ese prefijo.**
