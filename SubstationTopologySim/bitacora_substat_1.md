# BITÁCORA DE INGENIERÍA — SubstationTopologySim
**Documento de Control y Seguimiento de Desarrollo de Software Crítico**  
**Identificador:** `bitacora_substat_1.md`  
**Versión actual:** `0.4.0 (Fase 4)`  
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
| **Fase 5** | **Contingencias N-1 y Confiabilidad** | *Pendiente (Próxima)* | Cálculo de disponibilidad de componentes ($\lambda, \mu$), diagramas de bloques (RBD), Markov, potencia desconectada y cálculo riguroso de EENS. |
| **Fase 6** | **Análisis Tecnoeconómico** | *Pendiente* | Modelado de inversión en equipos, costos de mantenimiento anual, penalización por EENS y costo anualizado comparable. |
| **Fase 7** | **Exportador CAD (ASCII DXF)** | *Pendiente* | Transformación geométrica mundo-CAD, capas por tipo de activo, asignación de colores por nivel de tensión y serialización DXF válida. |
| **Fase 8** | **Validación Integral y Release** | *Pendiente* | Casos límite (tasas nulas, bucles, islas), pruebas de integración extremo a extremo y empaquetado para distribución. |

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
- **Ramas explícitas (`connections`):** Se implementó la abstracción de ramas eléctricas conectadas exclusivamente entre terminales identificados (`fromComponentId`, `fromTerminalId`, `toComponentId`, `toTerminalId`). No se infiere conectividad por proximidad gráfica.
- **Validaciones de cableado en modelo:**
  - Prevención de conexiones de un terminal consigo mismo.
  - Detección y rechazo de conexiones duplicadas entre los mismos pares de terminales.
  - Purga automática de ramas huérfanas al remover cualquier equipo.
  - Advertencias automáticas ante divergencia de niveles de tensión (*Voltage Mismatch*) si no media un transformador.
  - Detección de activos aislados (*Isolated Components*).

### 3.4. Gestor de Cableado y Enrutamiento Ortogonal (Fase 2)
- **`ConnectionManager` (`src/editor/connection-manager.js`):**
  - Cableado interactivo: hacer clic en un terminal circular inicia la sesión de cableado; el cursor proyecta una línea guía elástica discontinua; un segundo clic sobre un terminal compatible sella la conexión galvánica.
  - Enrutamiento ortogonal tipo Manhattan (esquinas limpias a 90° con puntos nodales centrales de inspección).
  - Persistencia de ramas dinámicas: al arrastrar un equipo por el lienzo, todas las ramas conectadas a sus terminales se recalculan y deforman en tiempo real sin desconectarse.
  - Selección y supresión independiente de ramas mediante la tecla `Supr` o botón de eliminación.

### 3.5. Validador Topológico y Propagación de Energización (Fase 2)
- **`TopologyValidator` (`src/model/topology-validator.js`):**
  - Algoritmo de exploración de grafos por anchura (BFS) iniciado desde fuentes activas (`SOURCE` en estado `CLOSED`).
  - Conducción interna dependiente del estado del aparato (Barras conducen equipotencialmente; Interruptores y Seccionadores conducen si están `CLOSED`; Transformadores acoplan primario y secundario).
  - Estado de energización reactivo:
    - Cuando un interruptor o seccionador se conmuta a `OPEN`, el motor topológico detecta la interrupción del camino galvánico hacia aguas abajo.
    - Los conductores y equipos afectados pasan inmediatamente a estado **DESENERGIZADO** (línea discontinua gris, pérdida de brillo).
    - Las cargas pasan automáticamente a la lista de `unsuppliedLoads` (deslastre de carga).

