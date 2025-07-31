import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { login, saveToken, saveUser } from "../services/authService";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  DollarSign, 
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  Zap,
  BarChart3,
  Wallet,
  Target,
  Globe,
  Smartphone,
  Award
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();
  
  // Referencias para animaciones GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Datos de la plataforma
  const platformStats = [
    { icon: Users, value: "50K+", label: "Usuarios activos" },
    { icon: TrendingUp, value: "98%", label: "Satisfacción" },
    { icon: Star, value: "4.9", label: "Calificación" }
  ];

  const platformFeatures = [
    {
      icon: Wallet,
      title: "Gestión Completa",
      description: "Controla todas tus cuentas y transacciones en un solo lugar"
    },
    {
      icon: BarChart3,
      title: "Análisis Inteligente",
      description: "Obtén insights sobre tus patrones de gasto y ahorro"
    },
    {
      icon: Target,
      title: "Metas Financieras",
      description: "Define y alcanza tus objetivos con seguimiento automático"
    },
    {
      icon: Globe,
      title: "Planificación de Viajes",
      description: "Presupuesta y gestiona todos los gastos de tus aventuras"
    }
  ];

  // Animaciones GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación del panel de formulario desde la izquierda
      if (formPanelRef.current) {
        gsap.fromTo(formPanelRef.current,
          { opacity: 0, x: -100 },
          { opacity: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.2 }
        );
      }

      // Animación del panel de información desde la derecha
      if (infoPanelRef.current) {
        gsap.fromTo(infoPanelRef.current,
          { opacity: 0, x: 100 },
          { opacity: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.4 }
        );
      }

      // Animación de los campos del formulario
      if (fieldsRef.current) {
        gsap.fromTo(fieldsRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.8 }
        );
      }

      // Animación del botón
      if (buttonRef.current) {
        gsap.fromTo(buttonRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 1.2 }
        );
      }

      // Animación de las estadísticas
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)", delay: 1 }
        );
      }

      // Animación de las características
      if (featuresRef.current) {
        gsap.fromTo(featuresRef.current.children,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out", delay: 1.4 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Animación del botón durante carga
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }
    
    try {
      const res = await login({ email, password });
      console.log("Respuesta login:", res);
      saveToken(res.token);
      saveUser(res.usuario);
      
      // Animación de éxito antes de navegar
      if (formRef.current) {
        gsap.to(formRef.current, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(formRef.current, {
              opacity: 0,
              scale: 0.9,
              duration: 0.3,
              ease: "power2.in",
              onComplete: () => navigate("/home")
            });
          }
        });
      } else {
        navigate("/home");
      }
    } catch (err: unknown) {
      // Animación de error
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut"
        });
      }
      
      if (err instanceof Error) {
        setError(err.message || "Error al iniciar sesión");
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Botón de regreso */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 group flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-200 text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Volver</span>
      </Link>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Panel del Formulario - Izquierda */}
        <div ref={formPanelRef} className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo y título */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h1>
              <p className="text-gray-600">Ingresa a tu cuenta de NexusFinance</p>
            </div>

            {/* Formulario */}
            <form ref={formRef} onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
              {/* Mensaje de error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Error de autenticación</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div ref={fieldsRef} className="space-y-6">
                {/* Campo Email */}
                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    emailFocused ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                      emailFocused ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none ${
                        emailFocused 
                          ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    passwordFocused ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                      passwordFocused ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none ${
                        passwordFocused 
                          ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Tu contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Recordar sesión y olvidé contraseña */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors">Recordar sesión</span>
                  </label>
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">¿Olvidaste tu contraseña?</a>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                ref={buttonRef}
                type="submit"
                disabled={loading}
                className="w-full mt-8 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">¿No tienes una cuenta?</span>
                </div>
              </div>

              {/* Link a registro */}
              <div className="text-center">
                <Link 
                  to="/register" 
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors group"
                >
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>Crear cuenta gratis</span>
                </Link>
              </div>
            </form>

            {/* Información de seguridad */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Conexión segura con encriptación SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Información - Derecha */}
        <div ref={infoPanelRef} className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 p-12 text-white relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-32 left-16 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Título principal */}
            <div className="mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Transforma tu
                <br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  vida financiera
                </span>
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Únete a miles de personas que ya están construyendo un futuro financiero sólido con NexusFinance.
              </p>
            </div>

            {/* Estadísticas */}
            <div ref={statsRef} className="grid grid-cols-3 gap-6 mb-12">
              {platformStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-3">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-blue-100">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Características principales */}
            <div ref={featuresRef} className="space-y-6">
              <h3 className="text-2xl font-bold mb-6">Lo que puedes hacer:</h3>
              
              {platformFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-200">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 group-hover:text-yellow-300 transition-colors duration-200">{feature.title}</h4>
                      <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Testimonial o badge */}
            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold">4.9/5</span>
              </div>
              <p className="text-blue-100 italic">
                "NexusFinance transformó completamente cómo manejo mi dinero. Ahora tengo control total de mis finanzas."
              </p>
              <div className="mt-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">MR</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">María Rodríguez</div>
                  <div className="text-blue-200 text-xs">Usuaria desde 2023</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}