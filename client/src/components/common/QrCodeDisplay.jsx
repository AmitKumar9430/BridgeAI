import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QrCodeDisplay = ({ value, size = 180, className = '' }) => {
  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative p-3 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center ${className}`}
      >
        <span className="text-xs text-slate-400 font-mono">Generating QR...</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center ${className}`}
    >
      <QRCodeSVG
        value={value}
        size={size - 20}
        level="M"
        bgColor="#ffffff"
        fgColor="#0f172a"
        includeMargin={false}
        className="w-full h-full"
      />
    </div>
  );
};

export default QrCodeDisplay;
