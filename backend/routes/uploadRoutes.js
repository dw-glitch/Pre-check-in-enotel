const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Child = require('../models/Child');

const router = express.Router();

// Verifica se a pasta uploads existe, e cria se não existir
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    console.log('Criando diretório uploads...');
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        console.log('Recebendo arquivo:', file.originalname, 'tipo:', file.mimetype);
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Apenas imagens (JPEG, PNG) e PDFs são permitidos'), false);
        }
        cb(null, true);
    }
});

// Rota de teste simples
router.get('/test', (req, res) => {
    res.json({ message: 'API de upload está funcionando!' });
});

// Rota para upload
router.post('/', upload.single('childDocument'), async (req, res) => {
    try {
        console.log('Requisição recebida:', req.body);
        console.log('Arquivo recebido:', req.file);
        
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const { childName, birthDate, fatherName, motherName } = req.body;
        const documentPath = file.path;

        console.log('Valores a serem salvos:');
        console.log('- Nome do pai:', fatherName || '');
        console.log('- Nome da mãe:', motherName || '');

        const newChild = await Child.create({
            childName,
            birthDate,
            fatherName: fatherName || '',
            motherName: motherName || '',
            documentPath,
        });

        console.log('Criança salva com sucesso:', newChild.toJSON());
        
        // Emitir evento para o Socket.IO
        req.app.get('io').emit('new-checkin', newChild);

        res.status(201).json({ message: 'Pré-check-in realizado com sucesso!', child: newChild });
    } catch (error) {
        console.error('Erro ao realizar o pré-check-in:', error);
        res.status(500).json({ message: 'Erro ao realizar o pré-check-in', error: error.message });
    }
});

// Rota para listar todos os check-ins
router.get('/checkins', async (req, res) => {
    try {
        console.log('Buscando todos os check-ins...');
        const checkins = await Child.findAll({
            order: [['createdAt', 'DESC']],
            raw: true
        });

        console.log(`Encontrados ${checkins.length} check-ins`);
        res.json(checkins);
    } catch (error) {
        console.error('Erro ao buscar check-ins:', error);
        res.status(500).json({
            message: 'Erro ao buscar check-ins',
            error: error.message
        });
    }
});

// Rota para obter um documento específico
router.get('/document/:id', async (req, res) => {
    try {
        const childId = req.params.id;
        const child = await Child.findByPk(childId);
        
        if (!child) {
            return res.status(404).json({ message: 'Documento não encontrado' });
        }
        
        // Retorna o caminho para o documento
        res.json({ documentPath: child.documentPath });
    } catch (error) {
        console.error('Erro ao buscar documento:', error);
        res.status(500).json({ message: 'Erro ao buscar documento', error: error.message });
    }
});

module.exports = router;
