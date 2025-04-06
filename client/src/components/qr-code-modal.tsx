import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [hostUrl, setHostUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Get the current hostname
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      
      // Format URL based on environment
      let url;
      if (hostname === "localhost") {
        url = `${protocol}//${hostname}:${port}`;
      } else {
        // For Replit deployment
        url = `https://${hostname}`;
      }
      
      setHostUrl(url);
      
      // Generate QR code
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0af", // Cyan color for the QR code
          light: "#111" // Dark background
        }
      })
        .then(dataUrl => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch(err => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Open Swipefolio<sup className="text-xs">™</sup> on your phone</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Scan this QR code with your phone's camera to open the app
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64 border-4 border-gray-700 rounded-lg" />
          ) : (
            <div className="w-64 h-64 bg-gray-700 animate-pulse rounded-lg"></div>
          )}
          
          <p className="mt-4 text-sm text-gray-400 text-center break-all">
            {hostUrl || "Loading URL..."}
          </p>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}