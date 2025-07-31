import { Transaccion } from '../../types/transaccion';
import { transaccionService } from '../../services/transaccionService';

interface RecentTransactionsProps {
  transacciones: Transaccion[];
  title: string;
}

export default function RecentTransactions({ transacciones, title }: RecentTransactionsProps) {
  if (transacciones.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">No hay transacciones recientes</p>
          <p className="text-xs text-gray-400 mt-1">Agrega tu primera transacción</p>
        </div>
      </div>
    );
  }

  const formatearFechaRelativa = (fecha: string) => {
    const ahora = new Date();
    const fechaTransaccion = new Date(fecha);
    const diferencia = ahora.getTime() - fechaTransaccion.getTime();
    const dias = Math.floor(diferencia / (1000 * 3600 * 24));
    const horas = Math.floor(diferencia / (1000 * 3600));
    const minutos = Math.floor(diferencia / (1000 * 60));

    if (dias > 0) {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transacciones.map((transaccion, index) => (
          <div 
            key={transaccion.transaccionId}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex items-center flex-1 min-w-0">
              {/* Icono de categoría */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                   style={{ backgroundColor: `${transaccion.color}20` }}>
                <span className="text-lg">
                  {transaccion.iconoCategoria || transaccionService.obtenerIconoPorTipo(transaccion.tipoTransaccion)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {transaccion.descripcion || transaccion.nombreCategoria || 'Sin descripción'}
                  </p>
                  <p className={`font-semibold text-sm ml-2 ${transaccionService.obtenerColorPorTipo(transaccion.tipoTransaccion)}`}>
                    {transaccion.tipoTransaccion === 'gasto' ? '-' : '+'}
                    {transaccionService.formatearMonto(transaccion.monto).replace('COP', '').trim()}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{transaccion.nombreCategoria}</span>
                    {transaccion.nombreCuenta && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{transaccion.nombreCuenta}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatearFechaRelativa(transaccion.fechaTransaccion)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Resumen de transacciones */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {(() => {
          const ingresos = transacciones.filter(t => t.tipoTransaccion === 'ingreso');
          const gastos = transacciones.filter(t => t.tipoTransaccion === 'gasto');
          const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
          const totalGastos = gastos.reduce((sum, t) => sum + t.monto, 0);
          
          return (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="font-semibold text-green-600 text-sm">
                  +{transaccionService.formatearMonto(totalIngresos).replace('COP', '').trim()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gastos</p>
                <p className="font-semibold text-red-600 text-sm">
                  -{transaccionService.formatearMonto(totalGastos).replace('COP', '').trim()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`font-semibold text-sm ${totalIngresos >= totalGastos ? 'text-green-600' : 'text-red-600'}`}>
                  {totalIngresos >= totalGastos ? '+' : ''}
                  {transaccionService.formatearMonto(totalIngresos - totalGastos).replace('COP', '').trim()}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}