const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Carregue as variáveis de ambiente novamente para garantir
dotenv.config({ path: path.join(__dirname, '../.env') });

// Valores padrão caso as variáveis não estejam definidas
const dbHost = process.env.PG_HOST || 'localhost';
const dbName = process.env.PG_DATABASE || 'pre_checkin_enotel';
const dbUser = process.env.PG_USER || 'postgres';
const dbPassword = process.env.PG_PASSWORD || 'unicorniodoido9_';

console.log('Tentando conectar ao banco de dados...');
console.log('Host:', dbHost);
console.log('Database:', dbName);
console.log('User:', dbUser);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'postgres',
    logging: true,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Teste a conexão
sequelize.authenticate()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
    })
    .catch(err => {
        console.error('Não foi possível conectar ao banco de dados:', err);
    });

module.exports = { sequelize };
