import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import AdminPanel from './Admin';
import QRCode from './QRCode';

function App() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);

    useEffect(() => {
        // Verificar qual página mostrar com base na URL
        const pathname = window.location.pathname;
        setShowAdmin(pathname.includes('admin'));
        setShowQRCode(pathname.includes('qrcode'));

        const socket = io('http://localhost:3000');
        socket.on('connect', () => {
            console.log('Conectado ao servidor Socket.IO');
        });
        
        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);

        // Log dos dados que estão sendo enviados
        console.log('Enviando dados:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('Status da resposta:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Resposta de sucesso:', data);
                setSubmitSuccess(true);
                e.target.reset(); // Limpa o formulário
                setTimeout(() => setSubmitSuccess(false), 5000); // Remove mensagem após 5 segundos
            } else {
                const errorData = await response.json().catch(() => null);
                console.error('Erro na resposta:', errorData);
                alert('Erro ao realizar o pré-check-in.');
            }
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
            alert('Erro ao conectar ao servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderiza o componente adequado com base na URL
    if (showAdmin) {
        return <AdminPanel />;
    }
    
    if (showQRCode) {
        return <QRCode />;
    }

    return (
        <div className="container">
            <h1>Bem-vindo ao EnoCheck Infantil</h1>
            
            {submitSuccess && (
                <div className="success-message">
                    Pré-check-in realizado com sucesso! Aguarde atendimento na recepção.
                </div>
            )}
            
            <form className="checkin-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="childName">Nome da Criança:</label>
                    <input type="text" id="childName" name="childName" required />
                </div>
                
                <div className="form-group">
                    <label htmlFor="birthDate">Data de Nascimento:</label>
                    <input type="date" id="birthDate" name="birthDate" required />
                </div>
                
                <div className="form-row">
                    <div className="form-group half">
                        <label htmlFor="fatherName">Nome do Pai:</label>
                        <input type="text" id="fatherName" name="fatherName" placeholder="Digite o nome do pai" />
                    </div>
                    
                    <div className="form-group half">
                        <label htmlFor="motherName">Nome da Mãe:</label>
                        <input type="text" id="motherName" name="motherName" placeholder="Digite o nome da mãe" />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="childDocument">Documento da Criança:</label>
                    <input type="file" id="childDocument" name="childDocument" accept="image/*,application/pdf" required />
                </div>
                
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
            </form>
        </div>
    );
}

export default App;
