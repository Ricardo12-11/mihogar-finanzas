require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const { sequelize, seedIfNeeded } = require('./src/models');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger/swaggerSpec');
const routes = require('./src/routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, 'public')));

// Redirección automática al login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});
// start server after DB ready and possibly seed
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    // sync (sin alter para evitar problemas con foreign keys en SQLite)
    await sequelize.sync();
    await seedIfNeeded();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
  }
})();
