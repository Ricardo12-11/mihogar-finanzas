const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if(!name || !email || !password) return res.status(400).json({ message:'Missing fields' });
    const exists = await User.findOne({ where: { email }});
    if(exists) return res.status(400).json({ message:'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash: hash });
    res.json({ id: user.id, email: user.email });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ message:'Missing fields' });
    const user = await User.findOne({ where: { email }});
    if(!user) return res.status(400).json({ message:'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(400).json({ message:'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: { id:user.id, name:user.name, email:user.email }});
  } catch (err) { res.status(500).json({ message: err.message }); }
};
