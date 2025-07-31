import { TransaccionPorCategoria } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface CategoryChartProps {
  data: TransaccionPorCategoria[];
  title: string;
}

export default function CategoryChart({ data, title }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.monto, 0);

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

  // Calcular ángulos para el gráfico circular
  let currentAngle = 0;
  const segments = data.map(item => {
    const percentage = (item.monto / total) * 100;
    const angle = (item.monto / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle
    };
  });

  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex items-center justify-between">
        {/* Gráfico circular */}
        <div className="flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createPath(80, 80, 70, segment.startAngle, segment.endAngle)}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        {/* Lista de categorías */}
        <div className="flex-1 ml-6 space-y-3 max-h-40 overflow-y-auto">
          {data.slice(0, 6).map((item, index) => {
            const percentage = ((item.monto / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 mr-3"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 truncate flex-1">
                    {item.icono} {item.nombreCategoria}
                  </span>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="font-medium text-gray-900">
                    {dashboardService.formatearMontoCompacto(item.monto)}
                  </div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              </div>
            );
          })}
          {data.length > 6 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{data.length - 6} categorías más
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-900">
            {dashboardService.formatearMonto(total)}
          </span>
        </div>
      </div>
    </div>
  );
}