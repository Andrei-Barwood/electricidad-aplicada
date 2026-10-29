/**
 * TopologyPresets - SubstationTopologySim
 * Definición, modelado y cargador de 18 topologías estándar de subestaciones eléctricas.
 * Abarca esquemas de Transmisión (AT/EAT), Distribución (MT), Generación Renovable e Industria Crítica.
 * Normas: IEEE Std C37.100 / IEC 61936-1 / CIGRE WG B3.
 */

import { 
  ComponentType, 
  OperationalState, 
  createComponent, 
  resetComponentCounters 
} from './components.js';

export const TOPOLOGY_CATEGORIES = Object.freeze({
  TRANSMISSION: { id: 'TRANSMISSION', label: 'Transmisión AT / EAT', icon: '⚡' },
  DISTRIBUTION: { id: 'DISTRIBUTION', label: 'Distribución MT', icon: '🏙️' },
  GENERATION_INDUSTRY: { id: 'GENERATION_INDUSTRY', label: 'Renovables & Industria', icon: '🏭' }
});

export const TOPOLOGY_PRESET_KEYS = Object.freeze({
  // --- Grupo A: Transmisión AT / EAT (9 Esquemas) ---
  SINGLE_BUS: 'SINGLE_BUS',
  MAIN_TRANSFER: 'MAIN_TRANSFER',
  SECTIONALIZED_BUS: 'SECTIONALIZED_BUS',
  DOUBLE_BUS_SINGLE_BREAKER: 'DOUBLE_BUS_SINGLE_BREAKER',
  DOUBLE_BUS_TRANSFER: 'DOUBLE_BUS_TRANSFER',
  RING_BUS: 'RING_BUS',
  RING_BUS_6CB: 'RING_BUS_6CB',
  BREAKER_AND_A_HALF: 'BREAKER_AND_A_HALF',
  DOUBLE_BUS_DOUBLE_BREAKER: 'DOUBLE_BUS_DOUBLE_BREAKER',

  // --- Grupo B: Distribución MT y Compactas (5 Esquemas) ---
  H_SCHEME_BRIDGE: 'H_SCHEME_BRIDGE',
  LINE_BRIDGE: 'LINE_BRIDGE',
  DUAL_RADIAL: 'DUAL_RADIAL',
  OPEN_RING_DISTRIBUTION: 'OPEN_RING_DISTRIBUTION',
  GIS_COMPACT: 'GIS_COMPACT',

  // --- Grupo C: Generación, Renovables e Industria (4 Esquemas) ---
  SOLAR_PV_COLLECTOR: 'SOLAR_PV_COLLECTOR',
  WIND_FARM_EVACUATION: 'WIND_FARM_EVACUATION',
  HEAVY_INDUSTRIAL: 'HEAVY_INDUSTRIAL',
  MISSION_CRITICAL_DATA_CENTER: 'MISSION_CRITICAL_DATA_CENTER'
});

