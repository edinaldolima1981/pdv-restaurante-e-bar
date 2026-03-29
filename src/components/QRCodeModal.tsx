import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';
import { Table } from '../types';
import { motion } from 'motion/react';

interface QRCodeModalProps {
  table: Table;
  onClose: () => void;
}

export function QRCodeModal({ table, onClose }: QRCodeModalProps) {
  const appUrl = window.location.origin;
  const qrUrl = `${appUrl}?tableId=${table.id}`;

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-table-${table.id}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Mesa_${table.number}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 max-w-md w-full shadow-2xl flex flex-col items-center text-center"
      >
        <div className="flex justify-between items-center w-full mb-6 sm:mb-8">
          <div className="text-left">
            <h2 className="text-xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">QR Code</h2>
            <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1">Mesa {table.number}</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl text-slate-400 transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-slate-50 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-slate-100 mb-6 sm:mb-8 w-full flex justify-center">
          <div className="w-full max-w-[200px] sm:max-w-none">
            <QRCodeSVG 
              id={`qr-table-${table.id}`}
              value={qrUrl} 
              size={256}
              level="H"
              includeMargin={true}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <p className="text-slate-500 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
          O cliente pode escanear este código para acessar o cardápio e fazer pedidos diretamente desta mesa.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          <button 
            onClick={downloadQRCode}
            className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Baixar
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-[#003087] text-white hover:bg-blue-700 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Imprimir
          </button>
        </div>
      </motion.div>
    </div>
  );
}
