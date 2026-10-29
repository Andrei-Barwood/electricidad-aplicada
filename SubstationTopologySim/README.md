# SubstationTopologySim (v1.0.0)

**Simulador de Topologías de Subestaciones Eléctricas de Potencia (AT/MT/BT)**  
*Diseño Conceptual, Maniobras e Interbloqueos (IEC 62271-102), Confiabilidad N-1 (IEEE Gold Book), Evaluación Tecnoeconómica LCC y Exportador CAD DXF.*

---

## 1. Resumen de la Aplicación

**SubstationTopologySim** es una plataforma frontend de simulación interactiva diseñada para la docencia universitaria y la pre-ingeniería de sistemas eléctricos de potencia. Implementa en Vanilla ES Modules (sin dependencias externas de empaquetado ni frameworks pesados) los siguientes módulos de ingeniería:

1. **Editor Unifilar SVG Interactivo:**
   - Lienzo vectorial con pan continuo, zoom dinámico centrado en cursor y ajuste a rejilla CAD de 20 px (*Snap to Grid*).
   - Biblioteca normalizada de equipos primarios con doble codificación accesible (color + estados IEC `I`/`O`/`MTO` + corte dieléctrico visible).
2. **Modelo Eléctrico y Cableado Manhattan:**
   - Grafo de red explícito con terminales polares por activo.
   - Enrutamiento ortogonal dinámico a 90° para ramas y conductores.
   - Validador topológico por exploración de grafos (BFS) para propagación de energización y detección automática de deslastre de carga.
3. **Catálogo de 18 Topologías Normalizadas (IEEE / IEC / CIGRE):**
   - **Transmisión AT / EAT (9 Esquemas):** Barra Simple (220 kV), Barra Principal y Transferencia (220 kV), Barra Seccionada / Partida (220 kV), Doble Barra con Acoplamiento Bus Tie (220 kV), Doble Barra con Transferencia / Triple Barra (220 kV), Barra en Anillo 4-CB (220 kV), Barra en Anillo Ampliado 6-CB (220 kV), Interruptor y Medio $1\,\frac{1}{2}$ CB (500 kV), Doble Barra con Doble Interruptor (500 kV).
   - **Distribución MT y Compactas (5 Esquemas):** Puente en H / *H-Scheme* (66/23 kV), Puente de Línea con Seccionamiento (66/23 kV), Doble Radial con Transferencia Automática ATS (23 kV), Distribución Urbana en Bucle Abierto (23 kV), Subestación Encapsulada GIS en $\text{SF}_6$ (110/23 kV).
   - **Renovables e Industria Crítica (4 Esquemas):** Colectora Parque Solar Fotovoltaico con GSU (23/110 kV), Evacuación Parque Eólico con STATCOM (33/220 kV), Industrial Pesada Minera/Siderúrgica con mitigación de flicker (220/23 kV), Data Center Tier IV con redundancia activa 2N (23 kV).
   - Pestañas de filtrado por categoría (`Todas`, `Transmisión`, `Distribución`, `Industria`), buscador en tiempo real, distintivos de tensión/confiabilidad y ficha técnica comparativa con ventajas, limitaciones y multiplicador CAPEX.
4. **Motor de Enclavamientos de Seguridad Operacional (IEC 62271-102):**
   - Bloqueo estricto de maniobras de seccionadores bajo carga.
   - Secuencia segura de energización y consignación de seguridad LOTO (`OUT_OF_SERVICE`).
   - Modo Bypass / Override de contingencia con auditoría.
   - Registro cronológico SOE (*Sequence of Events*) de alta resolución exportable a CSV.
5. **Motor de Contingencias N-1 y Confiabilidad Probabilística (IEEE 493 / CIGRE):**
   - Simulación iterativa de desconexión N-1 de cada activo de patio.
   - Cálculo cuantitativo de EENS (MWh/año), LOLE (horas/año) y LOLP.
   - Identificación automática de contingencias críticas y peor caso.
   - Benchmark comparativo automático entre las 6 topologías.
6. **Evaluación Tecnoeconómica de Ciclo de Vida (LCC / TAC):**
   - Desglose de inversión inicial (CAPEX) electromecánico, civil (30%), control/SCADA (15%) e ingeniería (8%).
   - Escalamiento exponencial no lineal de costos en transformadores ($S^{0.75} \cdot V^{0.40}$).
   - Gastos operativos y de mantenimiento anuales (OPEX).
   - Penalización por costo de falla regulatoria CENS ($\text{VoLL} = 2{,}000\text{ USD/MWh}$).
   - Costo Anualizado Comparable (TAC) mediante Factor de Recuperación de Capital (CRF).
7. **Exportador Universal CAD ASCII DXF:**
   - Generación de planos técnicos según estándar universal AutoCAD R11/R12 (AC1009).
   - Capas disciplinarias (`0_BARRAS`, `0_EQUIPOS`, `0_CONEXIONES`, `0_TEXTOS`) y cromáticas según nivel de tensión (ACI).
   - Transformación geométrica paramétrica SVG a WCS de CAD sin inversión de espejo.

---

## 2. Puesta en Marcha

