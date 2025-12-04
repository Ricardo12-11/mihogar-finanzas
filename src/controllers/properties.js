const { Property } = require('../models');

exports.create = async (req, res) => {
  try {
    const p = await Property.create(req.body);
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const props = await Property.findAll();
    res.json(props);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    await Property.update(req.body, { where: { id }});
    const updated = await Property.findByPk(id);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    await Property.destroy({ where: { id }});
    res.json({ message:'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
