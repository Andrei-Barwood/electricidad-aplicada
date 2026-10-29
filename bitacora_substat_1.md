# BITÁCORA DE INGENIERÍA — SubstationTopologySim
**Documento de Control y Seguimiento de Desarrollo de Software Crítico**  
**Identificador:** `bitacora_substat_1.md`  
**Versión actual:** `0.7.0 (Fase 7)`  
**Fecha:** 28 de octubre de 2026  
**Rol responsable:** Senior Software Engineer / Technical Lead — Sistemas Eléctricos de Potencia & Simulación CAD  

---

## 1. Resumen Ejecutivo del Proyecto

**SubstationTopologySim** es un simulador interactivo de topologías de subestaciones eléctricas de alta, media y baja tensión (AT/MT/BT), diseñado con propósitos educativos y de ingeniería conceptual/preliminar. Combina en una arquitectura frontend modular:
- Modelado de grafos eléctricos con nodos, terminales e identificación física de activos.
- Editor unifilar interactivo basado en estándares SVG.
- Lógica de maniobras operacionales con enclavamientos mecánicos y eléctricos (*interlocking*).
- Análisis estático de contingencias N-1 y deslastre de carga.
- Modelado probabilístico de confiabilidad y disponibilidad (RBD, Markov, EENS, LOLE/LOLP).
- Evaluación tecnoeconómica preliminar (CAPEX, OPEX, costo de energía no suministrada).
- Exportador CAD a formato estándar ASCII DXF.

---

## 2. Plan Maestro de Fases de Desarrollo

| Fase | Título | Estado | Hito Principal |
| :--- | :--- | :---: | :--- |
| **Fase 1** | **Esqueleto Funcional** | **COMPLETADA** | Arquitectura base, lienzo SVG, biblioteca vectorial, inspector y pruebas unitarias. |
| **Fase 2** | **Modelo Eléctrico y Conectividad** | **COMPLETADA** | Nodos, terminales de conexión, enrutamiento ortogonal Manhattan, validador topológico, propagación de energización (BFS) y deslastre de carga. |
| **Fase 3** | **Topologías Predefinidas** | **COMPLETADA** | Carga y verificación de las 6 configuraciones normalizadas (barra simple, transferencia, seccionada, anillo, interruptor y medio, doble barra) y ficha técnica interactiva. |
| **Fase 4** | **Motor de Maniobras e Interbloqueos** | **COMPLETADA** | Máquina de estados, enclavamientos de seguridad (IEC 62271-102), bloqueo de seccionadores bajo carga, modo bypass y registro SOE. |
| **Fase 5** | **Contingencias N-1 y Confiabilidad** | **COMPLETADA** | Análisis iterativo N-1, cálculo riguroso de EENS (MWh/año), LOLE (h/año), LOLP, simulación de fallas y benchmark comparativo de las 6 topologías. |
| **Fase 6** | **Análisis Tecnoeconómico** | **COMPLETADA** | Modelado de inversión en equipos (CAPEX), costos anuales de mantenimiento (OPEX), penalización por EENS/VoLL, evaluación LCC y costo anualizado comparable (TAC). |
| **Fase 7** | **Exportador CAD (ASCII DXF)** | **COMPLETADA** | Transformación geométrica mundo-CAD, capas normalizadas por disciplina y nivel de tensión (ACI), simbología vectorial y serialización DXF universal. |
| **Fase 8** | **Validación Integral y Release** | *Pendiente (Próxima)* | Casos límite (tasas nulas, bucles, islas), pruebas de integración extremo a extremo y empaquetado para distribución. |

---

## 3. Registro de Avances Logrados

### 3.1. Arquitectura de Software Desacoplada (Fase 1)
Se implementó una arquitectura en Vanilla ES Modules sin librerías pesadas:
- **`EventBus` (`src/app/event-bus.js`)**: Bus desacoplado de eventos pub/sub.
- **`StateStore` (`src/app/state-store.js`)**: Almacén reactivo de la sesión (selección, viewport, cuadrícula, herramientas).
- **`NetworkModel` (`src/model/network-model.js`)**: Grafo eléctrico independiente del DOM/SVG.
- **`Components` (`src/model/components.js`)**: Modelo formal de datos, geometría y confiabilidad ($\lambda, \mu, A, U$).

