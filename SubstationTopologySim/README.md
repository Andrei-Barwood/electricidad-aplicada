# SubstationTopologySim

**Simulador interactivo de topologías de subestaciones eléctricas, maniobras operacionales, confiabilidad y exportación CAD**

---

## 1. Visión general y Fase 1 (Esqueleto Funcional)

Esta primera entrega establece el **esqueleto base ejecutable** de la aplicación, desacoplando estrictamente el modelo eléctrico, el almacén de estados, el motor de renderizado vectorial SVG y la interfaz gráfica de usuario.

### Características de la Fase 1:
- **Lienzo interactivo SVG**: Panorámica (*pan* fluido con ratón/espacio), zoom centrado en el cursor con rueda y botones de ajuste rápido (*zoom to fit*, restablecer 1:1).
- **Cuadrícula CAD de ingeniería**: Rejilla mayor y menor con función de ajuste automático magnético (*snap to grid* a 20 px).
- **Biblioteca de componentes eléctricos**: Símbolos normalizados con doble codificación (forma, iconografía y color):
  - Barra colectora (*Busbar*)
  - Interruptor de potencia (*Circuit Breaker*) con indicador de estado (Cerrado [I] / Abierto [O] / Mantenimiento)
  - Seccionador de maniobra (*Disconnector*) con visualización explícita del corte dieléctrico
  - Transformador de potencia de 2 devanados (*Power Transformer*)
  - Salida de alimentador / Carga (*Feeder Load*)
  - Red / Generador (*Grid Infeed / Source*)
- **Manipulación de componentes**: Selección individual con caja delimitadora, arrastre (*drag & drop*) tanto desde la biblioteca como dentro del lienzo, duplicación (`Ctrl+D`) y eliminación (`Supr`/`Backspace`).
- **Inspector de propiedades**: Edición en tiempo real de nombres, estado de conmutación físico, tensiones, potencias y parámetros de confiabilidad ($\lambda$, MTTR, cálculo dinámico de disponibilidad e indisponibilidad).
- **Persistencia local**: Guardado y recuperación inmediata mediante almacenamiento web local (`localStorage`).

---

## 2. Estructura de archivos

```text
SubstationTopologySim/
├── index.html
├── package.json
├── README.md
├── src/
│   ├── main.js
│   ├── app/
│   │   ├── application.js
│   │   ├── event-bus.js
│   │   └── state-store.js
│   ├── model/
│   │   ├── components.js
│   │   └── network-model.js
│   ├── editor/
│   │   ├── component-renderer.js
│   │   ├── selection-manager.js
│   │   └── svg-editor.js
│   ├── ui/
│   │   ├── properties-panel.js
│   │   └── toolbar.js
│   └── styles/
│       ├── tokens.css
│       ├── layout.css
│       ├── editor.css
│       └── components.css
└── tests/
    └── network-model.test.js
```

---

## 3. Instrucciones de ejecución local

Dado que la aplicación utiliza módulos estándar ECMAScript (`import`/`export`), debe servirse mediante un servidor HTTP local para evitar restricciones de CORS del protocolo `file://`.

### Opción A (con Node.js y npm):
```bash
cd SubstationTopologySim
npm start
```
*Abre automáticamente o visita `http://localhost:3000`.*

### Opción B (con Python 3):
```bash
cd SubstationTopologySim
python3 -m http.server 8080
```
*Visita `http://localhost:8080`.*

### Ejecución de Pruebas Unitarias:
```bash
cd SubstationTopologySim
npm test
```

---

## 4. Guía de verificación manual (Fase 1)

1. **Carga inicial:** Al abrir la aplicación en el navegador, se renderiza automáticamente una bahía de prueba compuesta por Fuente 220 kV, Barra Principal BB-1, Seccionador DS-1, Interruptor CB-1, Transformador TR-1 y Alimentador LD-1.
2. **Selección y visualización:** Haz clic en el interruptor `CB-1`. Se destacará con un recuadro punteado y el panel lateral derecho mostrará sus parámetros.
3. **Cambio de estado:** En el selector de "Condición Física de Conmutación", cambia de `Cerrado / Conectado [I]` a `Abierto / Aislado [O]`. Observa cómo el símbolo vectorial cambia inmediatamente a un contacto visiblemente abierto y el badge pasa de rojo a verde.
4. **Arrastre y ajuste:** Arrastra cualquier componente con el ratón. Al soltarlo, se ajustará automáticamente a los múltiplos de 20 px de la cuadrícula CAD.
5. **Añadir desde paleta:** Arrastra una "Barra Colectora" desde el panel izquierdo hacia el lienzo, o haz clic sobre ella para colocarla en el centro.
6. **Duplicar y eliminar:** Con un componente seleccionado, presiona `Ctrl+D` (o el botón de duplicar de la barra flotante) para crear una copia. Presiona la tecla `Supr` para eliminarlo.
7. **Navegación:** Usa la rueda del ratón para hacer zoom in/out centrado en el cursor. Mantén presionada la barra espaciadora y arrastra con el ratón para desplazarte (*pan*). Haz clic en el botón de "Ajustar a la vista" para re-encuadrar todos los equipos.