### 3.6. Módulo de Topologías Normalizadas IEEE / IEC (Fase 3)
- **`TopologyPresets` (`src/model/topology-presets.js`):**
  Se desarrollaron los 6 esquemas unifilares normalizados con modelado paramétrico riguroso:
  1. **Barra Simple (*Single Bus*):** 1 barra colectora de 220 kV, acometida con interruptor de cabecera y 3 bahías de salida (Trafo 220/66 kV, Trafo 220/23 kV y línea 220 kV).
  2. **Barra Principal con Barra de Transferencia (*Main and Transfer Bus*):** 2 barras de 220 kV unidas mediante bahía de acoplamiento (*Bus Tie*) con interruptor comodín y seccionadores de bypass por circuito para mantenimiento sin interrupción.
  3. **Barra Seccionada / Partida (*Sectionalized Bus*):** Barra dividida en dos secciones con interruptor de acoplamiento de sección flanqueado por seccionadores; permite confinar fallas y aislar secciones independientemente.
  4. **Barra en Anillo (*Ring Bus*):** Polígono cerrado con 4 interruptores interconectados en bucle y seccionadores dobles por polo. Satisface el **Criterio N-1** de continuidad ante la apertura de cualquier interruptor individual.
  5. **Interruptor y Medio (*Breaker-and-a-Half*, $1\,\frac{1}{2}$ CB):** 2 barras principales a 220 kV y calles de 3 interruptores en serie para alimentar 2 posiciones de circuito independientes (máxima continuidad para subestaciones troncales de transmisión).
  6. **Doble Barra con Doble Interruptor (*Double Bus Double Breaker*):** 2 barras y 2 interruptores dedicados por cada circuito (máxima confiabilidad y disponibilidad $99.99\%$).

### 3.7. Interfaz de Selección y Ficha Técnica de Ingeniería (Fase 3)
- **`PresetsPanel` (`src/ui/presets-panel.js`):**
  - Menú interactivo integrado en el panel lateral izquierdo con insignias de confiabilidad por colores.
  - Carga con un solo clic, limpieza de sesión previa, reseteo de identificadores y auto-encuadre (*Zoom to Fit*).
  - Panel de **Ficha Técnica**: despliega estándar de referencia (IEEE C37 / IEC 61936-1), costo relativo estimado de inversión (CAPEX), nivel de confiabilidad, resumen operacional, ventajas y limitaciones técnicas.

### 3.8. Motor de Enclavamientos de Seguridad Operacional (Fase 4)
- **`InterlockingEngine` (`src/model/interlocking-engine.js`):**
  Implementa las reglas formales de seguridad operacional según **IEC 62271-102**:
  - **Regla R1 (Apertura de seccionador bajo carga):** Los seccionadores carecen de medios de extinción de arco. Se bloquea terminantemente su apertura si el interruptor de potencia asociado en serie está cerrado (`CLOSED`) y conduciendo corriente.
  - **Regla R2 (Secuencia segura de energización):** Se prohíbe cerrar un seccionador si el interruptor de potencia asociado ya está cerrado y energizado. El interruptor es siempre el último en cerrar.
  - **Regla R3 (Enclavamiento LOTO):** Bloqueo total de conmutación sobre equipos consignados en mantenimiento (`OUT_OF_SERVICE`).
  - **Modo Bypass / Override de Emergencia:** Switch de control que permite a operadores calificados forzar maniobras excepcionales emitiendo alarmas críticas en la bitácora.

### 3.9. Secuencia Cronológica de Eventos SOE (Fase 4)
- **`SequenceOfEvents` (`src/model/sequence-of-events.js`):**
  - Registro de alta resolución con sellado de tiempo en milisegundos (`HH:MM:SS.mmm`).
  - Clasificación de eventos: `INFO`, `SUCCESS`, `WARNING`, `BLOCKED`, `ALARM`.
  - Capacidad de filtrado dinámico y exportación completa a archivo CSV (`exportToCSV`).

### 3.10. Panel de Maniobras y Control Interactivo SVG (Fase 4)
- **`SoePanel` (`src/ui/soe-panel.js`) & `PropertiesPanel` (`src/ui/properties-panel.js`):**
  - Panel lateral derecho con pestañas desacopladas: `Inspector` y `Maniobras (SOE)`.
  - Botones de acción rápida: `Conmutar [I/O]`, `Abrir [O]`, `Cerrar [I]` con validación inmediata por enclavamiento.
  - Doble clic interactivo sobre cualquier interruptor o seccionador en el lienzo SVG para solicitar maniobra directa.
  - Animación visual de alerta (`interlock-flash-blocked`) con resplandor rojo en el símbolo SVG ante intentos de maniobras prohibidas.