### 3.2. Editor Unifilar SVG Interactivo (Fase 1)
- Lienzo con pan continuo (ratón, tecla `Espacio`), zoom centrado en cursor y ajuste a cuadrícula CAD de 20 px (*Snap to Grid*).
- Biblioteca vectorial normalizada (Barra, Interruptor, Seccionador, Transformador, Carga, Fuente) con doble codificación accesible (color + letras técnicas `I`/`O`/`MTO` + corte dieléctrico visible).
- Inspector de propiedades con edición y recálculo en tiempo real de disponibilidades.

### 3.3. Modelo Eléctrico, Nodos y Ramas Galvánicas (Fase 2)
- **Ramas explícitas (`connections`):** Abstracción de ramas eléctricas conectadas exclusivamente entre terminales identificados (`fromComponentId`, `fromTerminalId`, `toComponentId`, `toTerminalId`).
- **Validaciones de cableado en modelo:**
  - Prevención de conexiones de un terminal consigo mismo.
  - Detección y rechazo de conexiones duplicadas entre los mismos pares de terminales.
  - Purga automática de ramas huérfanas al remover cualquier equipo.
  - Advertencias automáticas ante divergencia de niveles de tensión (*Voltage Mismatch*) si no media un transformador.
  - Detección de activos aislados (*Isolated Components*).

### 3.4. Gestor de Cableado y Enrutamiento Ortogonal (Fase 2)
- **`ConnectionManager` (`src/editor/connection-manager.js`):**
  - Cableado interactivo mediante trazado elástico y ajuste ortogonal Manhattan (quiebres rectos a 90° con puntos nodales centrales de inspección).
  - Persistencia de ramas dinámicas ante arrastre de equipos en tiempo real.
  - Supresión y selección independiente de conexiones.

### 3.5. Validador Topológico y Propagación de Energización (Fase 2)
- **`TopologyValidator` (`src/model/topology-validator.js`):**
  - Algoritmo de exploración de grafos por anchura (BFS) iniciado desde fuentes activas (`SOURCE` en estado `CLOSED`).
  - Conducción interna dependiente del estado del aparato (Barras conducen equipotencialmente; Interruptores y Seccionadores conducen si están `CLOSED`; Transformadores acoplan primario y secundario).
  - Estado de energización reactivo con detección automática de deslastre de carga (`unsuppliedLoads`).

### 3.6. Módulo de Topologías Normalizadas IEEE / IEC (Fase 3)
- **`TopologyPresets` (`src/model/topology-presets.js`):**
  Modelado formal de las 6 topologías estándar de subestaciones:
  1. **Barra Simple (*Single Bus*):** Riel único de 220 kV y 3 salidas protegidas.
  2. **Barra Principal + Transferencia (*Main and Transfer Bus*):** Barras con campo de acoplamiento (*Bus Tie*) y bypass por posición.
  3. **Barra Seccionada / Partida (*Sectionalized Bus*):** Confinamiento de fallas por partición de barra.
  4. **Barra en Anillo (*Ring Bus*):** Lazo cerrado poligonal con cumplimiento estricto del criterio N-1.
  5. **Interruptor y Medio (*Breaker-and-a-Half*, $1\,\frac{1}{2}$ CB):** Calles de 3 interruptores para 2 circuitos independientes entre dos barras principales.
  6. **Doble Barra con Doble Interruptor (*Double Bus Double Breaker*):** 2 interruptores dedicados por cada circuito (disponibilidad $99.99\%$).

### 3.7. Interfaz de Selección y Ficha Técnica de Ingeniería (Fase 3)
- **`PresetsPanel` (`src/ui/presets-panel.js`):**
  - Selector interactivo con insignias de confiabilidad y estándares.
  - Ficha técnica reactiva con resumen de ingeniería, ventajas, limitaciones y costo relativo CAPEX.

### 3.8. Motor de Enclavamientos de Seguridad Operacional (Fase 4)
- **`InterlockingEngine` (`src/model/interlocking-engine.js`):**
  Implementa las reglas formales de seguridad operacional según **IEC 62271-102**:
  - Bloqueo de apertura/cierre de seccionadores bajo carga (no operar si el interruptor asociado está cerrado).
  - Secuencia segura de energización (el interruptor es el último en cerrar).
  - Bloqueo de consignación y mantenimiento LOTO (`OUT_OF_SERVICE`).
  - Modo Bypass / Override de emergencia con registro de auditoría.