### Requisitos del Sistema:
- Navegador web moderno con soporte estándar para ES Modules (Chrome, Firefox, Safari, Edge).
- Node.js versión 18+ (únicamente para ejecutar la suite de pruebas unitarias y de integración).

### Ejecución Local:
```bash
# Abrir directamente index.html en cualquier navegador web o servir localmente:
npx serve . -l 3000
```
Visite `http://localhost:3000` en su navegador.

### Ejecución de Pruebas Automatizadas:
```bash
npm test
```
Ejecuta la suite completa de 50 pruebas unitarias y de integración sobre Node.js test runner nativo (`node:test`).

---

## 3. Arquitectura del Código Fuente

```text
SubstationTopologySim/
├── index.html                   # Interfaz de usuario unificada con navegación por pestañas
├── package.json                 # Configuración de paquete (v1.0.0) y script de pruebas
├── README.md                    # Documentación técnica de la aplicación
├── bitacora_substat_1.md        # Bitácora de control y registro de ingeniería
├── src/
│   ├── main.js                  # Punto de entrada y arranque de la aplicación
│   ├── app/
│   │   ├── application.js       # Orquestador del ciclo de vida y eventos globales
│   │   ├── event-bus.js         # Bus desacoplado pub/sub para sincronización de módulos
│   │   └── state-store.js       # Almacén de estado reactivo (viewport, selección, rejilla)
│   ├── model/
│   │   ├── components.js        # Fábricas, parámetros de confiabilidad y modelo de activos
│   │   ├── network-model.js     # Grafo eléctrico de componentes y ramas galvánicas
│   │   ├── topology-presets.js  # Definición paramétrica de las 6 topologías IEEE/IEC
│   │   ├── topology-validator.js# Algoritmo BFS de propagación y deslastre de carga
│   │   ├── interlocking-engine.js# Lógica de interbloqueos de seguridad (IEC 62271-102)
│   │   ├── sequence-of-events.js# Registro cronológico SOE de eventos con sellado temporal
│   │   ├── reliability-engine.js# Motor de contingencias N-1, EENS, LOLE y LOLP
│   │   ├── economic-engine.js   # Evaluación tecnoeconómica LCC, CAPEX, OPEX, CENS y TAC
│   │   └── dxf-exporter.js      # Generador vectorial ASCII DXF para planos CAD
│   ├── editor/
│   │   ├── svg-editor.js        # Controlador del lienzo SVG, pan, zoom y transformaciones
│   │   ├── component-renderer.js# Renderizado vectorial SVG de aparamenta y terminales
│   │   ├── connection-manager.js# Cableado interactivo Manhattan y ramas ortogonales
│   │   └── selection-manager.js # Administración de foco, selección y atajos de teclado
│   ├── ui/
│   │   ├── toolbar.js           # Barra superior de navegación, zoom y acciones rápidas
│   │   ├── properties-panel.js  # Inspector de características eléctricas y de confiabilidad
│   │   ├── presets-panel.js     # Selector de esquemas predefinidos y ficha técnica
│   │   ├── soe-panel.js         # Panel de secuencias cronológicas y comandos de maniobra
│   │   ├── reliability-panel.js # Panel de contingencias N-1, simulación de disparos y EENS
│   │   └── economics-panel.js   # Panel de análisis de sensibilidad económica LCC y TAC
│   └── styles/
│       ├── tokens.css           # Variables de diseño (colores SCADA, niveles de tensión, espaciados)
│       ├── layout.css           # Estructura espacial de paneles flexibles
│       ├── editor.css           # Estilos del lienzo SVG, cuadrícula y selección
│       └── components.css       # Estilos visuales de tarjetas, inspectores, tablas y KPIs
└── tests/
    ├── components.test.js       # Verificación del modelo de datos de componentes
    ├── network-model.test.js    # Verificación del grafo eléctrico y conexiones
    ├── topology-validator.test.js # Verificación de BFS y flujo de energización
    ├── topology-presets.test.js # Verificación de los 6 esquemas normalizados
    ├── interlocking.test.js     # Verificación de reglas IEC 62271-102 y SOE
    ├── reliability.test.js      # Verificación del motor N-1, EENS y LOLE
    ├── economics.test.js        # Verificación de LCC, CAPEX, OPEX y TAC
    ├── dxf-exporter.test.js     # Verificación de primitivas CAD y capas DXF
    └── integration-release.test.js # Pruebas de integración E2E y esquinas numéricas
```

---

## 4. Estándares y Normas Aplicadas

- **IEC 62271-102:** Aparamenta de alta tensión — Seccionadores y seccionadores de puesta a tierra de corriente alterna.
- **IEEE Std 493 (IEEE Gold Book):** *Recommended Practice for the Design of Reliable Industrial and Commercial Power Systems*.
- **IEEE Std C37.100:** *Definitions for Power Switchgear*.
- **CIGRE WG C4 / B3:** *Substation Design and Reliability Evaluation Guidelines*.
- **AutoCAD DXF Reference (Release 12 / AC1009):** Formato universal de interoperabilidad CAD.

---

## 5. Licencia

Proyecto desarrollado bajo licencia **MIT**. Libre para uso educativo, académico y profesional.
