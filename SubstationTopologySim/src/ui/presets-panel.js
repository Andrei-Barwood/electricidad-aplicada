/**
 * PresetsPanel - SubstationTopologySim
 * Controlador del selector de topologías predefinidas e inspector de ficha técnica.
 */

import { 
  TOPOLOGY_PRESET_KEYS, 
  TOPOLOGY_PRESETS_METADATA, 
  loadTopologyPreset 
} from '../model/topology-presets.js';

export class PresetsPanel {
  /**
   * @param {HTMLElement} container
   * @param {import('../model/network-model.js').NetworkModel} networkModel
   * @param {import('../editor/svg-editor.js').SvgEditor} svgEditor
   * @param {import('../app/event-bus.js').EventBus} eventBus
   * @param {import('../editor/selection-manager.js').SelectionManager} selectionManager
   */
  constructor(container, networkModel, svgEditor, eventBus, selectionManager) {
    this.container = container;
    this.networkModel = networkModel;
    this.svgEditor = svgEditor;
    this.eventBus = eventBus;
    this.selectionManager = selectionManager;
    this.activePresetKey = null;

    this.render();
    this.subscribe();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">Topologías Normalizadas</span>
        <span class="preset-tag-badge">Fase 3</span>
      </div>
      <div class="panel-subtitle">
        Carga instantánea de unifilares estándar (IEEE / IEC):
      </div>

      <div class="presets-grid" id="presets-buttons-grid"></div>

      <!-- Ficha Técnica de la Topología Activa -->
      <div class="preset-tech-sheet" id="preset-tech-sheet" style="display: none;">
        <div class="tech-sheet-header">
          <span class="tech-sheet-title" id="tech-sheet-title">Ficha Técnica</span>
          <span class="tech-sheet-std" id="tech-sheet-std">IEEE C37</span>
        </div>
        <p class="tech-sheet-desc" id="tech-sheet-desc"></p>
        <div class="tech-sheet-meta">
          <div class="tech-meta-item">
            <span class="meta-label">Confiabilidad:</span>
            <span class="meta-val" id="tech-sheet-rel">Alta</span>
          </div>
          <div class="tech-meta-item">
            <span class="meta-label">Costo Relativo:</span>
            <span class="meta-val" id="tech-sheet-cost">1.0x</span>
          </div>
        </div>
        <div class="tech-sheet-points">
          <div class="points-col pros">
            <span class="points-title">Ventajas:</span>
            <ul id="tech-sheet-pros"></ul>
          </div>
          <div class="points-col cons">
            <span class="points-title">Limitaciones:</span>
            <ul id="tech-sheet-cons"></ul>
          </div>
        </div>
      </div>
    `;

    const grid = this.container.querySelector('#presets-buttons-grid');
    const presetsList = Object.values(TOPOLOGY_PRESETS_METADATA);

    for (const preset of presetsList) {
      const btn = document.createElement('button');
      btn.className = 'preset-card-btn';
      btn.dataset.presetKey = preset.key;
      btn.innerHTML = `
        <div class="preset-card-top">
          <span class="preset-card-name">${preset.name}</span>
          <span class="preset-card-badge" style="background: ${preset.badgeColor}20; color: ${preset.badgeColor}; border: 1px solid ${preset.badgeColor}60;">${preset.reliabilityLevel}</span>
        </div>
        <div class="preset-card-sub">${preset.englishName}</div>
      `;

      btn.addEventListener('click', () => {
        this.selectAndLoadPreset(preset.key);
      });

      grid.appendChild(btn);
    }
  }

  selectAndLoadPreset(presetKey) {
    try {
      this.activePresetKey = presetKey;
      this.selectionManager.clearSelection();

      // Cargar topología
      const res = loadTopologyPreset(this.networkModel, presetKey);

      // Actualizar estado activo en botones
      this.container.querySelectorAll('.preset-card-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.presetKey === presetKey);
      });

      // Actualizar Ficha Técnica
      this.updateTechSheet(res.metadata);

      // Centrar viewport
      setTimeout(() => {
        this.svgEditor.zoomToFit();
      }, 60);

      console.info(`[PresetsPanel] Topología '${res.metadata.name}' cargada exitosamente.`);
    } catch (err) {
      console.error('[PresetsPanel] Error al cargar preset:', err);
      alert(`Error al cargar topología: ${err.message}`);
    }
  }

  updateTechSheet(metadata) {
    const sheet = this.container.querySelector('#preset-tech-sheet');
    if (!sheet) return;

    sheet.style.display = 'block';
    this.container.querySelector('#tech-sheet-title').textContent = metadata.name;
    this.container.querySelector('#tech-sheet-std').textContent = metadata.standard;
    this.container.querySelector('#tech-sheet-desc').textContent = metadata.description;
    this.container.querySelector('#tech-sheet-rel').textContent = metadata.reliabilityLevel;
    this.container.querySelector('#tech-sheet-cost').textContent = `${metadata.relativeCost.toFixed(2)}x CAPEX`;

    const prosList = this.container.querySelector('#tech-sheet-pros');
    prosList.innerHTML = metadata.advantages.map(adv => `<li>${adv}</li>`).join('');

    const consList = this.container.querySelector('#tech-sheet-cons');
    consList.innerHTML = metadata.disadvantages.map(dis => `<li>${dis}</li>`).join('');
  }

  subscribe() {
    this.eventBus.on('preset:loaded', ({ presetKey, metadata }) => {
      this.activePresetKey = presetKey;
      this.container.querySelectorAll('.preset-card-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.presetKey === presetKey);
      });
      this.updateTechSheet(metadata);
    });
  }
}
