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
  X,
  Users,
  FileText,
  Repeat,
  CheckSquare,
  Calendar
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/home", icon: LayoutDashboard },
  { name: "Transacciones", path: "/transacciones", icon: CreditCard },
  { name: "Transacciones Recurrentes", path: "/transacciones-recurrentes", icon: Repeat },
  { name: "Cuentas", path: "/cuentas", icon: Wallet },
  { name: "Transferencias", path: "/transferencias", icon: Repeat },
  { name: "Presupuestos", path: "/presupuestos", icon: TrendingUp },
  { name: "Metas Financieras", path: "/metas", icon: Target },
  { name: "Categorías", path: "/categorias", icon: BarChart3 },
  { name: "Planes de Viaje", path: "/planes-vacaciones", icon: Plane },
  { name: "Gastos de Viaje", path: "/gastos-viaje", icon: TrendingUp },
  { name: "Actividades de Viaje", path: "/actividades-viaje", icon: Calendar },
  { name: "Checklist Viaje", path: "/checklist-viaje", icon: CheckSquare },
  { name: "Documentos Viaje", path: "/documentos-viaje", icon: FileText },
  { name: "Configuración", path: "/settings", icon: Settings },
];

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen) {
        // Animación del overlay
        if (overlayRef.current) {
          gsap.set(overlayRef.current, { display: "block" });
          gsap.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: "power2.out" }
          );
        }

        // Animación del menú
        if (menuRef.current) {
          gsap.set(menuRef.current, { display: "flex" });
          gsap.fromTo(menuRef.current,
            { x: "-100%" },
            { x: "0%", duration: 0.3, ease: "power2.out" }
          );

          // Animación del logo
          gsap.fromTo(logoRef.current,
            { y: -10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" }
          );

          // Animación de los items
          gsap.fromTo(menuItemsRef.current,
            { x: -20, opacity: 0 },
            { 
              x: 0, 
              opacity: 1,
              duration: 0.2,
              stagger: 0.03,
              delay: 0.15,
              ease: "power2.out" 
            }
          );
        }
      } else {
        // Animación de cierre
        if (menuRef.current) {
          gsap.to(menuRef.current,
            { 
              x: "-100%", 
              duration: 0.25, 
              ease: "power2.in",
              onComplete: () => {
                if (menuRef.current) {
                  gsap.set(menuRef.current, { display: "none" });
                }
              }
            }
          );
        }

        if (overlayRef.current) {
          gsap.to(overlayRef.current,
            { 
              opacity: 0, 
              duration: 0.2, 
              ease: "power2.in",
              onComplete: () => {
                if (overlayRef.current) {
                  gsap.set(overlayRef.current, { display: "none" });
                }
              }
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  const handleNavigation = (path: string, index: number) => {
    // Micro animación
    if (menuItemsRef.current[index]) {
      gsap.to(menuItemsRef.current[index], {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          navigate(path);
          setIsOpen(false);
        }
      });
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        style={{ display: 'none' }}
        onClick={() => setIsOpen(false)}
      />

      {/* Menú lateral */}
      <aside
        ref={menuRef}
        className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 
                   transform -translate-x-full lg:hidden flex flex-col
                   border-r border-gray-200"
        style={{ display: 'none' }}
      >
        {/* Header */}
        <div 
          ref={logoRef}
          className="h-16 flex items-center justify-between px-6 border-b border-gray-100"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="font-semibold text-gray-900 text-lg">
              NexusFinance
            </span>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X size={20} className="text-gray-600" />
          </button>
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
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                           text-sm font-medium transition-all duration-200 ease-out
                           hover:bg-gray-50 relative
                           ${active 
                             ? "bg-blue-50 text-blue-700 border border-blue-200" 
                             : "text-gray-700 hover:text-gray-900"
                           }`}
              >
                <Icon 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    active ? "text-blue-600" : "text-gray-500"
                  }`} 
                />
                <span>{item.name}</span>
                
                {/* Indicador activo */}
                {active && (
                  <div className="absolute right-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            © 2025 NexusFinance
          </div>
        </div>
      </aside>
    </>
  );
}