### 3.9. Secuencia Cronológica de Eventos SOE (Fase 4)
- **`SequenceOfEvents` (`src/model/sequence-of-events.js`):**
  - Registro de alta resolución con sellado de tiempo en milisegundos (`HH:MM:SS.mmm`).
  - Exportación a CSV y filtros por severidad.

### 3.10. Panel de Maniobras y Control Interactivo SVG (Fase 4)
- Pestañas desacopladas en panel derecho: `Inspector` y `Maniobras (SOE)`.
- Botones de acción rápida: `Conmutar [I/O]`, `Abrir [O]`, `Cerrar [I]`.
- Doble clic en lienzo SVG para conmutar equipos con animación de resplandor rojo ante bloqueos.

### 3.11. Motor de Contingencias N-1 y Confiabilidad Probabilística (Fase 5)
- **`ReliabilityEngine` (`src/model/reliability-engine.js`):**
  Implementa el análisis probabilístico de confiabilidad basado en **IEEE Gold Book (Std 493)** y lineamientos **CIGRE**:
  - **Simulación Iterativa N-1:** Desconecta ordenadamente cada activo candidato (interruptores, seccionadores, barras, transformadores y fuentes) y calcula la potencia deslastrada ($\Delta P$ en MW).
  - **Cálculo de EENS (Energía Esperada No Suministrada):**
    $$\text{EENS} = \sum_{k} P_{\text{cortada}, k} \cdot (\lambda_k \cdot \text{MTTR}_k) \quad [\text{MWh/año}]$$
  - **Cálculo de LOLE (Loss of Load Expectation) y LOLP:**
    $$\text{LOLE} = \sum_{k \mid P_k > 0} (\lambda_k \cdot \text{MTTR}_k) \quad [\text{horas/año}], \quad \text{LOLP} = \frac{\text{LOLE}}{8760}$$
  - **Identificación de Contingencias Críticas y Peor Caso:** Detecta el activo cuya falla representa el mayor riesgo para la continuidad del suministro.
  - **Benchmark Comparativo Automatizado:** Evalúa y clasifica las 6 topologías normalizadas ordenadas de menor a mayor EENS.

### 3.12. Dashboard de Confiabilidad y Simulación de Fallas en UI (Fase 5)
- **`ReliabilityPanel` (`src/ui/reliability-panel.js` e `index.html`):**
  - Tercera pestaña dedicada en el panel lateral derecho: `N-1 Confiabilidad`.
  - **Dashboard de KPIs:** Tarjetas métricas de EENS, LOLE, LOLP y verificación de cumplimiento del Criterio N-1.
  - **Simulación de Falla Interactiva:** Botón `Simular Disparo` al lado de cada contingencia para aislar el equipo en tiempo real y observar visualmente en el lienzo SVG el impacto galvánico.
  - **Matriz de Benchmark:** Visualización gráfica con barras de EENS vs inversión CAPEX relativa entre las 6 configuraciones.

