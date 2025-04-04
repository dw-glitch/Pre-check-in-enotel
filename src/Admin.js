import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './Admin.css';

function Admin() {
    const [checkins, setCheckins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newAlert, setNewAlert] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [currentDocument, setCurrentDocument] = useState('');

    useEffect(() => {
        fetchCheckins();

        // Configurar Socket.IO para atualizações em tempo real
        const socket = io('http://localhost:3000');
        socket.on('connect', () => {
            console.log('Conectado ao servidor Socket.IO');
        });

        socket.on('new-checkin', (data) => {
            console.log('Novo check-in recebido:', data);
            setCheckins(prevCheckins => [data, ...prevCheckins]);
            setNewAlert(true);

            // Tocar som de notificação
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Erro ao tocar notificação:', e));

            // Limpar alerta depois de alguns segundos
            setTimeout(() => setNewAlert(false), 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchCheckins = async () => {
        try {
            console.log('Solicitando check-ins do servidor...');
            const response = await fetch('http://localhost:3000/api/checkins');

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Erro ao carregar check-ins:', errorData);
                throw new Error(errorData?.message || 'Erro ao carregar dados');
            }

            const data = await response.json();
            console.log('Dados recebidos:', data);
            setCheckins(data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar check-ins:', error);
            setError(`Não foi possível carregar os dados: ${error.message}`);
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    };

    const viewDocument = (documentPath) => {
        // Ajusta o caminho para o documento
        const formattedPath = documentPath.replace(/\\/g, '/');
        const documentUrl = `http://localhost:3000/uploads/${formattedPath.split('/uploads/')[1] || formattedPath}`;
        
        // Define o documento atual e mostra o modal
        setCurrentDocument(documentUrl);
        setShowDocumentModal(true);
    };

    const closeModal = () => {
        setShowDocumentModal(false);
        setCurrentDocument('');
    };

    const downloadDocument = (documentPath) => {
        // Ajusta o caminho para o documento
        const formattedPath = documentPath.replace(/\\/g, '/');
        const documentUrl = `http://localhost:3000/uploads/${formattedPath.split('/uploads/')[1] || formattedPath}`;

        // Cria um link para download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentPath.split('/').pop(); // Define o nome do arquivo para download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="loading">Carregando dados...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Painel de Recepção - EnoCheck Infantil</h1>
                <div className="admin-actions">
                    <a href="/qrcode" className="qrcode-link" target="_blank">Ver QR Code</a>
                    {newAlert && (
                        <div className="new-alert">
                            Novo pré-check-in recebido!
                        </div>
                    )}
                </div>
            </header>

            <div className="checkins-list">
                <h2>Pré-Check-ins Recebidos</h2>

                {checkins.length === 0 ? (
                    <p className="no-data">Nenhum pré-check-in registrado ainda.</p>
                ) : (
                    <table className="checkins-table">
                        <thead>
                            <tr>
                                <th>Nome da Criança</th>
                                <th>Data de Nascimento</th>
                                <th>Nome do Pai</th>
                                <th>Nome da Mãe</th>
                                <th>Data de Envio</th>
                                <th>Documento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checkins.map((checkin) => (
                                <tr key={checkin.id}>
                                    <td>{checkin.childName}</td>
                                    <td>{new Date(checkin.birthDate).toLocaleDateString('pt-BR')}</td>
                                    <td>{checkin.fatherName || '-'}</td>
                                    <td>{checkin.motherName || '-'}</td>
                                    <td>{formatDate(checkin.createdAt)}</td>
                                    <td>
                                        <button
                                            onClick={() => viewDocument(checkin.documentPath)}
                                            className="view-doc-btn"
                                        >
                                            Visualizar
                                        </button>
                                        <button
                                            onClick={() => downloadDocument(checkin.documentPath)}
                                            className="download-doc-btn"
                                        >
                                            Baixar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal para visualização do documento */}
            {showDocumentModal && (
                <div className="document-modal-overlay" onClick={closeModal}>
                    <div className="document-modal" onClick={e => e.stopPropagation()}>
                        <div className="document-modal-header">
                            <h3>Visualização do Documento</h3>
                            <button className="close-modal-btn" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="document-modal-content">
                            {currentDocument.toLowerCase().endsWith('.pdf') ? (
                                <embed 
                                    src={`${currentDocument}#toolbar=0&navpanes=0`} 
                                    type="application/pdf" 
                                    width="100%" 
                                    height="500px" 
                                />
                            ) : (
                                <img 
                                    src={currentDocument} 
                                    alt="Documento" 
                                    style={{ maxWidth: '100%', maxHeight: '500px' }} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