export const TOPOLOGY_PRESETS_METADATA = Object.freeze({
  // ==========================================
  // GRUPO A: TRANSMISIÓN AT / EAT
  // ==========================================
  [TOPOLOGY_PRESET_KEYS.SINGLE_BUS]: {
    key: TOPOLOGY_PRESET_KEYS.SINGLE_BUS,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Barra Simple',
    englishName: 'Single Bus Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Esquema elemental con una única barra colectora a la que se conectan todos los circuitos. Presenta la mínima inversión en aparamenta, pero carece de flexibilidad: una falla en la barra interrumpe el suministro a toda la subestación.',
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
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Barra Principal y Transferencia',
    englishName: 'Main and Transfer Bus',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Incorpora una barra de transferencia auxiliar y un interruptor de acoplamiento (Bus Tie). Permite realizar mantenimiento a cualquier interruptor de posición transfiriendo la conducción al interruptor de transferencia sin interrumpir el suministro.',
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
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Barra Seccionada / Partida',
    englishName: 'Sectionalized Bus Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
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

  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_SINGLE_BREAKER]: {
    key: TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_SINGLE_BREAKER,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Doble Barra con Acoplamiento',
    englishName: 'Double Bus Single Breaker (Bus Tie)',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Dispone de dos barras independientes (Barra 1 y Barra 2) unidas por una bahía de acoplamiento (Bus Tie). Cada circuito dispone de dos seccionadores selectores que permiten conectarlo a cualquiera de las dos barras sin cortar el servicio.',
    advantages: [
      'Permite limpiar o reparar una barra transfiriendo todos los circuitos a la otra',
      'Posibilidad de segregar cargas críticas y cargas industriales en barras distintas',
      'Operación muy flexible y estándar en sistemas interconectados'
    ],
    disadvantages: [
      'Mantenimiento del interruptor de línea exige desconectar su posición',
      'Riesgo operativo ante maniobras erróneas de seccionadores selectores'
    ],
    reliabilityLevel: 'Alta',
    relativeCost: 1.45,
    badgeColor: '#2dd4bf'
  },

  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_TRANSFER]: {
    key: TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_TRANSFER,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Doble Barra con Transferencia (Triple Barra)',
    englishName: 'Double Bus with Transfer Bus',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Combina las ventajas de la doble barra colectora con una tercera barra auxiliar de transferencia. Permite realizar mantenimiento a cualquier barra y a cualquier interruptor sin interrupción de suministro.',
    advantages: [
      'Máxima flexibilidad de conmutación en subestaciones nodales',
      'Mantenimiento de interruptores y de barras sin deslastre de carga',
      'Aislamiento de fallas con múltiples rutas de energización'
    ],
    disadvantages: [
      'Elevada inversión inicial en barras y seccionadores (3 seccionadores por posición)',
      'Complejidad en lógica de enclavamientos y diferencial de barras triple'
    ],
    reliabilityLevel: 'Muy Alta',
    relativeCost: 1.65,
    badgeColor: '#60a5fa'
  },

  [TOPOLOGY_PRESET_KEYS.RING_BUS]: {
    key: TOPOLOGY_PRESET_KEYS.RING_BUS,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Barra en Anillo (4 Interruptores)',
    englishName: 'Ring Bus Scheme (4-CB)',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Los interruptores se interconectan en un circuito cerrado poligonal (anillo de 4 lados). Cada circuito se conecta entre dos interruptores contiguos, permitiendo aislar cualquier interruptor sin interrumpir ningún circuito alimentado (Criterio N-1).',
    advantages: [
      'Cumple criterio N-1: la apertura de cualquier interruptor mantiene el 100% de cargas',
      'Sin barras colectoras convencionales: no existe el concepto de falla de barra catastrófica',
      'Uso eficiente de 1 interruptor por circuito con alta confiabilidad'
    ],
    disadvantages: [
      'Si el anillo se abre por falla, se pierde la redundancia de lazo',
      'Dificultad de expansión más allá de 6 o 8 posiciones sin reconfiguración',
      'Coordinación de protecciones diferencial de línea y sobrecorriente compleja'
    ],
    reliabilityLevel: 'Muy Alta',
    relativeCost: 1.4,
    badgeColor: '#a78bfa'
  },

  [TOPOLOGY_PRESET_KEYS.RING_BUS_6CB]: {
    key: TOPOLOGY_PRESET_KEYS.RING_BUS_6CB,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Barra en Anillo Ampliado (6 Interruptores)',
    englishName: 'Ring Bus Scheme (6-CB)',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 220,
    description: 'Evolución hexagonal del anillo con 6 interruptores de potencia, 2 acometidas de red y 4 posiciones de salida de gran capacidad. Ofrece mayor capacidad de evacuación conservando la resiliencia N-1.',
    advantages: [
      'Mayor capacidad de conexión de circuitos manteniendo inmunidad N-1',
      'Aislamiento de interruptores sin desconectar líneas ni transformadores',
      'Bajo impacto de contingencias y excelente desempeño dinámico'
    ],
    disadvantages: [
      'Un doble disparo simultáneo divide el anillo en dos islas',
      'Mayor longitud de conductores de interconexión y patio de llaves amplio'
    ],
    reliabilityLevel: 'Muy Alta',
    relativeCost: 1.55,
    badgeColor: '#c084fc'
  },

  [TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF]: {
    key: TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF,
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Interruptor y Medio (1 1/2 CB)',
    englishName: 'Breaker-and-a-Half Scheme',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 500,
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
    category: TOPOLOGY_CATEGORIES.TRANSMISSION.id,
    name: 'Doble Barra con Doble Interruptor',
    englishName: 'Double Bus Double Breaker',
    standard: 'IEEE C37.100 / IEC 61936-1',
    voltageLevel: 500,
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
  },

  // ==========================================
  // GRUPO B: DISTRIBUCIÓN MT Y COMPACTAS
  // ==========================================
  [TOPOLOGY_PRESET_KEYS.H_SCHEME_BRIDGE]: {
    key: TOPOLOGY_PRESET_KEYS.H_SCHEME_BRIDGE,
    category: TOPOLOGY_CATEGORIES.DISTRIBUTION.id,
    name: 'Subestación Puente en H (H-Scheme)',
    englishName: 'H-Configuration / Bridge Substation',
    standard: 'IEC 61936-1 / CIGRE WG B3',
    voltageLevel: 66,
    description: 'Configuración clásica en H con 2 líneas de entrada, 2 transformadores reductores y una rama transversal de puente con interruptor central. Permite alimentar ambos transformadores desde cualquiera de las líneas.',
    advantages: [
      'Diseño compacto y eficiente para subestaciones transformadoras de distribución',
      'Excelente balance costo-confiabilidad con mínimo número de interruptores',
      'Permite aislar cualquier línea sin perder capacidad de transformación'
    ],
    disadvantages: [
      'Falla en el transformador exige conmutación manual o automática del puente',
      'Flexibilidad limitada frente a esquemas de barra completa'
    ],
    reliabilityLevel: 'Media-Alta',
    relativeCost: 1.15,
    badgeColor: '#fbbf24'
  },

  [TOPOLOGY_PRESET_KEYS.LINE_BRIDGE]: {
    key: TOPOLOGY_PRESET_KEYS.LINE_BRIDGE,
    category: TOPOLOGY_CATEGORIES.DISTRIBUTION.id,
    name: 'Puente de Línea con Seccionamiento',
    englishName: 'Line Bridge Scheme',
    standard: 'IEC 61936-1',
    voltageLevel: 66,
    description: 'Variante del esquema puente donde la rama transversal se ubica en el lado de llegada de líneas con interruptores dedicados a los transformadores. Ideal para subestaciones en antena o derivación en T.',
    advantages: [
      'Protección selectiva directa sobre los transformadores de potencia',
      'Bajo costo de ingeniería y construcción rápida',
      'Despeje expedito de fallas en cables o líneas de llegada'
    ],
    disadvantages: [
      'La falla de línea corta una de las ramas primarias',
      'Menor flexibilidad para mantenimiento de interruptores primarios'
    ],
    reliabilityLevel: 'Media',
    relativeCost: 1.10,
    badgeColor: '#f59e0b'
  },

  [TOPOLOGY_PRESET_KEYS.DUAL_RADIAL]: {
    key: TOPOLOGY_PRESET_KEYS.DUAL_RADIAL,
    category: TOPOLOGY_CATEGORIES.DISTRIBUTION.id,
    name: 'Doble Radial con Transferencia (ATS)',
    englishName: 'Dual Radial with Auto-Transfer',
    standard: 'IEEE 242 / IEC 60364',
    voltageLevel: 23,
    description: 'Dos acometidas de red alimentan independientemente dos semibarras de media tensión acopladas por un interruptor de enlace normalmente abierto (N.O. Tie) con lógica de transferencia automática de carga (ATS).',
    advantages: [
      'Continuidad de servicio casi instantánea ante pérdida de una fuente primaria',
      'Independencia galvánica en operación normal (bajo nivel de cortocircuito)',
      'Estándar por excelencia en hospitales, centros de bombeo e infraestructura urbana'
    ],
    disadvantages: [
      'Cada transformador/fuente debe sobredimensionarse para asumir la carga total',
      'Requiere lógica de control ATS confiable para evitar cierre en falla'
    ],
    reliabilityLevel: 'Alta',
    relativeCost: 1.25,
    badgeColor: '#10b981'
  },

  [TOPOLOGY_PRESET_KEYS.OPEN_RING_DISTRIBUTION]: {
    key: TOPOLOGY_PRESET_KEYS.OPEN_RING_DISTRIBUTION,
    category: TOPOLOGY_CATEGORIES.DISTRIBUTION.id,
    name: 'Distribución en Bucle Abierto',
    englishName: 'Open Ring Distribution Scheme',
    standard: 'IEC 62271-200',
    voltageLevel: 23,
    description: 'Alimentadores de media tensión interconectados en anillo pero operados con un punto de frontera normalmente abierto (N.O.). Permite reconfigurar el flujo y aislar tramos fallados en pocos segundos.',
    advantages: [
      'Fácil localización y aislamiento de fallas de cable subterráneo',
      'Protecciones sencillas no direccionales durante operación radial abierta',
      'Reconfiguración automatizada vía SCADA o telemando'
    ],
    disadvantages: [
      'Interrupción momentánea durante la conmutación del punto abierto',
      'Caídas de tensión acumuladas en colas de línea largas'
    ],
    reliabilityLevel: 'Media-Alta',
    relativeCost: 1.20,
    badgeColor: '#06b6d4'
  },

  [TOPOLOGY_PRESET_KEYS.GIS_COMPACT]: {
    key: TOPOLOGY_PRESET_KEYS.GIS_COMPACT,
    category: TOPOLOGY_CATEGORIES.DISTRIBUTION.id,
    name: 'Subestación Encapsulada GIS (SF6)',
    englishName: 'Gas-Insulated Switchgear Substation',
    standard: 'IEC 62271-203',
    voltageLevel: 110,
    description: 'Subestación compacta con aislamiento integral en gas SF6. Implementa un esquema de doble barra colectora en un área física menor al 25% de una subestación convencional en aire (AIS), inmune a la polución ambiental.',
    advantages: [
      'Huella de implantación extremadamente reducida (ideal para ciudades y cavernas)',
      'Inmune a niebla salina, polvo desértico, sismos e inundaciones superficiales',
      'Intervalos de mantenimiento preventivo muy prolongados (alta disponibilidad)'
    ],
    disadvantages: [
      'Mayor costo inicial de adquisición de equipos (CAPEX elevado en aparamenta)',
      'Protocolos estrictos de manejo ambiental y detección de fugas de gas SF6',
      'Tiempos de reparación de bahía más prolongados ante fallas internas'
    ],
    reliabilityLevel: 'Máxima',
    relativeCost: 1.80,
    badgeColor: '#3b82f6'
  },

  // ==========================================
  // GRUPO C: GENERACIÓN, RENOVABLES E INDUSTRIA
  // ==========================================
  [TOPOLOGY_PRESET_KEYS.SOLAR_PV_COLLECTOR]: {
    key: TOPOLOGY_PRESET_KEYS.SOLAR_PV_COLLECTOR,
    category: TOPOLOGY_CATEGORIES.GENERATION_INDUSTRY.id,
    name: 'Colectora Solar Fotovoltaica',
    englishName: 'Solar PV Plant Collector Substation',
    standard: 'IEEE 1547 / IEC 62727',
    voltageLevel: 110,
    description: 'Diseño para plantas solares a gran escala. Múltiples circuitos colectores de inversores fotovoltaicos en 23 kV confluyen a una barra colectora de media tensión que alimenta un transformador elevador principal hacia la red troncal de 110 kV.',
    advantages: [
      'Agrupación modular de bloques inversores con protección dedicada',
      'Interruptor principal de máquina (GSU) con sincronización automática',
      'Medición de inyección neta fiscal y monitoreo armónico centralizado'
    ],
    disadvantages: [
      'La falla del transformador elevador único detiene la evacuación total del parque',
      'Flujo de potencia unidireccional inverso con sobretensiones diurnas'
    ],
    reliabilityLevel: 'Media-Alta',
    relativeCost: 1.35,
    badgeColor: '#eab308'
  },

  [TOPOLOGY_PRESET_KEYS.WIND_FARM_EVACUATION]: {
    key: TOPOLOGY_PRESET_KEYS.WIND_FARM_EVACUATION,
    category: TOPOLOGY_CATEGORIES.GENERATION_INDUSTRY.id,
    name: 'Evacuación de Parque Eólico',
    englishName: 'Wind Farm Evacuation Substation',
    standard: 'IEC 61400-30 / IEEE C37.010',
    voltageLevel: 220,
    description: 'Subestación elevadora de 33 kV a 220 kV para parques eólicos. Incluye barra colectora para circuitos de aerogeneradores, bahía de compensación reactiva rápida (STATCOM/condensadores) y salida en alta tensión.',
    advantages: [
      'Integración de soporte de tensión y cumplimiento del código de red (Fault Ride-Through)',
      'Compensación dinámica de energía reactiva en barra de 33 kV',
      'Evacuación eficiente de bloques de potencia variable'
    ],
    disadvantages: [
      'Exposición a transitorios de maniobra de alta frecuencia por cables submarinos/subterráneos',
      'Requiere filtros dedicados de resonancia armónica'
    ],
    reliabilityLevel: 'Alta',
    relativeCost: 1.50,
    badgeColor: '#14b8a6'
  },

  [TOPOLOGY_PRESET_KEYS.HEAVY_INDUSTRIAL]: {
    key: TOPOLOGY_PRESET_KEYS.HEAVY_INDUSTRIAL,
    category: TOPOLOGY_CATEGORIES.GENERATION_INDUSTRY.id,
    name: 'Industrial Pesada Minera / Siderúrgica',
    englishName: 'Heavy Industrial Mining Substation',
    standard: 'IEEE 141 (Red Book) / IEEE 493',
    voltageLevel: 220,
    description: 'Doble acometida en 220 kV con dos transformadores reductores (220/23 kV) y barra partida para aislar cargas altamente perturbadoras (molinos SAG, hornos de arco) de servicios esenciales.',
    advantages: [
      'Excelente mitigación de fluctuaciones de tensión (flicker y huecos)',
      'Continuidad operativa ininterrumpida ante mantenimiento o contingencias',
      'Alimentación redundante a cargas de procesos críticos de producción continua'
    ],
    disadvantages: [
      'Alta inversión en capacidad de cortocircuito y aparamenta reforzada',
      'Requiere transformadores con cambiador de tomas bajo carga (OLTC) de alta velocidad'
    ],
    reliabilityLevel: 'Muy Alta',
    relativeCost: 1.75,
    badgeColor: '#f97316'
  },

  [TOPOLOGY_PRESET_KEYS.MISSION_CRITICAL_DATA_CENTER]: {
    key: TOPOLOGY_PRESET_KEYS.MISSION_CRITICAL_DATA_CENTER,
    category: TOPOLOGY_CATEGORIES.GENERATION_INDUSTRY.id,
    name: 'Data Center Tier IV (Topología 2N)',
    englishName: 'Mission-Critical Tier IV Substation',
    standard: 'Uptime Institute Tier IV / TIA-942',
    voltageLevel: 23,
    description: 'Topología 2N con redundancia activa simultánea de extremo a extremo. Dos acometidas eléctricas de redes públicas distintas, respaldo local de grupos electrógenos diésel y barras independientes tolerantes a cualquier falla sin caída de servidores.',
    advantages: [
      'Tolerancia a fallas activa absoluta: ningún evento individual interrumpe los servidores IT',
      'Mantenimiento concurrente en cualquier activo de la cadena eléctrica sin pérdida de servicio',
      'Disponibilidad proyectada del 99.995% (tiempo de inactividad menor a 26 minutos/año)'
    ],
    disadvantages: [
      'Inversión inicial muy cuantiosa: 100% de sobredimensionamiento por camino redundante',
      'Lógica de sincronismo de generadores y transferencias de alta complejidad'
    ],
    reliabilityLevel: 'Extrema',
    relativeCost: 1.90,
    badgeColor: '#ec4899'
  }
});

