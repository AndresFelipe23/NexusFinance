import { useState, useEffect, useRef } from 'react';
import Layout from "../components/Layout";
import { authService, logout, removeUser } from '../services/authService';
import type { User } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { confirmarAccion } from '../utils/sweetAlert';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Info, 
  Github, 
  Instagram, 
  Coffee, 
  LogOut, 
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  Heart,
  Star,
  DollarSign,
  Calendar,
  Camera,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>({});
  const navigate = useNavigate();

  // Referencias para animaciones
  const pageRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'preferences', name: 'Preferencias', icon: SettingsIcon },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'about', name: 'Acerca de', icon: Info }
  ];

  useEffect(() => {
    const user = authService.getUser();
    setCurrentUser(user);
    setEditedUser(user || {});
  }, []);

  useEffect(() => {
    // Verificar preferencia de tema guardada
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    // Animaciones de entrada mejoradas
    const ctx = gsap.context(() => {
      // Animación del contenedor principal
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );

      // Animación de las pestañas
      if (tabsRef.current) {
        gsap.fromTo(
          tabsRef.current.children,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "power2.out" }
        );
      }

      // Animación del contenido
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.5, ease: "power2.out" }
      );

      // Animación de las tarjetas
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, delay: 0.7, ease: "back.out(1.7)" }
      );
    });

    return () => ctx.revert();
  }, [activeTab]);

  const handleLogout = async () => {
    const confirmed = await confirmarAccion(
      '¿Cerrar sesión?',
      '¿Estás seguro de que quieres cerrar tu sesión?',
      'Cerrar sesión',
      'Cancelar',
      'warning'
    );

    if (confirmed) {
      logout();
      removeUser();
      navigate("/login");
    }
  };

  const handleSaveProfile = () => {
    // Aquí iría la lógica para guardar los cambios del perfil
    setCurrentUser(editedUser);
    setIsEditing(false);
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar y información básica */}
      <div ref={el => { if (el) cardsRef.current[0] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {currentUser?.nombre?.charAt(0)}{currentUser?.apellido?.charAt(0)}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{currentUser?.nombre} {currentUser?.apellido}</h2>
            <p className="text-gray-600">{currentUser?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">Activo</span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Información del perfil */}
      <div ref={el => { if (el) cardsRef.current[1] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
          Información Personal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.nombre || ''}
                onChange={(e) => setEditedUser({...editedUser, nombre: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{currentUser?.nombre}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.apellido || ''}
                onChange={(e) => setEditedUser({...editedUser, apellido: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{currentUser?.apellido}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex-1">{currentUser?.email}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            {isEditing ? (
              <select
                value={editedUser.moneda || ''}
                onChange={(e) => setEditedUser({...editedUser, moneda: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="COP">COP - Peso Colombiano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex-1">{currentUser?.moneda}</p>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div ref={el => { if (el) cardsRef.current[0] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-purple-500" />
          Apariencia
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <p className="font-medium text-gray-900">Modo Oscuro</p>
                <p className="text-sm text-gray-500">Cambia el tema de la aplicación</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div ref={el => { if (el) cardsRef.current[1] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-green-500" />
          Idioma y Región
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="America/Bogota">GMT-5 Bogotá</option>
              <option value="America/New_York">GMT-5 New York</option>
              <option value="Europe/Madrid">GMT+1 Madrid</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div ref={el => { if (el) cardsRef.current[0] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-500" />
          Preferencias de Notificación
        </h3>
        
        <div className="space-y-6">
          {[
            { key: 'email', icon: Mail, title: 'Notificaciones por Email', desc: 'Recibe actualizaciones por correo electrónico' },
            { key: 'push', icon: Smartphone, title: 'Notificaciones Push', desc: 'Recibe notificaciones en tu dispositivo' },
            { key: 'marketing', icon: Star, title: 'Marketing', desc: 'Recibe ofertas y novedades de productos' },
            { key: 'security', icon: Shield, title: 'Seguridad', desc: 'Alertas importantes de seguridad' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange(item.key, !notifications[item.key as keyof typeof notifications])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div ref={el => { if (el) cardsRef.current[0] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-red-500" />
          Seguridad de la Cuenta
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Autenticación de dos factores</p>
                <p className="text-sm text-green-700">Tu cuenta está protegida</p>
              </div>
            </div>
            <span className="text-green-600 font-medium">Activo</span>
          </div>
          
          <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Cambiar Contraseña</p>
                <p className="text-sm text-gray-500">Actualiza tu contraseña</p>
              </div>
            </div>
            <Edit3 className="w-5 h-5 text-gray-400" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Descargar Datos</p>
                <p className="text-sm text-gray-500">Exporta toda tu información</p>
              </div>
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div ref={el => { if (el) cardsRef.current[1] = el; }} className="bg-red-50 rounded-2xl shadow-lg border border-red-200 p-8">
        <h3 className="text-xl font-semibold text-red-900 mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
          Zona de Peligro
        </h3>
        
        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 border border-red-300 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-900">Cerrar Sesión</p>
                <p className="text-sm text-red-700">Salir de tu cuenta</p>
              </div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 border border-red-300 rounded-xl hover:bg-red-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-900">Eliminar Cuenta</p>
                <p className="text-sm text-red-700">Eliminar permanentemente tu cuenta</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="space-y-6">
      <div ref={el => { if (el) cardsRef.current[0] = el; }} className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-2">NexusFinance</h2>
          <p className="text-blue-100 mb-4">Tu aliado en la gestión financiera personal</p>
          <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm">
            <span>Versión 1.0.0</span>
          </div>
        </div>
      </div>

      <div ref={el => { if (el) cardsRef.current[1] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Acerca del Desarrollador</h3>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            AE
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Andrés Espitia</h4>
            <p className="text-gray-600">Desarrollador Full Stack</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Apasionado por crear soluciones tecnológicas que mejoren la vida de las personas. 
          NexusFinance nació con la visión de democratizar el acceso a herramientas financieras avanzadas.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a 
            href="https://github.com/AndresEspitia" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Github className="w-5 h-5 text-gray-700" />
            <span className="text-gray-700">GitHub</span>
          </a>
          
          <a 
            href="https://www.instagram.com/andres_espitia_dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Instagram className="w-5 h-5 text-pink-600" />
            <span className="text-gray-700">Instagram</span>
          </a>
          
          <a 
            href="https://www.buymeacoffee.com/andresespitia" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Coffee className="w-5 h-5 text-yellow-600" />
            <span className="text-gray-700">Café</span>
          </a>
        </div>
      </div>

      <div ref={el => { if (el) cardsRef.current[2] = el; }} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-500" />
          ¿Te gusta NexusFinance?
        </h3>
        
        <p className="text-gray-600 mb-6">
          Si NexusFinance te ha ayudado a mejorar tus finanzas, considera apoyar el proyecto.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 flex items-center justify-center space-x-2 p-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors">
            <Star className="w-5 h-5" />
            <span>Calificar App</span>
          </button>
          
          <button className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
            <Coffee className="w-5 h-5" />
            <span>Invitar un café</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'preferences': return renderPreferencesTab();
      case 'notifications': return renderNotificationsTab();
      case 'security': return renderSecurityTab();
      case 'about': return renderAboutTab();
      default: return renderProfileTab();
    }
  };

  return (
    <Layout>
      <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Configuración</h1>
            <p className="text-lg text-gray-600">Personaliza tu experiencia en NexusFinance</p>
          </div>

          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Sidebar con pestañas */}
            <div className="lg:col-span-1">
              <nav ref={tabsRef} className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3 mt-8 lg:mt-0">
              <div ref={contentRef}>
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}