module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Client', {
    full_name: DataTypes.STRING,
    dni: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    income: DataTypes.DECIMAL(12,2),
    marital_status: DataTypes.STRING,
    // Campos para evaluar Bono Techo Propio
    es_primera_vivienda: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tiene_terreno_propio: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
