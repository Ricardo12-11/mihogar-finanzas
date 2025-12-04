const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { CreditConfig } = require('../models');

router.use('/auth', require('./auth'));
router.use('/clients', require('./clients'));
router.use('/properties', require('./properties'));
router.use('/loans', require('./loans'));

// Ruta para guardar configuración de crédito
router.post('/config', verifyToken, async (req, res) => {
  try {
    const { moneda, tipo_tasa, capitalizacion, periodo_gracia, meses_gracia } = req.body;
    // Buscar si ya existe una config para este usuario
    let config = await CreditConfig.findOne({ where: { userId: req.userId } });
    if (config) {
      await config.update({ moneda, tipo_tasa, capitalizacion, periodo_gracia, meses_gracia: meses_gracia || 0 });
    } else {
      config = await CreditConfig.create({ 
        userId: req.userId, 
        moneda, 
        tipo_tasa, 
        capitalizacion, 
        periodo_gracia,
        meses_gracia: meses_gracia || 0
      });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ruta para obtener configuración de crédito
router.get('/config', verifyToken, async (req, res) => {
  try {
    const config = await CreditConfig.findOne({ where: { userId: req.userId } });
    res.json(config || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', (req,res)=> res.json({message:'API root'}));

module.exports = router;
