const r = require('express').Router();
const c = require('../controllers/auth');
r.post('/register', c.register);
r.post('/login', c.login);
module.exports = r;
