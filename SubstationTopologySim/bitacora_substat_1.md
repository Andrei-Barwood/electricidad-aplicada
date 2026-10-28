# BITÁCORA DE INGENIERÍA — SubstationTopologySim
**Documento de Control y Seguimiento de Desarrollo de Software Crítico**  
**Identificador:** `bitacora_substat_1.md`  
**Versión actual:** `0.5.0 (Fase 5)`  
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
| **Fase 6** | **Análisis Tecnoeconómico** | *Pendiente (Próxima)* | Modelado de inversión en equipos (CAPEX), costos anuales de mantenimiento (OPEX), penalización por EENS y costo anualizado comparable. |
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

---

## 4. Verificación Automatizada (Pruebas Unitarias)

Se ejecutó la suite completa de pruebas unitarias (`node --test tests/*.test.js`), alcanzando un **100% de aprobación (32 de 32 pruebas en verde, 0 fallos)**:

```text
▶ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine)
  ✔ debe bloquear la apertura de un seccionador si su interruptor asociado está cerrado bajo carga (R1) (33.4ms)
  ✔ debe permitir abrir el seccionador después de haber abierto primero el interruptor de potencia (1.2ms)
  ✔ debe impedir el cierre de seccionador si el interruptor asociado está cerrado (secuencia segura R2) (0.6ms)
  ✔ debe permitir forzar maniobras en Modo Bypass / Override emitiendo ALARM en SOE (0.8ms)
  ✔ debe bloquear el cierre de un equipo consignado bajo LOTO (OUT_OF_SERVICE) (0.6ms)
  ✔ debe registrar y exportar correctamente la secuencia cronológica SOE a CSV (0.9ms)
✔ Fase 4: Motor de Maniobras e Interbloqueos (Interlocking Engine) (38.4ms)

▶ Modelo de Componentes Eléctricos
  ✔ debe crear un Interruptor de Potencia con parámetros físicos y de confiabilidad consistentes (1.0ms)
  ✔ debe calcular correctamente la indisponibilidad U = 1 - A (0.1ms)
  ✔ debe asignar terminales coherentes a una Barra Colectora (0.07ms)
✔ Modelo de Componentes Eléctricos (1.9ms)

▶ NetworkModel (Grafo de Red)
  ✔ debe permitir agregar, consultar, actualizar y remover componentes (0.4ms)
  ✔ debe rechazar la inserción de componentes con id duplicado (0.2ms)
  ✔ debe serializar y deserializar a JSON sin perder atributos (1.5ms)
✔ NetworkModel (Grafo de Red) (2.5ms)

▶ Fase 5: Motor de Contingencias N-1 y Confiabilidad (Reliability Engine)
  ✔ debe calcular correctamente los índices de confiabilidad N-1 en Barra Simple (4.2ms)
  ✔ debe verificar que la apertura de interruptores en Barra en Anillo cumple N-1 (0 MW perdidos) (2.8ms)
  ✔ debe verificar redundancia de barra total en Doble Barra con Doble Interruptor (2.7ms)
  ✔ debe ejecutar el Benchmark comparativo de las 6 topologías ordenado por EENS (12.3ms)
✔ Fase 5: Motor de Contingencias N-1 y Confiabilidad (Reliability Engine) (22.9ms)

▶ Fase 3: Módulo de Topologías Predefinidas (Presets)
  ✔ debe contener los 6 esquemas normalizados en los metadatos (0.6ms)
  ✔ debe cargar exitosamente la topología de Barra Simple y energizar todas sus cargas (2.4ms)
  ✔ debe cargar exitosamente Barra Principal + Transferencia con bypasses operativos (1.3ms)
  ✔ debe cargar Barra Seccionada y demostrar aislamiento de fallas por partición (1.7ms)
  ✔ debe cargar Barra en Anillo y soportar contingencia N-1 (abrir 1 interruptor sin perder cargas) (1.0ms)
  ✔ debe cargar Interruptor y Medio y mantener servicio ante pérdida de una barra colectora (2.1ms)
  ✔ debe cargar Doble Barra con Doble Interruptor con máxima redundancia de bahía (2.0ms)
  ✔ debe rechazar una clave de topología no registrada (0.2ms)
✔ Fase 3: Módulo de Topologías Predefinidas (Presets) (12.6ms)

▶ Gestión de Conexiones Galvánicas (Ramas)
  ✔ debe permitir crear conexiones válidas entre terminales de componentes existentes (1.1ms)
  ✔ debe rechazar la conexión de un terminal consigo mismo (0.3ms)
  ✔ debe impedir conexiones duplicadas directas entre los mismos terminales (0.1ms)
  ✔ eliminar un componente debe purgar automáticamente todas sus conexiones asociadas (0.2ms)
✔ Gestión de Conexiones Galvánicas (Ramas) (2.6ms)

▶ Validación Topológica y Flujo de Energización (BFS)
  ✔ debe propagar la energización completa desde una Fuente hasta una Carga a través de equipos cerrados (1.2ms)
  ✔ abrir un interruptor debe interrumpir la energización hacia aguas abajo (deslastre de carga) (0.3ms)
  ✔ debe emitir advertencia ante discrepancia directa de tensión sin transformador (0.2ms)
  ✔ debe detectar componentes aislados sin conexiones en la subestación (0.2ms)
✔ Validación Topológica y Flujo de Energización (BFS) (2.4ms)

ℹ Total: 32 tests en 7 suites | 32 aprobados | 0 fallos | 107.3ms
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

---

## 6. Próxima Fase a Ejecutar: Fase 6 (Análisis Tecnoeconómico)

### Objetivos técnicos inmediatos:
1. **Modelado de Costos de Inversión (CAPEX):**
   - Costos unitarios de adquisición y montaje (USD) por tipo de equipo y nivel de tensión (220 kV, 66 kV, 23 kV).
   - Costo de obras civiles, terreno de patio y sistema de control/protecciones.
2. **Costos Anuales de Operación y Mantenimiento (OPEX):**
   - Costo preventivo y correctivo anualizado según tasas de falla ($\lambda, \text{MTTR}$).
3. **Costo de Energía No Suministrada (CENS / Penalizaciones Regulatorias):**
   - Valoración económica del EENS ($\text{USD/MWh}$ según estándar regulatorio nacional / SEC / CNE).
4. **Costo Total Anualizado Comparable (TAC / LCC):**
   - Tasa de descuento ($r$), vida útil del proyecto ($N = 25\text{ a 30 años}$) y comparación económica global entre las 6 topologías.

---

*Fin del registro de bitácora actualizado para la Fase 5.*  
*El archivo ha quedado persistido en [bitacora_substat_1.md](file:///Users/andreibarwood/Documents/CFT/electricidad_aplicada/bitacora_substat_1.md).*
