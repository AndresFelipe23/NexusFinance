import { MetaResumen } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface GoalsWidgetProps {
  metas: MetaResumen[];
  title: string;
}

export default function GoalsWidget({ metas, title }: GoalsWidgetProps) {
  if (metas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-500">No tienes metas configuradas</p>
          <p className="text-xs text-gray-400 mt-1">Crea tu primera meta financiera</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">
          {metas.filter(m => m.estaCompletada).length} de {metas.length} completadas
        </span>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {metas.map((meta, index) => (
          <div key={meta.metaId} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  meta.estaCompletada 
                    ? 'bg-green-500' 
                    : meta.porcentajeProgreso >= 80 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                }`} />
                <span className="font-medium text-gray-900 text-sm">
                  {meta.nombreMeta}
                </span>
                {meta.estaCompletada && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {meta.porcentajeProgreso}%
              </span>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  meta.estaCompletada 
                    ? 'bg-green-500' 
                    : meta.porcentajeProgreso >= 80 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(meta.porcentajeProgreso, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {dashboardService.formatearMontoCompacto(meta.montoActual)} / {dashboardService.formatearMontoCompacto(meta.montoObjetivo)}
              </span>
              {meta.diasRestantes !== undefined && !meta.estaCompletada && (
                <span className={`${
                  meta.diasRestantes <= 30 
                    ? 'text-red-500' 
                    : meta.diasRestantes <= 90 
                      ? 'text-yellow-600' 
                      : 'text-gray-500'
                }`}>
                  {meta.diasRestantes > 0 
                    ? `${meta.diasRestantes} días` 
                    : meta.diasRestantes === 0
                      ? 'Hoy'
                      : `${Math.abs(meta.diasRestantes)} días vencida`
                  }
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {metas.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            Ver todas las metas
          </button>
        </div>
      )}
    </div>
  );
}