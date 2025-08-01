module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
        nombre: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
        fechaEvento: DataTypes.DATE,
        duracion: DataTypes.INTEGER,
        precioEntrada: DataTypes.FLOAT,
        habilitadoInscripcion: DataTypes.BOOLEAN,
        capacidad: DataTypes.INTEGER
    });

    Event.associate = function(models) {
        Event.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
        Event.belongsTo(models.Location, { as: 'location', foreignKey: 'locationId' });
    };

    return Event;
};