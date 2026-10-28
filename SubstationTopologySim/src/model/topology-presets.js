/**
 * TopologyPresets - SubstationTopologySim
 * Definición, modelado y cargador de las 6 topologías estándar de subestaciones (IEEE Std C37 / IEC 61936-1).
 */

import { 
  ComponentType, 
  OperationalState, 
  createComponent, 
  resetComponentCounters 
} from './components.js';

export const TOPOLOGY_PRESET_KEYS = Object.freeze({
  SINGLE_BUS: 'SINGLE_BUS',
  MAIN_TRANSFER: 'MAIN_TRANSFER',
  SECTIONALIZED_BUS: 'SECTIONALIZED_BUS',
  RING_BUS: 'RING_BUS',
  BREAKER_AND_A_HALF: 'BREAKER_AND_A_HALF',
  DOUBLE_BUS_DOUBLE_BREAKER: 'DOUBLE_BUS_DOUBLE_BREAKER'
});

export const TOPOLOGY_PRESETS_METADATA = Object.freeze({
  [TOPOLOGY_PRESET_KEYS.SINGLE_BUS]: {
    key: TOPOLOGY_PRESET_KEYS.SINGLE_BUS,
    name: 'Barra Simple',
    englishName: 'Single Bus Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Esquema elemental con una única barra colectora a la que se conectan todos los circuitos. Presenta la mínima inversión en aparamenta, pero carece de flexibilidad operacional: una falla en la barra interrumpe el suministro a toda la subestación.',
    advantages: [
      'Menor costo inicial de inversión (CAPEX mínimo)',
      'Espacio físico reducido y control simple',
      'Fácil comprensión operativa y mantenimiento básico'
    ],
    disadvantages: [
      'Sin redundancia: falla de barra desenergiza la subestación completa',
      'Mantenimiento de cualquier interruptor exige desconectar la salida asociada',
      'Dificultad de ampliación futura sin cortes de servicio'
    ],
    reliabilityLevel: 'Baja',
    relativeCost: 1.0,
    badgeColor: '#38bdf8'
  },

  [TOPOLOGY_PRESET_KEYS.MAIN_TRANSFER]: {
    key: TOPOLOGY_PRESET_KEYS.MAIN_TRANSFER,
    name: 'Barra Principal y Transferencia',
    englishName: 'Main and Transfer Bus',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Incorpora una barra de transferencia auxiliar y un interruptor de acoplamiento (Bus Tie). Permite realizar mantenimiento a cualquier interruptor de posición transfiriendo la protección y conducción al interruptor de transferencia sin interrumpir el suministro.',
    advantages: [
      'Mantenimiento de interruptores sin desconectar líneas o transformadores',
      'Costo moderado con sustancial mejora de disponibilidad respecto a barra simple',
      'Uso eficiente de un único interruptor comodín para toda la subestación'
    ],
    disadvantages: [
      'Falla en la barra principal desenergiza todos los circuitos',
      'Complejidad adicional en enclavamientos de seccionadores de bypass',
      'Requiere bahía dedicada de acoplamiento de barras'
    ],
    reliabilityLevel: 'Media',
    relativeCost: 1.3,
    badgeColor: '#818cf8'
  },

  [TOPOLOGY_PRESET_KEYS.SECTIONALIZED_BUS]: {
    key: TOPOLOGY_PRESET_KEYS.SECTIONALIZED_BUS,
    name: 'Barra Seccionada / Partida',
    englishName: 'Sectionalized Bus Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Divide la barra principal en dos o más secciones mediante un interruptor de partición flanqueado por seccionadores. Permite aislar una sección ante fallas o mantenimiento preservando la continuidad en la otra mitad de la subestación.',
    advantages: [
      'Confinamiento de fallas: una falla en barra solo afecta a su sección',
      'Flexibilidad para operar en dos subsistemas independientes o acoplados',
      'Excelente relación costo/beneficio para subestaciones medianas'
    ],
    disadvantages: [
      'Pérdida parcial de cargas si se pierde la fuente de la sección afectada',
      'Requiere coordinación de protecciones direccionales en el enlace de sección'
    ],
    reliabilityLevel: 'Media-Alta',
    relativeCost: 1.25,
    badgeColor: '#34d399'
  },

  [TOPOLOGY_PRESET_KEYS.RING_BUS]: {
    key: TOPOLOGY_PRESET_KEYS.RING_BUS,
    name: 'Barra en Anillo',
    englishName: 'Ring Bus Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Los interruptores se interconectan en un circuito cerrado poligonal (anillo). Cada circuito (fuente o carga) se conecta entre dos interruptores contiguos, permitiendo aislar cualquier interruptor sin interrumpir ningún circuito alimentado (Criterio N-1).',
    advantages: [
      'Cumplimiento estricto del Criterio N-1 sin necesidad de barra de transferencia',
      'Cada circuito se alimenta a través de dos caminos galvánicos independientes',
      'No requiere barra colectora central convencional; alta disponibilidad'
    ],
    disadvantages: [
      'Apertura de un interruptor transforma el anillo en barra seccionada en U',
      'Capacidad máxima limitada a 6-8 posiciones para evitar coordinaciones complejas',
      'Mayor complejidad en el esquema de disparo de protecciones diferenciales'
    ],
    reliabilityLevel: 'Alta',
    relativeCost: 1.45,
    badgeColor: '#fbbf24'
  },

  [TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF]: {
    key: TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF,
    name: 'Interruptor y Medio (1 1/2)',
    englishName: 'Breaker-and-a-Half Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Configuración estándar en subestaciones troncales de transmisión (220 kV y 500 kV). Dispone de dos barras principales y calles de 3 interruptores para alimentar 2 circuitos (1.5 interruptores por circuito), garantizando máxima continuidad ante fallas o mantenimiento.',
    advantages: [
      'Cualquier interruptor puede salir a mantenimiento sin perturbar ningún circuito',
      'Una falla en cualquiera de las dos barras principales no interrumpe ninguna carga',
      'Máxima flexibilidad operacional y confiabilidad del sistema interconectado'
    ],
    disadvantages: [
      'Elevada inversión inicial en aparamenta (3 interruptores por cada 2 bahías)',
      'Mayor área de implantación física en patio de alta tensión',
      'Sistemas de control y protección diferencial de barras duplicados'
    ],
    reliabilityLevel: 'Máxima',
    relativeCost: 1.7,
    badgeColor: '#f87171'
  },

  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER]: {
    key: TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER,
    name: 'Doble Barra con Doble Interruptor',
    englishName: 'Double Bus Double Breaker',
    standard: 'IEEE C37.100 / IEC 61936-1',
    description: 'Configuración de redundancia física absoluta. Cuenta con dos barras principales independientes y dos interruptores completos dedicados a cada posición o circuito. Empleada en centrales generadoras nucleares o nodos críticos de extrema seguridad.',
    advantages: [
      'Aislamiento total e independiente de barras y de interruptores',
      'Maniobras operativas de transferencia instantáneas sin riesgo',
      'Disponibilidad del 99.99% en barras y circuitos de potencia'
    ],
    disadvantages: [
      'Máximo costo de capital (CAPEX) y espacio de patio',
      '2 interruptores por cada circuito conectado (el doble de aparamenta que barra simple)',
      'Mayor costo anual de mantenimiento preventivo (OPEX)'
    ],
    reliabilityLevel: 'Extrema',
    relativeCost: 1.95,
    badgeColor: '#e879f9'
  }
});

