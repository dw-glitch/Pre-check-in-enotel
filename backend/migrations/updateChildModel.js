const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Carregue as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

// Valores padrão caso as variáveis não estejam definidas
const dbHost = process.env.PG_HOST || 'localhost';
const dbName = process.env.PG_DATABASE || 'pre_checkin_enotel';
const dbUser = process.env.PG_USER || 'postgres';
const dbPassword = process.env.PG_PASSWORD || 'unicorniodoido9_';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'postgres',
    logging: console.log
});

async function updateDatabase() {
    try {
        // Conectar ao banco de dados
        await sequelize.authenticate();
        console.log('Conectado ao banco de dados');
        
        // Verificar se a coluna parentName existe
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Children' AND column_name = 'parentName'
        `);
        
        const hasParentName = results.length > 0;
        
        if (hasParentName) {
            console.log('Coluna parentName encontrada, atualizando modelo...');
            
            // Adicionar novas colunas
            await sequelize.query(`
                ALTER TABLE "Children" 
                ADD COLUMN IF NOT EXISTS "fatherName" VARCHAR(255),
                ADD COLUMN IF NOT EXISTS "motherName" VARCHAR(255)
            `);
            
            // Copiar dados da coluna parentName para fatherName (ou motherName, conforme necessário)
            await sequelize.query(`
                UPDATE "Children" 
                SET "fatherName" = "parentName"
                WHERE "parentName" IS NOT NULL
            `);
            
            console.log('Modelo atualizado com sucesso!');
        } else {
            console.log('Coluna parentName não encontrada, verificando se as novas colunas existem...');
            
            // Verificar se as novas colunas já existem
            const [fatherResults] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'Children' AND column_name = 'fatherName'
            `);
            
            if (fatherResults.length === 0) {
                console.log('Adicionando novas colunas...');
                await sequelize.query(`
                    ALTER TABLE "Children" 
                    ADD COLUMN IF NOT EXISTS "fatherName" VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS "motherName" VARCHAR(255)
                `);
                console.log('Novas colunas adicionadas com sucesso!');
            } else {
                console.log('Novas colunas já existem.');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar o banco de dados:', error);
    } finally {
        await sequelize.close();
        console.log('Conexão fechada');
    }
}

updateDatabase();