// ============================================================================
// CONSTRUCTORES DE TOPOLOGÍAS (BUILDERS)
// ============================================================================

/**
 * 1. Topología de Barra Simple
 */

// ============================================================================
// CONSTRUCTORES DE TOPOLOGÍAS (18 PLANTILLAS)
// ============================================================================

/** 1. Barra Simple */
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

/** 2. Barra Principal y Transferencia */
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

/** 3. Barra Seccionada / Partida */
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

/** 4. Doble Barra con Interruptor de Acoplamiento */
export function buildDoubleBusSingleBreakerPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const bb1 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-1',
    name: 'Barra Colectora 1 (220 kV)',
    x: 80,
    y: 80,
    width: 600,
    terminalCount: 4,
    properties: { voltageLevel: 220, ratedCurrent: 2500 }
  });
  const bb2 = createComponent(ComponentType.BUSBAR, {
    id: 'BB-2',
    name: 'Barra Colectora 2 (220 kV)',
    x: 80,
    y: 170,
    width: 600,
    terminalCount: 4,
    properties: { voltageLevel: 220, ratedCurrent: 2500 }
  });
  components.push(bb1, bb2);

  // Bahía de Acoplamiento (Bus Tie)
  const dsTie1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-TIE-1', name: 'Secc. Acople B1', x: 130, y: 110, operationalState: OperationalState.CLOSED });
  const cbTie = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TIE', name: 'Int. Acoplamiento Barras', x: 130, y: 130, operationalState: OperationalState.CLOSED });
  const dsTie2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-TIE-2', name: 'Secc. Acople B2', x: 130, y: 150, operationalState: OperationalState.CLOSED });
  components.push(dsTie1, cbTie, dsTie2);

  connections.push(
    { id: 'CONN-TIE-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t1', toComponentId: 'DS-TIE-1', toTerminalId: 'DS-TIE-1-t1' },
    { id: 'CONN-TIE-CB1', fromComponentId: 'DS-TIE-1', fromTerminalId: 'DS-TIE-1-t2', toComponentId: 'CB-TIE', toTerminalId: 'CB-TIE-t1' },
    { id: 'CONN-TIE-CB2', fromComponentId: 'CB-TIE', fromTerminalId: 'CB-TIE-t2', toComponentId: 'DS-TIE-2', toTerminalId: 'DS-TIE-2-t1' },
    { id: 'CONN-TIE-B2', fromComponentId: 'DS-TIE-2', fromTerminalId: 'DS-TIE-2-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t1' }
  );

  // Bahía 1: Entrada Red 220 kV con selectores
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Red 220 kV', x: 260, y: 20, properties: { voltageLevel: 220 } });
  const cbSrc = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SRC', name: 'Int. Línea Red', x: 260, y: 220, operationalState: OperationalState.CLOSED });
  const dsSrcB1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-SRC-B1', name: 'Secc. Red B1', x: 230, y: 115, operationalState: OperationalState.CLOSED });
  const dsSrcB2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-SRC-B2', name: 'Secc. Red B2', x: 290, y: 145, operationalState: OperationalState.OPEN });
  components.push(src1, cbSrc, dsSrcB1, dsSrcB2);

  connections.push(
    { id: 'CONN-SRC-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'DS-SRC-B1', toTerminalId: 'DS-SRC-B1-t1' },
    { id: 'CONN-SRC-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t2', toComponentId: 'DS-SRC-B2', toTerminalId: 'DS-SRC-B2-t1' },
    { id: 'CONN-SRC-J1', fromComponentId: 'DS-SRC-B1', fromTerminalId: 'DS-SRC-B1-t2', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-SRC-J2', fromComponentId: 'DS-SRC-B2', fromTerminalId: 'DS-SRC-B2-t2', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-SRC-IN', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t2' }
  );

  // Bahía 2: Salida Trafo 1 (220/66 kV)
  const dsOut1B1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT1-B1', name: 'Secc. Trafo 1 B1', x: 400, y: 115, operationalState: OperationalState.CLOSED });
  const dsOut1B2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT1-B2', name: 'Secc. Trafo 1 B2', x: 450, y: 145, operationalState: OperationalState.OPEN });
  const cbOut1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-OUT1', name: 'Int. Trafo 1', x: 425, y: 220, operationalState: OperationalState.CLOSED });
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 420, y: 310, properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 60 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Red 66 kV', x: 425, y: 430, properties: { voltageLevel: 66, ratedPower: 45 } });
  components.push(dsOut1B1, dsOut1B2, cbOut1, tr1, ld1);

  connections.push(
    { id: 'CONN-OUT1-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t3', toComponentId: 'DS-OUT1-B1', toTerminalId: 'DS-OUT1-B1-t1' },
    { id: 'CONN-OUT1-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t3', toComponentId: 'DS-OUT1-B2', toTerminalId: 'DS-OUT1-B2-t1' },
    { id: 'CONN-OUT1-J1', fromComponentId: 'DS-OUT1-B1', fromTerminalId: 'DS-OUT1-B1-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-OUT1-J2', fromComponentId: 'DS-OUT1-B2', fromTerminalId: 'DS-OUT1-B2-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-OUT1-TR', fromComponentId: 'CB-OUT1', fromTerminalId: 'CB-OUT1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-OUT1-LD', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Bahía 3: Salida Trafo 2 (220/23 kV)
  const dsOut2B1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT2-B1', name: 'Secc. Trafo 2 B1', x: 540, y: 115, operationalState: OperationalState.OPEN });
  const dsOut2B2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT2-B2', name: 'Secc. Trafo 2 B2', x: 590, y: 145, operationalState: OperationalState.CLOSED });
  const cbOut2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-OUT2', name: 'Int. Trafo 2', x: 565, y: 220, operationalState: OperationalState.CLOSED });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (220/23 kV)', x: 560, y: 310, properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 40 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Red 23 kV', x: 565, y: 430, properties: { voltageLevel: 23, ratedPower: 35 } });
  components.push(dsOut2B1, dsOut2B2, cbOut2, tr2, ld2);

  connections.push(
    { id: 'CONN-OUT2-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t4', toComponentId: 'DS-OUT2-B1', toTerminalId: 'DS-OUT2-B1-t1' },
    { id: 'CONN-OUT2-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t4', toComponentId: 'DS-OUT2-B2', toTerminalId: 'DS-OUT2-B2-t1' },
    { id: 'CONN-OUT2-J1', fromComponentId: 'DS-OUT2-B1', fromTerminalId: 'DS-OUT2-B1-t2', toComponentId: 'CB-OUT2', toTerminalId: 'CB-OUT2-t1' },
    { id: 'CONN-OUT2-J2', fromComponentId: 'DS-OUT2-B2', fromTerminalId: 'DS-OUT2-B2-t2', toComponentId: 'CB-OUT2', toTerminalId: 'CB-OUT2-t1' },
    { id: 'CONN-OUT2-TR', fromComponentId: 'CB-OUT2', fromTerminalId: 'CB-OUT2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-OUT2-LD', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * 5. Doble Barra con Transferencia (Triple Barra)
 */

/** 5. Doble Barra con Barra de Transferencia */
export function buildDoubleBusTransferPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const bb1 = createComponent(ComponentType.BUSBAR, { id: 'BB-1', name: 'Barra Principal 1 (220 kV)', x: 80, y: 70, width: 620, terminalCount: 4, properties: { voltageLevel: 220 } });
  const bb2 = createComponent(ComponentType.BUSBAR, { id: 'BB-2', name: 'Barra Principal 2 (220 kV)', x: 80, y: 150, width: 620, terminalCount: 4, properties: { voltageLevel: 220 } });
  const bbT = createComponent(ComponentType.BUSBAR, { id: 'BB-T', name: 'Barra Auxiliar Transferencia', x: 80, y: 240, width: 620, terminalCount: 4, properties: { voltageLevel: 220 } });
  components.push(bb1, bb2, bbT);

  // Acople / Transferencia
  const dsTie1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-TIE-B1', name: 'Secc. Acople B1', x: 120, y: 95, operationalState: OperationalState.CLOSED });
  const cbTie = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TIE', name: 'Int. Acople/Transf.', x: 120, y: 175, operationalState: OperationalState.CLOSED });
  const dsTieT = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-TIE-T', name: 'Secc. Acople BT', x: 120, y: 215, operationalState: OperationalState.CLOSED });
  components.push(dsTie1, cbTie, dsTieT);

  connections.push(
    { id: 'CONN-TRP-T1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t1', toComponentId: 'DS-TIE-B1', toTerminalId: 'DS-TIE-B1-t1' },
    { id: 'CONN-TRP-T2', fromComponentId: 'DS-TIE-B1', fromTerminalId: 'DS-TIE-B1-t2', toComponentId: 'CB-TIE', toTerminalId: 'CB-TIE-t1' },
    { id: 'CONN-TRP-T3', fromComponentId: 'CB-TIE', fromTerminalId: 'CB-TIE-t2', toComponentId: 'DS-TIE-T', toTerminalId: 'DS-TIE-T-t1' },
    { id: 'CONN-TRP-T4', fromComponentId: 'DS-TIE-T', fromTerminalId: 'DS-TIE-T-t2', toComponentId: 'BB-T', toTerminalId: 'BB-T-t1' }
  );

  // Acometida SRC-1
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Red 220 kV', x: 260, y: 15, properties: { voltageLevel: 220 } });
  const cbSrc = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SRC', name: 'Int. Red', x: 260, y: 280, operationalState: OperationalState.CLOSED });
  const dsSrcB1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-SRC-B1', name: 'Secc. Red B1', x: 235, y: 95, operationalState: OperationalState.CLOSED });
  const dsSrcB2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-SRC-B2', name: 'Secc. Red B2', x: 285, y: 175, operationalState: OperationalState.OPEN });
  components.push(src1, cbSrc, dsSrcB1, dsSrcB2);

  connections.push(
    { id: 'CONN-SRC-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'DS-SRC-B1', toTerminalId: 'DS-SRC-B1-t1' },
    { id: 'CONN-SRC-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t2', toComponentId: 'DS-SRC-B2', toTerminalId: 'DS-SRC-B2-t1' },
    { id: 'CONN-SRC-J1', fromComponentId: 'DS-SRC-B1', fromTerminalId: 'DS-SRC-B1-t2', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-SRC-J2', fromComponentId: 'DS-SRC-B2', fromTerminalId: 'DS-SRC-B2-t2', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-SRC-IN', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t2' }
  );

  // Bahía Salida Trafo 1
  const dsOut1B1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT1-B1', name: 'Secc. T1 B1', x: 390, y: 95, operationalState: OperationalState.CLOSED });
  const dsOut1B2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT1-B2', name: 'Secc. T1 B2', x: 440, y: 175, operationalState: OperationalState.OPEN });
  const cbOut1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-OUT1', name: 'Int. Trafo 1', x: 415, y: 280, operationalState: OperationalState.CLOSED });
  const dsOut1Byp = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OUT1-BYP', name: 'Secc. Bypass T1', x: 485, y: 280, operationalState: OperationalState.OPEN });
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 410, y: 360, properties: { voltageLevel: 220, secondaryVoltage: 66, ratedPower: 60 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Red 66 kV', x: 415, y: 470, properties: { voltageLevel: 66, ratedPower: 45 } });
  components.push(dsOut1B1, dsOut1B2, cbOut1, dsOut1Byp, tr1, ld1);

  connections.push(
    { id: 'CONN-O1-B1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t3', toComponentId: 'DS-OUT1-B1', toTerminalId: 'DS-OUT1-B1-t1' },
    { id: 'CONN-O1-B2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t3', toComponentId: 'DS-OUT1-B2', toTerminalId: 'DS-OUT1-B2-t1' },
    { id: 'CONN-O1-J1', fromComponentId: 'DS-OUT1-B1', fromTerminalId: 'DS-OUT1-B1-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-O1-J2', fromComponentId: 'DS-OUT1-B2', fromTerminalId: 'DS-OUT1-B2-t2', toComponentId: 'CB-OUT1', toTerminalId: 'CB-OUT1-t1' },
    { id: 'CONN-O1-TR', fromComponentId: 'CB-OUT1', fromTerminalId: 'CB-OUT1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-O1-BYPIN', fromComponentId: 'BB-T', fromTerminalId: 'BB-T-t2', toComponentId: 'DS-OUT1-BYP', toTerminalId: 'DS-OUT1-BYP-t1' },
    { id: 'CONN-O1-BYPOUT', fromComponentId: 'DS-OUT1-BYP', fromTerminalId: 'DS-OUT1-BYP-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-O1-LD', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  return { components, connections };
}

/**
 * 6. Topología de Barra en Anillo 4-CB
 */

/** 6. Barra en Anillo 4-CB */
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

/** 7. Barra en Anillo Ampliado 6-CB */
export function buildRingBus6CBPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const cbR1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R1', name: 'Int. R1', x: 200, y: 120, operationalState: OperationalState.CLOSED });
  const cbR2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R2', name: 'Int. R2', x: 400, y: 120, operationalState: OperationalState.CLOSED });
  const cbR3 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R3', name: 'Int. R3', x: 550, y: 240, operationalState: OperationalState.CLOSED });
  const cbR4 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R4', name: 'Int. R4', x: 400, y: 360, operationalState: OperationalState.CLOSED });
  const cbR5 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R5', name: 'Int. R5', x: 200, y: 360, operationalState: OperationalState.CLOSED });
  const cbR6 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-R6', name: 'Int. R6', x: 80, y: 240, operationalState: OperationalState.CLOSED });
  components.push(cbR1, cbR2, cbR3, cbR4, cbR5, cbR6);

  // Conexiones del lazo hexagonal
  connections.push(
    { id: 'CONN-HEX-1', fromComponentId: 'CB-R1', fromTerminalId: 'CB-R1-t2', toComponentId: 'CB-R2', toTerminalId: 'CB-R2-t1' },
    { id: 'CONN-HEX-2', fromComponentId: 'CB-R2', fromTerminalId: 'CB-R2-t2', toComponentId: 'CB-R3', toTerminalId: 'CB-R3-t1' },
    { id: 'CONN-HEX-3', fromComponentId: 'CB-R3', fromTerminalId: 'CB-R3-t2', toComponentId: 'CB-R4', toTerminalId: 'CB-R4-t1' },
    { id: 'CONN-HEX-4', fromComponentId: 'CB-R4', fromTerminalId: 'CB-R4-t2', toComponentId: 'CB-R5', toTerminalId: 'CB-R5-t1' },
    { id: 'CONN-HEX-5', fromComponentId: 'CB-R5', fromTerminalId: 'CB-R5-t2', toComponentId: 'CB-R6', toTerminalId: 'CB-R6-t1' },
    { id: 'CONN-HEX-6', fromComponentId: 'CB-R6', fromTerminalId: 'CB-R6-t2', toComponentId: 'CB-R1', toTerminalId: 'CB-R1-t1' }
  );

  // Fuentes (Líneas 1 y 2)
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Línea 1 (220 kV)', x: 300, y: 30, properties: { voltageLevel: 220 } });
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-2', name: 'Línea 2 (220 kV)', x: 650, y: 240, properties: { voltageLevel: 220 } });
  components.push(src1, src2);

  connections.push(
    { id: 'CONN-SRC1-HEX', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-R1', toTerminalId: 'CB-R1-t2' },
    { id: 'CONN-SRC2-HEX', fromComponentId: 'SRC-2', fromTerminalId: 'SRC-2-t1', toComponentId: 'CB-R3', toTerminalId: 'CB-R3-t2' }
  );

  // Cargas / Transformadores en los otros vértices
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (220/66 kV)', x: 480, y: 440, properties: { voltageLevel: 220, secondaryVoltage: 66 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Red 66 kV', x: 485, y: 550, properties: { voltageLevel: 66, ratedPower: 50 } });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (220/23 kV)', x: 120, y: 440, properties: { voltageLevel: 220, secondaryVoltage: 23 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Red 23 kV', x: 125, y: 550, properties: { voltageLevel: 23, ratedPower: 40 } });
  components.push(tr1, ld1, tr2, ld2);

  connections.push(
    { id: 'CONN-HEX-TR1', fromComponentId: 'CB-R4', fromTerminalId: 'CB-R4-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-TR1-LD', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-HEX-TR2', fromComponentId: 'CB-R5', fromTerminalId: 'CB-R5-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-TR2-LD', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * 8. Interruptor y Medio (1 1/2 CB)
 */

/** 8. Interruptor y Medio */
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

/** 9. Doble Barra con Doble Interruptor */
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

/** 10. Subestación Transformadora Puente en H */
export function buildHSchemeBridgePreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // 2 Líneas de llegada 66 kV
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-L1', name: 'Línea AT 1 (66 kV)', x: 150, y: 30, properties: { voltageLevel: 66 } });
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-L2', name: 'Línea AT 2 (66 kV)', x: 450, y: 30, properties: { voltageLevel: 66 } });
  const cbL1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-L1', name: 'Int. Línea 1', x: 150, y: 110, operationalState: OperationalState.CLOSED });
  const cbL2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-L2', name: 'Int. Línea 2', x: 450, y: 110, operationalState: OperationalState.CLOSED });
  components.push(src1, src2, cbL1, cbL2);

  connections.push(
    { id: 'CONN-H-L1', fromComponentId: 'SRC-L1', fromTerminalId: 'SRC-L1-t1', toComponentId: 'CB-L1', toTerminalId: 'CB-L1-t1' },
    { id: 'CONN-H-L2', fromComponentId: 'SRC-L2', fromTerminalId: 'SRC-L2-t1', toComponentId: 'CB-L2', toTerminalId: 'CB-L2-t1' }
  );

  // Rama transversal Puente en H (con interruptor central de enlace)
  const dsBr1 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-BR1', name: 'Secc. Puente Izq.', x: 230, y: 190, operationalState: OperationalState.CLOSED });
  const cbBridge = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-BRIDGE', name: 'Int. Puente H', x: 300, y: 190, operationalState: OperationalState.CLOSED });
  const dsBr2 = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-BR2', name: 'Secc. Puente Der.', x: 370, y: 190, operationalState: OperationalState.CLOSED });
  components.push(dsBr1, cbBridge, dsBr2);

  connections.push(
    { id: 'CONN-BR-L1', fromComponentId: 'CB-L1', fromTerminalId: 'CB-L1-t2', toComponentId: 'DS-BR1', toTerminalId: 'DS-BR1-t1' },
    { id: 'CONN-BR-1', fromComponentId: 'DS-BR1', fromTerminalId: 'DS-BR1-t2', toComponentId: 'CB-BRIDGE', toTerminalId: 'CB-BRIDGE-t1' },
    { id: 'CONN-BR-2', fromComponentId: 'CB-BRIDGE', fromTerminalId: 'CB-BRIDGE-t2', toComponentId: 'DS-BR2', toTerminalId: 'DS-BR2-t1' },
    { id: 'CONN-BR-L2', fromComponentId: 'DS-BR2', fromTerminalId: 'DS-BR2-t2', toComponentId: 'CB-L2', toTerminalId: 'CB-L2-t2' }
  );

  // 2 Transformadores 66/23 kV y cargas
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (66/23 kV)', x: 150, y: 280, properties: { voltageLevel: 66, secondaryVoltage: 23, ratedPower: 25 } });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (66/23 kV)', x: 450, y: 280, properties: { voltageLevel: 66, secondaryVoltage: 23, ratedPower: 25 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Sector A (23 kV)', x: 155, y: 410, properties: { voltageLevel: 23, ratedPower: 20 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Sector B (23 kV)', x: 455, y: 410, properties: { voltageLevel: 23, ratedPower: 20 } });
  components.push(tr1, tr2, ld1, ld2);

  connections.push(
    { id: 'CONN-H-TR1', fromComponentId: 'CB-L1', fromTerminalId: 'CB-L1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-H-TR2', fromComponentId: 'CB-L2', fromTerminalId: 'CB-L2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-H-LD1', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-H-LD2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * 11. Puente de Línea con Seccionamiento
 */

/** 11. Puente de Línea */
export function buildLineBridgePreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Línea Infeed 1 (66 kV)', x: 160, y: 30, properties: { voltageLevel: 66 } });
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-2', name: 'Línea Infeed 2 (66 kV)', x: 460, y: 30, properties: { voltageLevel: 66 } });
  const cbTieLine = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-LINE-TIE', name: 'Int. Puente Líneas', x: 310, y: 90, operationalState: OperationalState.CLOSED });
  components.push(src1, src2, cbTieLine);

  connections.push(
    { id: 'CONN-LB-1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-LINE-TIE', toTerminalId: 'CB-LINE-TIE-t1' },
    { id: 'CONN-LB-2', fromComponentId: 'CB-LINE-TIE', fromTerminalId: 'CB-LINE-TIE-t2', toComponentId: 'SRC-2', toTerminalId: 'SRC-2-t1' }
  );

  const cbT1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-T1', name: 'Int. Trafo 1', x: 160, y: 170, operationalState: OperationalState.CLOSED });
  const cbT2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-T2', name: 'Int. Trafo 2', x: 460, y: 170, operationalState: OperationalState.CLOSED });
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo 1 (66/23 kV)', x: 160, y: 270, properties: { voltageLevel: 66, secondaryVoltage: 23, ratedPower: 30 } });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo 2 (66/23 kV)', x: 460, y: 270, properties: { voltageLevel: 66, secondaryVoltage: 23, ratedPower: 30 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Alimentador 1 (23 kV)', x: 165, y: 390, properties: { voltageLevel: 23, ratedPower: 25 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Alimentador 2 (23 kV)', x: 465, y: 390, properties: { voltageLevel: 23, ratedPower: 25 } });
  components.push(cbT1, cbT2, tr1, tr2, ld1, ld2);

  connections.push(
    { id: 'CONN-LB-T1IN', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-T1', toTerminalId: 'CB-T1-t1' },
    { id: 'CONN-LB-T2IN', fromComponentId: 'SRC-2', fromTerminalId: 'SRC-2-t1', toComponentId: 'CB-T2', toTerminalId: 'CB-T2-t1' },
    { id: 'CONN-LB-TR1', fromComponentId: 'CB-T1', fromTerminalId: 'CB-T1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-LB-TR2', fromComponentId: 'CB-T2', fromTerminalId: 'CB-T2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-LB-LD1', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-LB-LD2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * 12. Doble Radial con Transferencia Automática (ATS)
 */

/** 12. Doble Radial */
export function buildDualRadialPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const bb1 = createComponent(ComponentType.BUSBAR, { id: 'BB-1', name: 'Semibarra 1 (23 kV)', x: 80, y: 170, width: 260, terminalCount: 3, properties: { voltageLevel: 23 } });
  const bb2 = createComponent(ComponentType.BUSBAR, { id: 'BB-2', name: 'Semibarra 2 (23 kV)', x: 420, y: 170, width: 260, terminalCount: 3, properties: { voltageLevel: 23 } });
  components.push(bb1, bb2);

  // Interruptor de Transferencia Automática (ATS) normalmente abierto
  const cbAts = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-ATS', name: 'Enlace ATS (Normal Abierto)', x: 350, y: 170, operationalState: OperationalState.OPEN, properties: { voltageLevel: 23 } });
  components.push(cbAts);

  connections.push(
    { id: 'CONN-ATS-1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t3', toComponentId: 'CB-ATS', toTerminalId: 'CB-ATS-t1' },
    { id: 'CONN-ATS-2', fromComponentId: 'CB-ATS', fromTerminalId: 'CB-ATS-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t1' }
  );

  // Acometida 1
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Alimentador Principal 1', x: 120, y: 30, properties: { voltageLevel: 23 } });
  const cbSrc1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SRC1', name: 'Int. Entrada 1', x: 120, y: 100, operationalState: OperationalState.CLOSED });
  components.push(src1, cbSrc1);
  connections.push(
    { id: 'CONN-DR-IN1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC1', toTerminalId: 'CB-SRC1-t1' },
    { id: 'CONN-DR-BB1', fromComponentId: 'CB-SRC1', fromTerminalId: 'CB-SRC1-t2', toComponentId: 'BB-1', toTerminalId: 'BB-1-t1' }
  );

  // Acometida 2
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-2', name: 'Alimentador Principal 2', x: 580, y: 30, properties: { voltageLevel: 23 } });
  const cbSrc2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SRC2', name: 'Int. Entrada 2', x: 580, y: 100, operationalState: OperationalState.CLOSED });
  components.push(src2, cbSrc2);
  connections.push(
    { id: 'CONN-DR-IN2', fromComponentId: 'SRC-2', fromTerminalId: 'SRC-2-t1', toComponentId: 'CB-SRC2', toTerminalId: 'CB-SRC2-t1' },
    { id: 'CONN-DR-BB2', fromComponentId: 'CB-SRC2', fromTerminalId: 'CB-SRC2-t2', toComponentId: 'BB-2', toTerminalId: 'BB-2-t3' }
  );

  // Cargas críticas en Semibarra 1 y Semibarra 2
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Carga Hospitalaria (23 kV)', x: 200, y: 280, properties: { voltageLevel: 23, ratedPower: 12 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Carga Urbana 1 (23 kV)', x: 500, y: 280, properties: { voltageLevel: 23, ratedPower: 15 } });
  components.push(ld1, ld2);

  connections.push(
    { id: 'CONN-DR-LD1', fromComponentId: 'BB-1', fromTerminalId: 'BB-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' },
    { id: 'CONN-DR-LD2', fromComponentId: 'BB-2', fromTerminalId: 'BB-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' }
  );

  return { components, connections };
}

/**
 * 13. Distribución en Bucle Abierto
 */

/** 13. Distribución Urbana en Bucle Abierto */
export function buildOpenRingDistributionPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Subestación Cabecera', x: 80, y: 40, properties: { voltageLevel: 23 } });
  const cbMain = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-MAIN', name: 'Int. Cabecera Anillo', x: 80, y: 120, operationalState: OperationalState.CLOSED });
  components.push(src1, cbMain);
  connections.push({ id: 'CONN-OR-1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-MAIN', toTerminalId: 'CB-MAIN-t1' });

  // Centro de Transformación 1
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'CT 1 (23/0.4 kV)', x: 220, y: 200, properties: { voltageLevel: 23, secondaryVoltage: 13, ratedPower: 2 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Consumo BT 1', x: 225, y: 320, properties: { voltageLevel: 13, ratedPower: 1.5 } });
  components.push(tr1, ld1);

  connections.push(
    { id: 'CONN-OR-2', fromComponentId: 'CB-MAIN', fromTerminalId: 'CB-MAIN-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-OR-LD1', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  // Seccionador de Frontera Abierto (Punto Abierto Normal)
  const dsOpenPoint = createComponent(ComponentType.DISCONNECTOR, { id: 'DS-OPEN', name: 'Punto Frontera (Abierto)', x: 360, y: 200, operationalState: OperationalState.OPEN });
  components.push(dsOpenPoint);
  connections.push({ id: 'CONN-OR-3', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t1', toComponentId: 'DS-OPEN', toTerminalId: 'DS-OPEN-t1' });

  // Centro de Transformación 2 y retorno a otra fuente
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'CT 2 (23/0.4 kV)', x: 500, y: 200, properties: { voltageLevel: 23, secondaryVoltage: 13, ratedPower: 2 } });
  const ld2 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-2', name: 'Consumo BT 2', x: 505, y: 320, properties: { voltageLevel: 13, ratedPower: 1.5 } });
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-2', name: 'Subestación Retorno', x: 620, y: 40, properties: { voltageLevel: 23 } });
  const cbRet = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-RET', name: 'Int. Retorno', x: 620, y: 120, operationalState: OperationalState.CLOSED });
  components.push(tr2, ld2, src2, cbRet);

  connections.push(
    { id: 'CONN-OR-4', fromComponentId: 'DS-OPEN', fromTerminalId: 'DS-OPEN-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' },
    { id: 'CONN-OR-LD2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'LD-2', toTerminalId: 'LD-2-t1' },
    { id: 'CONN-OR-5', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t1', toComponentId: 'CB-RET', toTerminalId: 'CB-RET-t2' },
    { id: 'CONN-OR-6', fromComponentId: 'CB-RET', fromTerminalId: 'CB-RET-t1', toComponentId: 'SRC-2', toTerminalId: 'SRC-2-t1' }
  );

  return { components, connections };
}

/**
 * 14. Subestación Encapsulada GIS (SF6)
 */

/** 14. Subestación Encapsulada GIS en SF6 */
export function buildGISCompactPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const bbGis1 = createComponent(ComponentType.BUSBAR, { id: 'BB-GIS-1', name: 'Barra GIS 1 (110 kV)', x: 80, y: 90, width: 550, terminalCount: 3, properties: { voltageLevel: 110 } });
  const bbGis2 = createComponent(ComponentType.BUSBAR, { id: 'BB-GIS-2', name: 'Barra GIS 2 (110 kV)', x: 80, y: 170, width: 550, terminalCount: 3, properties: { voltageLevel: 110 } });
  components.push(bbGis1, bbGis2);

  // Acople GIS
  const cbGisTie = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-GIS-TIE', name: 'Int. Acople GIS', x: 130, y: 130, operationalState: OperationalState.CLOSED });
  components.push(cbGisTie);
  connections.push(
    { id: 'CONN-GIS-T1', fromComponentId: 'BB-GIS-1', fromTerminalId: 'BB-GIS-1-t1', toComponentId: 'CB-GIS-TIE', toTerminalId: 'CB-GIS-TIE-t1' },
    { id: 'CONN-GIS-T2', fromComponentId: 'CB-GIS-TIE', fromTerminalId: 'CB-GIS-TIE-t2', toComponentId: 'BB-GIS-2', toTerminalId: 'BB-GIS-2-t1' }
  );

  // Entrada GIS
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-1', name: 'Cable Subterráneo 110 kV', x: 260, y: 20, properties: { voltageLevel: 110 } });
  const cbSrc = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-SRC', name: 'Int. Entrada GIS', x: 260, y: 130, operationalState: OperationalState.CLOSED });
  components.push(src1, cbSrc);
  connections.push(
    { id: 'CONN-GIS-IN1', fromComponentId: 'SRC-1', fromTerminalId: 'SRC-1-t1', toComponentId: 'CB-SRC', toTerminalId: 'CB-SRC-t1' },
    { id: 'CONN-GIS-IN2', fromComponentId: 'CB-SRC', fromTerminalId: 'CB-SRC-t2', toComponentId: 'BB-GIS-1', toTerminalId: 'BB-GIS-1-t2' }
  );

  // Salida GIS con Transformador
  const cbOut = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-OUT', name: 'Int. Trafo GIS', x: 440, y: 130, operationalState: OperationalState.CLOSED });
  const trGis = createComponent(ComponentType.TRANSFORMER, { id: 'TR-GIS', name: 'Trafo GIS (110/23 kV)', x: 435, y: 230, properties: { voltageLevel: 110, secondaryVoltage: 23, ratedPower: 50 } });
  const ld1 = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-1', name: 'Distribución Urbana (23 kV)', x: 440, y: 350, properties: { voltageLevel: 23, ratedPower: 45 } });
  components.push(cbOut, trGis, ld1);

  connections.push(
    { id: 'CONN-GIS-O1', fromComponentId: 'BB-GIS-2', fromTerminalId: 'BB-GIS-2-t3', toComponentId: 'CB-OUT', toTerminalId: 'CB-OUT-t1' },
    { id: 'CONN-GIS-O2', fromComponentId: 'CB-OUT', fromTerminalId: 'CB-OUT-t2', toComponentId: 'TR-GIS', toTerminalId: 'TR-GIS-t1' },
    { id: 'CONN-GIS-O3', fromComponentId: 'TR-GIS', fromTerminalId: 'TR-GIS-t2', toComponentId: 'LD-1', toTerminalId: 'LD-1-t1' }
  );

  return { components, connections };
}

/**
 * 15. Subestación Colectora Solar Fotovoltaica
 */

/** 15. Colectora Parque Solar Fotovoltaico */
export function buildSolarPVCollectorPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Barra colectora 23 kV
  const bbCol = createComponent(ComponentType.BUSBAR, { id: 'BB-COL', name: 'Barra Colectora MT (23 kV)', x: 80, y: 150, width: 550, terminalCount: 4, properties: { voltageLevel: 23 } });
  components.push(bbCol);

  // 3 Bloques de generación fotovoltaica
  const pv1 = createComponent(ComponentType.SOURCE, { id: 'PV-1', name: 'Inversores Campo Solar 1', x: 120, y: 30, properties: { voltageLevel: 23, ratedPower: 25 } });
  const cbPv1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-PV1', name: 'Int. Colector 1', x: 120, y: 90, operationalState: OperationalState.CLOSED });
  const pv2 = createComponent(ComponentType.SOURCE, { id: 'PV-2', name: 'Inversores Campo Solar 2', x: 260, y: 30, properties: { voltageLevel: 23, ratedPower: 25 } });
  const cbPv2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-PV2', name: 'Int. Colector 2', x: 260, y: 90, operationalState: OperationalState.CLOSED });
  const pv3 = createComponent(ComponentType.SOURCE, { id: 'PV-3', name: 'Inversores Campo Solar 3', x: 400, y: 30, properties: { voltageLevel: 23, ratedPower: 25 } });
  const cbPv3 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-PV3', name: 'Int. Colector 3', x: 400, y: 90, operationalState: OperationalState.CLOSED });
  components.push(pv1, cbPv1, pv2, cbPv2, pv3, cbPv3);

  connections.push(
    { id: 'CONN-PV1-1', fromComponentId: 'PV-1', fromTerminalId: 'PV-1-t1', toComponentId: 'CB-PV1', toTerminalId: 'CB-PV1-t1' },
    { id: 'CONN-PV1-2', fromComponentId: 'CB-PV1', fromTerminalId: 'CB-PV1-t2', toComponentId: 'BB-COL', toTerminalId: 'BB-COL-t1' },
    { id: 'CONN-PV2-1', fromComponentId: 'PV-2', fromTerminalId: 'PV-2-t1', toComponentId: 'CB-PV2', toTerminalId: 'CB-PV2-t1' },
    { id: 'CONN-PV2-2', fromComponentId: 'CB-PV2', fromTerminalId: 'CB-PV2-t2', toComponentId: 'BB-COL', toTerminalId: 'BB-COL-t2' },
    { id: 'CONN-PV3-1', fromComponentId: 'PV-3', fromTerminalId: 'PV-3-t1', toComponentId: 'CB-PV3', toTerminalId: 'CB-PV3-t1' },
    { id: 'CONN-PV3-2', fromComponentId: 'CB-PV3', fromTerminalId: 'CB-PV3-t2', toComponentId: 'BB-COL', toTerminalId: 'BB-COL-t3' }
  );

  // Bahía GSU Elevadora hacia Red 110 kV
  const cbGsu = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-GSU', name: 'Int. Principal GSU', x: 540, y: 200, operationalState: OperationalState.CLOSED });
  const trGsu = createComponent(ComponentType.TRANSFORMER, { id: 'TR-GSU', name: 'Trafo Elevador (23/110 kV)', x: 535, y: 280, properties: { voltageLevel: 23, secondaryVoltage: 110, ratedPower: 80 } });
  const cbGrid = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-GRID', name: 'Int. Inyección SEN', x: 540, y: 390, operationalState: OperationalState.CLOSED });
  const ldGrid = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-GRID', name: 'Inyección Red Troncal 110 kV', x: 545, y: 480, properties: { voltageLevel: 110, ratedPower: 75 } });
  components.push(cbGsu, trGsu, cbGrid, ldGrid);

  connections.push(
    { id: 'CONN-COL-GSU', fromComponentId: 'BB-COL', fromTerminalId: 'BB-COL-t4', toComponentId: 'CB-GSU', toTerminalId: 'CB-GSU-t1' },
    { id: 'CONN-GSU-TR', fromComponentId: 'CB-GSU', fromTerminalId: 'CB-GSU-t2', toComponentId: 'TR-GSU', toTerminalId: 'TR-GSU-t1' },
    { id: 'CONN-TR-GRID', fromComponentId: 'TR-GSU', fromTerminalId: 'TR-GSU-t2', toComponentId: 'CB-GRID', toTerminalId: 'CB-GRID-t1' },
    { id: 'CONN-GRID-OUT', fromComponentId: 'CB-GRID', fromTerminalId: 'CB-GRID-t2', toComponentId: 'LD-GRID', toTerminalId: 'LD-GRID-t1' }
  );

  return { components, connections };
}

/**
 * 16. Evacuación de Parque Eólico
 */

/** 16. Evacuación Parque Eólico con STATCOM */
export function buildWindFarmEvacuationPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  const bbWind = createComponent(ComponentType.BUSBAR, { id: 'BB-WIND', name: 'Barra Colectora Eólica (33 kV)', x: 80, y: 150, width: 550, terminalCount: 4, properties: { voltageLevel: 66 } });
  components.push(bbWind);

  // Aerogeneradores
  const wtg1 = createComponent(ComponentType.SOURCE, { id: 'WTG-1', name: 'Circuito Aerogeneradores 1', x: 120, y: 30, properties: { voltageLevel: 66, ratedPower: 40 } });
  const wtg2 = createComponent(ComponentType.SOURCE, { id: 'WTG-2', name: 'Circuito Aerogeneradores 2', x: 260, y: 30, properties: { voltageLevel: 66, ratedPower: 40 } });
  const cbW1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-W1', name: 'Int. Eólico 1', x: 120, y: 90, operationalState: OperationalState.CLOSED });
  const cbW2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-W2', name: 'Int. Eólico 2', x: 260, y: 90, operationalState: OperationalState.CLOSED });
  // Banco Reactivo / STATCOM
  const ldComp = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-COMP', name: 'Compensación STATCOM', x: 400, y: 250, properties: { voltageLevel: 66, ratedPower: 15 } });
  components.push(wtg1, wtg2, cbW1, cbW2, ldComp);

  connections.push(
    { id: 'CONN-W1-CB', fromComponentId: 'WTG-1', fromTerminalId: 'WTG-1-t1', toComponentId: 'CB-W1', toTerminalId: 'CB-W1-t1' },
    { id: 'CONN-W1-BB', fromComponentId: 'CB-W1', fromTerminalId: 'CB-W1-t2', toComponentId: 'BB-WIND', toTerminalId: 'BB-WIND-t1' },
    { id: 'CONN-W2-CB', fromComponentId: 'WTG-2', fromTerminalId: 'WTG-2-t1', toComponentId: 'CB-W2', toTerminalId: 'CB-W2-t1' },
    { id: 'CONN-W2-BB', fromComponentId: 'CB-W2', fromTerminalId: 'CB-W2-t2', toComponentId: 'BB-WIND', toTerminalId: 'BB-WIND-t2' },
    { id: 'CONN-COMP-BB', fromComponentId: 'BB-WIND', fromTerminalId: 'BB-WIND-t3', toComponentId: 'LD-COMP', toTerminalId: 'LD-COMP-t1' }
  );

  // Transformador Elevador y salida 220 kV
  const trWind = createComponent(ComponentType.TRANSFORMER, { id: 'TR-WIND', name: 'Trafo Eólico (66/220 kV)', x: 535, y: 220, properties: { voltageLevel: 66, secondaryVoltage: 220, ratedPower: 100 } });
  const cbHv = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-HV', name: 'Int. Evacuación 220 kV', x: 540, y: 330, operationalState: OperationalState.CLOSED });
  const ldGrid = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-GRID', name: 'Inyección Red 220 kV', x: 545, y: 430, properties: { voltageLevel: 220, ratedPower: 80 } });
  components.push(trWind, cbHv, ldGrid);

  connections.push(
    { id: 'CONN-WIND-TR', fromComponentId: 'BB-WIND', fromTerminalId: 'BB-WIND-t4', toComponentId: 'TR-WIND', toTerminalId: 'TR-WIND-t1' },
    { id: 'CONN-TR-HV', fromComponentId: 'TR-WIND', fromTerminalId: 'TR-WIND-t2', toComponentId: 'CB-HV', toTerminalId: 'CB-HV-t1' },
    { id: 'CONN-HV-OUT', fromComponentId: 'CB-HV', fromTerminalId: 'CB-HV-t2', toComponentId: 'LD-GRID', toTerminalId: 'LD-GRID-t1' }
  );

  return { components, connections };
}

/**
 * 17. Industrial Pesada Minera / Siderúrgica
 */

/** 17. Subestación Industrial Pesada Minera / Siderúrgica */
export function buildHeavyIndustrialPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Doble Acometida 220 kV
  const src1 = createComponent(ComponentType.SOURCE, { id: 'SRC-UTIL1', name: 'Línea Externa 1 (220 kV)', x: 180, y: 30, properties: { voltageLevel: 220 } });
  const src2 = createComponent(ComponentType.SOURCE, { id: 'SRC-UTIL2', name: 'Línea Externa 2 (220 kV)', x: 480, y: 30, properties: { voltageLevel: 220 } });
  const cbU1 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-U1', name: 'Int. Red 1', x: 180, y: 100, operationalState: OperationalState.CLOSED });
  const cbU2 = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-U2', name: 'Int. Red 2', x: 480, y: 100, operationalState: OperationalState.CLOSED });
  components.push(src1, src2, cbU1, cbU2);

  // Transformadores de Potencia Reductores 220/23 kV
  const tr1 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-1', name: 'Trafo Reductor 1 (80 MVA)', x: 180, y: 190, properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 80 } });
  const tr2 = createComponent(ComponentType.TRANSFORMER, { id: 'TR-2', name: 'Trafo Reductor 2 (80 MVA)', x: 480, y: 190, properties: { voltageLevel: 220, secondaryVoltage: 23, ratedPower: 80 } });
  components.push(tr1, tr2);

  connections.push(
    { id: 'CONN-IND-U1', fromComponentId: 'SRC-UTIL1', fromTerminalId: 'SRC-UTIL1-t1', toComponentId: 'CB-U1', toTerminalId: 'CB-U1-t1' },
    { id: 'CONN-IND-U2', fromComponentId: 'SRC-UTIL2', fromTerminalId: 'SRC-UTIL2-t1', toComponentId: 'CB-U2', toTerminalId: 'CB-U2-t1' },
    { id: 'CONN-IND-T1', fromComponentId: 'CB-U1', fromTerminalId: 'CB-U1-t2', toComponentId: 'TR-1', toTerminalId: 'TR-1-t1' },
    { id: 'CONN-IND-T2', fromComponentId: 'CB-U2', fromTerminalId: 'CB-U2-t2', toComponentId: 'TR-2', toTerminalId: 'TR-2-t1' }
  );

  // Barra Seccionada 23 kV
  const bbMv1 = createComponent(ComponentType.BUSBAR, { id: 'BB-MV1', name: 'Barra Molienda 23 kV', x: 80, y: 310, width: 250, terminalCount: 3, properties: { voltageLevel: 23 } });
  const bbMv2 = createComponent(ComponentType.BUSBAR, { id: 'BB-MV2', name: 'Barra Flotación 23 kV', x: 400, y: 310, width: 250, terminalCount: 3, properties: { voltageLevel: 23 } });
  const cbTieMv = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TIE-MV', name: 'Int. Acople 23 kV', x: 335, y: 310, operationalState: OperationalState.CLOSED });
  components.push(bbMv1, bbMv2, cbTieMv);

  connections.push(
    { id: 'CONN-IND-B1', fromComponentId: 'TR-1', fromTerminalId: 'TR-1-t2', toComponentId: 'BB-MV1', toTerminalId: 'BB-MV1-t1' },
    { id: 'CONN-IND-B2', fromComponentId: 'TR-2', fromTerminalId: 'TR-2-t2', toComponentId: 'BB-MV2', toTerminalId: 'BB-MV2-t3' },
    { id: 'CONN-TIE-M1', fromComponentId: 'BB-MV1', fromTerminalId: 'BB-MV1-t3', toComponentId: 'CB-TIE-MV', toTerminalId: 'CB-TIE-MV-t1' },
    { id: 'CONN-TIE-M2', fromComponentId: 'CB-TIE-MV', fromTerminalId: 'CB-TIE-MV-t2', toComponentId: 'BB-MV2', toTerminalId: 'BB-MV2-t1' }
  );

  // Cargas Industriales
  const ldSag = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-SAG', name: 'Molino SAG Principal', x: 180, y: 430, properties: { voltageLevel: 23, ratedPower: 35 } });
  const ldFlot = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-FLOT', name: 'Planta de Flotación', x: 480, y: 430, properties: { voltageLevel: 23, ratedPower: 30 } });
  components.push(ldSag, ldFlot);

  connections.push(
    { id: 'CONN-LD-SAG', fromComponentId: 'BB-MV1', fromTerminalId: 'BB-MV1-t2', toComponentId: 'LD-SAG', toTerminalId: 'LD-SAG-t1' },
    { id: 'CONN-LD-FLOT', fromComponentId: 'BB-MV2', fromTerminalId: 'BB-MV2-t2', toComponentId: 'LD-FLOT', toTerminalId: 'LD-FLOT-t1' }
  );

  return { components, connections };
}

/**
 * 18. Data Center Tier IV (Topología 2N)
 */

/** 18. Data Center Tier IV con Redundancia Activa 2N */
export function buildMissionCriticalDataCenterPreset() {
  resetComponentCounters();
  const components = [];
  const connections = [];

  // Acometidas independientes de Red Eléctrica
  const srcA = createComponent(ComponentType.SOURCE, { id: 'SRC-GRID-A', name: 'Acometida Red A (23 kV)', x: 140, y: 30, properties: { voltageLevel: 23 } });
  const srcB = createComponent(ComponentType.SOURCE, { id: 'SRC-GRID-B', name: 'Acometida Red B (23 kV)', x: 500, y: 30, properties: { voltageLevel: 23 } });
  const cbA = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-GRID-A', name: 'Int. Entrada A', x: 140, y: 100, operationalState: OperationalState.CLOSED });
  const cbB = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-GRID-B', name: 'Int. Entrada B', x: 500, y: 100, operationalState: OperationalState.CLOSED });
  components.push(srcA, srcB, cbA, cbB);

  // Barras A y B
  const bbA = createComponent(ComponentType.BUSBAR, { id: 'BB-DC-A', name: 'Barra Sala IT - Rama A', x: 70, y: 190, width: 250, terminalCount: 3, properties: { voltageLevel: 23 } });
  const bbB = createComponent(ComponentType.BUSBAR, { id: 'BB-DC-B', name: 'Barra Sala IT - Rama B', x: 420, y: 190, width: 250, terminalCount: 3, properties: { voltageLevel: 23 } });
  // Interruptor de amarre sincronizado (normalmente abierto)
  const cbTie = createComponent(ComponentType.CIRCUIT_BREAKER, { id: 'CB-TIE-DC', name: 'Acople Sincronizado (N.O.)', x: 330, y: 190, operationalState: OperationalState.OPEN });
  components.push(bbA, bbB, cbTie);

  connections.push(
    { id: 'CONN-DC-IN-A', fromComponentId: 'SRC-GRID-A', fromTerminalId: 'SRC-GRID-A-t1', toComponentId: 'CB-GRID-A', toTerminalId: 'CB-GRID-A-t1' },
    { id: 'CONN-DC-BB-A', fromComponentId: 'CB-GRID-A', fromTerminalId: 'CB-GRID-A-t2', toComponentId: 'BB-DC-A', toTerminalId: 'BB-DC-A-t1' },
    { id: 'CONN-DC-IN-B', fromComponentId: 'SRC-GRID-B', fromTerminalId: 'SRC-GRID-B-t1', toComponentId: 'CB-GRID-B', toTerminalId: 'CB-GRID-B-t1' },
    { id: 'CONN-DC-BB-B', fromComponentId: 'CB-GRID-B', fromTerminalId: 'CB-GRID-B-t2', toComponentId: 'BB-DC-B', toTerminalId: 'BB-DC-B-t3' },
    { id: 'CONN-DC-TIE1', fromComponentId: 'BB-DC-A', fromTerminalId: 'BB-DC-A-t3', toComponentId: 'CB-TIE-DC', toTerminalId: 'CB-TIE-DC-t1' },
    { id: 'CONN-DC-TIE2', fromComponentId: 'CB-TIE-DC', fromTerminalId: 'CB-TIE-DC-t2', toComponentId: 'BB-DC-B', toTerminalId: 'BB-DC-B-t1' }
  );

  // Generador de Emergencia (Respaldo en Rama A)
  const genD = createComponent(ComponentType.SOURCE, { id: 'GEN-EMERG', name: 'Grupos Diésel Respaldo', x: 320, y: 30, operationalState: OperationalState.OPEN, properties: { voltageLevel: 23, ratedPower: 20 } });
  components.push(genD);
  connections.push({ id: 'CONN-GEN-DC', fromComponentId: 'GEN-EMERG', fromTerminalId: 'GEN-EMERG-t1', toComponentId: 'BB-DC-A', toTerminalId: 'BB-DC-A-t2' });

  // Cargas Críticas 2N (Servidores Sala A y Sala B)
  const ldItA = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-IT-A', name: 'Racks Servidores A (2N)', x: 170, y: 300, properties: { voltageLevel: 23, ratedPower: 15 } });
  const ldItB = createComponent(ComponentType.FEEDER_LOAD, { id: 'LD-IT-B', name: 'Racks Servidores B (2N)', x: 520, y: 300, properties: { voltageLevel: 23, ratedPower: 15 } });
  components.push(ldItA, ldItB);

  connections.push(
    { id: 'CONN-IT-A', fromComponentId: 'BB-DC-A', fromTerminalId: 'BB-DC-A-t2', toComponentId: 'LD-IT-A', toTerminalId: 'LD-IT-A-t1' },
    { id: 'CONN-IT-B', fromComponentId: 'BB-DC-B', fromTerminalId: 'BB-DC-B-t2', toComponentId: 'LD-IT-B', toTerminalId: 'LD-IT-B-t1' }
  );

  return { components, connections };
}

/**
 * Mapa de constructores por clave de topología (18 plantillas).
 */

/**
 * Mapa de constructores por clave de topología (18 plantillas).
 */
const PRESET_BUILDERS = {
  [TOPOLOGY_PRESET_KEYS.SINGLE_BUS]: buildSingleBusPreset,
  [TOPOLOGY_PRESET_KEYS.MAIN_TRANSFER]: buildMainTransferPreset,
  [TOPOLOGY_PRESET_KEYS.SECTIONALIZED_BUS]: buildSectionalizedBusPreset,
  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_SINGLE_BREAKER]: buildDoubleBusSingleBreakerPreset,
  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_TRANSFER]: buildDoubleBusTransferPreset,
  [TOPOLOGY_PRESET_KEYS.RING_BUS]: buildRingBusPreset,
  [TOPOLOGY_PRESET_KEYS.RING_BUS_6CB]: buildRingBus6CBPreset,
  [TOPOLOGY_PRESET_KEYS.BREAKER_AND_A_HALF]: buildBreakerAndAHalfPreset,
  [TOPOLOGY_PRESET_KEYS.DOUBLE_BUS_DOUBLE_BREAKER]: buildDoubleBusDoubleBreakerPreset,

  [TOPOLOGY_PRESET_KEYS.H_SCHEME_BRIDGE]: buildHSchemeBridgePreset,
  [TOPOLOGY_PRESET_KEYS.LINE_BRIDGE]: buildLineBridgePreset,
  [TOPOLOGY_PRESET_KEYS.DUAL_RADIAL]: buildDualRadialPreset,
  [TOPOLOGY_PRESET_KEYS.OPEN_RING_DISTRIBUTION]: buildOpenRingDistributionPreset,
  [TOPOLOGY_PRESET_KEYS.GIS_COMPACT]: buildGISCompactPreset,

  [TOPOLOGY_PRESET_KEYS.SOLAR_PV_COLLECTOR]: buildSolarPVCollectorPreset,
  [TOPOLOGY_PRESET_KEYS.WIND_FARM_EVACUATION]: buildWindFarmEvacuationPreset,
  [TOPOLOGY_PRESET_KEYS.HEAVY_INDUSTRIAL]: buildHeavyIndustrialPreset,
  [TOPOLOGY_PRESET_KEYS.MISSION_CRITICAL_DATA_CENTER]: buildMissionCriticalDataCenterPreset
};

/**
 * Aplica una transformación de espaciado geométrico a una colección de componentes.
 * Separa de manera holgada y proporcional las bahías (X) y niveles jerárquicos (Y)
 * para evitar colisiones entre etiquetas de texto y bornes galvánicos contiguos.
 * @param {Array<Object>} components
 * @param {Array<Object>} connections
 * @param {Object} [options]
 * @returns {{ components: Array<Object>, connections: Array<Object> }}
 */
export function applyLayoutSpacing(components, connections, options = {}) {
  if (!components || components.length === 0) return { components, connections };

  const scaleX = options.scaleX ?? 1.6;
  const scaleY = options.scaleY ?? 1.45;

  let minX = Infinity;
  let minY = Infinity;
  for (const c of components) {
    if (c.position.x < minX) minX = c.position.x;
    if (c.position.y < minY) minY = c.position.y;
  }
  if (!isFinite(minX)) minX = 0;
  if (!isFinite(minY)) minY = 0;

  const originX = minX;
  const originY = minY;

  for (const c of components) {
    const oldX = c.position.x;
    const oldY = c.position.y;

    c.position.x = Math.round(originX + (oldX - originX) * scaleX);
    c.position.y = Math.round(originY + (oldY - originY) * scaleY);

    if (c.type === ComponentType.BUSBAR) {
      c.dimensions.width = Math.round(c.dimensions.width * scaleX);
    }
  }

  return { components, connections };
}

/**
 * Carga una topología predefinida en el NetworkModel activo.
 * @param {import('./network-model.js').NetworkModel} networkModel
 * @param {string} presetKey
 * @param {Object} [options]
 * @returns {{ metadata: Object, componentsCount: number, connectionsCount: number }}
 */
export function loadTopologyPreset(networkModel, presetKey, options = {}) {
  const builder = PRESET_BUILDERS[presetKey];
  if (!builder) {
    throw new Error(`[TopologyPresets] Topología predefinida '${presetKey}' no reconocida.`);
  }

  const metadata = TOPOLOGY_PRESETS_METADATA[presetKey];
  networkModel.clear();

  const rawPreset = builder();
  const { components, connections } = applyLayoutSpacing(rawPreset.components, rawPreset.connections, options);

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