/**
 * 1. Topología de Barra Simple
 */
export function buildSingleBusPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Barra colectora principal 220 kV
  const bb1 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-1',
    name: 'Barra Principal 220 kV',
    x: 100,
    y: 160,
    width: 600,
    terminalCount: 4,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(bb1);

  // Bahía 1: Acometida Red Eléctrica 220 kV (x=220)
  const src1 = createComponent(ComponentType.SOURCE, {
    id: 'SRC-1',
    name: 'Red Interconectada 220 kV',
    x: 195,
    y: 20,
    properties: { voltageLevel: 220, ratedPower: 250 }
  });
  const cbSrc = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-SRC',
    name: 'Int. Acometida 220 kV',
    x: 195,
    y: 90,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(src1, cbSrc);

  connections.push(
    { id: 'CONN-SRC-1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-SRC-2', fromComponentId: 'CB-SRC', fromTerminalId: 'CB-SRC-t2', toComponentId: 'BB-1', toTerminalId: 'BB-1-t1' }
  );

  // Bahía 2: Alimentador Industrial 1 (Trafo 220/66 kV) (x=340)
  const dsOut1 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT1',
    name: 'Secc. Barra Trafo 1',
    x: 315,
    y: 200,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT1',
    name: 'Int. Potencia Trafo 1',
    x: 315,
    y: 270,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr1 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-1',
    name: 'Trafo 1 (220/66 kV)',
    x: 310,
    y: 350,
    properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 60 }
  });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-1',
    name: 'Carga Industrial 66 kV',
    x: 315,
    y: 460,
    properties: { voltageLevel: 66, ratedPower: 45 }
  });
  components.push(dsOut1, cbOut1, tr1, ld1);

  connections.push(
    { id: 'CONN-F1-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'DS-OUT1', toTerminalId: 'DS-OUT1-t1' },
    { id: 'CONN-F1-2', fromComponentId: 'DS-OUT1', fromTerminalId: 'DS-OUT1-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-F1-3', fromComponentId: 'CB-OUT1', fromTerminalId: 'CB-OUT1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-F1-4', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Bahía 3: Alimentador Urbano 2 (Trafo 220/23 kV) (x=460)
  const dsOut2 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT2',
    name: 'Secc. Barra Trafo 2',
    x: 435,
    y: 200,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut2 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT2',
    name: 'Int. Potencia Trafo 2',
    x: 435,
    y: 270,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr2 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-2',
    name: 'Trafo 2 (220/23 kV)',
    x: 430,
    y: 350,
    properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 40 }
  });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-2',
    name: 'Carga Urbana 23 kV',
    x: 435,
    y: 460,
    properties: { voltageLevel: 23, ratedPower: 30 }
  });
  components.push(dsOut2, cbOut2, tr2, ld2);

  connections.push(
    { id: 'CONN-F2-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t3', toComponentId: 'DS-OUT2', toTerminalId: 'DS-OUT2-t1' },
    { id: 'CONN-F2-2', fromComponentId: 'DS-OUT2', fromTerminalId: 'DS-OUT2-t2', toComponentId: 'CB-OUT2', toTerminalId: 'CB-OUT2-t1' },
    { id: 'CONN-F2-3', fromComponentId: 'CB-OUT2', fromTerminalId: 'CB-OUT2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-F2-4', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  // Bahía 4: Línea de Transmisión 220 kV (x=580)
  const dsOut3 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT3',
    name: 'Secc. Barra Línea 3',
    x: 555,
    y: 200,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut3 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT3',
    name: 'Int. Potencia Línea 3',
    x: 555,
    y: 270,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const ld3 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-3',
    name: 'Línea de Enlace 220 kV',
    x: 555,
    y: 360,
    properties: { voltageLevel: 220, ratedPower: 70 }
  });
  components.push(dsOut3, cbOut3, ld3);

  connections.push(
    { id: 'CONN-F3-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t4', toComponentId: 'DS-OUT3', toTerminalId: 'DS-OUT3-t1' },
    { id: 'CONN-F3-2', fromComponentId: 'DS-OUT3', fromTerminalId: 'DS-OUT3-t2', toComponentId: 'CB-OUT3', toTerminalId: 'CB-OUT3-t1' },
    { id: 'CONN-F3-3', fromComponentId: 'CB-OUT3', fromTerminalId: 'CB-OUT3-t2', toComponentId: 'LD-3', toTerminalId: 'LD-3-t1' }
  );

  return { components, connections };
}

/**
 * 2. Topología de Barra Principal con Barra de Transferencia
 */
