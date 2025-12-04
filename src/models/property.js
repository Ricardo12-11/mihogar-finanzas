module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Property', {
    project_name: DataTypes.STRING,
    address: DataTypes.STRING,
    area: DataTypes.DECIMAL(8,2),
    rooms: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(12,2),
    currency: DataTypes.STRING,
    status: DataTypes.STRING
  });
};
