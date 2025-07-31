import React from 'react';
import { X } from 'lucide-react';

interface DocumentoViajeModalSimpleProps {
  onClose: () => void;
  planId: string;
}

const DocumentoViajeModalSimple: React.FC<DocumentoViajeModalSimpleProps> = ({
  onClose,
  planId
}) => {
  console.log('Modal simple renderizado:', { planId });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Modal de Prueba</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Este es un modal de prueba. PlanId: {planId}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentoViajeModalSimple; 