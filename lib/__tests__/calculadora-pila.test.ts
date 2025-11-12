import {
  calcularIBC,
  calcularSalud,
  calcularPension,
  calcularARL,
  calcularTotalAportes,
  calcularFechaLimite,
  formatearPeriodo,
  formatearMoneda,
  validarIBC,
  obtenerPorcentajeARL,
  SMMLV_2025,
  IBC_MINIMO,
  IBC_MAXIMO,
  PORCENTAJE_SALUD,
  PORCENTAJE_PENSION,
  PORCENTAJES_ARL,
} from '../calculadora-pila';

describe('Calculadora PILA - Constantes', () => {
  it('debe tener el SMMLV 2025 correcto', () => {
    expect(SMMLV_2025).toBe(1423500);
  });

  it('debe tener IBC_MINIMO igual a 1 SMMLV', () => {
    expect(IBC_MINIMO).toBe(SMMLV_2025);
  });

  it('debe tener IBC_MAXIMO igual a 25 SMMLV', () => {
    expect(IBC_MAXIMO).toBe(SMMLV_2025 * 25);
  });

  it('debe tener porcentajes de cotización correctos', () => {
    expect(PORCENTAJE_SALUD).toBe(12.5);
    expect(PORCENTAJE_PENSION).toBe(16.0);
  });

  it('debe tener los 5 niveles de riesgo ARL', () => {
    expect(PORCENTAJES_ARL).toHaveProperty('I');
    expect(PORCENTAJES_ARL).toHaveProperty('II');
    expect(PORCENTAJES_ARL).toHaveProperty('III');
    expect(PORCENTAJES_ARL).toHaveProperty('IV');
    expect(PORCENTAJES_ARL).toHaveProperty('V');
  });
});

describe('calcularIBC', () => {
  it('debe retornar el IBC sin ajustes para ingresos normales', () => {
    const resultado = calcularIBC(3000000);
    expect(resultado.ibc).toBe(3000000);
    expect(resultado.ajustado).toBe(false);
    expect(resultado.ingresoReportado).toBe(3000000);
    expect(resultado.motivoAjuste).toBeUndefined();
  });

  it('debe ajustar al mínimo si ingreso es menor a 1 SMMLV', () => {
    const resultado = calcularIBC(1000000);
    expect(resultado.ibc).toBe(SMMLV_2025);
    expect(resultado.ajustado).toBe(true);
    expect(resultado.motivoAjuste).toBe('MINIMO');
    expect(resultado.ingresoReportado).toBe(1000000);
  });

  it('debe ajustar al máximo si ingreso excede 25 SMMLV', () => {
    const resultado = calcularIBC(50000000);
    expect(resultado.ibc).toBe(SMMLV_2025 * 25);
    expect(resultado.ajustado).toBe(true);
    expect(resultado.motivoAjuste).toBe('MAXIMO');
    expect(resultado.ingresoReportado).toBe(50000000);
  });

  it('debe aceptar exactamente 1 SMMLV sin ajustar', () => {
    const resultado = calcularIBC(SMMLV_2025);
    expect(resultado.ibc).toBe(SMMLV_2025);
    expect(resultado.ajustado).toBe(false);
  });

  it('debe aceptar exactamente 25 SMMLV sin ajustar', () => {
    const resultado = calcularIBC(SMMLV_2025 * 25);
    expect(resultado.ibc).toBe(SMMLV_2025 * 25);
    expect(resultado.ajustado).toBe(false);
  });

  it('debe lanzar error si ingreso es cero', () => {
    expect(() => calcularIBC(0)).toThrow('El ingreso mensual debe ser mayor a cero');
  });

  it('debe lanzar error si ingreso es negativo', () => {
    expect(() => calcularIBC(-1000)).toThrow('El ingreso mensual debe ser mayor a cero');
  });

  it('debe redondear el IBC a entero', () => {
    const resultado = calcularIBC(3000000.75);
    expect(resultado.ibc).toBe(3000001);
    expect(Number.isInteger(resultado.ibc)).toBe(true);
  });
});

