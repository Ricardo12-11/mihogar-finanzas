exports.periodRateFromAnnual = (annualRate, diasPeriodo = 30) => {
  return Math.pow(1 + annualRate, diasPeriodo / 360) - 1;
};

exports.monthlyRateFromAnnual = (annualRate) => {
  return exports.periodRateFromAnnual(annualRate, 30);
};

exports.annualRateFromPeriod = (periodRate, diasPeriodo = 30) => {
  return Math.pow(1 + periodRate, 360 / diasPeriodo) - 1;
};

exports.nominalToEffective = (nominalRate, capitalizacion) => {
  const periodos = {
    'mensual': 12,
    'trimestral': 4,
    'semestral': 2,
    'anual': 1
  };
  const m = periodos[capitalizacion] || 12;
  return Math.pow(1 + nominalRate / m, m) - 1;
};

exports.frenchScheduleComplete = (params) => {
  const {
    monto,
    numCuotas,
    tea,
    diasPeriodo = 30,
    tipoGracia = 'ninguno',
    periodosGracia = 0,
    precioInmueble = 0,
    seguroDesgravamenPct = 0,
    seguroRiesgoPctAnual = 0,
    comisionPeriodica = 0,
    portes = 0
  } = params;

  const tasaPeriodo = exports.periodRateFromAnnual(tea, diasPeriodo);
  const periodosPorAnio = 360 / diasPeriodo;
  
  const seguroRiesgoPctPeriodo = seguroRiesgoPctAnual / periodosPorAnio;

  let saldo = monto;
  const schedule = [];

  let totalAmortizacion = 0;
  let totalInteres = 0;
  let totalSeguroDesgravamen = 0;
  let totalSeguroRiesgo = 0;
  let totalComisiones = 0;
  let totalPortes = 0;
  let totalCuotaBase = 0;
  let totalCuotaCompleta = 0;

  for (let i = 1; i <= periodosGracia; i++) {
    const saldoInicial = saldo;
    const interes = saldo * tasaPeriodo;

    let amortizacion = 0;
    let cuotaBase = 0;

    if (tipoGracia === 'total') {
      saldo += interes;
      cuotaBase = 0;
    } else if (tipoGracia === 'parcial') {
      cuotaBase = interes;
    }

    const segDesgravamen = saldoInicial * seguroDesgravamenPct;
    const segRiesgo = precioInmueble * seguroRiesgoPctPeriodo;
    const cuotaTotal = cuotaBase + segDesgravamen + segRiesgo + comisionPeriodica + portes;

    totalInteres += (tipoGracia === 'parcial') ? interes : 0;
    totalSeguroDesgravamen += segDesgravamen;
    totalSeguroRiesgo += segRiesgo;
    totalComisiones += comisionPeriodica;
    totalPortes += portes;
    totalCuotaBase += cuotaBase;
    totalCuotaCompleta += cuotaTotal;

    schedule.push({
      installment_number: i,
      tipo: tipoGracia === 'total' ? 'Gracia Total' : 'Gracia Parcial',
      saldoInicial: Number(saldoInicial.toFixed(2)),
      amortization: 0,
      interest: tipoGracia === 'parcial' ? Number(interes.toFixed(2)) : 0,
      cuotaBase: Number(cuotaBase.toFixed(2)),
      seguroDesgravamen: Number(segDesgravamen.toFixed(2)),
      seguroRiesgo: Number(segRiesgo.toFixed(2)),
      comision: comisionPeriodica,
      portes: portes,
      total: Number(cuotaTotal.toFixed(2)),
      balance: Number(saldo.toFixed(2))
    });
  }

  const periodosRestantes = numCuotas - periodosGracia;
  
  if (periodosRestantes <= 0) {
    return { 
      cuota: 0, 
      tasaPeriodo, 
      schedule, 
      totales: {
        amortizacion: 0,
        interes: totalInteres,
        seguroDesgravamen: totalSeguroDesgravamen,
        seguroRiesgo: totalSeguroRiesgo,
        comisiones: totalComisiones,
        portes: totalPortes,
        cuotaBase: totalCuotaBase,
        cuotaTotal: totalCuotaCompleta
      }
    };
  }

  const cuotaFija = saldo * (tasaPeriodo * Math.pow(1 + tasaPeriodo, periodosRestantes)) / 
                    (Math.pow(1 + tasaPeriodo, periodosRestantes) - 1);

  for (let i = periodosGracia + 1; i <= numCuotas; i++) {
    const saldoInicial = saldo;
    const interes = saldo * tasaPeriodo;
    let amortizacion = cuotaFija - interes;

    if (i === numCuotas) {
      amortizacion = saldo;
    }

    saldo = Math.max(0, saldo - amortizacion);
    const cuotaBase = (i === numCuotas) ? amortizacion + interes : cuotaFija;

    const segDesgravamen = saldoInicial * seguroDesgravamenPct;
    const segRiesgo = precioInmueble * seguroRiesgoPctPeriodo;
    const cuotaTotal = cuotaBase + segDesgravamen + segRiesgo + comisionPeriodica + portes;

    totalAmortizacion += amortizacion;
    totalInteres += interes;
    totalSeguroDesgravamen += segDesgravamen;
    totalSeguroRiesgo += segRiesgo;
    totalComisiones += comisionPeriodica;
    totalPortes += portes;
    totalCuotaBase += cuotaBase;
    totalCuotaCompleta += cuotaTotal;

    schedule.push({
      installment_number: i,
      tipo: 'Normal',
      saldoInicial: Number(saldoInicial.toFixed(2)),
      amortization: Number(amortizacion.toFixed(2)),
      interest: Number(interes.toFixed(2)),
      cuotaBase: Number(cuotaBase.toFixed(2)),
      seguroDesgravamen: Number(segDesgravamen.toFixed(2)),
      seguroRiesgo: Number(segRiesgo.toFixed(2)),
      comision: comisionPeriodica,
      portes: portes,
      total: Number(cuotaTotal.toFixed(2)),
      balance: Number(saldo.toFixed(2))
    });
  }

  return {
    cuota: Number(cuotaFija.toFixed(2)),
    tasaPeriodo,
    schedule,
    totales: {
      amortizacion: Number(totalAmortizacion.toFixed(2)),
      interes: Number(totalInteres.toFixed(2)),
      seguroDesgravamen: Number(totalSeguroDesgravamen.toFixed(2)),
      seguroRiesgo: Number(totalSeguroRiesgo.toFixed(2)),
      comisiones: Number(totalComisiones.toFixed(2)),
      portes: Number(totalPortes.toFixed(2)),
      cuotaBase: Number(totalCuotaBase.toFixed(2)),
      cuotaTotal: Number(totalCuotaCompleta.toFixed(2))
    }
  };
};

