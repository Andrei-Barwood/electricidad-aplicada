# Electricidad Aplicada

Un archivo. Diez instrumentos. Un plano.

[electricidadaplicada.app](https://electricidadaplicada.app)

Snocomm. Geometría de la corriente. Cálculo en el navegador, sin servidor, sin nube. El hexágono del tablero, la malla del suelo, el vector del color, la normalización por unidad: cada panel es una figura, no un formulario.

---

## Forma

`index.html` es la suite. Nada más hace falta.

```
⌂  Inicio
∿  SEV
▦  Malla de tierra
☀  Iluminación
♨  BTU
💧 Hidráulica
☀  Solar térmica
⌁  Consumo
▣  TAN / AHF
⚡ Por Unidad (PU)
∠  Fasores
◐  Color HEX → HSB
```

Plantillas de 10 a 500 kW para instalaciones típicas de la Región de Los Ríos. Una plantilla llena todos los paneles a la vez. El informe PDF sale de cada servicio: A4, crédito **Snocomm**.

Material de apoyo académico. No sustituye catálogo, ensayo de tipo ni memoria de cálculo.

---

## Instrumentos

Cada servicio es una figura. El cálculo es la arista.

### ∿ SEV — círculos concéntricos

El sondeo es un mandala de radio. AB/2 abre anillos en el suelo; cada L es un círculo, cada ρa un tono. Las capas H, K, A, Q son estratos de un mismo centro: resistividad que se pliega hacia adentro.

Hace el arreglo Schlumberger, ρa por Pekeris y filtro de Ghosh (1971), y ajusta el modelo de capas en el cliente. Curva log-log y sección geoeléctrica.

### ▦ Malla — retícula sagrada

La tierra no es un punto: es una grilla. IEEE 80 dibuja el cuadrado que devuelve la falta. Paso y contacto son dos distancias en la misma tela. Rg es el silencio del nudo.

Calcula ρeq, Ig, Cs, tensiones tolerables y de malla, Rg (Sverak) y sección de conductor. Vista de la grilla.

### ☀ Iluminación — flor de lúmenes

El recinto es un rectángulo; las luminarias, nodos de una flor. κ es la proporción del vacío útil. ΦT reparte la luz como un patrón que cabe en el plano de tarea.

Método de lúmenes: CU, snap de κ, N, Ēm. Tablas UNE-EN 12464-1:2012. Plano n×n y tablero de circuitos.

### 💧 Hidráulica — vesica del caudal

El litro es el círculo; el metro cúbico, el cubo. 1 000 L cierran un volumen. El salto H es la vertical del vesica: dos cotas, un huso de agua. P = 9,81 · Q · H · η es la línea que cae y se vuelve potencia.

Convierte L ↔ m³, caudal y potencia de pico / microhidro. Energía anual con factor de planta.

### ☀ Solar térmica — calor y fase

Calcula calor sensible con `Q = m · c · ΔT` y calor latente con `Q = m · L`. Incluye plantillas de calor específico para agua, hielo, vapor de agua, aluminio, vidrio, hierro, cobre y aire, además de relaciones de fusión, solidificación, vaporización, condensación, sublimación y sublimación inversa. La relación sugerida se actualiza al cambiar la plantilla de material.

También convierte temperaturas entre Kelvin, Celsius y Fahrenheit desde cualquiera de las tres entradas.

La suite residencial agrega plantillas de departamento, casas familiares y vivienda muy bien aislada para aproximar carga de calefacción por piso radiante, superficie activa, longitud de tubo, circuitos y caudal. Incluye además ACS solar para parejas, familias y cabañas: consumo diario, energía, superficie de colectores, número de paneles, acumulación y energía de respaldo. Son predimensionamientos académicos editables, no una memoria térmica ni una especificación de montaje.

### ◒ Eficiencia energética — potencia y envolvente

Incluye 24 plantillas desde 5 hasta 500 kW instalados con artefactos habituales de vivienda, comercio, servicios y proceso. Cada escenario aproxima `η = P útil / P total × 100`, potencia útil y potencia perdida o margen no utilizado mediante factores de utilización editables. La calculadora de aislamiento térmico se actualiza con la plantilla y estima transmisión, infiltración, pérdida térmica, resistencia equivalente y clasificación preliminar.

### ♨ BTU — proyección de calefacción

Proyecta la carga de calefacción de un recinto desde sus dimensiones, temperaturas exterior/objetivo y aislación. Entrega BTU/h, kW térmicos, joules, kWh, equivalencia de agua en libras y litros, área sugerida, plano del recinto y una propuesta preliminar de tablero eléctrico para climatización.

### ⌁ Consumo — cubo de coincidencias

Cada carga es un vértice. El empalme es el cubo que las contiene. La simultaneidad no es la suma: es qué aristas se tocan a la vez. La pinza lee el régimen, no el relámpago del arranque.

Empalme editable. Casa-granja o plantilla 10–500 kW. Duty, kWh, frío vs total, coincidencia. Tarifa de energía.

### ▣ TAN / AHF — hexágono del tablero

El tablero es un hexágono cerrado: In, Icc, ΔT, forma. Proyectar es inscribir la carga en esa figura. Los armónicos H3, H5, H7 son polígonos anidados sobre la fundamental. El banco 24 V es el cubo chico al lado del grande.

Proyección IEC 61439 (nodo telecom), DSP 3P+N (Clarke / THDi académico) y banco 24 V · 120 W.

### ⚡ Por Unidad (PU) — normalización del sistema

El sistema eléctrico es una escala. Al llevar magnitudes reales a por unidad (pu), la red multi-tensión se unifica en una sola impedancia Thévenin. La potencia base Sb y la tensión Vb fijan el pulso del cálculo.

Calcula bases trifásicas (Zb, Ib), cambio de base Zpu de transformadores y generadores, impedancia de línea, cortocircuito simétrico trifásico (Icc 3φ, Scc) y diagrama unilineal (SLD) interactivo. Incluye plantillas exclusivas de subestaciones de Los Ríos basadas en la información pública de [Infotécnica del Coordinador Eléctrico Nacional](https://infotecnica.coordinador.cl/instalaciones/subestaciones); las impedancias de estudio permanecen editables y no se presentan como datos oficiales.

### ∠ Fasores — el giro del complejo

Un número complejo tiene dos lecturas: la arista rectangular `a + jb` y el radio fasorial `A ∠ θ`. La calculadora convierte en ambos sentidos, usando grados y `atan2` para conservar el cuadrante correcto. Incluye 24 plantillas de circuitos trifásicos (motores, transformadores, cargas Y/Δ, rectificadores, filtros e inversores), cuyos valores alimentan la calculadora y cuyo esquema se dibuja con p5.js.

### ◐ Color — hexágono de la luz

El HEX es un cristal de seis caras. RGB es trinidad; HSB es el círculo: tono, saturación, brillo. Un clic copia el número. El color deja de ser pigmento y queda vector.

Conversor HEX → HSB con vista previa y RGB.

---

## Uso

Abrir `index.html` o visitar el dominio.

Tema día / noche según el sistema, o a mano. Las plantillas viven en la galería del inicio y en el selector de cada panel. **Exportar PDF** captura el panel activo.

Los informes PDF llevan solo la marca Snocomm. El pie del sitio, no el PDF, nombra al autor.

---

## Archivo

```
index.html                  suite
electricidad-aplicada.html  copia en sincronía
vendor/                     html2canvas · jsPDF
CNAME                       electricidadaplicada.app
```

Un solo origen: `index.html`. La copia se mantiene con:

```sh
cp index.html electricidad-aplicada.html
```

---

## Plano, Vértice y Línea

Andres Barbudo Rodriguez · CFT Paillaco  
WhatsApp [@andresbarbudo](https://wa.me/andresbarbudo)  
[youtube.com/@kirtantegsingh](https://www.youtube.com/@kirtantegsingh)  
[sacred-geometry.uk](https://sacred-geometry.uk)

Snocomm