---

## 4. Verificación Automatizada (Pruebas Unitarias)

Se ejecutó la suite completa de pruebas unitarias (`node --test tests/*.test.js`), alcanzando un **100% de aprobación (28 de 28 pruebas en verde, 0 fallos)**:

```text
▶ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine)
  ✔ debe bloquear la apertura de un seccionador si su interruptor asociado está cerrado bajo carga (R1) (30.01ms)
  ✔ debe permitir abrir el seccionador después de haber abierto primero el interruptor de potencia (1.15ms)
  ✔ debe impedir el cierre de seccionador si el interruptor asociado está cerrado (secuencia segura R2) (0.66ms)
  ✔ debe permitir forzar maniobras en Modo Bypass / Override emitiendo ALARM en SOE (0.82ms)
  ✔ debe bloquear el cierre de un equipo consignado bajo LOTO (OUT_OF_SERVICE) (0.58ms)
  ✔ debe registrar y exportar correctamente la secuencia cronológica SOE a CSV (0.90ms)
✔ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine) (34.92ms)

▶ Modelo de Componentes Eléctricos
  ✔ debe crear un Interruptor de Potencia con parámetros físicos y de confiabilidad consistentes (0.55ms)
  ✔ debe calcular correctamente la indisponibilidad U = 1 - A (0.14ms)
  ✔ debe asignar terminales coherentes a una Barra Colectora (0.07ms)
✔ Modelo de Componentes Eléctricos (1.36ms)

▶ NetworkModel (Grafo de Red)
  ✔ debe permitir agregar, consultar, actualizar y remover componentes (0.46ms)
  ✔ debe rechazar la inserción de componentes con id duplicado (0.27ms)
  ✔ debe serializar y deserializar a JSON sin perder atributos (0.78ms)
✔ NetworkModel (Grafo de Red) (1.62ms)

▶ Fase 3: Módulo de Topologías Predefinidas (Presets)
  ✔ debe contener los 6 esquemas normalizados en los metadatos (0.56ms)
  ✔ debe cargar exitosamente la topología de Barra Simple y energizar todas sus cargas (2.01ms)
  ✔ debe cargar exitosamente Barra Principal + Transferencia con bypasses operativos (1.28ms)
  ✔ debe cargar Barra Seccionada y demostrar aislamiento de fallas por partición (1.31ms)
  ✔ debe cargar Barra en Anillo y soportar contingencia N-1 (abrir 1 interruptor sin perder cargas) (1.12ms)
  ✔ debe cargar Interruptor y Medio y mantener servicio ante pérdida de una barra colectora (2.18ms)
  ✔ debe cargar Doble Barra con Doble Interruptor con máxima redundancia de bahía (1.05ms)
  ✔ debe rechazar una clave de topología no registrada (0.50ms)
✔ Fase 3: Módulo de Topologías Predefinidas (Presets) (11.17ms)

▶ Gestión de Conexiones Galvánicas (Ramas)
  ✔ debe permitir crear conexiones válidas entre terminales de componentes existentes (0.85ms)
  ✔ debe rechazar la conexión de un terminal consigo mismo (0.21ms)
  ✔ debe impedir conexiones duplicadas directas entre los mismos terminales (0.15ms)
  ✔ eliminar un componente debe purgar automáticamente todas sus conexiones asociadas (0.22ms)
✔ Gestión de Conexiones Galvánicas (Ramas) (2.13ms)

▶ Validación Topológica y Flujo de Energización (BFS)
  ✔ debe propagar la energización completa desde una Fuente hasta una Carga a través de equipos cerrados (1.23ms)
  ✔ abrir un interruptor debe interrumpir la energización hacia aguas abajo (deslastre de carga) (0.24ms)
  ✔ debe emitir advertencia ante discrepancia directa de tensión sin transformador (0.15ms)
  ✔ debe detectar componentes aislados sin conexiones en la subestación (0.28ms)
✔ Validación Topológica y Flujo de Energización (BFS) (2.19ms)

ℹ Total: 28 tests en 6 suites | 28 aprobados | 0 fallos | 101.0ms
```

