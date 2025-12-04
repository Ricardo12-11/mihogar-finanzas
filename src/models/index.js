const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const storage = process.env.DB_STORAGE || './database.sqlite';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: false,
  define: { timestamps: true }
});

// import models
const User = require('./user')(sequelize, DataTypes);
const Client = require('./client')(sequelize, DataTypes);
const Property = require('./property')(sequelize, DataTypes);
const CreditConfig = require('./creditConfig')(sequelize, DataTypes);
const Loan = require('./loan')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);

// Relations
User.hasMany(Client, { foreignKey: 'userId' });
Client.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CreditConfig, { foreignKey: 'userId' });
CreditConfig.belongsTo(User, { foreignKey: 'userId' });

Client.hasMany(Loan, { foreignKey: 'clientId' });
Loan.belongsTo(Client, { foreignKey: 'clientId' });

Property.hasMany(Loan, { foreignKey: 'propertyId' });
Loan.belongsTo(Property, { foreignKey: 'propertyId' });

CreditConfig.hasMany(Loan, { foreignKey: 'creditConfigId' });
Loan.belongsTo(CreditConfig, { foreignKey: 'creditConfigId' });

Loan.hasMany(Payment, { foreignKey: 'loanId' });
Payment.belongsTo(Loan, { foreignKey: 'loanId' });

async function seedIfNeeded(){
  // No seed data - base de datos limpia
}

module.exports = { sequelize, User, Client, Property, CreditConfig, Loan, Payment, seedIfNeeded };
