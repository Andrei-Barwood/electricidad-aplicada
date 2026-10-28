/**
 * Components Model - SubstationTopologySim
 * Definiciones, fábricas, estados operacionales y terminales eléctricos.
 */

export const ComponentType = Object.freeze({
  BUSBAR: 'BUSBAR',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  DISCONNECTOR: 'DISCONNECTOR',
  TRANSFORMER: 'TRANSFORMER',
  FEEDER_LOAD: 'FEEDER_LOAD',
  SOURCE: 'SOURCE'
});

export const OperationalState = Object.freeze({
  CLOSED: 'CLOSED',                 // Cerrado (conduce corriente)
  OPEN: 'OPEN',                     // Abierto (aislamiento galvánico)
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'  // Fuera de servicio / Bloqueo / Mantenimiento
});

let idCounters = {
  BUSBAR: 1,
  CIRCUIT_BREAKER: 1,
  DISCONNECTOR: 1,
  TRANSFORMER: 1,
  FEEDER_LOAD: 1,
  SOURCE: 1
};

/**
 * Resetea los contadores de identificadores.
 */
export function resetComponentCounters() {
  idCounters = {
    BUSBAR: 1,
    CIRCUIT_BREAKER: 1,
    DISCONNECTOR: 1,
    TRANSFORMER: 1,
    FEEDER_LOAD: 1,
    SOURCE: 1
  };
}

/**
 * Genera un identificador técnico normalizado.
 * @param {string} type
 * @returns {string}
 */
export function generateComponentId(type) {
  const prefixMap = {
    [ComponentType.BUSBAR]: 'BB',
    [ComponentType.CIRCUIT_BREAKER]: 'CB',
    [ComponentType.DISCONNECTOR]: 'DS',
    [ComponentType.TRANSFORMER]: 'TR',
    [ComponentType.FEEDER_LOAD]: 'LD',
    [ComponentType.SOURCE]: 'SRC'
  };

  const prefix = prefixMap[type] || 'CMP';
  const num = idCounters[type] ? idCounters[type]++ : Date.now();
  return `${prefix}-${num}`;
}

/**
 * Crea un componente eléctrico con su modelo formal de datos.
 * @param {string} type
 * @param {Object} options
 * @returns {Object}
 */
export function createComponent(type, options = {}) {
  const id = options.id || generateComponentId(type);
  const x = options.x ?? 100;
  const y = options.y ?? 100;

  // Parámetros de confiabilidad por defecto (datos preliminares de ingeniería estándar CIGRE / IEEE)
  const defaultReliability = {
    [ComponentType.BUSBAR]: { failureRate: 0.005, mttrHours: 12 },            // 0.005 fallas/año
    [ComponentType.CIRCUIT_BREAKER]: { failureRate: 0.020, mttrHours: 24 },    // 0.02 fallas/año
    [ComponentType.DISCONNECTOR]: { failureRate: 0.008, mttrHours: 8 },        // 0.008 fallas/año
    [ComponentType.TRANSFORMER]: { failureRate: 0.015, mttrHours: 72 },       // 0.015 fallas/año
    [ComponentType.FEEDER_LOAD]: { failureRate: 0.040, mttrHours: 6 },         // 0.04 fallas/año
    [ComponentType.SOURCE]: { failureRate: 0.010, mttrHours: 10 }              // 0.01 fallas/año
  }[type] || { failureRate: 0.01, mttrHours: 12 };

  const failureRate = options.failureRate ?? defaultReliability.failureRate;
  const mttrHours = options.mttrHours ?? defaultReliability.mttrHours;
  // mu = 8760 horas/año / MTTR
  const repairRate = mttrHours > 0 ? (8760 / mttrHours) : 8760;
  const availability = repairRate / (failureRate + repairRate);
  const unavailability = 1 - availability;

  // Propiedades eléctricas específicas por tipo
  let dimensions = { width: 60, height: 60 };
  let terminals = [];
  let name = options.name;
  let operationalState = options.operationalState ?? OperationalState.CLOSED;

  switch (type) {
    case ComponentType.BUSBAR:
      dimensions = { width: options.width || 240, height: 16 };
      name = name || `Barra ${id}`;
      // Las barras poseen terminales distribuidos a lo largo del riel
      if (options.terminals && Array.isArray(options.terminals)) {
        terminals = options.terminals;
      } else if (options.terminalCount && options.terminalCount > 0) {
        terminals = [];
        const count = options.terminalCount;
        for (let i = 1; i <= count; i++) {
          terminals.push({
            id: `${id}-t${i}`,
            name: `P${i}`,
            relX: i / (count + 1),
            relY: 0.5
          });
        }
      } else {
        terminals = [
          { id: `${id}-t1`, name: 'P1', relX: 0.2, relY: 0.5 },
          { id: `${id}-t2`, name: 'P2', relX: 0.4, relY: 0.5 },
          { id: `${id}-t3`, name: 'P3', relX: 0.6, relY: 0.5 },
          { id: `${id}-t4`, name: 'P4', relX: 0.8, relY: 0.5 }
        ];
      }
      break;

    case ComponentType.CIRCUIT_BREAKER:
      dimensions = { width: 50, height: 50 };
      name = name || `Int. ${id}`;
      operationalState = options.operationalState ?? OperationalState.CLOSED;
      terminals = [
        { id: `${id}-t1`, name: 'In', relX: 0.5, relY: 0.0 },
        { id: `${id}-t2`, name: 'Out', relX: 0.5, relY: 1.0 }
      ];
      break;

    case ComponentType.DISCONNECTOR:
      dimensions = { width: 50, height: 50 };
      name = name || `Secc. ${id}`;
      operationalState = options.operationalState ?? OperationalState.CLOSED;
      terminals = [
        { id: `${id}-t1`, name: 'In', relX: 0.5, relY: 0.0 },
        { id: `${id}-t2`, name: 'Out', relX: 0.5, relY: 1.0 }
      ];
      break;

    case ComponentType.TRANSFORMER:
      dimensions = { width: 60, height: 80 };
      name = name || `Trafo ${id}`;
      terminals = [
        { id: `${id}-t1`, name: 'Primario', relX: 0.5, relY: 0.0 },
        { id: `${id}-t2`, name: 'Secundario', relX: 0.5, relY: 1.0 }
      ];
      break;

    case ComponentType.FEEDER_LOAD:
      dimensions = { width: 50, height: 60 };
      name = name || `Carga ${id}`;
      terminals = [
        { id: `${id}-t1`, name: 'Alimentación', relX: 0.5, relY: 0.0 }
      ];
      break;

    case ComponentType.SOURCE:
      dimensions = { width: 50, height: 60 };
      name = name || `Red ${id}`;
      terminals = [
        { id: `${id}-t1`, name: 'Salida', relX: 0.5, relY: 1.0 }
      ];
      break;

    default:
      name = name || id;
      terminals = [
        { id: `${id}-t1`, name: 'T1', relX: 0.5, relY: 0.0 },
        { id: `${id}-t2`, name: 'T2', relX: 0.5, relY: 1.0 }
      ];
  }

  return {
    id,
    type,
    name,
    position: { x, y },
    dimensions,
    terminals,
    operationalState,
    isEnergized: options.isEnergized ?? false,
    availability,
    unavailability,
    failureRate,
    repairRate,
    mttrHours,
    properties: {
      voltageLevel: options.voltageLevel || 220, // kV
      ratedCurrent: options.ratedCurrent || 1250, // A
      ratedPower: options.ratedPower || 50,       // MVA / MW
      ...options.properties
    }
  };
}
