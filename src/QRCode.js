import React, { useState, useEffect } from 'react';
import './QRCode.css';

function QRCode() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Captura a URL base da aplicação
    const currentUrl = window.location.origin;
    setBaseUrl(currentUrl);
    
    // Define a URL para a API de QR code, usando um serviço gratuito
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`);
    
    console.log('QR Code URL:', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`);
  }, []);

  return (
    <div className="qrcode-container">
      <header className="qrcode-header">
        <h1>EnoCheck - QR Code</h1>
      </header>

      <div className="qrcode-content">
        <h2>Escaneie o QR Code para acessar o pré-check-in infantil</h2>
        <div className="qrcode-wrapper">
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code para pré-check-in infantil" 
              className="qrcode-image"
            />
          ) : (
            <div className="qrcode-loading">Gerando QR Code...</div>
          )}
        </div>
        <p className="qrcode-instructions">
          Aponte a câmera do seu celular para este QR Code para acessar o formulário 
          de pré-check-in infantil diretamente no seu dispositivo.
        </p>
        <div className="qrcode-url">
          <p>Ou acesse diretamente o link:</p>
          <a href={baseUrl} target="_blank" rel="noopener noreferrer">
            {baseUrl}
          </a>
        </div>
      </div>
    </div>
  );
}

export default QRCode;