---

## 5. Registro de Decisiones de Arquitectura (ADR)

- **ADR-01: Separación estricta entre Modelo y Vista SVG:**  
  Las conexiones no son elementos visuales desconectados: son ramas con identificadores estables en el `NetworkModel`. Si se mueve la posición de un equipo, las ramas se deforman ortogonalmente sin alterar la conectividad eléctrica.
- **ADR-02: Propagación Galvánica mediante BFS Determinista:**  
  Recorrido determinista por anchura sobre el grafo galvánico que evalúa estados de aislamiento y acoplamiento según la posición física de contactos de seccionadores e interruptores.
- **ADR-03: Enrutamiento Ortogonal Dinámico Manhattan:**  
  Cálculo de rutas ortogonales con quiebres a 90° para representación fidedigna de planos unifilares normalizados y compatibilidad con trazados CAD DXF.
- **ADR-04: Metadatos de Ingeniería Desacoplados y Paramétricos para Topologías:**  
  Cada topología cuenta con un objeto de metadatos estandarizado con parámetros normalizados (estándar, confiabilidad, costos relativos CAPEX, ventajas y limitaciones) independiente del renderizado del DOM.
- **ADR-05: Carga Declarativa Atómica y Limpieza con Reseteo de Contadores:**  
  Al invocar un preset, el modelo ejecuta un ciclo seguro de purga (`networkModel.clear()`) y resetea los contadores de nombres de ingeniería para asegurar determinismo total en los identificadores de terminales y ramas.
- **ADR-06: Capa de Interbloqueo Mediada por Reglas Físicas (IEC 62271-102):**  
  Las maniobras de apertura/cierre no modifican el modelo directamente; pasan obligatoriamente por el `InterlockingEngine`. Si se detecta un interruptor cerrado en serie conduciendo corriente, la maniobra se intercepta y rechaza antes de alterar el grafo galvánico.
- **ADR-07: Doble Canal de Notificación de Maniobras (SOE + Alerta Visual SVG):**  
  Toda maniobra (exitosa o bloqueada) genera un evento inmutable en el registro cronológico SOE y activa simultáneamente retroalimentación sensorial (resplandor de advertencia SVG y toast explicativo).

---

## 6. Próxima Fase a Ejecutar: Fase 5 (Contingencias N-1 y Confiabilidad)

### Objetivos técnicos inmediatos:
1. **Modelado Probabilístico de Confiabilidad de Activos:**
   - Tasas de falla ($\lambda$), tiempos medios de reparación ($\text{MTTR}$, $\mu$).
   - Disponibilidad intrínseca ($A = \frac{\mu}{\lambda + \mu}$) e indisponibilidad ($U = 1 - A$).
2. **Motor de Análisis Estático de Contingencias N-1:**
   - Simulación iterativa de pérdida de cada activo individual (cada interruptor, seccionador, barra o trafo).
   - Detección automática de islas eléctricas y potencia deslastrada ($\Delta P$).
3. **Cálculo Riguroso de Índices de Confiabilidad:**
   - EENS (Energía Esperada No Suministrada en $\text{MWh/año} = \sum P_{\text{cortada}} \cdot U \cdot 8760$).
   - LOLE (Loss of Load Expectation en $\text{horas/año}$) y LOLP.
4. **Matriz Comparativa de Confiabilidad entre las 6 Topologías:**
   - Tabla interactiva que clasifique las topologías de mayor a menor resiliencia N-1.

---

*Fin del registro de bitácora actualizado para la Fase 4.*  
*El archivo ha quedado persistido en [bitacora_substat_1.md](file:///Users/andreibarwood/Documents/CFT/electricidad_aplicada/bitacora_substat_1.md).*
