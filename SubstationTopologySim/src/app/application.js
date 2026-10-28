/**
 * Application - SubstationTopologySim
 * Coordinador central del ciclo de vida y orquestador de componentes.
 */

import { EventBus } from './event-bus.js';
import { StateStore } from './state-store.js';
import { NetworkModel } from '../model/network-model.js';
import { ComponentType, OperationalState, createComponent } from '../model/components.js';
import { SelectionManager } from '../editor/selection-manager.js';
import { SvgEditor } from '../editor/svg-editor.js';
import { Toolbar } from '../ui/toolbar.js';
import { PropertiesPanel } from '../ui/properties-panel.js';
import { PresetsPanel } from '../ui/presets-panel.js';
import { SoePanel } from '../ui/soe-panel.js';
import { TOPOLOGY_PRESET_KEYS } from '../model/topology-presets.js';
import { SequenceOfEvents } from '../model/sequence-of-events.js';
import { InterlockingEngine } from '../model/interlocking-engine.js';

export class Application {
  constructor() {
    this.eventBus = new EventBus();
    this.stateStore = new StateStore(this.eventBus);
    this.networkModel = new NetworkModel(this.eventBus);
    this.selectionManager = new SelectionManager(this.stateStore, this.eventBus);
    this.soe = new SequenceOfEvents(this.eventBus);
    this.interlockingEngine = new InterlockingEngine(this.eventBus, this.soe);
  }

  /**
   * Inicializa los subsistemas del editor e inyecta el escenario inicial.
   */
  start() {
    const canvasContainer = document.getElementById('canvas-container');
    const propertiesContainer = document.getElementById('properties-container');

    if (!canvasContainer || !propertiesContainer) {
      throw new Error('[Application] Contenedores estructurales del DOM no encontrados');
    }

    // Inicializar subsistemas del editor
    this.svgEditor = new SvgEditor(
      canvasContainer,
      this.networkModel,
      this.stateStore,
      this.eventBus,
      this.selectionManager
    );

    this.toolbar = new Toolbar(
      this.svgEditor,
      this.networkModel,
      this.stateStore,
      this.eventBus,
      this.selectionManager
    );

    this.propertiesPanel = new PropertiesPanel(
      propertiesContainer,
      this.networkModel,
      this.eventBus,
      this.selectionManager,
      this.interlockingEngine
    );

    const presetsContainer = document.getElementById('presets-panel-container');
    if (presetsContainer) {
      this.presetsPanel = new PresetsPanel(
        presetsContainer,
        this.networkModel,
        this.svgEditor,
        this.eventBus,
        this.selectionManager
      );
    }

    const soeContainer = document.getElementById('soe-panel-container');
    if (soeContainer) {
      this.soePanel = new SoePanel(
        soeContainer,
        this.interlockingEngine,
        this.soe,
        this.networkModel,
        this.eventBus
      );
    }

    this.initTabs();
    this.initPalette();
    this.subscribeGlobalEvents();

    if (this.presetsPanel) {
      this.presetsPanel.selectAndLoadPreset(TOPOLOGY_PRESET_KEYS.SINGLE_BUS);
    } else {
      this.loadInitialSchematic();
    }

    console.info('[SubstationTopologySim] Fase 4 inicializada: Motor de maniobras e interbloqueos activo.');
  }

  /**
   * Inicializa la navegación por pestañas en el panel lateral derecho.
   */
  initTabs() {
    const tabBtnProp = document.getElementById('tab-btn-properties');
    const tabBtnSoe = document.getElementById('tab-btn-soe');
    const tabContentProp = document.getElementById('tab-content-properties');
    const tabContentSoe = document.getElementById('tab-content-soe');

    tabBtnProp?.addEventListener('click', () => {
      tabBtnProp.classList.add('active');
      tabBtnSoe?.classList.remove('active');
      tabContentProp?.classList.add('active');
      tabContentSoe?.classList.remove('active');
    });

    tabBtnSoe?.addEventListener('click', () => {
      tabBtnSoe.classList.add('active');
      tabBtnProp?.classList.remove('active');
      tabContentSoe?.classList.add('active');
      tabContentProp?.classList.remove('active');
    });

    this.eventBus.on('soe:event-logged', () => {
      const badge = document.getElementById('tab-soe-badge');
      if (badge) badge.textContent = this.soe.events.length;
    });

    // Si se bloquea una maniobra, alternar temporalmente o alertar en pestaña SOE
    this.eventBus.on('interlocking:blocked', () => {
      const badge = document.getElementById('tab-soe-badge');
      if (badge) {
        badge.classList.remove('badge-alert');
        void badge.offsetWidth;
        badge.classList.add('badge-alert');
      }
    });
  }

