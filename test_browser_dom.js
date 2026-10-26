const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('simulador.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
const { window } = dom;

// Check that buttons exist
const wireTdaBtn = window.document.querySelector("#wire-tda");
const tableBtn = window.document.querySelector("#toggle-load-table");

console.log("Button #wire-tda exists?", Boolean(wireTdaBtn));
console.log("Button #toggle-load-table exists?", Boolean(tableBtn));

if (!wireTdaBtn || !tableBtn) {
  console.error("Missing buttons in DOM!");
  process.exit(1);
} else {
  console.log("✓ All DOM elements found in simulador.html");
}