export function buildMainTransferPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Barra Principal 220 kV
  const bbMain = createComponent(ComponentType.BUSBAR, {
    id: 'BB-MAIN',
    name: 'Barra Principal 220 kV',
    x: 100,
    y: 150,
    width: 620,
    terminalCount: 4,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });

  // Barra de Transferencia 220 kV
  const bbTransf = createComponent(ComponentType.BUSBAR, {
    id: 'BB-TRANSF',
    name: 'Barra de Transferencia 220 kV',
    x: 100,
    y: 310,
    width: 620,
    terminalCount: 4,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(bbMain, bbTransf);

  // Bahía 1: Campo de Acoplamiento y Transferencia (Bus Tie) (x=224)
  const dsTieM = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-TIE-M',
    name: 'Secc. Acople a Principal',
    x: 199,
    y: 180,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  const cbTie = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-TIE',
    name: 'Int. Acoplamiento (Bus Tie)',
    x: 199,
    y: 245,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(dsTieM, cbTie);

  connections.push(
    { id: 'CONN-TIE-1', fromComponentId: 'BB-MAIN', fromTerminalId: 'BB-MAIN-t1', toComponentId: 'DS-TIE-M', toTerminalId: 'DS-TIE-M-t1' },
    { id: 'CONN-TIE-2', fromComponentId: 'DS-TIE-M', fromTerminalId: 'DS-TIE-M-t2', toComponentId: 'CB-TIE', toTerminalId: 'CB-TIE-t1' },
    { id: 'CONN-TIE-3', fromComponentId: 'CB-TIE', fromTerminalId: 'CB-TIE-t2', toComponentId: 'BB-TRANSF', toTerminalId: 'BB-TRANSF-t1' }
  );

  // Bahía 2: Acometida Red Eléctrica 220 kV (x=348)
  const src1 = createComponent(ComponentType.SOURCE, {
    id: 'SRC-1',
    name: 'Red 220 kV (Acometida)',
    x: 323,
    y: 20,
    properties: { voltageLevel: 220, ratedPower: 200 }
  });
  const cbIn = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-IN',
    name: 'Int. Acometida 220 kV',
    x: 323,
    y: 85,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(src1, cbIn);

  connections.push(
    { id: 'CONN-SRC-1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-IN', toTerminalId: 'CB-IN-t1' },
    { id: 'CONN-SRC-2', fromComponentId: 'CB-IN', fromTerminalId: 'CB-IN-t2', toComponentId: 'BB-MAIN', toTerminalId: 'BB-MAIN-t2' }
  );

  // Bahía 3: Alimentador 1 con seccionador de bypass a transferencia (x=472)
  const dsOut1 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT1',
    name: 'Secc. Barra Principal Salida 1',
    x: 447,
    y: 180,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT1',
    name: 'Int. Línea 1',
    x: 447,
    y: 245,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const dsBypass1 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-BYPASS1',
    name: 'Secc. Bypass Transferencia 1',
    x: 510,
    y: 350,
    operationalState: OperationalState.OPEN, // Abierto normalmente; se cierra para mantenimiento de CB-OUT1
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr1 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-1',
    name: 'Trafo 1 (220/66 kV)',
    x: 442,
    y: 350,
    properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 60 }
  });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-1',
    name: 'Carga Industrial 1',
    x: 447,
    y: 460,
    properties: { voltageLevel: 66, ratedPower: 45 }
  });
  components.push(dsOut1, cbOut1, dsBypass1, tr1, ld1);

  connections.push(
    { id: 'CONN-B1-1', fromComponentId: 'BB-MAIN', fromTerminalId: 'BB-MAIN-t3', toComponentId: 'DS-OUT1', toTerminalId: 'DS-OUT1-t1' },
    { id: 'CONN-B1-2', fromComponentId: 'DS-OUT1', fromTerminalId: 'DS-OUT1-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-B1-3', fromComponentId: 'CB-OUT1', fromTerminalId: 'CB-OUT1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-B1-4', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-BYPASS-1A', fromComponentId: 'BB-TRANSF', fromTerminalId: 'BB-TRANSF-t3', toComponentId: 'DS-BYPASS1', toTerminalId: 'DS-BYPASS1-t1' },
    { id: 'CONN-BYPASS-1B', fromComponentId: 'DS-BYPASS1', fromTerminalId: 'DS-BYPASS1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' }
  );

  // Bahía 4: Alimentador 2 con seccionador de bypass a transferencia (x=596)
  const dsOut2 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT2',
    name: 'Secc. Barra Principal Salida 2',
    x: 571,
    y: 180,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut2 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT2',
    name: 'Int. Línea 2',
    x: 571,
    y: 245,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const dsBypass2 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-BYPASS2',
    name: 'Secc. Bypass Transferencia 2',
    x: 635,
    y: 350,
    operationalState: OperationalState.OPEN,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr2 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-2',
    name: 'Trafo 2 (220/23 kV)',
    x: 566,
    y: 350,
    properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 45 }
  });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-2',
    name: 'Carga Urbana 2',
    x: 571,
    y: 460,
    properties: { voltageLevel: 23, ratedPower: 35 }
  });
  components.push(dsOut2, cbOut2, dsBypass2, tr2, ld2);

  connections.push(
    { id: 'CONN-B2-1', fromComponentId: 'BB-MAIN', fromTerminalId: 'BB-MAIN-t4', toComponentId: 'DS-OUT2', toTerminalId: 'DS-OUT2-t1' },
    { id: 'CONN-B2-2', fromComponentId: 'DS-OUT2', fromTerminalId: 'DS-OUT2-t2', toComponentId: 'CB-OUT2', toTerminalId: 'CB-OUT2-t1' },
    { id: 'CONN-B2-3', fromComponentId: 'CB-OUT2', fromTerminalId: 'CB-OUT2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-B2-4', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' },
    { id: 'CONN-BYPASS-2A', fromComponentId: 'BB-TRANSF', fromTerminalId: 'BB-TRANSF-t4', toComponentId: 'DS-BYPASS2', toTerminalId: 'DS-BYPASS2-t1' },
    { id: 'CONN-BYPASS-2B', fromComponentId: 'DS-BYPASS2', fromTerminalId: 'DS-BYPASS2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' }
  );

  return { components, connections };
}

/**
 * 3. Topología de Barra Seccionada / Partida
 */
