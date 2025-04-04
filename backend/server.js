const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

// Configurações iniciais - Carregar variáveis de ambiente antes de tudo
dotenv.config({ path: path.join(__dirname, '.env') });

// Verifique se as variáveis de ambiente foram carregadas
console.log('Variáveis de ambiente:');
console.log('PORT:', process.env.PORT);
console.log('PG_HOST:', process.env.PG_HOST);
console.log('PG_DATABASE:', process.env.PG_DATABASE);
console.log('PG_USER:', process.env.PG_USER);

// Só importe o banco de dados depois de carregar as variáveis de ambiente
const { sequelize } = require('./config/database');
const uploadRoutes = require('./routes/uploadRoutes');

// Forçar recriação das tabelas (PERDERÁ TODOS OS DADOS EXISTENTES)
console.log('Forçando recriação das tabelas no banco de dados...');
sequelize.sync({ force: true }) 
    .then(() => {
        console.log('Banco de dados sincronizado (tabelas recriadas)');
        // Verificar se a tabela Children tem as colunas esperadas
        return sequelize.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'Children'
            ORDER BY column_name
        `);
    })
    .then(([results]) => {
        console.log('Colunas na tabela Children:', results.map(r => r.column_name));
    })
    .catch((err) => console.error('Erro ao sincronizar o banco de dados:', err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configura o diretório de uploads para ser acessível - AJUSTADO PARA MELHOR SERVIR ARQUIVOS
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Diretório de uploads:', uploadsPath);
if (!fs.existsSync(uploadsPath)) {
    console.log('Criando diretório uploads...');
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configuração específica para servir arquivos de upload
app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        // Para PDFs, configurar o Content-Type para exibição inline
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            // Para visualização, usar inline ao invés de attachment
            // Quando o cliente solicitar download específico, ele usará o atributo download na tag <a>
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
        } else if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
            // Para imagens, configurar o tipo MIME correto
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }[ext] || 'application/octet-stream';
            
            res.setHeader('Content-Type', mimeType);
        }
    }
}));

// Rota de API para upload
app.use('/api/upload', uploadRoutes);

// Rota de API para outras operações relacionadas
app.use('/api', uploadRoutes);

// Comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

app.set('io', io); // Certifique-se de que o Socket.IO está disponível nas rotas

// Servir o frontend - Certifique-se de que o caminho está correto
const frontendPath = path.join(__dirname, '../frontend/build');
console.log('Servindo arquivos estáticos do frontend a partir de:', frontendPath);

// Configuração específica para servir o favicon
app.get('/favicon.ico', (req, res) => {
    console.log('Servindo favicon...');
    res.sendFile(path.join(frontendPath, 'favicon.ico'));
});

// Servir arquivos estáticos
app.use(express.static(frontendPath));

// Rotas específicas para o frontend
app.get('/', (req, res) => {
    console.log('Servindo página inicial');
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    console.log('Servindo página de admin');
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/qrcode', (req, res) => {
    console.log('Servindo página de QR Code');
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Rota de fallback para servir o index.html para qualquer rota desconhecida
app.use((req, res) => {
    console.log('Servindo index.html para a rota:', req.originalUrl);
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Adicione um middleware para tratar erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        message: 'Erro interno do servidor',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