describe('calcularSalud', () => {
  it('debe calcular correctamente el 12.5% del IBC', () => {
    const salud = calcularSalud(3000000);
    expect(salud).toBe(375000);
  });

  it('debe calcular correctamente para 1 SMMLV', () => {
    const salud = calcularSalud(SMMLV_2025);
    const esperado = Math.round(SMMLV_2025 * 0.125);
    expect(salud).toBe(esperado);
  });

  it('debe redondear al entero más cercano', () => {
    const salud = calcularSalud(2000000);
    expect(Number.isInteger(salud)).toBe(true);
    expect(salud).toBe(250000);
  });

  it('debe lanzar error si IBC es cero', () => {
    expect(() => calcularSalud(0)).toThrow('IBC debe ser mayor a cero');
  });

  it('debe lanzar error si IBC es negativo', () => {
    expect(() => calcularSalud(-100)).toThrow('IBC debe ser mayor a cero');
  });
});

describe('calcularPension', () => {
  it('debe calcular correctamente el 16% del IBC', () => {
    const pension = calcularPension(3000000);
    expect(pension).toBe(480000);
  });

  it('debe calcular correctamente para 1 SMMLV', () => {
    const pension = calcularPension(SMMLV_2025);
    const esperado = Math.round(SMMLV_2025 * 0.16);
    expect(pension).toBe(esperado);
  });

  it('debe redondear al entero más cercano', () => {
    const pension = calcularPension(2500000);
    expect(Number.isInteger(pension)).toBe(true);
    expect(pension).toBe(400000);
  });

  it('debe lanzar error si IBC es cero', () => {
    expect(() => calcularPension(0)).toThrow('IBC debe ser mayor a cero');
  });

  it('debe lanzar error si IBC es negativo', () => {
    expect(() => calcularPension(-100)).toThrow('IBC debe ser mayor a cero');
  });
});

describe('calcularARL', () => {
  it('debe calcular correctamente ARL nivel I', () => {
    const arl = calcularARL(3000000, 'I');
    const esperado = Math.round(3000000 * 0.00522);
    expect(arl).toBe(esperado);
  });

  it('debe calcular correctamente ARL nivel II', () => {
    const arl = calcularARL(3000000, 'II');
    const esperado = Math.round(3000000 * 0.01044);
    expect(arl).toBe(esperado);
  });

  it('debe calcular correctamente ARL nivel III', () => {
    const arl = calcularARL(3000000, 'III');
    const esperado = Math.round(3000000 * 0.02436);
    expect(arl).toBe(esperado);
  });

  it('debe calcular correctamente ARL nivel IV', () => {
    const arl = calcularARL(3000000, 'IV');
    const esperado = Math.round(3000000 * 0.04350);
    expect(arl).toBe(esperado);
  });

  it('debe calcular correctamente ARL nivel V', () => {
    const arl = calcularARL(3000000, 'V');
    const esperado = Math.round(3000000 * 0.06960);
    expect(arl).toBe(esperado);
  });

  it('debe redondear al entero más cercano', () => {
    const arl = calcularARL(3000000, 'I');
    expect(Number.isInteger(arl)).toBe(true);
  });

  it('debe lanzar error si IBC es cero', () => {
    expect(() => calcularARL(0, 'I')).toThrow('IBC debe ser mayor a cero');
  });

  it('debe lanzar error si IBC es negativo', () => {
    expect(() => calcularARL(-100, 'I')).toThrow('IBC debe ser mayor a cero');
  });
});

