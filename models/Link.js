module.exports = (sequelize, DataTypes) => {
    const Link = sequelize.define('Link', {
        url: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return Link;
};