export function buildSectionalizedBusPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Barra Sección 1 (220 kV)
  const bbSec1 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-SEC-1',
    name: 'Barra Sección 1 (220 kV)',
    x: 80,
    y: 160,
    width: 280,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });

  // Barra Sección 2 (220 kV)
  const bbSec2 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-SEC-2',
    name: 'Barra Sección 2 (220 kV)',
    x: 500,
    y: 160,
    width: 280,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  components.push(bbSec1, bbSec2);

  // Campo de Enlace / Seccionamiento de Barra (Bus Section) (x entre 290 y 570)
  const dsSecA = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-SEC-A',
    name: 'Secc. Partición Sec. 1',
    x: 370,
    y: 90,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  const cbSec = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-SEC',
    name: 'Int. Partición de Barra',
    x: 430,
    y: 140,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  const dsSecB = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-SEC-B',
    name: 'Secc. Partición Sec. 2',
    x: 370,
    y: 195,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  components.push(dsSecA, cbSec, dsSecB);

  connections.push(
    { id: 'CONN-SEC-1', fromComponentId: 'BB-SEC-1', fromTerminalId: 'BB-SEC-1-t3', toComponentId: 'DS-SEC-A', toTerminalId: 'DS-SEC-A-t1' },
    { id: 'CONN-SEC-2', fromComponentId: 'DS-SEC-A', fromTerminalId: 'DS-SEC-A-t2', toComponentId: 'CB-SEC', toTerminalId: 'CB-SEC-t1' },
    { id: 'CONN-SEC-3', fromComponentId: 'CB-SEC', fromTerminalId: 'CB-SEC-t2', toComponentId: 'DS-SEC-B', toTerminalId: 'DS-SEC-B-t1' },
    { id: 'CONN-SEC-4', fromComponentId: 'DS-SEC-B', fromTerminalId: 'DS-SEC-B-t2', toComponentId: 'BB-SEC-2', toTerminalId: 'BB-SEC-2-t1' }
  );

  // Sección 1 - Bahía Fuente 1 (x=150)
  const src1 = createComponent(ComponentType.SOURCE, {
    id: 'SRC-1',
    name: 'Generación / Red 1 (220 kV)',
    x: 125,
    y: 30,
    properties: { voltageLevel: 220, ratedPower: 150 }
  });
  const cbSrc1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-SRC1',
    name: 'Int. Entrada 1',
    x: 125,
    y: 95,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  components.push(src1, cbSrc1);

  connections.push(
    { id: 'CONN-S1-IN-1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC1', toTerminalId: 'CB-SRC1-t1' },
    { id: 'CONN-S1-IN-2', fromComponentId: 'CB-SRC1', fromTerminalId: 'CB-SRC1-t2', toComponentId: 'BB-SEC-1', toTerminalId: 'BB-SEC-1-t1' }
  );

  // Sección 1 - Bahía Salida 1 (x=220)
  const dsOut1 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT1',
    name: 'Secc. Salida 1',
    x: 195,
    y: 200,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT1',
    name: 'Int. Salida 1',
    x: 195,
    y: 265,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr1 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-1',
    name: 'Trafo 1 (220/66 kV)',
    x: 190,
    y: 340,
    properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 50 }
  });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-1',
    name: 'Alimentador Sec. 1',
    x: 195,
    y: 445,
    properties: { voltageLevel: 66, ratedPower: 35 }
  });
  components.push(dsOut1, cbOut1, tr1, ld1);

  connections.push(
    { id: 'CONN-S1-OUT-1', fromComponentId: 'BB-SEC-1', fromTerminalId: 'BB-SEC-1-t2', toComponentId: 'DS-OUT1', toTerminalId: 'DS-OUT1-t1' },
    { id: 'CONN-S1-OUT-2', fromComponentId: 'DS-OUT1', fromTerminalId: 'DS-OUT1-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-S1-OUT-3', fromComponentId: 'CB-OUT1', fromTerminalId: 'CB-OUT1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-S1-OUT-4', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Sección 2 - Bahía Salida 2 (x=640)
  const dsOut2 = createComponent(ComponentType.DISCONNECTOR, {
    id: 'DS-OUT2',
    name: 'Secc. Salida 2',
    x: 615,
    y: 200,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const cbOut2 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-OUT2',
    name: 'Int. Salida 2',
    x: 615,
    y: 265,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1250 }
  });
  const tr2 = createComponent(ComponentType.TRANSFORMER, {
    id: 'TR-2',
    name: 'Trafo 2 (220/23 kV)',
    x: 610,
    y: 340,
    properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 50 }
  });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, {
    id: 'LD-2',
    name: 'Alimentador Sec. 2',
    x: 615,
    y: 445,
    properties: { voltageLevel: 23, ratedPower: 40 }
  });
  components.push(dsOut2, cbOut2, tr2, ld2);

  connections.push(
    { id: 'CONN-S2-OUT-1', fromComponentId: 'BB-SEC-2', fromTerminalId: 'BB-SEC-2-t2', toComponentId: 'DS-OUT2', toTerminalId: 'DS-OUT2-t1' },
    { id: 'CONN-S2-OUT-2', fromComponentId: 'DS-OUT2', fromTerminalId: 'DS-OUT2-t2', toComponentId: 'CB-OUT2', toTerminalId: 'CB-OUT2-t1' },
    { id: 'CONN-S2-OUT-3', fromComponentId: 'CB-OUT2', fromTerminalId: 'CB-OUT2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-S2-OUT-4', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  // Sección 2 - Fuente / Respaldo 2 (x=710)
  const src2 = createComponent(ComponentType.SOURCE, {
    id: 'SRC-2',
    name: 'Generación / Red 2 (Respaldo)',
    x: 685,
    y: 30,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedPower: 100 }
  });
  const cbSrc2 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-SRC2',
    name: 'Int. Entrada 2',
    x: 685,
    y: 95,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 1600 }
  });
  components.push(src2, cbSrc2);

  connections.push(
    { id: 'CONN-S2-IN-1', fromComponentId: 'SRC-2', fromTerminalId: 'SRC-2-t1', toComponentId: 'CB-SRC2', toTerminalId: 'CB-SRC2-t1' },
    { id: 'CONN-S2-IN-2', fromComponentId: 'CB-SRC2', fromTerminalId: 'CB-SRC2-t2', toComponentId: 'BB-SEC-2', toTerminalId: 'BB-SEC-2-t3' }
  );

  return { components, connections };
}

