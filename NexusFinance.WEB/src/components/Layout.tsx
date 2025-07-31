import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";

export default function Layout({ children }: { children: React.ReactNode }) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación suave de entrada
      gsap.fromTo(
        layoutRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );

      gsap.fromTo(
        mainRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={layoutRef}
      className="flex h-screen bg-white font-sans"
    >
      {/* Sidebar para pantallas grandes */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
      </div>

      {/* Menú móvil */}
      <MobileMenu isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          toggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto bg-gray-50/50"
        >
          {children}
        </main>
      </div>
    </div>
  );
}