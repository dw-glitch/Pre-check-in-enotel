const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Child = sequelize.define('Child', {
    childName: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    birthDate: { 
        type: DataTypes.DATE, 
        allowNull: false,
        get() {
            const date = this.getDataValue('birthDate');
            return date ? date : null;
        }
    },
    // Novos campos separados
    fatherName: { 
        type: DataTypes.STRING, 
        allowNull: true,
        defaultValue: '' // Valor padrão vazio
    },
    motherName: { 
        type: DataTypes.STRING, 
        allowNull: true,
        defaultValue: '' // Valor padrão vazio 
    },
    documentPath: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
}, {
    timestamps: true,
    hooks: {
        beforeCreate: (child) => {
            // Garantir que birthDate seja um objeto Date válido
            if (child.birthDate && typeof child.birthDate === 'string') {
                child.birthDate = new Date(child.birthDate);
            }
            
            // Garantir que os campos nunca são null
            if (child.fatherName === null) child.fatherName = '';
            if (child.motherName === null) child.motherName = '';
        }
    }
});

module.exports = Child;
