import { useState, useEffect, useRef } from "react";
import { getUser, logout, removeUser } from "../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { Menu, Settings, LogOut, User } from "lucide-react";

const routeTitles: { [key: string]: string } = {
  "/home": "Dashboard",
  "/cuentas": "Cuentas",
  "/transacciones": "Transacciones",
  "/transacciones-recurrentes": "Transacciones Recurrentes",
  "/presupuestos": "Presupuestos",
  "/metas": "Metas de Ahorro",
  "/categorias": "Categorías",
  "/transferencias": "Transferencias",
  "/reportes": "Reportes",
  "/settings": "Ajustes",
  "/planes-vacaciones": "Planes de Vacaciones",
  "/categorias-gastos-viaje": "Categorías de Gastos de Viaje",
  "/presupuesto-viaje": "Presupuesto de Viaje",
  "/actividades-viaje": "Actividades de Viaje",
  "/checklist-viaje": "Checklist de Viaje",
  "/gastos-viaje": "Gastos de Viaje",
  "/documentos-viaje": "Documentos de Viaje",
  "/login": "Inicio de Sesión",
  "/registro": "Registro",
  "/": "NexusFinance",
};

export default function Navbar({ 
  toggleSidebar, 
  toggleSidebarCollapse, 
  isSidebarCollapsed 
}: { 
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const collapseButtonRef = useRef<HTMLButtonElement>(null);

  const getTitle = () => {
    const { pathname } = location;
    // Búsqueda exacta primero
    if (routeTitles[pathname]) {
      return routeTitles[pathname];
    }
    // Manejo de rutas dinámicas
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      const basePath = `/${pathSegments[0]}`;
      if (routeTitles[basePath]) {
        return routeTitles[basePath];
      }
    }
    return "NexusFinance"; // Título por defecto
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navbarRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    // Animación del dropdown
    if (dropdownRef.current) {
      if (open) {
        gsap.set(dropdownRef.current, { display: "block" });
        gsap.fromTo(dropdownRef.current,
          { opacity: 0, y: -8, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
        );
      } else {
        gsap.to(dropdownRef.current,
          { 
            opacity: 0, 
            y: -8, 
            scale: 0.95,
            duration: 0.15, 
            ease: "power2.in",
            onComplete: () => {
              if (dropdownRef.current) {
                gsap.set(dropdownRef.current, { display: "none" });
              }
            }
          }
        );
      }
    }
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => setUser(getUser()), 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    removeUser();
    setUser(null);
    navigate("/login");
  };

  const toggleDropdown = () => {
    if (avatarRef.current) {
      gsap.to(avatarRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
    setOpen(!open);
  };

  const handleToggleCollapse = () => {
    if (collapseButtonRef.current) {
      gsap.to(collapseButtonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
    toggleSidebarCollapse();
  };

  return (
    <header 
      ref={navbarRef}
      className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between"
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ease-out"
          aria-label="Toggle navigation"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        <button
          ref={collapseButtonRef}
          onClick={handleToggleCollapse}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ease-out"
          aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          title={isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="relative">
        {user && (
          <>
            <button
              ref={avatarRef}
              onClick={toggleDropdown}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded={open ? "true" : "false"}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user.nombre}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email || 'N/A'}
                </div>
              </div>
            </button>

            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 origin-top-right py-1"
              style={{ display: 'none' }}
            >
              <hr className="my-1 border-gray-100" />

              <button
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 
                          hover:bg-gray-50 transition-colors duration-150"
                onClick={() => {
                  setOpen(false);
                  navigate("/ajustes");
                }}
              >
                <Settings size={16} />
                <span>Ajustes</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}