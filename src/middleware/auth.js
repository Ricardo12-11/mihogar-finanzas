const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyToken = (req, res, next) => {
  const h = req.headers['authorization'];
  if(!h) return res.status(401).json({ message: 'No token provided' });
  const parts = h.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'Malformed token' });
  const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err) return res.status(401).json({ message: 'Unauthorized: ' + err.message });
    req.userId = decoded.id;
    next();
  });
};
