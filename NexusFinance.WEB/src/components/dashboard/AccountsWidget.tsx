import { CuentaResumen } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface AccountsWidgetProps {
  cuentas: CuentaResumen[];
  title: string;
}

export default function AccountsWidget({ cuentas, title }: AccountsWidgetProps) {
  if (cuentas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💳</div>
          <p className="text-gray-500">No tienes cuentas registradas</p>
          <p className="text-xs text-gray-400 mt-1">Agrega tu primera cuenta</p>
        </div>
      </div>
    );
  }

  const totalSaldo = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);

  const getTipoCuentaIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'ahorros':
        return '🏦';
      case 'corriente':
        return '💳';
      case 'credito':
        return '💎';
      case 'inversion':
        return '📈';
      case 'efectivo':
        return '💵';
      default:
        return '💰';
    }
  };

  const getTipoCuentaColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'ahorros':
        return 'bg-blue-100 text-blue-800';
      case 'corriente':
        return 'bg-green-100 text-green-800';
      case 'credito':
        return 'bg-purple-100 text-purple-800';
      case 'inversion':
        return 'bg-yellow-100 text-yellow-800';
      case 'efectivo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-indigo-100 text-indigo-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-semibold text-gray-900">
            {dashboardService.formatearMontoCompacto(totalSaldo)}
          </p>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {cuentas.map((cuenta, index) => (
          <div 
            key={cuenta.cuentaId}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center flex-1 min-w-0">
              <div className="text-xl mr-3">
                {getTipoCuentaIcon(cuenta.tipoCuenta)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {cuenta.nombreCuenta}
                  </p>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTipoCuentaColor(cuenta.tipoCuenta)}`}>
                    {cuenta.tipoCuenta}
                  </span>
                </div>
                {cuenta.nombreBanco && (
                  <p className="text-xs text-gray-500 truncate">
                    {cuenta.nombreBanco}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4 flex-shrink-0">
              <p className={`font-semibold ${
                cuenta.saldo >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {dashboardService.formatearMontoCompacto(cuenta.saldo)}
              </p>
              <p className="text-xs text-gray-500">
                {cuenta.moneda || 'COP'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Distribución por tipo de cuenta */}
      {cuentas.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Distribución</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(
              cuentas.reduce((acc, cuenta) => {
                const tipo = cuenta.tipoCuenta;
                acc[tipo] = (acc[tipo] || 0) + cuenta.saldo;
                return acc;
              }, {} as Record<string, number>)
            ).map(([tipo, saldo]) => {
              const porcentaje = totalSaldo > 0 ? ((saldo / totalSaldo) * 100).toFixed(1) : '0';
              return (
                <div key={tipo} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      {getTipoCuentaIcon(tipo)} {tipo}
                    </span>
                    <span className="font-medium">{porcentaje}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {cuentas.length > 6 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            Ver todas las cuentas
          </button>
        </div>
      )}
    </div>
  );
}