  /**
   * Configura la paleta interactiva de componentes del panel izquierdo.
   */
  initPalette() {
    const paletteItems = document.querySelectorAll('.palette-item');

    paletteItems.forEach(item => {
      const type = item.dataset.componentType;

      // Evento Drag & Drop estándar
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/substation-component-type', type);
        e.dataTransfer.effectAllowed = 'copy';
      });

      // Clic directo para añadir al centro de la vista
      item.addEventListener('click', () => {
        const { x, y, zoom } = this.stateStore.viewport;
        const rect = this.svgEditor.svg.getBoundingClientRect();
        const centerWorldX = (-x + rect.width / 2) / zoom;
        const centerWorldY = (-y + rect.height / 2) / zoom;

        const snappedX = this.svgEditor.snap(centerWorldX);
        const snappedY = this.svgEditor.snap(centerWorldY);

        const newComp = createComponent(type, {
          x: snappedX,
          y: snappedY
        });

        this.networkModel.addComponent(newComp);
        this.selectionManager.select(newComp.id);
      });
    });
  }

  /**
   * Escucha eventos globales entre módulos.
   */
  subscribeGlobalEvents() {
    this.eventBus.on('editor:drop-component', ({ type, position }) => {
      const newComp = createComponent(type, {
        x: position.x,
        y: position.y
      });
      this.networkModel.addComponent(newComp);
      this.selectionManager.select(newComp.id);
    });

    // Maniobra directa de conmutación desde el lienzo
    this.eventBus.on('editor:component-toggle-requested', ({ componentId }) => {
      this.interlockingEngine.toggleComponent(componentId, this.networkModel);
    });

    // Guardado y carga local
    document.getElementById('btn-save-project')?.addEventListener('click', () => {
      this.saveToLocalStorage();
    });

    document.getElementById('btn-load-project')?.addEventListener('click', () => {
      this.loadFromLocalStorage();
    });
  }

  /**
   * Guarda el estado del proyecto en localStorage.
   */
  saveToLocalStorage() {
    const data = this.networkModel.toJSON();
    localStorage.setItem('substation_sim_project', JSON.stringify(data));
    alert('Proyecto guardado correctamente en almacenamiento local con toda su conectividad galvánica.');
  }

  /**
   * Carga el estado del proyecto desde localStorage.
   */
  loadFromLocalStorage() {
    const raw = localStorage.getItem('substation_sim_project');
    if (!raw) {
      alert('No se encontró ningún proyecto guardado previamente.');
      return;
    }
    try {
      const data = JSON.parse(raw);
      this.networkModel.fromJSON(data);
      this.svgEditor.zoomToFit();
      alert('Proyecto cargado exitosamente.');
    } catch (err) {
      console.error('[Application] Error al cargar proyecto:', err);
      alert('Error al leer el archivo de proyecto guardado.');
    }
  }

  /**
   * Carga una bahía unifilar de muestra con ramas explícitas y flujo de energización.
   */
  loadInitialSchematic() {
    // 1. Equipos eléctricos
    const src1 = createComponent(ComponentType.SOURCE, {
      id: 'SRC-1',
      name: 'Red 220 kV (Infeed)',
      x: 170,
      y: 40,
      properties: { voltageLevel: 220 }
    });

    const bb1 = createComponent(ComponentType.BUSBAR, {
      id: 'BB-1',
      name: 'Barra Principal 220 kV (BP-1)',
      x: 100,
      y: 140,
      width: 320,
      properties: { voltageLevel: 220 }
    });

    const ds1 = createComponent(ComponentType.DISCONNECTOR, {
      id: 'DS-1',
      name: 'Secc. Barra 220 kV',
      x: 235,
      y: 200,
      operationalState: OperationalState.CLOSED,
      properties: { voltageLevel: 220 }
    });

    const cb1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
      id: 'CB-1',
      name: 'Int. Potencia Trafo',
      x: 235,
      y: 280,
      operationalState: OperationalState.CLOSED,
      properties: { voltageLevel: 220 }
    });

    const tr1 = createComponent(ComponentType.TRANSFORMER, {
      id: 'TR-1',
      name: 'Trafo 1 (220/66 kV)',
      x: 230,
      y: 370,
      properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 60 }
    });

    const ld1 = createComponent(ComponentType.FEEDER_LOAD, {
      id: 'LD-1',
      name: 'Alimentador Industrial 1',
      x: 235,
      y: 490,
      properties: { voltageLevel: 66, ratedPower: 35 }
    });

    this.networkModel.addComponent(src1);
    this.networkModel.addComponent(bb1);
    this.networkModel.addComponent(ds1);
    this.networkModel.addComponent(cb1);
    this.networkModel.addComponent(tr1);
    this.networkModel.addComponent(ld1);

    // 2. Conectividad galvánica explícita entre terminales
    this.networkModel.addConnection({
      id: 'BRANCH-1',
      fromComponentId: 'SRC-1',
      fromTerminalId: 'SRC-1-t1',
      toComponentId: 'BB-1',
      toTerminalId: 'BB-1-t2'
    });

    this.networkModel.addConnection({
      id: 'BRANCH-2',
      fromComponentId: 'BB-1',
      fromTerminalId: 'BB-1-t3',
      toComponentId: 'DS-1',
      toTerminalId: 'DS-1-t1'
    });

    this.networkModel.addConnection({
      id: 'BRANCH-3',
      fromComponentId: 'DS-1',
      fromTerminalId: 'DS-1-t2',
      toComponentId: 'CB-1',
      toTerminalId: 'CB-1-t1'
    });

    this.networkModel.addConnection({
      id: 'BRANCH-4',
      fromComponentId: 'CB-1',
      fromTerminalId: 'CB-1-t2',
      toComponentId: 'TR-1',
      toTerminalId: 'TR-1-t1'
    });

    this.networkModel.addConnection({
      id: 'BRANCH-5',
      fromComponentId: 'TR-1',
      fromTerminalId: 'TR-1-t2',
      toComponentId: 'LD-1',
      toTerminalId: 'LD-1-t1'
    });

    // Ajustar zoom inicial suavemente
    setTimeout(() => {
      this.svgEditor.zoomToFit();
    }, 50);
  }
}