describe('calcularTotalAportes', () => {
  it('debe calcular correctamente todos los aportes', () => {
    const resultado = calcularTotalAportes(3000000, 'I');

    expect(resultado.ibc).toBe(3000000);
    expect(resultado.salud).toBe(375000);
    expect(resultado.pension).toBe(480000);
    expect(resultado.arl).toBe(Math.round(3000000 * 0.00522));
    expect(resultado.total).toBe(
      resultado.salud + resultado.pension + resultado.arl
    );
  });

  it('debe usar nivel de riesgo I por defecto', () => {
    const resultado = calcularTotalAportes(3000000);
    expect(resultado.desglose.arl.nivelRiesgo).toBe('I');
  });

  it('debe incluir desglose completo de salud', () => {
    const resultado = calcularTotalAportes(3000000, 'I');

    expect(resultado.desglose.salud.base).toBe(3000000);
    expect(resultado.desglose.salud.porcentaje).toBe(PORCENTAJE_SALUD);
    expect(resultado.desglose.salud.valor).toBe(375000);
  });

  it('debe incluir desglose completo de pensión', () => {
    const resultado = calcularTotalAportes(3000000, 'I');

    expect(resultado.desglose.pension.base).toBe(3000000);
    expect(resultado.desglose.pension.porcentaje).toBe(PORCENTAJE_PENSION);
    expect(resultado.desglose.pension.valor).toBe(480000);
  });

  it('debe incluir desglose completo de ARL', () => {
    const resultado = calcularTotalAportes(3000000, 'III');

    expect(resultado.desglose.arl.base).toBe(3000000);
    expect(resultado.desglose.arl.porcentaje).toBe(PORCENTAJES_ARL.III);
    expect(resultado.desglose.arl.nivelRiesgo).toBe('III');
    expect(resultado.desglose.arl.valor).toBe(
      Math.round(3000000 * 0.02436)
    );
  });

  it('debe ajustar IBC al mínimo y calcular sobre ese valor', () => {
    const resultado = calcularTotalAportes(1000000, 'I');

    expect(resultado.ibc).toBe(SMMLV_2025);
    expect(resultado.salud).toBe(Math.round(SMMLV_2025 * 0.125));
    expect(resultado.pension).toBe(Math.round(SMMLV_2025 * 0.16));
  });

  it('debe ajustar IBC al máximo y calcular sobre ese valor', () => {
    const resultado = calcularTotalAportes(50000000, 'I');

    expect(resultado.ibc).toBe(SMMLV_2025 * 25);
    expect(resultado.salud).toBe(Math.round((SMMLV_2025 * 25) * 0.125));
    expect(resultado.pension).toBe(Math.round((SMMLV_2025 * 25) * 0.16));
  });

  it('debe calcular diferente para cada nivel de riesgo', () => {
    const nivel1 = calcularTotalAportes(3000000, 'I');
    const nivel5 = calcularTotalAportes(3000000, 'V');

    expect(nivel5.arl).toBeGreaterThan(nivel1.arl);
    expect(nivel5.total).toBeGreaterThan(nivel1.total);
    // Salud y pensión deben ser iguales
    expect(nivel5.salud).toBe(nivel1.salud);
    expect(nivel5.pension).toBe(nivel1.pension);
  });
});

describe('calcularFechaLimite', () => {
  it('debe calcular fecha límite correctamente', () => {
    const fecha = calcularFechaLimite(11, 2025); // Noviembre 2025
    expect(fecha.getMonth()).toBe(11); // Diciembre (0-indexed)
    expect(fecha.getDate()).toBe(10);
    expect(fecha.getFullYear()).toBe(2025);
    expect(fecha.getHours()).toBe(23);
    expect(fecha.getMinutes()).toBe(59);
    expect(fecha.getSeconds()).toBe(59);
  });

  it('debe manejar cambio de año', () => {
    const fecha = calcularFechaLimite(12, 2025); // Diciembre 2025
    expect(fecha.getMonth()).toBe(0); // Enero (0-indexed)
    expect(fecha.getDate()).toBe(10);
    expect(fecha.getFullYear()).toBe(2026);
  });

  it('debe calcular correctamente para enero', () => {
    const fecha = calcularFechaLimite(1, 2025); // Enero 2025
    expect(fecha.getMonth()).toBe(1); // Febrero (0-indexed)
    expect(fecha.getDate()).toBe(10);
    expect(fecha.getFullYear()).toBe(2025);
  });

  it('debe lanzar error si mes es menor a 1', () => {
    expect(() => calcularFechaLimite(0, 2025)).toThrow(
      'El mes debe estar entre 1 y 12'
    );
  });

  it('debe lanzar error si mes es mayor a 12', () => {
    expect(() => calcularFechaLimite(13, 2025)).toThrow(
      'El mes debe estar entre 1 y 12'
    );
  });

  it('debe lanzar error si año es anterior a 2020', () => {
    expect(() => calcularFechaLimite(6, 2019)).toThrow('Año inválido');
  });

  it('debe aceptar año 2020', () => {
    expect(() => calcularFechaLimite(6, 2020)).not.toThrow();
  });
});

describe('formatearPeriodo', () => {
  it('debe formatear enero correctamente', () => {
    expect(formatearPeriodo(1, 2025)).toBe('Enero 2025');
  });

  it('debe formatear diciembre correctamente', () => {
    expect(formatearPeriodo(12, 2025)).toBe('Diciembre 2025');
  });

  it('debe formatear un mes del medio correctamente', () => {
    expect(formatearPeriodo(6, 2025)).toBe('Junio 2025');
  });

  it('debe lanzar error si mes es menor a 1', () => {
    expect(() => formatearPeriodo(0, 2025)).toThrow(
      'El mes debe estar entre 1 y 12'
    );
  });

  it('debe lanzar error si mes es mayor a 12', () => {
    expect(() => formatearPeriodo(13, 2025)).toThrow(
      'El mes debe estar entre 1 y 12'
    );
  });
});