exports.frenchSchedule = (amount, months, annualRate, options = {}) => {
  const { tipoGracia = 'ninguno', mesesGracia = 0 } = options;
  
  const result = exports.frenchScheduleComplete({
    monto: amount,
    numCuotas: months,
    tea: annualRate,
    diasPeriodo: 30,
    tipoGracia,
    periodosGracia: mesesGracia
  });

  const schedule = result.schedule.map(s => ({
    installment_number: s.installment_number,
    amortization: s.amortization,
    interest: s.interest,
    total: s.cuotaBase,
    balance: s.balance,
    tipo: s.tipo === 'Gracia Total' ? 'gracia_total' : 
          s.tipo === 'Gracia Parcial' ? 'gracia_parcial' : 'normal'
  }));

  return { cuota: result.cuota, schedule };
};

exports.calculateTIR = (inversion, flujos) => {
  if (!inversion || inversion <= 0 || !flujos || flujos.length === 0) {
    return 0;
  }

  const npv = (r) => {
    if (r <= -1) return Infinity;
    let sum = -inversion;
    for (let i = 0; i < flujos.length; i++) {
      sum += flujos[i] / Math.pow(1 + r, i + 1);
    }
    return sum;
  };

  let low = -0.5, high = 2, mid;

  const npvLow = npv(low);
  const npvHigh = npv(high);
  
  if ((npvLow > 0 && npvHigh > 0) || (npvLow < 0 && npvHigh < 0)) {
    for (let testHigh = 0.5; testHigh <= 5; testHigh += 0.5) {
      if (npv(-0.3) > 0 && npv(testHigh) < 0) {
        low = -0.3;
        high = testHigh;
        break;
      }
    }
  }

  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }

  return mid;
};

exports.calculateVAN = (inversion, flujos, tasaPeriodo) => {
  let van = inversion;
  for (let i = 0; i < flujos.length; i++) {
    van -= flujos[i] / Math.pow(1 + tasaPeriodo, i + 1);
  }
  return van;
};

exports.calculateTCEA = (montoRecibido, cuotasTotales, diasPeriodo = 30) => {
  const tirPeriodo = exports.calculateTIR(montoRecibido, cuotasTotales);
  return exports.annualRateFromPeriod(tirPeriodo, diasPeriodo);
};

exports.calculateIndicadores = (params) => {
  const {
    montoRecibido,
    montoFinanciado,
    cuotasTotales,
    tasaDescuentoAnual,
    diasPeriodo = 30
  } = params;

  const periodosPorAnio = 360 / diasPeriodo;
  const tasaDescuentoPeriodo = exports.periodRateFromAnnual(tasaDescuentoAnual, diasPeriodo);

  const tirPeriodo = exports.calculateTIR(montoFinanciado, cuotasTotales);
  const tirAnual = exports.annualRateFromPeriod(tirPeriodo, diasPeriodo);

  const van = exports.calculateVAN(montoFinanciado, cuotasTotales, tasaDescuentoPeriodo);

  const tceaPeriodo = exports.calculateTIR(montoRecibido, cuotasTotales);
  const tceaAnual = exports.annualRateFromPeriod(tceaPeriodo, diasPeriodo);

  return {
    van: Number(van.toFixed(2)),
    tirPeriodo,
    tirAnual,
    tceaAnual,
    tasaDescuentoPeriodo
  };
};

