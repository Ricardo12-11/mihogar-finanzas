const r = require('express').Router();
const c = require('../controllers/loan');
const { verifyToken } = require('../middleware/auth');

// Endpoints de cálculo (no guardan nada)
r.post('/calculate', verifyToken, c.calculate);   // Calcular cronograma completo
r.post('/evaluar-bono', verifyToken, c.evaluarBono); // Evaluar Bono Techo Propio

// CRUD de préstamos
r.get('/', verifyToken, c.list);           // Listar todos los créditos
r.post('/', verifyToken, c.create);        // Crear nuevo crédito
r.get('/:id', verifyToken, c.getOne);      // Obtener un crédito específico
r.put('/:id', verifyToken, c.update);      // Actualizar un crédito
r.delete('/:id', verifyToken, c.delete);   // Eliminar un crédito
r.get('/:id/payments', verifyToken, c.payments); // Obtener pagos de un crédito

module.exports = r;
