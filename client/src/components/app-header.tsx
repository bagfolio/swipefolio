import { Bell, Menu, Smartphone } from "lucide-react";
import { useState } from "react";
import QRCodeModal from "./qr-code-modal";

export default function AppHeader() {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <div className="app-header fixed top-0 left-0 right-0 z-20">
      <div className="bg-white border-b border-slate-100 shadow-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Menu className="w-5 h-5 text-slate-500" />
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 font-sans text-slate-800 text-xl font-semibold tracking-tight">
          Swipefolio<sup className="text-xs">™</sup>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="bg-slate-50 rounded-full p-2 border border-slate-100" 
            onClick={() => setShowQRModal(true)}
            aria-label="Open on mobile"
          >
            <Smartphone className="w-5 h-5 text-sky-500" />
          </button>
          <button className="bg-slate-50 rounded-full p-2 border border-slate-100">
            <Bell className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      <QRCodeModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}