describe('formatearMoneda', () => {
  it('debe formatear valores grandes correctamente', () => {
    const resultado = formatearMoneda(3000000);
    expect(resultado).toContain('3');
    expect(resultado).toContain('000');
    expect(resultado).toContain('000');
  });

  it('debe formatear 1 SMMLV correctamente', () => {
    const resultado = formatearMoneda(SMMLV_2025);
    expect(resultado).toContain('1');
    expect(resultado).toContain('423');
    expect(resultado).toContain('500');
  });

  it('debe formatear cero', () => {
    const resultado = formatearMoneda(0);
    expect(resultado).toBeTruthy();
  });

  it('debe formatear valores negativos', () => {
    const resultado = formatearMoneda(-1000);
    expect(resultado).toContain('-');
    expect(resultado).toContain('1');
  });

  it('no debe incluir decimales', () => {
    const resultado = formatearMoneda(1234.56);
    expect(resultado).not.toContain(',');
    expect(resultado).not.toContain('56');
  });
});

describe('validarIBC', () => {
  it('debe validar IBC dentro del rango', () => {
    expect(validarIBC(3000000)).toBe(true);
  });

  it('debe validar IBC en el mínimo', () => {
    expect(validarIBC(IBC_MINIMO)).toBe(true);
  });

  it('debe validar IBC en el máximo', () => {
    expect(validarIBC(IBC_MAXIMO)).toBe(true);
  });

  it('debe rechazar IBC menor al mínimo', () => {
    expect(validarIBC(IBC_MINIMO - 1)).toBe(false);
  });

  it('debe rechazar IBC mayor al máximo', () => {
    expect(validarIBC(IBC_MAXIMO + 1)).toBe(false);
  });

  it('debe rechazar IBC cero', () => {
    expect(validarIBC(0)).toBe(false);
  });

  it('debe rechazar IBC negativo', () => {
    expect(validarIBC(-1000)).toBe(false);
  });
});

describe('obtenerPorcentajeARL', () => {
  it('debe retornar porcentaje correcto para nivel I', () => {
    expect(obtenerPorcentajeARL('I')).toBe(PORCENTAJES_ARL.I);
  });

  it('debe retornar porcentaje correcto para nivel III', () => {
    expect(obtenerPorcentajeARL('III')).toBe(PORCENTAJES_ARL.III);
  });

  it('debe retornar porcentaje correcto para nivel V', () => {
    expect(obtenerPorcentajeARL('V')).toBe(PORCENTAJES_ARL.V);
  });

  it('porcentajes deben estar en orden ascendente', () => {
    expect(PORCENTAJES_ARL.I).toBeLessThan(PORCENTAJES_ARL.II);
    expect(PORCENTAJES_ARL.II).toBeLessThan(PORCENTAJES_ARL.III);
    expect(PORCENTAJES_ARL.III).toBeLessThan(PORCENTAJES_ARL.IV);
    expect(PORCENTAJES_ARL.IV).toBeLessThan(PORCENTAJES_ARL.V);
  });
});

describe('Casos de uso reales', () => {
  it('debe calcular correctamente para freelancer con ingreso promedio', () => {
    const ingreso = 4500000;
    const resultado = calcularTotalAportes(ingreso, 'I');

    expect(resultado.ibc).toBe(4500000);
    expect(resultado.salud).toBe(562500);
    expect(resultado.pension).toBe(720000);
    expect(resultado.total).toBeGreaterThan(1282000);
  });

  it('debe calcular correctamente para ingreso mínimo', () => {
    const resultado = calcularTotalAportes(SMMLV_2025, 'I');

    expect(resultado.ibc).toBe(SMMLV_2025);
    expect(resultado.total).toBeGreaterThan(405000);
  });

  it('debe calcular correctamente para alto ingreso', () => {
    const ingreso = 15000000;
    const resultado = calcularTotalAportes(ingreso, 'II');

    expect(resultado.ibc).toBe(15000000);
    expect(resultado.salud).toBe(1875000);
    expect(resultado.pension).toBe(2400000);
  });
});