### 3.13. Motor de Análisis Tecnoeconómico y Ciclo de Vida LCC (Fase 6)
- **`EconomicEngine` (`src/model/economic-engine.js`):**
  Implementa la evaluación integral de ciclo de vida de activos y costo anualizado comparable según prácticas internacionales de ingeniería (CIGRE / IEEE / EPRI):
  - **Estructura Detallada de Inversión (CAPEX):**
    - Costos unitarios de adquisición y montaje de equipos primarios parametrizados por nivel de tensión (220 kV, 110 kV, 66 kV, 23 kV).
    - Modelo de costos de transformadores con escalamiento no lineal por potencia y tensión:
      $$C_{\text{trafo}} = C_{\text{base}} \cdot \left(\frac{S}{S_{\text{base}}}\right)^{0.75} \cdot \left(\frac{V_1}{V_{\text{base}}}\right)^{0.40}$$
    - Factor de obras civiles y patio de llaves: $+30\%$ sobre el costo electromecánico.
    - Factor de control, protecciones secundarias y SCADA: $+15\%$.
    - Factor de ingeniería de detalle y gerenciamiento de proyecto: $+8\%$.
  - **Costos Anuales de Operación y Mantenimiento (OPEX):**
    - Parametrizado como $2.5\%$ anual del CAPEX total de la subestación.
  - **Penalización Económica por Energía No Suministrada (CENS):**
    - Cuantifica la pérdida social y regulatoria de energía interrumpida mediante el Costo de Falla (*Value of Lost Load*, $\text{VoLL} = 2{,}000\text{ USD/MWh}$ por defecto):
      $$\text{CENS}_{\text{anual}} = \text{EENS} \cdot \text{VoLL} \quad [\text{USD/año}]$$
  - **Factor de Recuperación de Capital (CRF):**
    $$\text{CRF} = \frac{r(1+r)^N}{(1+r)^N - 1} \quad (r = 7\%,\; N = 30\text{ años} \implies \text{CRF} \approx 0.080586)$$
  - **Costo Total Anualizado Comparable (TAC):**
    $$\text{TAC} = \text{CAPEX} \cdot \text{CRF} + \text{OPEX}_{\text{anual}} + \text{CENS}_{\text{anual}} \quad [\text{USD/año}]$$
  - **Costo de Ciclo de Vida a Valor Presente (LCC):**
    $$\text{LCC} = \text{CAPEX} + \frac{\text{OPEX}_{\text{anual}} + \text{CENS}_{\text{anual}}}{\text{CRF}} \quad [\text{USD}]$$
  - **Benchmark Tecnoeconómico de las 6 Topologías:**
    Clasificación económica global demostrando cuantitativamente que esquemas de mayor inversión inicial (como Barra en Anillo o Interruptor y Medio) resultan en un TAC y LCC considerablemente más económicos al mitigar millonarias penalizaciones por energía no servida.

### 3.14. Panel de Evaluación Económica y Benchmark LCC en UI (Fase 6)
- **`EconomicsPanel` (`src/ui/economics-panel.js` e `index.html`):**
  - Cuarta pestaña dedicada en el panel lateral derecho: `Economía LCC`.
  - **Controles de Sensibilidad en Tiempo Real:** Ajuste dinámico de Tasa de Descuento ($r\%$), Vida Útil ($N$ años) y Valor de Falla ($\text{VoLL}$ USD/MWh).
  - **Dashboard de Métricas:** KPIs de TAC, CAPEX Total, OPEX Anual, Penalización CENS y LCC Total.
  - **Desglose de Inversión Inicial (CAPEX):** Detalle de aparamenta electromecánica, obras civiles, control/protecciones e ingeniería.
  - **Vista Comparativa de Benchmark TAC:** Clasificación gráfica de las 6 topologías con indicador de cumplimiento N-1 y barras proporcionales de costo total anualizado.

