const { Client } = require('../models');

exports.create = async (req, res) => {
  try {
    const data = req.body;
    data.userId = req.userId;
    const client = await Client.create(data);
    res.json(client);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const clients = await Client.findAll({ where: { userId: req.userId }});
    res.json(clients);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    await Client.update(req.body, { where: { id, userId: req.userId }});
    const updated = await Client.findByPk(id);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    await Client.destroy({ where: { id, userId: req.userId }});
    res.json({ message:'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