/**
 * 4. Topología de Barra en Anillo
 */
export function buildRingBusPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // 4 Interruptores de potencia formando los cuatro lados del anillo
  const cb1 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-RING-1',
    name: 'Int. Anillo 1 (Norte-Oeste)',
    x: 230,
    y: 140,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  const cb2 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-RING-2',
    name: 'Int. Anillo 2 (Norte-Este)',
    x: 470,
    y: 140,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  const cb3 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-RING-3',
    name: 'Int. Anillo 3 (Sur-Este)',
    x: 470,
    y: 360,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  const cb4 = createComponent(ComponentType.CIRCUIT_BREAKER, {
    id: 'CB-RING-4',
    name: 'Int. Anillo 4 (Sur-Oeste)',
    x: 230,
    y: 360,
    operationalState: OperationalState.CLOSED,
    properties: { voltageLevel: 220, ratedCurrent: 2000 }
  });
  components.push(cb1, cb2, cb3, cb4);

  // Seccionadores de aislamiento por polo de cada interruptor
  const ds1A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1A', name: 'Secc. CB1-A', x: 295, y: 140, operationalState: OperationalState.CLOSED });
  const ds2A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2A', name: 'Secc. CB2-A', x: 405, y: 140, operationalState: OperationalState.CLOSED });
  const ds2B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2B', name: 'Secc. CB2-B', x: 470, y: 215, operationalState: OperationalState.CLOSED });
  const ds3A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3A', name: 'Secc. CB3-A', x: 470, y: 285, operationalState: OperationalState.CLOSED });
  const ds3B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3B', name: 'Secc. CB3-B', x: 405, y: 360, operationalState: OperationalState.CLOSED });
  const ds4A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-4A', name: 'Secc. CB4-A', x: 295, y: 360, operationalState: OperationalState.CLOSED });
  const ds4B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-4B', name: 'Secc. CB4-B', x: 230, y: 285, operationalState: OperationalState.CLOSED });
  const ds1B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1B', name: 'Secc. CB1-B', x: 230, y: 215, operationalState: OperationalState.CLOSED });
  components.push(ds1A, ds2A, ds2B, ds3A, ds3B, ds4A, ds4B, ds1B);

  // Conexiones del lazo cerrado
  connections.push(
    // Lado Norte
    { id: 'CONN-R-N1', fromComponentId: 'CB-RING-1', fromTerminalId: 'CB-RING-1-t2', toComponentId: 'DS-1A', toTerminalId: 'DS-1A-t1' },
    { id: 'CONN-R-N2', fromComponentId: 'DS-1A', fromTerminalId: 'DS-1A-t2', toComponentId: 'DS-2A', toTerminalId: 'DS-2A-t1' },
    { id: 'CONN-R-N3', fromComponentId: 'DS-2A', fromTerminalId: 'DS-2A-t2', toComponentId: 'CB-RING-2', toTerminalId: 'CB-RING-2-t1' },
    // Lado Este
    { id: 'CONN-R-E1', fromComponentId: 'CB-RING-2', fromTerminalId: 'CB-RING-2-t2', toComponentId: 'DS-2B', toTerminalId: 'DS-2B-t1' },
    { id: 'CONN-R-E2', fromComponentId: 'DS-2B', fromTerminalId: 'DS-2B-t2', toComponentId: 'DS-3A', toTerminalId: 'DS-3A-t1' },
    { id: 'CONN-R-E3', fromComponentId: 'DS-3A', fromTerminalId: 'DS-3A-t2', toComponentId: 'CB-RING-3', toTerminalId: 'CB-RING-3-t1' },
    // Lado Sur
    { id: 'CONN-R-S1', fromComponentId: 'CB-RING-3', fromTerminalId: 'CB-RING-3-t2', toComponentId: 'DS-3B', toTerminalId: 'DS-3B-t1' },
    { id: 'CONN-R-S2', fromComponentId: 'DS-3B', fromTerminalId: 'DS-3B-t2', toComponentId: 'DS-4A', toTerminalId: 'DS-4A-t1' },
    { id: 'CONN-R-S3', fromComponentId: 'DS-4A', fromTerminalId: 'DS-4A-t2', toComponentId: 'CB-RING-4', toTerminalId: 'CB-RING-4-t1' },
    // Lado Oeste
    { id: 'CONN-R-W1', fromComponentId: 'CB-RING-4', fromTerminalId: 'CB-RING-4-t2', toComponentId: 'DS-4B', toTerminalId: 'DS-4B-t1' },
    { id: 'CONN-R-W2', fromComponentId: 'DS-4B', fromTerminalId: 'DS-4B-t2', toComponentId: 'DS-1B', toTerminalId: 'DS-1B-t1' },
    { id: 'CONN-R-W3', fromComponentId: 'DS-1B', fromTerminalId: 'DS-1B-t2', toComponentId: 'CB-RING-1', toTerminalId: 'CB-RING-1-t1' }
  );

  // 4 Posiciones conectadas a los 4 vértices del anillo:
  // Vértice Norte: Acometida SRC-1
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Red 220 kV (Infeed)', x: 350, y: 20, properties: { voltageLevel: 220 } });
  components.push(src1);
  connections.push({ id: 'CONN-NODE-N', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'DS-2A', toTerminalId: 'DS-2A-t1' });

  // Vértice Este: Salida Trafo 1 -> LD-1
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 580, y: 235, properties: { voltageLevel: 220, secondaryVoltage: 66 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Este 66 kV', x: 690, y: 245, properties: { voltageLevel: 66 } });
  components.push(tr1, ld1);
  connections.push(
    { id: 'CONN-NODE-E1', fromComponentId: 'DS-3A', fromTerminalId: 'DS-3A-t1', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-NODE-E2', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Vértice Sur: Salida Trafo 2 -> LD-2
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (220/23 kV)', x: 345, y: 440, properties: { voltageLevel: 220, secondaryVoltage: 23 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Sur 23 kV', x: 350, y: 540, properties: { voltageLevel: 23 } });
  components.push(tr2, ld2);
  connections.push(
    { id: 'CONN-NODE-S1', fromComponentId: 'DS-4A', fromTerminalId: 'DS-4A-t1', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-NODE-S2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  // Vértice Oeste: Salida Alimentador 3 directo 220 kV
  const ld3 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-3', name: 'Línea Oeste 220 kV', x: 100, y: 245, properties: { voltageLevel: 220 } });
  components.push(ld3);
  connections.push({ id: 'CONN-NODE-W', fromComponentId: 'DS-1B', fromTerminalId: 'DS-1B-t1', toComponentId: 'LD-3', toTerminalId: 'LD-3-t1' });

  return { components, connections };
}

/**
 * 5. Topología de Interruptor y Medio (Breaker-and-a-Half)
 */
export function buildBreakerAndAHalfPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Dos barras principales (220 kV)
  const bb1 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-1',
    name: 'Barra Colectora 1 (220 kV)',
    x: 80,
    y: 80,
    width: 600,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 3000 }
  });
  const bb2 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-2',
    name: 'Barra Colectora 2 (220 kV)',
    x: 80,
    y: 500,
    width: 600,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 3000 }
  });
  components.push(bb1, bb2);

  // Calle 1 (x=230): 3 Interruptores para alimentar Acometida SRC-1 y Carga LD-1
  const ds1A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1A', name: 'Secc. BB1-Calle1', x: 205, y: 120, operationalState: OperationalState.CLOSED });
  const cb1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-1', name: 'Int. Superior Calle 1', x: 205, y: 180, operationalState: OperationalState.CLOSED });
  const ds1B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1B', name: 'Secc. Int1-Calle1', x: 205, y: 240, operationalState: OperationalState.CLOSED });

  const dsMidA = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-MID-A', name: 'Secc. MidA-Calle1', x: 205, y: 300, operationalState: OperationalState.CLOSED });
  const cbMid = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-MID', name: 'Int. Central (Tie Breaker)', x: 205, y: 355, operationalState: OperationalState.CLOSED });
  const dsMidB = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-MID-B', name: 'Secc. MidB-Calle1', x: 205, y: 410, operationalState: OperationalState.CLOSED });

  const ds2A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2A', name: 'Secc. Int2-Calle1', x: 205, y: 445, operationalState: OperationalState.CLOSED });
  const cb2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-2', name: 'Int. Inferior Calle 1', x: 205, y: 465, operationalState: OperationalState.CLOSED });
  const ds2B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2B', name: 'Secc. BB2-Calle1', x: 205, y: 485, operationalState: OperationalState.CLOSED });
  components.push(ds1A, cb1, ds1B, dsMidA, cbMid, dsMidB, ds2A, cb2, ds2B);

  // Circuitos de la Calle 1:
  // Circuito 1 (Tap entre CB1 y CBMID): Acometida SRC-1
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Red 220 kV (Línea 1)', x: 95, y: 240, properties: { voltageLevel: 220 } });
  // Circuito 2 (Tap entre CBMID y CB2): Trafo 1 -> LD-1
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 90, y: 355, properties: { voltageLevel: 220, secondaryVoltage: 66 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Trafo 1', x: 95, y: 460, properties: { voltageLevel: 66 } });
  components.push(src1, tr1, ld1);

  connections.push(
    // Conexión vertical Calle 1
    { id: 'CONN-C1-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t1', toComponentId: 'DS-1A', toTerminalId: 'DS-1A-t1' },
    { id: 'CONN-C1-2', fromComponentId: 'DS-1A', fromTerminalId: 'DS-1A-t2', toComponentId: 'CB-1', toTerminalId: 'CB-1-t1' },
    { id: 'CONN-C1-3', fromComponentId: 'CB-1', fromTerminalId: 'CB-1-t2', toComponentId: 'DS-1B', toTerminalId: 'DS-1B-t1' },
    // Tap Circuito 1
    { id: 'CONN-C1-TAP1', fromComponentId: 'DS-1B', fromTerminalId: 'DS-1B-t2', toComponentId: 'SRC-1', toTerminalId: 'SRC-1-t1' },
    { id: 'CONN-C1-4', fromComponentId: 'DS-1B', fromTerminalId: 'DS-1B-t2', toComponentId: 'DS-MID-A', toTerminalId: 'DS-MID-A-t1' },
    { id: 'CONN-C1-5', fromComponentId: 'DS-MID-A', fromTerminalId: 'DS-MID-A-t2', toComponentId: 'CB-MID', toTerminalId: 'CB-MID-t1' },
    { id: 'CONN-C1-6', fromComponentId: 'CB-MID', fromTerminalId: 'CB-MID-t2', toComponentId: 'DS-MID-B', toTerminalId: 'DS-MID-B-t1' },
    // Tap Circuito 2
    { id: 'CONN-C1-TAP2', fromComponentId: 'DS-MID-B', fromTerminalId: 'DS-MID-B-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-C1-TR1', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-C1-7', fromComponentId: 'DS-MID-B', fromTerminalId: 'DS-MID-B-t2', toComponentId: 'DS-2A', toTerminalId: 'DS-2A-t1' },
    { id: 'CONN-C1-8', fromComponentId: 'DS-2A', fromTerminalId: 'DS-2A-t2', toComponentId: 'CB-2', toTerminalId: 'CB-2-t1' },
    { id: 'CONN-C1-9', fromComponentId: 'CB-2', fromTerminalId: 'CB-2-t2', toComponentId: 'DS-2B', toTerminalId: 'DS-2B-t1' },
    { id: 'CONN-C1-10', fromComponentId: 'DS-2B', fromTerminalId: 'DS-2B-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t1' }
  );

  // Calle 2 (x=480): 3 Interruptores adicionales para alimentar Cargas LD-2 y LD-3
  const ds3A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3A', name: 'Secc. BB1-Calle2', x: 455, y: 120, operationalState: OperationalState.CLOSED });
  const cb3 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-3', name: 'Int. Superior Calle 2', x: 455, y: 180, operationalState: OperationalState.CLOSED });
  const ds3B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3B', name: 'Secc. Int3-Calle2', x: 455, y: 240, operationalState: OperationalState.CLOSED });

  const dsMid2A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-MID2-A', name: 'Secc. MidA-Calle2', x: 455, y: 300, operationalState: OperationalState.CLOSED });
  const cbMid2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-MID2', name: 'Int. Central Calle 2', x: 455, y: 355, operationalState: OperationalState.CLOSED });
  const dsMid2B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-MID2-B', name: 'Secc. MidB-Calle2', x: 455, y: 410, operationalState: OperationalState.CLOSED });

  const ds4A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-4A', name: 'Secc. Int4-Calle2', x: 455, y: 445, operationalState: OperationalState.CLOSED });
  const cb4 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-4', name: 'Int. Inferior Calle 2', x: 455, y: 465, operationalState: OperationalState.CLOSED });
  const ds4B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-4B', name: 'Secc. BB2-Calle2', x: 455, y: 485, operationalState: OperationalState.CLOSED });
  components.push(ds3A, cb3, ds3B, dsMid2A, cbMid2, dsMid2B, ds4A, cb4, ds4B);

  // Circuitos de la Calle 2:
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Alimentador 2 (220 kV)', x: 570, y: 240, properties: { voltageLevel: 220 } });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (220/23 kV)', x: 565, y: 355, properties: { voltageLevel: 220, secondaryVoltage: 23 } });
  const ld3 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-3', name: 'Carga Trafo 2', x: 570, y: 460, properties: { voltageLevel: 23 } });
  components.push(ld2, tr2, ld3);

  connections.push(
    // Conexión vertical Calle 2
    { id: 'CONN-C2-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'DS-3A', toTerminalId: 'DS-3A-t1' },
    { id: 'CONN-C2-2', fromComponentId: 'DS-3A', fromTerminalId: 'DS-3A-t2', toComponentId: 'CB-3', toTerminalId: 'CB-3-t1' },
    { id: 'CONN-C2-3', fromComponentId: 'CB-3', fromTerminalId: 'CB-3-t2', toComponentId: 'DS-3B', toTerminalId: 'DS-3B-t1' },
    // Tap Circuito 3
    { id: 'CONN-C2-TAP3', fromComponentId: 'DS-3B', fromTerminalId: 'DS-3B-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' },
    { id: 'CONN-C2-4', fromComponentId: 'DS-3B', fromTerminalId: 'DS-3B-t2', toComponentId: 'DS-MID2-A', toTerminalId: 'DS-MID2-A-t1' },
    { id: 'CONN-C2-5', fromComponentId: 'DS-MID2-A', fromTerminalId: 'DS-MID2-A-t2', toComponentId: 'CB-MID2', toTerminalId: 'CB-MID2-t1' },
    { id: 'CONN-C2-6', fromComponentId: 'CB-MID2', fromTerminalId: 'CB-MID2-t2', toComponentId: 'DS-MID2-B', toTerminalId: 'DS-MID2-B-t1' },
    // Tap Circuito 4
    { id: 'CONN-C2-TAP4', fromComponentId: 'DS-MID2-B', fromTerminalId: 'DS-MID2-B-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-C2-TR2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-3', toTerminalId: 'LD-3-t1' },
    { id: 'CONN-C2-7', fromComponentId: 'DS-MID2-B', fromTerminalId: 'DS-MID2-B-t2', toComponentId: 'DS-4A', toTerminalId: 'DS-4A-t1' },
    { id: 'CONN-C2-8', fromComponentId: 'DS-4A', fromTerminalId: 'DS-4A-t2', toComponentId: 'CB-4', toTerminalId: 'CB-4-t1' },
    { id: 'CONN-C2-9', fromComponentId: 'CB-4', fromTerminalId: 'CB-4-t2', toComponentId: 'DS-4B', toTerminalId: 'DS-4B-t1' },
    { id: 'CONN-C2-10', fromComponentId: 'DS-4B', fromTerminalId: 'DS-4B-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t2' }
  );

  return { components, connections };
}