### 3.15. Exportador Universal CAD ASCII DXF (Fase 7)
- **`DxfExporter` (`src/model/dxf-exporter.js`):**
  Implementa un motor de exportación vectorial puro compatible con la especificación industrial **AutoCAD Release 11/12 (AC1009)**, garantizando lectura e interoperabilidad con AutoCAD, LibreCAD, QCad y visores web CAD:
  - **Estructura Estándar de Secciones DXF:**
    - `HEADER`: Variables del entorno de dibujo (`$ACADVER = AC1009`, `$INSUNITS = 4` [milímetros]).
    - `TABLES`:
      - `LTYPE`: Tipos de trazo continuo (`CONTINUOUS`).
      - `LAYER`: Capas normalizadas con asignación de color por disciplina y nivel de tensión según **ACI (AutoCAD Color Index)**:
        - `0_BARRAS` (ACI 1 / 30): Barras colectoras y rieles primarios.
        - `0_EQUIPOS` (ACI 3 / 7): Interruptores, seccionadores, trafos y fuentes.
        - `0_CONEXIONES` (ACI 4): Ramas y conductores eléctricos.
        - `0_TEXTOS` (ACI 2): Rótulos, anotaciones de ingeniería y potencias.
        - Capas de tensión: `0_VOLT_500KV` (ACI 1 Rojo), `0_VOLT_220KV` (ACI 30 Naranja), `0_VOLT_110KV` (ACI 2 Amarillo), `0_VOLT_66KV` (ACI 3 Verde), `0_VOLT_23KV` (ACI 4 Cyan), `0_VOLT_13KV` (ACI 5 Azul).
      - `STYLE`: Definición tipográfica de ingeniería (`STANDARD`).
    - `BLOCKS`: Sección de bloques reservada.
    - `ENTITIES`: Primitivas vectoriales de alta precisión (`LINE`, `CIRCLE`, `TEXT`).
  - **Transformación de Coordenadas Pantalla-a-Mundo (SVG a WCS):**
    - Mapeo cartesiano universal: en SVG el eje $Y$ crece hacia abajo, mientras que en CAD WCS el eje $Y$ crece hacia arriba. Se implementó la inversión paramétrica:
      $$X_{\text{cad}} = (X_{\text{svg}} - X_{\min}) \cdot \text{scale} + \text{padding}$$
      $$Y_{\text{cad}} = (Y_{\max} - Y_{\svg}) \cdot \text{scale} + \text{padding}$$
      preservando la orientación espacial exacta de la subestación sin inversiones de espejo.
  - **Simbología Vectorial Técnica:**
    - Barras: Contornos cerrados y eje de acoplamiento galvánico.
    - Interruptores: Caja cuadrada ($36 \times 36\text{ mm}$) con cruz interna de contacto y terminal stubs.
    - Seccionadores: Contactos circulares fijos con cuchilla de aislamiento cerrada o en ángulo según el estado operativo (`CLOSED` / `OPEN`).
    - Transformadores: Devanados circulares superpuestos estándar IEC con especificación de potencias nominales ($S$ MVA) y relación de transformación ($V_1/V_2$ kV).
    - Cargas: Triángulo de consumo con flecha descendente y potencia de placa ($P$ MW).
    - Fuentes: Círculo de generación con onda senoidal interior y nivel de inyección ($V$ kV).
    - Ramas: Trazado ortogonal Manhattan con quiebres exactos a 90°.
  - **Integración con la Interfaz de Usuario:**
    - Botón habilitado en el encabezado superior: `#btn-export-dxf`.
    - Generación dinámica de Blob MIME `application/dxf;charset=utf-8` y descarga automática con el nombre de la topología activa (p. ej., `single_bus_unifilar.dxf`).

---

## 4. Verificación Automatizada (Pruebas Unitarias)

Se ejecutó la suite completa de pruebas unitarias (`node --test tests/*.test.js`), alcanzando un **100% de aprobación (43 de 43 pruebas en verde, 0 fallos)**:

