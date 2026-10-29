/**
 * PresetsPanel - SubstationTopologySim
 * Controlador del selector de 18 topologías normalizadas e inspector de ficha técnica.
 * Soporta filtrado por categoría (Transmisión, Distribución, Renovables/Industria) y búsqueda interactiva.
 */

import { 
  TOPOLOGY_PRESET_KEYS, 
  TOPOLOGY_CATEGORIES,
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
    this.activeCategoryFilter = 'ALL';
    this.searchQuery = '';

    this.render();
    this.subscribe();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">Topologías Normalizadas</span>
        <span class="preset-tag-badge">18 Plantillas</span>
      </div>
      <div class="panel-subtitle">
        Catálogo unifilar estándar (IEEE / IEC / CIGRE):
      </div>

      <!-- Filtros y Búsqueda -->
      <div class="presets-filter-container">
        <input 
          type="text" 
          class="presets-search-input" 
          id="presets-search-input" 
          placeholder="Buscar configuración (ej. Anillo, 500 kV, Solar)..."
          autocomplete="off"
        />
        <div class="presets-category-tabs" id="presets-category-tabs">
          <button class="preset-tab-btn active" data-category="ALL">Todas (18)</button>
          <button class="preset-tab-btn" data-category="${TOPOLOGY_CATEGORIES.TRANSMISSION.id}">⚡ Transmisión (9)</button>
          <button class="preset-tab-btn" data-category="${TOPOLOGY_CATEGORIES.DISTRIBUTION.id}">🏙️ Distribución (5)</button>
          <button class="preset-tab-btn" data-category="${TOPOLOGY_CATEGORIES.GENERATION_INDUSTRY.id}">🏭 Industria (4)</button>
        </div>
      </div>

      <!-- Grid de Tarjetas de Topología -->
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

    // Eventos de Pestañas de Categoría
    const tabsContainer = this.container.querySelector('#presets-category-tabs');
    tabsContainer.querySelectorAll('.preset-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.preset-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategoryFilter = btn.dataset.category;
        this.renderPresetButtons();
      });
    });

    // Evento de Búsqueda
    const searchInput = this.container.querySelector('#presets-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderPresetButtons();
    });

    this.renderPresetButtons();
  }

  renderPresetButtons() {
    const grid = this.container.querySelector('#presets-buttons-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allPresets = Object.values(TOPOLOGY_PRESETS_METADATA);
    const filtered = allPresets.filter(preset => {
      const matchesCategory = this.activeCategoryFilter === 'ALL' || preset.category === this.activeCategoryFilter;
      if (!matchesCategory) return false;

      if (!this.searchQuery) return true;
      const q = this.searchQuery;
      return (
        preset.name.toLowerCase().includes(q) ||
        preset.englishName.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        `${preset.voltageLevel} kv`.includes(q) ||
        preset.reliabilityLevel.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="font-size: 11px; color: var(--color-text-muted); text-align: center; padding: 16px 8px;">
          No se encontraron topologías que coincidan con la búsqueda.
        </div>
      `;
      return;
    }

    for (const preset of filtered) {
      const btn = document.createElement('button');
      btn.className = 'preset-card-btn';
      if (this.activePresetKey === preset.key) {
        btn.classList.add('active');
      }
      btn.dataset.presetKey = preset.key;
      btn.innerHTML = `
        <div class="preset-card-top">
          <span class="preset-card-name">${preset.name}</span>
          <div class="preset-card-badges">
            <span class="preset-card-voltage">${preset.voltageLevel} kV</span>
            <span class="preset-card-badge" style="background: ${preset.badgeColor}20; color: ${preset.badgeColor}; border: 1px solid ${preset.badgeColor}60;">${preset.reliabilityLevel}</span>
          </div>
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

      // Actualizar selector rápido superior si existe
      const quickSelect = document.getElementById('quick-preset-select');
      if (quickSelect && quickSelect.value !== presetKey) {
        quickSelect.value = presetKey;
      }

      this.eventBus.emit('preset:loaded', { presetKey, metadata: res.metadata });

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
    this.container.querySelector('#tech-sheet-title').textContent = `${metadata.name} (${metadata.voltageLevel} kV)`;
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
      const quickSelect = document.getElementById('quick-preset-select');
      if (quickSelect && quickSelect.value !== presetKey) {
        quickSelect.value = presetKey;
      }
      this.updateTechSheet(metadata);
    });

    const quickSelect = document.getElementById('quick-preset-select');
    if (quickSelect) {
      quickSelect.addEventListener('change', (e) => {
        this.selectAndLoadPreset(e.target.value);
      });
    }

    const quickZoomFit = document.getElementById('quick-btn-zoom-fit');
    if (quickZoomFit) {
      quickZoomFit.addEventListener('click', () => {
        this.svgEditor.zoomToFit();
      });
    }
  }
}
