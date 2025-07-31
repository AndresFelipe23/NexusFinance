

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet,
  CreditCard,
  TrendingUp,
  Target,
  Plane,
  BarChart3, 
  Settings,
  ChevronLeft,
  Users,
  FileText,
  Repeat,
  CheckSquare,
  Calendar,
  PieChart
} from "lucide-react";

const menuItems = [
  // Funcionalidades principales de finanzas
  { name: "Dashboard", path: "/home", icon: LayoutDashboard },
  { name: "Transacciones", path: "/transacciones", icon: CreditCard },
  { name: "Transacciones Recurrentes", path: "/transacciones-recurrentes", icon: Repeat },
  { name: "Cuentas", path: "/cuentas", icon: Wallet },
  { name: "Transferencias", path: "/transferencias", icon: Repeat },
  { name: "Presupuestos", path: "/presupuestos", icon: TrendingUp },
  { name: "Metas Financieras", path: "/metas", icon: Target },
  { name: "Categorías", path: "/categorias", icon: BarChart3 },
  
  // Funcionalidades de viajes
  { name: "Planes de Viaje", path: "/planes-vacaciones", icon: Plane },
  { name: "Gastos de Viaje", path: "/gastos-viaje", icon: Plane },
  { name: "Actividades de Viaje", path: "/actividades-viaje", icon: Calendar },
  { name: "Checklist Viaje", path: "/checklist-viaje", icon: CheckSquare },
  { name: "Documentos Viaje", path: "/documentos-viaje", icon: FileText },
  
  // Herramientas adicionales
  { name: "Reportes", path: "/reportes", icon: PieChart },
  { name: "Configuración", path: "/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación de entrada del sidebar
      gsap.fromTo(
        sidebarRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      // Animación del logo
      gsap.fromTo(
        logoRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, delay: 0.2, ease: "power2.out" }
      );

      // Animación escalonada de items del menú
      gsap.fromTo(
        menuItemsRef.current,
        { x: -10, opacity: 0 },
        { 
          x: 0, 
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          delay: 0.3,
          ease: "power2.out" 
        }
      );
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Animación al colapsar/expandir
    const ctx = gsap.context(() => {
      gsap.to(sidebarRef.current, {
        width: isCollapsed ? 80 : 256,
        duration: 0.3,
        ease: "power2.out"
      });

      // Rotar el botón de colapsar
      gsap.to(collapseButtonRef.current, {
        rotation: isCollapsed ? 180 : 0,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    return () => ctx.revert();
  }, [isCollapsed]);

  const handleNavigation = (path: string, index: number) => {
    // Micro animación al hacer clic
    gsap.to(menuItemsRef.current[index], {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });
    
    navigate(path);
  };

  const toggleCollapse = () => {
    // Animación del botón
    gsap.to(collapseButtonRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });
    
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      ref={sidebarRef}
      className="h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300"
      style={{ width: isCollapsed ? '80px' : '256px' }}
    >
      {/* Logo */}
      <div 
        ref={logoRef}
        className="h-16 flex items-center justify-between px-6 border-b border-gray-100"
      >
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-gray-900 text-lg whitespace-nowrap">
              NexusFinance
            </span>
          )}
        </div>
        
        {/* Botón colapsar/expandir */}
        {!isCollapsed && (
          <button
            ref={collapseButtonRef}
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
            title="Colapsar sidebar"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          
          return (
            <button
              key={item.name}
              ref={(el) => {
                if (el) menuItemsRef.current[index] = el;
              }}
              onClick={() => handleNavigation(item.path, index)}
              className={`w-full flex items-center rounded-lg
                         text-sm font-medium transition-all duration-200 ease-out
                         hover:bg-gray-50 group relative
                         ${isCollapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-3 py-2.5'}
                         ${active 
                           ? "bg-blue-50 text-blue-700 border border-blue-200" 
                           : "text-gray-700 hover:text-gray-900"
                         }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon 
                size={18} 
                className={`flex-shrink-0 transition-colors duration-200 ${
                  active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                }`} 
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
              
              {/* Indicador activo */}
              {active && !isCollapsed && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )}
              
              {/* Indicador activo para modo colapsado */}
              {active && isCollapsed && (
                <div className="absolute right-1 top-1 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Botón expandir cuando está colapsado */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={toggleCollapse}
            className="w-full p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200
                       flex items-center justify-center"
            title="Expandir sidebar"
          >
            <ChevronLeft size={16} className="text-gray-500 rotate-180" />
          </button>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            © 2025 NexusFinance
          </div>
        </div>
      )}
    </aside>
  );
}
