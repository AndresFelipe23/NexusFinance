import { TendenciaMensual } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface TrendChartProps {
  data: TendenciaMensual[];
  title: string;
}

export default function TrendChart({ data, title }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.ingresos, Math.abs(d.gastos)))
  );

  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  const getYPosition = (value: number) => {
    return chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding));
  };

  const getXPosition = (index: number) => {
    return padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
  };

  // Crear path para línea de ingresos
  const ingresosPath = data.map((point, index) => {
    const x = getXPosition(index);
    const y = getYPosition(point.ingresos);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Crear path para línea de gastos
  const gastosPath = data.map((point, index) => {
    const x = getXPosition(index);
    const y = getYPosition(point.gastos);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => {
            const y = getYPosition((maxValue * percent) / 100);
            return (
              <g key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="end"
                >
                  {dashboardService.formatearMontoCompacto((maxValue * percent) / 100)}
                </text>
              </g>
            );
          })}

          {/* Línea de ingresos */}
          <path
            d={ingresosPath}
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Línea de gastos */}
          <path
            d={gastosPath}
            stroke="#ef4444"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos de ingresos */}
          {data.map((point, index) => (
            <circle
              key={`ingresos-${index}`}
              cx={getXPosition(index)}
              cy={getYPosition(point.ingresos)}
              r="5"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
              className="hover:r-6 transition-all cursor-pointer"
            />
          ))}

          {/* Puntos de gastos */}
          {data.map((point, index) => (
            <circle
              key={`gastos-${index}`}
              cx={getXPosition(index)}
              cy={getYPosition(point.gastos)}
              r="5"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="hover:r-6 transition-all cursor-pointer"
            />
          ))}

          {/* Etiquetas de meses */}
          {data.map((point, index) => (
            <text
              key={`mes-${index}`}
              x={getXPosition(index)}
              y={chartHeight - 10}
              fontSize="11"
              fill="#6b7280"
              textAnchor="middle"
            >
              {point.mes}
            </text>
          ))}
        </svg>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Ingresos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Gastos</span>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        {(() => {
          const totalIngresos = data.reduce((sum, d) => sum + d.ingresos, 0);
          const totalGastos = data.reduce((sum, d) => sum + d.gastos, 0);
          const balance = totalIngresos - totalGastos;
          
          return (
            <>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Ingresos</p>
                <p className="font-semibold text-green-600">
                  {dashboardService.formatearMontoCompacto(totalIngresos)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Gastos</p>
                <p className="font-semibold text-red-600">
                  {dashboardService.formatearMontoCompacto(totalGastos)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`font-semibold ${dashboardService.obtenerColorBalance(balance)}`}>
                  {dashboardService.formatearMontoCompacto(balance)}
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}