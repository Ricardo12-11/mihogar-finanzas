const { Loan, Payment, Client, Property } = require('../models');
const finance = require('../utils/finance');

exports.calculate = async (req, res) => {
  try {
    const {
      // Datos del inmueble
      precioInmueble,
      moneda = 'PEN',
      
      // Financiamiento
      cuotaInicialPct = 0,
      cuotaInicialMonto = 0,
      bonoMonto = 0,
      
      // Costos iniciales
      costesNotariales = 0,
      costesRegistrales = 0,
      tasacion = 0,
      comisionEstudio = 0,
      comisionActivacion = 0,
      
      // Costos periódicos
      seguroDesgravamenPct = 0,
      seguroRiesgoPctAnual = 0,
      comisionPeriodica = 0,
      portes = 0,
      
      // Condiciones del préstamo
      numCuotas,
      tasaAnual, // en porcentaje (11 = 11%)
      tipoTasa = 'efectiva',
      capitalizacion = 'mensual',
      diasPeriodo = 30,
      tipoGracia = 'ninguno',
      periodosGracia = 0,
      
      // Para indicadores
      tasaDescuento = 20 // en porcentaje
    } = req.body;

    // Validaciones básicas
    if (!precioInmueble || precioInmueble <= 0) {
      return res.status(400).json({ message: 'El precio del inmueble debe ser mayor a 0' });
    }
    if (!numCuotas || numCuotas < 1) {
      return res.status(400).json({ message: 'El número de cuotas debe ser al menos 1' });
    }
    if (!tasaAnual || tasaAnual <= 0) {
      return res.status(400).json({ message: 'La tasa debe ser mayor a 0' });
    }

    // Convertir tasas a decimal
    const tea = tasaAnual / 100;
    const tasaDescuentoAnual = tasaDescuento / 100;
    const segDesgravPct = seguroDesgravamenPct / 100;
    const segRiesgoPct = seguroRiesgoPctAnual / 100;

    // Calcular todo usando finance.js
    const resultado = finance.calcularPrestamoCompleto({
      precioInmueble: Number(precioInmueble),
      cuotaInicialPct: Number(cuotaInicialPct),
      cuotaInicialMonto: Number(cuotaInicialMonto),
      bonoMonto: Number(bonoMonto),
      costesNotariales: Number(costesNotariales),
      costesRegistrales: Number(costesRegistrales),
      tasacion: Number(tasacion),
      comisionEstudio: Number(comisionEstudio),
      comisionActivacion: Number(comisionActivacion),
      seguroDesgravamenPct: segDesgravPct,
      seguroRiesgoPctAnual: segRiesgoPct,
      comisionPeriodica: Number(comisionPeriodica),
      portes: Number(portes),
      numCuotas: Number(numCuotas),
      tea,
      tipoTasa,
      capitalizacion,
      diasPeriodo: Number(diasPeriodo),
      tipoGracia,
      periodosGracia: Number(periodosGracia),
      tasaDescuentoAnual
    });

    // Agregar moneda al resultado
    resultado.resumen.moneda = moneda;
    resultado.resumen.simbolo = moneda === 'USD' ? '$' : 'S/';

    res.json(resultado);
  } catch (err) {
    console.error('Error en cálculo:', err);
    res.status(500).json({ message: err.message });
  }
};

