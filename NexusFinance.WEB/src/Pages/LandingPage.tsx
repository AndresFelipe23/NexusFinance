import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { 
  Wallet,
  PiggyBank,
  TrendingUp,
  MapPin,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  ArrowRight,
  Play,
  CheckCircle,
  Menu,
  X,
  DollarSign,
  Target,
  CreditCard,
  Plane,
  Calendar,
  FileText,
  Sparkles
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function NexusFinanceLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Referencias para animaciones GSAP
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación inicial del hero text
      if (heroTextRef.current) {
        gsap.fromTo(heroTextRef.current.children, 
          { 
            opacity: 0, 
            y: 60,
            scale: 0.9
          },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            duration: 1.2, 
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.3
          }
        );
      }

      // Animación de botones del hero
      if (heroButtonsRef.current) {
        gsap.fromTo(heroButtonsRef.current.children,
          { 
            opacity: 0, 
            y: 30,
            scale: 0.8
          },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            duration: 0.8, 
            stagger: 0.15,
            ease: "back.out(1.7)",
            delay: 1
          }
        );
      }

      // Animación de estadísticas con contador
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { 
            opacity: 0, 
            scale: 0.3,
            rotation: -10
          },
          { 
            opacity: 1, 
            scale: 1,
            rotation: 0,
            duration: 0.8, 
            stagger: 0.1,
            ease: "elastic.out(1, 0.75)",
            delay: 1.5
          }
        );
      }

      // Animación de features con scroll trigger
      if (featuresRef.current) {
        gsap.fromTo(featuresRef.current.children,
          { 
            opacity: 0, 
            y: 80,
            scale: 0.8,
            rotation: 5
          },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            rotation: 0,
            duration: 1, 
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Animación del CTA section
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { 
            opacity: 0, 
            scale: 0.9,
            y: 50
          },
          { 
            opacity: 1, 
            scale: 1,
            y: 0,
            duration: 1.2, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 80%"
            }
          }
        );
      }

      // Elementos flotantes animados
      if (floatingElementsRef.current) {
        const elements = floatingElementsRef.current.children;
        Array.from(elements).forEach((element, index) => {
          gsap.to(element, {
            y: -20,
            duration: 2 + (index * 0.3),
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            delay: index * 0.5
          });
          
          gsap.to(element, {
            rotation: 5,
            duration: 3 + (index * 0.2),
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            delay: index * 0.3
          });
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Wallet,
      title: "Gestión de Cuentas",
      description: "Administra múltiples cuentas bancarias, saldos y movimientos en tiempo real.",
      color: "from-blue-500 to-cyan-500",
      delay: 0
    },
    {
      icon: TrendingUp,
      title: "Análisis Inteligente",
      description: "Obtén insights sobre tus patrones de gasto con gráficos y reportes avanzados.",
      color: "from-emerald-500 to-teal-500",
      delay: 0.1
    },
    {
      icon: Target,
      title: "Metas Financieras",
      description: "Define y alcanza tus objetivos financieros con seguimiento automático.",
      color: "from-purple-500 to-pink-500",
      delay: 0.2
    },
    {
      icon: Plane,
      title: "Planificador de Viajes",
      description: "Presupuesta y gestiona todos los gastos de tus aventuras y vacaciones.",
      color: "from-orange-500 to-red-500",
      delay: 0.3
    },
    {
      icon: BarChart3,
      title: "Presupuestos Dinámicos",
      description: "Crea presupuestos por categorías con alertas automáticas de sobregasto.",
      color: "from-indigo-500 to-blue-500",
      delay: 0.4
    },
    {
      icon: Shield,
      title: "Seguridad Bancaria",
      description: "Protección de datos con encriptación de nivel bancario y autenticación JWT.",
      color: "from-gray-600 to-gray-800",
      delay: 0.5
    }
  ];

  const stats = [
    { number: "50K+", label: "Usuarios Activos", icon: DollarSign },
    { number: "1M+", label: "Transacciones", icon: CreditCard },
    { number: "98%", label: "Satisfacción", icon: CheckCircle },
    { number: "24/7", label: "Soporte", icon: Shield }
  ];

  const benefits = [
    "Dashboard interactivo en tiempo real",
    "Categorización automática de gastos",
    "Transferencias entre cuentas",
    "Reportes exportables (PDF/Excel)",
    "Metas con contribuciones automáticas",
    "Gestión completa de viajes"
  ];

  // Eliminar AuthModal y lógica de login modal

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Elementos flotantes decorativos */}
      <div ref={floatingElementsRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full opacity-10 blur-xl"></div>
      </div>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NexusFinance
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Inicio</a>
              <a href="#caracteristicas" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Funcionalidades</a>
              <a href="#beneficios" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Beneficios</a>
              <a href="#contacto" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Contacto</a>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:scale-105"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Comenzar Gratis
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600 transition-all duration-200 p-2 rounded-lg hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 animate-in slide-in-from-top duration-300">
            <div className="px-4 py-4 space-y-3">
              <a href="#inicio" className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Inicio</a>
              <a href="#caracteristicas" className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
              <a href="#beneficios" className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Beneficios</a>
              <a href="#contacto" className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>Contacto</a>
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <button 
                  onClick={() => {navigate("/login"); setIsMenuOpen(false);}}
                  className="block w-full text-left px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => {navigate("/login"); setIsMenuOpen(false);}}
                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Comenzar Gratis
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div ref={heroTextRef}>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-semibold text-blue-800 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Nuevas funcionalidades disponibles
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
                Tu dinero.
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                  Tus sueños.
                </span>
                <br />
                Una plataforma.
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
                Transforma la manera en que gestionas tu dinero y planificas tus aventuras. 
                <span className="font-medium text-gray-800">NexusFinance</span> une finanzas inteligentes con planificación de viajes.
              </p>
            </div>
            
            <div ref={heroButtonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button 
                onClick={() => navigate("/login")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center gap-3 min-w-[200px]"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="group px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 text-lg font-semibold rounded-2xl hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 min-w-[180px]">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Ver Demo
              </button>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="group text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{stat.number}</div>
                    <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-sm font-semibold text-emerald-800 mb-6">
              <Target className="w-4 h-4 mr-2" />
              Funcionalidades principales
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Gestión financiera{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                inteligente
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Descubre las herramientas que harán que controlar tus finanzas y planificar tus viajes sea más fácil que nunca.
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  {/* Fondo gradiente animado */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
                    
                    {/* Indicador de hover */}
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-sm font-semibold text-purple-800 mb-6">
                <CheckCircle className="w-4 h-4 mr-2" />
                Beneficios incluidos
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Más que una app,{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  tu aliado financiero
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                NexusFinance no solo te ayuda a gestionar tu dinero, sino que te empodera para tomar decisiones financieras inteligentes.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Placeholder para imagen o dashboard preview */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard Principal</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Balance Total</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">$12,459</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">Este Mes</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">+$834</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Meta: Vacaciones</span>
                      <span className="text-sm font-semibold text-purple-600">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white mb-6">
            <Target className="w-4 h-4 mr-2" />
            ¡Es momento de actuar!
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Transforma tus finanzas
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              desde hoy
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Únete a más de 50,000 personas que ya están construyendo un futuro financiero sólido con NexusFinance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button 
              onClick={() => navigate("/login")}
              className="group px-10 py-4 bg-white text-blue-600 text-lg font-bold rounded-2xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center gap-3 min-w-[220px]"
            >
              <DollarSign className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Comenzar Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="group px-8 py-4 border-2 border-white/50 text-white text-lg font-semibold rounded-2xl hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm flex items-center gap-3 min-w-[180px]">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Ver Cómo Funciona
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Configuración en 2 minutos</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold">NexusFinance</span>
              </div>
              <p className="text-gray-400 max-w-md text-lg leading-relaxed mb-6">
                La plataforma que revoluciona la forma en que gestionas tu dinero y planificas tus aventuras.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                  <Smartphone className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Producto</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#caracteristicas" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Funcionalidades
                </a></li>
                <li><a href="#beneficios" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Beneficios
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Seguridad
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  API
                </a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Soporte</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Centro de Ayuda
                </a></li>
                <li><a href="mailto:soporte@nexusfinance.com" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Contacto
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Estado del Sistema
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 flex items-center group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Privacidad
                </a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 NexusFinance. Todos los derechos reservados.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Hecho con ❤️ para tus finanzas</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Sistema operativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}