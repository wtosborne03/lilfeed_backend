module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        number: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        req_id: DataTypes.STRING,
        name: {
            type: DataTypes.STRING,
            defaultValue: "New User",
            allowNull: true
        },
        setup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        bio: {
            type: DataTypes.TEXT,
            defaultValue: "New User Bio",
            allowNull: true
        }
    });

    return User;
};