```text
▶ Fase 7: Exportador CAD ASCII DXF (DxfExporter)
  ✔ debe generar las secciones estándar obligatorias DXF y finalizar en EOF (1.6ms)
  ✔ debe definir las capas normalizadas con sus respectivos códigos de color ACI (0.1ms)
  ✔ debe exportar entidades geométricas acordes al tipo de equipo (LINE, CIRCLE, TEXT) (0.8ms)
  ✔ debe realizar la transformación de coordenadas SVG a WCS invirtiendo el eje Y correctamente (1.1ms)
  ✔ debe exportar exitosamente a CAD DXF las 6 topologías normalizadas predefinidas (18.1ms)
  ✔ debe ejecutar downloadDXF sin lanzar errores en entorno sin DOM (1.4ms)
✔ Fase 7: Exportador CAD ASCII DXF (DxfExporter) (23.9ms)

▶ Fase 6: Motor de Análisis Tecnoeconómico (Economic Engine)
  ✔ debe calcular con exactitud el Factor de Recuperación de Capital (CRF) (0.6ms)
  ✔ debe estimar costos de transformadores con escalamiento no lineal por potencia y tensión (0.1ms)
  ✔ debe evaluar el CAPEX, OPEX, CENS y TAC completo para Barra Simple (6.5ms)
  ✔ debe reflejar el impacto directo del costo de falla VoLL sobre la penalización CENS (2.9ms)
  ✔ debe ejecutar el Benchmark Tecnoeconómico de las 6 topologías comparando CAPEX vs CENS (23.7ms)
✔ Fase 6: Motor de Análisis Tecnoeconómico (Economic Engine) (34.8ms)

▶ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine)
  ✔ debe bloquear la apertura de un seccionador si su interruptor asociado está cerrado bajo carga (R1) (41.0ms)
  ✔ debe permitir abrir el seccionador después de haber abierto primero el interruptor de potencia (3.2ms)
  ✔ debe impedir el cierre de seccionador si el interruptor asociado está cerrado (secuencia segura R2) (1.9ms)
  ✔ debe permitir forzar maniobras en Modo Bypass / Override emitiendo ALARM en SOE (2.6ms)
  ✔ debe bloquear el cierre de un equipo consignado bajo LOTO (OUT_OF_SERVICE) (1.4ms)
  ✔ debe registrar y exportar correctamente la secuencia cronológica SOE a CSV (1.1ms)
✔ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine) (52.7ms)

▶ Modelo de Componentes Eléctricos
  ✔ debe crear un Interruptor de Potencia con parámetros físicos y de confiabilidad consistentes (0.6ms)
  ✔ debe calcular correctamente la indisponibilidad U = 1 - A (0.2ms)
  ✔ debe asignar terminales coherentes a una Barra Colectora (0.08ms)
✔ Modelo de Componentes Eléctricos (1.4ms)

▶ NetworkModel (Grafo de Red)
  ✔ debe permitir agregar, consultar, actualizar y remover componentes (0.5ms)
  ✔ debe rechazar la inserción de componentes con id duplicado (0.3ms)
  ✔ debe serializar y deserializar a JSON sin perder atributos (1.4ms)
✔ NetworkModel (Grafo de Red) (2.3ms)

▶ Fase 5: Motor de Contingencias N-1 y Confiabilidad (Reliability Engine)
  ✔ debe calcular correctamente los índices de confiabilidad N-1 en Barra Simple (6.8ms)
  ✔ debe verificar que la apertura de interruptores en Barra en Anillo cumple N-1 (0 MW perdidos) (3.0ms)
  ✔ debe verificar redundancia de barra total en Doble Barra con Doble Interruptor (2.6ms)
  ✔ debe ejecutar el Benchmark comparativo de las 6 topologías ordenado por EENS (16.0ms)
✔ Fase 5: Motor de Contingencias N-1 y Confiabilidad (Reliability Engine) (29.2ms)

▶ Fase 3: Módulo de Topologías Predefinidas (Presets)
  ✔ debe contener los 6 esquemas normalizados en los metadatos (1.3ms)
  ✔ debe cargar exitosamente la topología de Barra Simple y energizar todas sus cargas (5.8ms)
  ✔ debe cargar exitosamente Barra Principal + Transferencia con bypasses operativos (2.3ms)
  ✔ debe cargar Barra Seccionada y demostrar aislamiento de fallas por partición (3.4ms)
  ✔ debe cargar Barra en Anillo y soportar contingencia N-1 (abrir 1 interruptor sin perder cargas) (0.9ms)
  ✔ debe cargar Interruptor y Medio y mantener servicio ante pérdida de una barra colectora (7.2ms)
  ✔ debe cargar Doble Barra con Doble Interruptor con máxima redundancia de bahía (2.5ms)
  ✔ debe rechazar una clave de topología no registrada (0.5ms)
✔ Fase 3: Módulo de Topologías Predefinidas (Presets) (25.7ms)

▶ Gestión de Conexiones Galvánicas (Ramas)
  ✔ debe permitir crear conexiones válidas entre terminales de componentes existentes (0.9ms)
  ✔ debe rechazar la conexión de un terminal consigo mismo (0.2ms)
  ✔ debe impedir conexiones duplicadas directas entre los mismos terminales (0.2ms)
  ✔ eliminar un componente debe purgar automáticamente todas sus conexiones asociadas (0.2ms)
✔ Gestión de Conexiones Galvánicas (Ramas) (2.2ms)

▶ Validación Topológica y Flujo de Energización (BFS)
  ✔ debe propagar la energización completa desde una Fuente hasta una Carga a través de equipos cerrados (1.3ms)
  ✔ abrir un interruptor debe interrumpir la energización hacia aguas abajo (deslastre de carga) (0.7ms)
  ✔ debe emitir advertencia ante discrepancia directa de tensión sin transformador (0.1ms)
  ✔ debe detectar componentes aislados sin conexiones en la subestación (0.5ms)
✔ Validación Topológica y Flujo de Energización (BFS) (3.0ms)

ℹ Total: 43 tests en 9 suites | 43 aprobados | 0 fallos | 136.7ms
```

---

## 5. Registro de Decisiones de Arquitectura (ADR)

- **ADR-01: Separación estricta entre Modelo y Vista SVG:**  
  Las conexiones son ramas con identificadores estables en el `NetworkModel` con enrutamiento ortogonal dinámico.
