module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Payment', {
    installment_number: DataTypes.INTEGER,
    amortization: DataTypes.DECIMAL(12,2),
    interest: DataTypes.DECIMAL(12,2),
    total: DataTypes.DECIMAL(12,2),
    balance: DataTypes.DECIMAL(12,2),
    due_date: DataTypes.DATEONLY
  });
};
