import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle,
  trend 
}: StatsCardProps) {
  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full blur-2xl -translate-y-6 translate-x-6"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-2 transition-colors duration-300`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-3 p-2 bg-slate-50/50 rounded-lg">
              <span className={`text-sm font-bold flex items-center ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-lg mr-1">{trend.isPositive ? '↗' : '↘'}</span>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-slate-500 ml-2">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <div className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-all duration-300 ${color.replace('text-', 'bg-').replace('-600', '-100')} border-2 border-white/50`}>
            <div className={`${color} transition-colors duration-300`}>
              {icon}
            </div>
          </div>
          {/* Glow effect */}
          <div className={`absolute -inset-2 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-300 ${color.replace('text-', 'bg-').replace('-600', '-400')}`}></div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.replace('text-', 'from-').replace('-600', '-400')} to-transparent rounded-b-2xl`}></div>
    </div>
  );
}