- **ADR-02: Propagación Galvánica mediante BFS Determinista:**  
  Recorrido en grafo que evalúa estados de aislamiento y acoplamiento según la posición física de contactos.
- **ADR-03: Enrutamiento Ortogonal Dinámico Manhattan:**  
  Cálculo de rutas a 90° estándar en planos unifilares y CAD DXF.
- **ADR-04: Metadatos de Ingeniería Desacoplados y Paramétricos para Topologías:**  
  Parámetros técnicos de referencia normalizados independientes de la capa gráfica.
- **ADR-05: Carga Declarativa Atómica y Limpieza con Reseteo de Contadores:**  
  Garantiza determinismo en identificadores de terminales y ramas al cambiar de topología.
- **ADR-06: Capa de Interbloqueo Mediada por Reglas Físicas (IEC 62271-102):**  
  Intercepta maniobras indebidas impidiendo la apertura de seccionadores bajo carga.
- **ADR-07: Doble Canal de Notificación de Maniobras (SOE + Alerta Visual SVG):**  
  Registro en milisegundos y retroalimentación sensorial instantánea en el esquema unifilar.
- **ADR-08: Evaluación No Destructiva de Contingencias N-1:**  
  El análisis N-1 itera sobre copias de estado sin alterar permanentemente el modelo del usuario, restaurando automáticamente la condición operacional base.
- **ADR-09: Benchmark Comparativo Desacoplado con Auto-Restauración:**  
  La ejecución del benchmark de las 6 topologías serializa y restaura el proyecto en memoria sin pérdida de trabajo.
- **ADR-10: Modelo Paramétrico de Costos con Escalamiento No Lineal:**  
  Transformadores y bahías escalan con ley exponencial económica ($S^{0.75} \cdot V^{0.40}$), reflejando con exactitud los estándares de cotización de la industria electromecánica.
- **ADR-11: Formulación Anualizada Comparable (TAC) para Arbitraje CAPEX vs Confiabilidad:**  
  El TAC integra la anualización de inversión (vía CRF), el costo de mantenimiento anual y la penalización estocástica por energía no suministrada (CENS), permitiendo comparar esquemas simples de bajo CAPEX contra esquemas redundantes de alto CAPEX en una misma escala anual de dólares.
- **ADR-12: Transformación Cartesiana Invertida SVG a WCS de CAD:**  
  Mapeo estricto del eje de ordenadas ($Y_{\text{cad}} = Y_{\max} - Y_{\text{svg}}$) para asegurar que los planos exportados en AutoCAD y LibreCAD conserven la orientación espacial cenital exacta del esquema unifilar sin requerir rotaciones ni escalados manuales.
- **ADR-13: Estructuración por Capas y ACI según Disciplina y Nivel de Tensión:**  
  Separación jerárquica de primitivas vectoriales en capas especializadas (`0_BARRAS`, `0_EQUIPOS`, `0_CONEXIONES`, `0_TEXTOS`) y capas cromáticas por nivel de tensión (ACI 1, 2, 3, 4, 5, 30), cumpliendo con los estándares de diseño y entrega de planos unifilares en empresas eléctricas y de ingeniería.

---

## 6. Próxima Fase a Ejecutar: Fase 8 (Validación Integral y Release)

### Objetivos técnicos inmediatos:
1. **Validación de Casos Límite y Esquinas Numéricas:**
   - Redes vacías o con un solo componente aislado.
   - Parámetros de confiabilidad extremos (tasas nulas $\lambda = 0$, MTTR muy alto).
   - Topologías con bucles o mallas complejas y múltiples fuentes en paralelo.
2. **Pruebas de Integración Extremo a Extremo (E2E):**
   - Flujo de trabajo completo: Carga de Preset -> Maniobra -> Alerta SOE -> Análisis N-1 -> Análisis Económico LCC -> Exportación CAD DXF.
3. **Optimización de Rendimiento y Empaquetado:**
   - Verificación de ausencia de memory leaks en listeners del EventBus.
   - Generación de documentación final de usuario y manual técnico en `README.md`.
   - Congelación de versión `1.0.0 (Release Candidate / Final)`.

---

*Fin del registro de bitácora actualizado para la Fase 7.*  
*El archivo ha quedado persistido en [bitacora_substat_1.md](file:///Users/andreibarwood/Documents/CFT/electricidad_aplicada/bitacora_substat_1.md).*