/**
 * 6. Topología de Doble Barra con Doble Interruptor
 */
export function buildDoubleBusDoubleBreakerPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Barra Colectora 1 (220 kV)
  const bb1 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-1',
    name: 'Barra Colectora 1 (220 kV)',
    x: 80,
    y: 80,
    width: 660,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 3150 }
  });

  // Barra Colectora 2 (220 kV)
  const bb2 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-2',
    name: 'Barra Colectora 2 (220 kV)',
    x: 80,
    y: 200,
    width: 660,
    terminalCount: 3,
    properties: { voltageLevel: 220, ratedCurrent: 3150 }
  });
  components.push(bb1, bb2);

  // Posición 1 (Acometida SRC-1): Doble Interruptor (CB-1A a Barra 1, CB-1B a Barra 2)
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Red 220 kV (Infeed)', x: 195, y: 15, properties: { voltageLevel: 220 } });
  const cb1A = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-1A', name: 'Int. Acometida - Barra 1', x: 160, y: 125, operationalState: OperationalState.CLOSED });
  const cb1B = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-1B', name: 'Int. Acometida - Barra 2', x: 230, y: 125, operationalState: OperationalState.CLOSED });
  const ds1A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1A', name: 'Secc. Acometida B1', x: 160, y: 70, operationalState: OperationalState.CLOSED });
  const ds1B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-1B', name: 'Secc. Acometida B2', x: 230, y: 175, operationalState: OperationalState.CLOSED });
  components.push(src1, cb1A, cb1B, ds1A, ds1B);

  connections.push(
    // Desde Fuente hacia los dos interruptores
    { id: 'CONN-P1-SRC1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'DS-1A', toTerminalId: 'DS-1A-t1' },
    { id: 'CONN-P1-SRC2', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-1B', toTerminalId: 'CB-1B-t1' },
    // Rama Barra 1
    { id: 'CONN-P1-1', fromComponentId: 'DS-1A', fromTerminalId: 'DS-1A-t2', toComponentId: 'CB-1A', toTerminalId: 'CB-1A-t1' },
    { id: 'CONN-P1-2', fromComponentId: 'CB-1A', fromTerminalId: 'CB-1A-t2', toComponentId: 'BB-1', toTerminalId: 'BB-1-t1' },
    // Rama Barra 2
    { id: 'CONN-P1-3', fromComponentId: 'CB-1B', fromTerminalId: 'CB-1B-t2', toComponentId: 'DS-1B', toTerminalId: 'DS-1B-t1' },
    { id: 'CONN-P1-4', fromComponentId: 'DS-1B', fromTerminalId: 'DS-1B-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t1' }
  );

  // Posición 2 (Salida Trafo 1 -> Carga 1): Doble Interruptor (CB-2A y CB-2B)
  const cb2A = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-2A', name: 'Int. Trafo 1 - Barra 1', x: 370, y: 125, operationalState: OperationalState.CLOSED });
  const cb2B = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-2B', name: 'Int. Trafo 1 - Barra 2', x: 440, y: 245, operationalState: OperationalState.CLOSED });
  const ds2A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2A', name: 'Secc. Trafo 1 B1', x: 370, y: 70, operationalState: OperationalState.CLOSED });
  const ds2B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-2B', name: 'Secc. Trafo 1 B2', x: 440, y: 175, operationalState: OperationalState.CLOSED });
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 400, y: 340, properties: { voltageLevel: 220, secondaryVoltage: 66 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Red 66 kV', x: 405, y: 450, properties: { voltageLevel: 66 } });
  components.push(cb2A, cb2B, ds2A, ds2B, tr1, ld1);

  connections.push(
    // Conexión a Barra 1
    { id: 'CONN-P2-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'DS-2A', toTerminalId: 'DS-2A-t1' },
    { id: 'CONN-P2-B1-CB', fromComponentId: 'DS-2A', fromTerminalId: 'DS-2A-t2', toComponentId: 'CB-2A', toTerminalId: 'CB-2A-t1' },
    // Conexión a Barra 2
    { id: 'CONN-P2-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t2', toComponentId: 'DS-2B', toTerminalId: 'DS-2B-t1' },
    { id: 'CONN-P2-B2-CB', fromComponentId: 'DS-2B', fromTerminalId: 'DS-2B-t2', toComponentId: 'CB-2B', toTerminalId: 'CB-2B-t1' },
    // Unión hacia Trafo 1
    { id: 'CONN-P2-JOIN1', fromComponentId: 'CB-2A', fromTerminalId: 'CB-2A-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-P2-JOIN2', fromComponentId: 'CB-2B', fromTerminalId: 'CB-2B-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-P2-LOAD', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Posición 3 (Salida Trafo 2 -> Carga 2): Doble Interruptor (CB-3A y CB-3B)
  const cb3A = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-3A', name: 'Int. Trafo 2 - Barra 1', x: 570, y: 125, operationalState: OperationalState.CLOSED });
  const cb3B = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-3B', name: 'Int. Trafo 2 - Barra 2', x: 640, y: 245, operationalState: OperationalState.CLOSED });
  const ds3A = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3A', name: 'Secc. Trafo 2 B1', x: 570, y: 70, operationalState: OperationalState.CLOSED });
  const ds3B = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-3B', name: 'Secc. Trafo 2 B2', x: 640, y: 175, operationalState: OperationalState.CLOSED });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (220/23 kV)', x: 600, y: 340, properties: { voltageLevel: 220, secondaryVoltage: 23 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Red 23 kV', x: 605, y: 450, properties: { voltageLevel: 23 } });
  components.push(cb3A, cb3B, ds3A, ds3B, tr2, ld2);

  connections.push(
    // Conexión a Barra 1
    { id: 'CONN-P3-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t3', toComponentId: 'DS-3A', toTerminalId: 'DS-3A-t1' },
    { id: 'CONN-P3-B1-CB', fromComponentId: 'DS-3A', fromTerminalId: 'DS-3A-t2', toComponentId: 'CB-3A', toTerminalId: 'CB-3A-t1' },
    // Conexión a Barra 2
    { id: 'CONN-P3-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t3', toComponentId: 'DS-3B', toTerminalId: 'DS-3B-t1' },
    { id: 'CONN-P3-B2-CB', fromComponentId: 'DS-3B', fromTerminalId: 'DS-3B-t2', toComponentId: 'CB-3B', toTerminalId: 'CB-3B-t1' },
    // Unión hacia Trafo 2
    { id: 'CONN-P3-JOIN1', fromComponentId: 'CB-3A', fromTerminalId: 'CB-3A-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-P3-JOIN2', fromComponentId: 'CB-3B', fromTerminalId: 'CB-3B-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-P3-LOAD', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * Mapa de constructores por clave de topología.
 */
const PRESET_BUILDERS = {
  [TOPOLOGY_PRESET_KEYS.SINGLE_BUS]: buildSingleBusPreset,
  [TOPOLOGY_PRESET_KEYS.MAIN_TRANSFER]: buildMainTransferPreset,
  [TOPOLOGY_PRESET_KEYS.SECTIONALIZED_BUS]: buildSectionalizedBusPreset,
  [TOPOLOGY_PRESET_KEYS.RING_BUS]: buildRingBusPreset,
  [TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF]: buildBreakerAndAHalfPreset,
  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER]: buildDoubleBusDoubleBreakerPreset
};

/**
 * Carga una topología predefinida en el NetworkModel activo.
 * @param {import('./network-model.js').NetworkModel} networkModel
 * @param {string} presetKey
 * @returns {{ metadata: Object, componentsCount: number, connectionsCount: number }}
 */
export function loadTopologyPreset(networkModel, presetKey) {
  const builder = PRESET_BUILDERS[presetKey];
  if (!builder) {
    throw new Error(`[TopologyPresets] Topología predefinida '${presetKey}' no reconocida.`);
  }

  const metadata = TOPOLOGY_PRESETS_METADATA[presetKey];
  networkModel.clear();

  const { components, connections } = builder();

  // Agregar componentes
  for (const comp of components) {
    networkModel.addComponent(comp);
  }

  // Agregar conexiones galvánicas
  for (const conn of connections) {
    networkModel.addConnection(conn);
  }

  networkModel.recalculateTopology();

  networkModel.eventBus?.emit('preset:loaded', {
    presetKey,
    metadata,
    componentsCount: components.length,
    connectionsCount: connections.length
  });

  return {
    metadata,
    componentsCount: components.length,
    connectionsCount: connections.length
  };
}