// ============================================================
// NUEVO: Evaluar Bono Techo Propio
// ============================================================
exports.evaluarBono = async (req, res) => {
  try {
    const { ingresos, esPrimeraVivienda, precioViviendaSoles, tipoCambio = 3.75 } = req.body;
    
    const resultado = finance.evaluarBonoTechoPropio({
      ingresos: Number(ingresos),
      esPrimeraVivienda: esPrimeraVivienda !== false,
      precioViviendaSoles: Number(precioViviendaSoles)
    });
    
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { 
      clientId, propertyId, creditConfigId, amount, term_months, annual_rate, 
      start_date, bono_techo, bono_monto, tipo_tasa, capitalizacion, 
      periodo_gracia, meses_gracia, moneda, tasa_descuento, frecuencia_pago,
      // Indicadores calculados desde el frontend
      van_calculado, tir_periodo, tir_anual, tcea_anual, 
      cuota_base, cuota_total, total_pagar, total_intereses,
      // Cronograma completo desde el frontend
      cronograma
    } = req.body;
    
    // Calcular monto real del préstamo (restando bono si aplica)
    let montoReal = Number(amount);
    const bonoAplicado = bono_techo && bono_monto ? Number(bono_monto) : 0;
    montoReal = montoReal - bonoAplicado;
    
    // Convertir tasa de porcentaje a decimal (11% -> 0.11)
    let tasaDecimal = Number(annual_rate) / 100;
    
    // Convertir tasa si es nominal a efectiva
    let tasaEfectiva = tasaDecimal;
    if (tipo_tasa === 'nominal' && capitalizacion) {
      tasaEfectiva = finance.nominalToEffective(tasaDecimal, capitalizacion);
    }
    
    // Tasa de descuento (COK) - convertir de porcentaje a decimal
    const tasaDescuentoDecimal = tasa_descuento ? Number(tasa_descuento) / 100 : 0.20;
    
    // Frecuencia de pago (30=mensual, 60=bimestral, 90=trimestral, etc.)
    const frecuenciaPagoNum = parseInt(frecuencia_pago) || 30;
    
    // Crear el préstamo con todos los campos incluyendo indicadores
    const loan = await Loan.create({ 
      clientId, propertyId, creditConfigId, 
      amount: montoReal, 
      term_months, 
      annual_rate: tasaEfectiva, 
      start_date, 
      bono_techo: bono_techo || false,
      bono_monto: bonoAplicado,
      tipo_tasa: tipo_tasa || 'efectiva',
      capitalizacion: capitalizacion || 'mensual',
      periodo_gracia: periodo_gracia || 'ninguno',
      meses_gracia: meses_gracia || 0,
      moneda: moneda || 'PEN',
      tasa_descuento: tasaDescuentoDecimal,
      frecuencia_pago: frecuenciaPagoNum,
      // Guardar indicadores calculados
      van_calculado: van_calculado || 0,
      tir_periodo: tir_periodo || 0,
      tir_anual: tir_anual || 0,
      tcea_anual: tcea_anual || 0,
      cuota_base: cuota_base || 0,
      cuota_total: cuota_total || 0,
      total_pagar: total_pagar || 0,
      total_intereses: total_intereses || 0
    });
    
    // Función para calcular fechas de vencimiento por período
    function addPeriods(date, periods, diasPeriodo) {
      const result = new Date(date);
      // Cada período es diasPeriodo días después de la fecha de inicio
      result.setDate(result.getDate() + (periods * diasPeriodo));
      return result;
    }
    
    const startDateObj = new Date(start_date || new Date());
    console.log('Fecha inicio:', startDateObj.toISOString().split('T')[0]);
    console.log('Frecuencia días:', frecuenciaPagoNum);
    console.log('Cronograma recibido:', cronograma ? cronograma.length : 'ninguno');
    
    // Si viene cronograma del frontend, usarlo; si no, generar con el backend
    if (cronograma && Array.isArray(cronograma) && cronograma.length > 0) {
      console.log('Guardando', cronograma.length, 'cuotas del frontend');
      // Usar el cronograma enviado desde el frontend
      for (const cuota of cronograma) {
        const due = addPeriods(startDateObj, cuota.installment_number, frecuenciaPagoNum);
        console.log('Cuota', cuota.installment_number, '- Vence:', due.toISOString().split('T')[0], '- Total:', cuota.total);
        await Payment.create({
          loanId: loan.id,
          installment_number: cuota.installment_number,
          amortization: cuota.amortization || 0,
          interest: cuota.interest || 0,
          total: cuota.total || 0,
          balance: cuota.balance || 0,
          due_date: due.toISOString().split('T')[0]
        });
      }
    } else {
      // Generar cronograma con el backend (fallback)
      const { schedule } = finance.frenchSchedule(
        montoReal, 
        Number(term_months), 
        tasaEfectiva,
        {
          tipoGracia: periodo_gracia || 'ninguno',
          mesesGracia: Number(meses_gracia) || 0
        }
      );
      
      for (const s of schedule) {
        const due = addPeriods(startDateObj, s.installment_number, frecuenciaPagoNum);
        await Payment.create({
          loanId: loan.id,
          installment_number: s.installment_number,
          amortization: s.amortization,
          interest: s.interest,
          total: s.total,
          balance: s.balance,
          due_date: due.toISOString().split('T')[0]
        });
      }
    }
    
    res.json({ loan, message: 'Crédito creado correctamente' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Listar todos los créditos con información del cliente y propiedad
exports.list = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [
        { model: Client, attributes: ['id', 'full_name', 'dni'] },
        { model: Property, attributes: ['id', 'project_name', 'address'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(loans);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Obtener un crédito específico con su información completa
exports.getOne = async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Client, attributes: ['id', 'full_name', 'dni', 'email', 'phone'] },
        { model: Property, attributes: ['id', 'project_name', 'address', 'price', 'currency'] }
      ]
    });
    if (!loan) return res.status(404).json({ message: 'Crédito no encontrado' });
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.payments = async (req, res) => {
  try {
    const loanId = req.params.id;
    const payments = await Payment.findAll({ where: { loanId }, order: [['installment_number', 'ASC']] });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Eliminar un crédito y sus pagos asociados
exports.delete = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findByPk(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }
    
    // Eliminar primero los pagos asociados
    await Payment.destroy({ where: { loanId } });
    
    // Luego eliminar el crédito
    await loan.destroy();
    
    res.json({ message: 'Crédito eliminado correctamente', id: loanId });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// Actualizar un crédito (regenera el cronograma)
exports.update = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findByPk(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }
    
    const { 
      clientId, propertyId, amount, term_months, annual_rate, 
      start_date, bono_techo, bono_monto, tipo_tasa, capitalizacion, 
      periodo_gracia, meses_gracia, moneda, tasa_descuento, frecuencia_pago 
    } = req.body;
    
    // Calcular monto real del préstamo
    let montoReal = Number(amount);
    const bonoAplicado = bono_techo && bono_monto ? Number(bono_monto) : 0;
    montoReal = montoReal - bonoAplicado;
    
    // Convertir tasa de porcentaje a decimal
    let tasaDecimal = Number(annual_rate) / 100;
    let tasaEfectiva = tasaDecimal;
    if (tipo_tasa === 'nominal' && capitalizacion) {
      tasaEfectiva = finance.nominalToEffective(tasaDecimal, capitalizacion);
    }
    
    const tasaDescuentoDecimal = tasa_descuento ? Number(tasa_descuento) / 100 : 0.20;
    const frecuenciaPagoNum = parseInt(frecuencia_pago) || 30;
    
    // Actualizar el préstamo
    await loan.update({ 
      clientId, propertyId,
      amount: montoReal, 
      term_months, 
      annual_rate: tasaEfectiva, 
      start_date, 
      bono_techo: bono_techo || false,
      bono_monto: bonoAplicado,
      tipo_tasa: tipo_tasa || 'efectiva',
      capitalizacion: capitalizacion || 'mensual',
      periodo_gracia: periodo_gracia || 'ninguno',
      meses_gracia: meses_gracia || 0,
      moneda: moneda || 'PEN',
      tasa_descuento: tasaDescuentoDecimal,
      frecuencia_pago: frecuenciaPagoNum
    });
    
    // Eliminar pagos anteriores
    await Payment.destroy({ where: { loanId } });
    
    // Regenerar cronograma
    const { cuota, schedule } = finance.frenchSchedule(
      montoReal, 
      Number(term_months), 
      tasaEfectiva,
      {
        tipoGracia: periodo_gracia || 'ninguno',
        mesesGracia: Number(meses_gracia) || 0
      }
    );
    
    // Función para sumar meses correctamente
    function addMonths(date, months) {
      const result = new Date(date);
      const dayOfMonth = result.getDate();
      result.setMonth(result.getMonth() + months);
      if (result.getDate() !== dayOfMonth) {
        result.setDate(0);
      }
      return result;
    }
    
    // Guardar nuevos pagos
    const startDateObj = new Date(start_date || new Date());
    for(const s of schedule){
      const due = addMonths(startDateObj, s.installment_number);
      await Payment.create({
        loanId: loan.id,
        installment_number: s.installment_number,
        amortization: s.amortization,
        interest: s.interest,
        total: s.total,
        balance: s.balance,
        due_date: due.toISOString().split('T')[0]
      });
    }
    
    res.json({ loan, cuota, schedule, message: 'Crédito actualizado correctamente' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};
