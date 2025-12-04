const r = require('express').Router();
const c = require('../controllers/clients');
const { verifyToken } = require('../middleware/auth');
r.post('/', verifyToken, c.create);
r.get('/', verifyToken, c.list);
r.put('/:id', verifyToken, c.update);
r.delete('/:id', verifyToken, c.remove);
module.exports = r;
