import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  User,
  DollarSign, 
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Star,
  Zap,
  BarChart3,
  Wallet,
  Target,
  Globe,
  Gift,
  Clock,
  Award,
  Crown
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  
  // Referencias para animaciones GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  // Datos de beneficios del registro
  const registrationBenefits = [
    {
      icon: Gift,
      title: "Gratis para siempre",
      description: "Todas las funciones básicas sin costo alguno"
    },
    {
      icon: Clock,
      title: "Configuración en 2 minutos",
      description: "Comienza a usar la plataforma inmediatamente"
    },
    {
      icon: Crown,
      title: "Sin tarjeta de crédito",
      description: "No necesitas proporcionar información de pago"
    },
    {
      icon: Award,
      title: "Soporte premium",
      description: "Acceso completo a nuestro equipo de soporte"
    }
  ];

  const onboardingSteps = [
    { step: 1, title: "Crea tu cuenta", description: "Registro rápido y seguro", active: true },
    { step: 2, title: "Conecta tus cuentas", description: "Vincula tus cuentas bancarias", active: false },
    { step: 3, title: "Define tus metas", description: "Establece objetivos financieros", active: false },
    { step: 4, title: "¡Comienza a ahorrar!", description: "Disfruta de todas las funciones", active: false }
  ];

  // Función para calcular fortaleza de contraseña
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

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
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 1.4 }
        );
      }

      // Animación de los beneficios
      if (benefitsRef.current) {
        gsap.fromTo(benefitsRef.current.children,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, stagger: 0.15, ease: "back.out(1.7)", delay: 1 }
        );
      }

      // Animación de los pasos
      if (stepsRef.current) {
        gsap.fromTo(stepsRef.current.children,
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 1.6 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Actualizar fortaleza de contraseña
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Débil';
    if (passwordStrength < 50) return 'Regular';
    if (passwordStrength < 75) return 'Buena';
    return 'Excelente';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwordStrength < 50) {
      setError("La contraseña debe ser más fuerte");
      return;
    }

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
      // Aquí iría la lógica de registro
      console.log("Datos de registro:", formData);
      
      // Simulación de registro exitoso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
              onComplete: () => navigate("/login")
            });
          }
        });
      } else {
        navigate("/login");
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
      
      setError("Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-100 relative overflow-hidden">
      {/* Botón de regreso */}
      <Link 
        to="/login" 
        className="absolute top-6 left-6 z-20 group flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-200 text-gray-600 hover:text-emerald-600 shadow-lg hover:shadow-xl"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Únete a NexusFinance</h1>
              <p className="text-gray-600">Crea tu cuenta gratuita en segundos</p>
            </div>

            {/* Formulario */}
            <form ref={formRef} onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
              {/* Mensaje de error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Error de validación</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div ref={fieldsRef} className="space-y-5">
                {/* Campos de Nombre */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      focusedField === 'firstName' ? 'text-emerald-600' : 'text-gray-700'
                    }`}>
                      Nombre
                    </label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                        focusedField === 'firstName' ? 'text-emerald-600' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => setFocusedField('')}
                        className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none text-sm ${
                          focusedField === 'firstName'
                            ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      focusedField === 'lastName' ? 'text-emerald-600' : 'text-gray-700'
                    }`}>
                      Apellido
                    </label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                        focusedField === 'lastName' ? 'text-emerald-600' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => setFocusedField('')}
                        className={`w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none text-sm ${
                          focusedField === 'lastName'
                            ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Tu apellido"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Campo Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-emerald-600' : 'text-gray-700'
                  }`}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                      focusedField === 'email' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none ${
                        focusedField === 'email'
                          ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-emerald-600' : 'text-gray-700'
                  }`}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                      focusedField === 'password' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none ${
                        focusedField === 'password'
                          ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Indicador de fortaleza */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Fortaleza de contraseña</span>
                        <span className={`font-medium ${
                          passwordStrength < 25 ? 'text-red-500' :
                          passwordStrength < 50 ? 'text-orange-500' :
                          passwordStrength < 75 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo Confirmar Contraseña */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    focusedField === 'confirmPassword' ? 'text-emerald-600' : 'text-gray-700'
                  }`}>
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                      focusedField === 'confirmPassword' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-200 outline-none ${
                        focusedField === 'confirmPassword'
                          ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-500/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Repite tu contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Indicador de coincidencia */}
                  {formData.confirmPassword && (
                    <div className="mt-2 flex items-center space-x-2">
                      {formData.password === formData.confirmPassword ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-xs ${
                        formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formData.password === formData.confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Términos y condiciones */}
                <div className="flex items-start space-x-3 text-sm">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5" 
                    required 
                  />
                  <span className="text-gray-600">
                    Acepto los{" "}
                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      política de privacidad
                    </a>
                  </span>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                ref={buttonRef}
                type="submit"
                disabled={loading}
                className="w-full mt-8 group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <span>Crear cuenta gratis</span>
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
                  <span className="px-4 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
                </div>
              </div>

              {/* Link a login */}
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Inicia sesión aquí</span>
                </Link>
              </div>
            </form>

            {/* Información de seguridad */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Registro seguro con encriptación SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Información - Derecha */}
        <div ref={infoPanelRef} className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600 p-12 text-white relative overflow-hidden">
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
                Comienza tu
                <br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  transformación financiera
                </span>
              </h2>
              <p className="text-xl text-emerald-100 leading-relaxed">
                Únete a nuestra comunidad y toma control total de tus finanzas personales.
              </p>
            </div>

            {/* Beneficios del registro */}
            <div ref={benefitsRef} className="space-y-6 mb-12">
              <h3 className="text-2xl font-bold mb-6">¿Por qué elegir NexusFinance?</h3>
              
              {registrationBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-200">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 group-hover:text-yellow-300 transition-colors duration-200">{benefit.title}</h4>
                      <p className="text-emerald-100 text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pasos del onboarding */}
            <div ref={stepsRef} className="space-y-4">
              <h3 className="text-xl font-bold mb-6">Tu proceso de registro:</h3>
              
              {onboardingSteps.map((step, index) => (
                <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${
                  step.active ? 'bg-white/20' : 'bg-white/5'
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.active ? 'bg-yellow-400 text-gray-900' : 'bg-white/20'
                  }`}>
                    {step.step}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${step.active ? 'text-yellow-300' : 'text-white'}`}>
                      {step.title}
                    </h4>
                    <p className="text-emerald-100 text-xs">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold">5.0/5</span>
              </div>
              <p className="text-emerald-100 italic mb-4">
                "El registro fue súper fácil y en minutos ya estaba gestionando todas mis finanzas. ¡Increíble!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">CF</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Carlos Fernández</div>
                  <div className="text-emerald-200 text-xs">Nuevo usuario</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}