exports.evaluarBonoTechoPropio = (params) => {
  const { ingresos, esPrimeraVivienda, precioViviendaSoles } = params;
  
  const LIMITE_INGRESOS = 3715;

  if (!esPrimeraVivienda) {
    return {
      aplica: false,
      monto: 0,
      tipo: null,
      descripcion: null,
      mensaje: 'El cliente ya posee otra vivienda'
    };
  }

  if (ingresos > LIMITE_INGRESOS) {
    return {
      aplica: false,
      monto: 0,
      tipo: null,
      descripcion: null,
      mensaje: `Ingresos S/ ${ingresos.toLocaleString()} exceden el límite de S/ ${LIMITE_INGRESOS.toLocaleString()}`
    };
  }

  let monto = 0;
  let tipo = '';
  let descripcion = '';

  if (precioViviendaSoles <= 60000) {
    monto = 56710;
    tipo = 'VIS Priorizada Lote';
    descripcion = 'Vivienda hasta S/ 60,000';
  } else if (precioViviendaSoles <= 70000) {
    monto = 51895;
    tipo = 'VIS Priorizada Multi';
    descripcion = 'Vivienda hasta S/ 70,000';
  } else if (precioViviendaSoles <= 109000) {
    monto = 50825;
    tipo = 'VIS Lote Unifamiliar';
    descripcion = 'Vivienda hasta S/ 109,000';
  } else if (precioViviendaSoles <= 136000) {
    monto = 46545;
    tipo = 'VIS Multifamiliar';
    descripcion = 'Vivienda hasta S/ 136,000';
  } else {
    return {
      aplica: false,
      monto: 0,
      tipo: null,
      descripcion: null,
      mensaje: `Vivienda S/ ${precioViviendaSoles.toLocaleString()} excede el límite de S/ 136,000`
    };
  }

  const ahorroMinimo = precioViviendaSoles <= 70000 
    ? precioViviendaSoles * 0.01 
    : precioViviendaSoles * 0.03;

  return {
    aplica: true,
    monto,
    tipo,
    descripcion,
    ahorroMinimo: Number(ahorroMinimo.toFixed(2)),
    mensaje: `Aplica ${tipo}: S/ ${monto.toLocaleString()}`
  };
};

exports.calcularPrestamoCompleto = (params) => {
  const {
    precioInmueble,
    cuotaInicialPct = 0,
    cuotaInicialMonto = 0,
    bonoMonto = 0,
    
    costesNotariales = 0,
    costesRegistrales = 0,
    tasacion = 0,
    comisionEstudio = 0,
    comisionActivacion = 0,
    
    seguroDesgravamenPct = 0,
    seguroRiesgoPctAnual = 0,
    comisionPeriodica = 0,
    portes = 0,
    
    numCuotas,
    tea,
    tipoTasa = 'efectiva',
    capitalizacion = 'mensual',
    diasPeriodo = 30,
    tipoGracia = 'ninguno',
    periodosGracia = 0,
    
    tasaDescuentoAnual = 0.20
  } = params;

  const cuotaInicial = cuotaInicialMonto > 0 
    ? cuotaInicialMonto 
    : precioInmueble * (cuotaInicialPct / 100);

  const montoSinCostos = Math.max(0, precioInmueble - cuotaInicial - bonoMonto);
  
  const costosIniciales = costesNotariales + costesRegistrales + tasacion + 
                          comisionEstudio + comisionActivacion;
  
  const montoFinanciado = montoSinCostos + costosIniciales;

  let tasaEfectiva = tea;
  if (tipoTasa === 'nominal') {
    tasaEfectiva = exports.nominalToEffective(tea, capitalizacion);
  }

  const resultado = exports.frenchScheduleComplete({
    monto: montoFinanciado,
    numCuotas,
    tea: tasaEfectiva,
    diasPeriodo,
    tipoGracia,
    periodosGracia,
    precioInmueble,
    seguroDesgravamenPct,
    seguroRiesgoPctAnual,
    comisionPeriodica,
    portes
  });

  const cuotasTotales = resultado.schedule.map(s => s.total);
  const indicadores = exports.calculateIndicadores({
    montoRecibido: montoSinCostos,
    montoFinanciado,
    cuotasTotales,
    tasaDescuentoAnual,
    diasPeriodo
  });

  const primeraCuotaNormal = resultado.schedule.find(s => s.tipo === 'Normal');

  return {
    resumen: {
      precioInmueble,
      cuotaInicial,
      bonoMonto,
      montoSinCostos,
      costosIniciales,
      montoFinanciado,
      numCuotas,
      diasPeriodo,
      tea: tasaEfectiva,
      tasaPeriodo: resultado.tasaPeriodo,
      periodosGracia,
      tipoGracia
    },
    
    cuotas: {
      cuotaBase: resultado.cuota,
      cuotaTotal: primeraCuotaNormal ? primeraCuotaNormal.total : 0
    },
    
    schedule: resultado.schedule,
    
    totales: resultado.totales,
    
    indicadores: {
      van: indicadores.van,
      tirPeriodo: indicadores.tirPeriodo,
      tirAnual: indicadores.tirAnual,
      tceaAnual: indicadores.tceaAnual
    }
  };
};
