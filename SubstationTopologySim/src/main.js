/**
 * Main Entry Point - SubstationTopologySim
 */

import { Application } from './app/application.js';

window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new Application();
    app.start();
    // Exponer instancia global para depuración o pruebas en consola
    window.__substationApp = app;
  } catch (err) {
    console.error('[Main] Fallo crítico al iniciar SubstationTopologySim:', err);
  }
});
