# 💰 NexusFinance

## 📋 Descripción

**NexusFinance** es una aplicación web completa de gestión financiera personal diseñada para ayudar a los usuarios a tomar control de sus finanzas de manera inteligente y eficiente. La plataforma ofrece herramientas avanzadas para el seguimiento de gastos, presupuestos, metas financieras y planificación de viajes.

---

## 🛠️ Tecnologías Utilizadas

### 🚀 Backend (.NET 8)
- **Framework**: ASP.NET Core 8.0
- **Base de Datos**: SQL Server
- **ORM**: Entity Framework Core 9.0.7
- **Mapeo de Objetos**: AutoMapper 12.0.1
- **Autenticación**: JWT Bearer Authentication
- **Validación**: FluentValidation
- **Documentación**: Swagger/OpenAPI
- **Logging**: Serilog
- **Reportes PDF**: QuestPDF, iTextSharp
- **Exportación Excel**: ClosedXML
- **Almacenamiento**: Firebase Storage
- **Tareas en Background**: Hangfire
- **Seguridad**: BCrypt.Net para hash de contraseñas
- **Rate Limiting**: AspNetCoreRateLimit
- **Health Checks**: AspNetCore.HealthChecks

### 🎨 Frontend (React + TypeScript)
- **Framework**: React 19.1.0
- **Lenguaje**: TypeScript 5.8.3
- **Build Tool**: Vite 7.0.4
- **Enrutamiento**: React Router DOM 7.6.3
- **Estilos**: Tailwind CSS 4.1.11
- **Animaciones**: GSAP 3.13.0
- **Iconos**: Lucide React 0.525.0
- **Gráficos**: Recharts 3.1.0
- **Alertas**: SweetAlert2 11.22.2
- **Generación PDF**: jsPDF + jsPDF AutoTable
- **Captura de Pantalla**: html2canvas
- **Almacenamiento**: Firebase 12.0.0

### 🗄️ Base de Datos
- **Motor**: Microsoft SQL Server
- **ORM**: Entity Framework Core con Code First
- **Stored Procedures**: Optimización de consultas complejas
- **Migraciones**: Entity Framework Migrations

---

## ✨ Funcionalidades Principales

### 💳 Gestión de Cuentas
- ✅ Creación y administración de múltiples cuentas bancarias
- ✅ Seguimiento de saldos en tiempo real
- ✅ Categorización de cuentas (ahorro, corriente, inversión)
- ✅ Historial completo de movimientos

### 📊 Transacciones
- ✅ Registro de ingresos y gastos
- ✅ Categorización automática e inteligente
- ✅ Transacciones recurrentes programables
- ✅ Transferencias entre cuentas
- ✅ Importación masiva de datos

### 🎯 Presupuestos y Metas
- ✅ Creación de presupuestos por categorías
- ✅ Seguimiento de gastos vs presupuesto
- ✅ Metas financieras a corto y largo plazo
- ✅ Contribuciones automáticas a metas
- ✅ Alertas de sobregasto

### 📈 Dashboard y Reportes
- ✅ Dashboard interactivo con métricas clave
- ✅ Gráficos de tendencias y distribución
- ✅ Reportes personalizables por período
- ✅ Exportación a PDF y Excel
- ✅ Análisis de patrones de gasto

### ✈️ Planificación de Viajes
- ✅ Presupuestos específicos para viajes
- ✅ Seguimiento de gastos por destino
- ✅ Checklist de actividades
- ✅ Gestión de documentos de viaje
- ✅ Planes de vacaciones integrados

### 🔒 Seguridad y Autenticación
- ✅ Autenticación JWT segura
- ✅ Encriptación de contraseñas con BCrypt
- ✅ Rate limiting para prevenir ataques
- ✅ Validación robusta de datos
- ✅ Health checks del sistema

---

## 🏗️ Arquitectura del Sistema

```
📁 NexusFinance/
├── 🔧 NexusFinance.API/          # Backend API
│   ├── Controllers/              # Controladores REST
│   ├── Services/                 # Lógica de negocio
│   ├── Models/                   # Entidades y DTOs
│   ├── Validators/              # Validadores FluentValidation
│   └── Logs/                    # Archivos de log
├── 🎨 NexusFinance.WEB/         # Frontend React
│   ├── src/
│   │   ├── Pages/               # Páginas principales
│   │   ├── components/          # Componentes reutilizables
│   │   ├── services/            # Servicios API
│   │   ├── types/               # Definiciones TypeScript
│   │   ├── hooks/               # Custom hooks
│   │   └── utils/               # Utilidades
│   └── public/                  # Archivos estáticos
└── 🗄️ Base de datos/           # Scripts SQL
    ├── BASE DE DATOS DE NEXUS FINANCE.sql
    └── SP DE *.sql              # Stored Procedures
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- ✅ .NET 8 SDK
- ✅ Node.js 18+ y npm/bun
- ✅ SQL Server
- ✅ Cuenta de Firebase (para almacenamiento)

### Backend Setup
```bash
cd NexusFinance.API
dotnet restore
dotnet build
dotnet run
```

### Frontend Setup
```bash
cd NexusFinance.WEB
npm install # o bun install
npm run dev # o bun dev
```

### Base de Datos
1. Ejecutar el script `BASE DE DATOS DE NEXUS FINANCE.sql`
2. Ejecutar todos los stored procedures en orden
3. Configurar la cadena de conexión en `appsettings.json`

---

## 📸 Capturas de Pantalla

### 🏠 Dashboard Principal

![Dashboard](https://github.com/AndresFelipe23/NexusFinance/blob/main/Capturas/dashboard.png)

### 💰 Gestión de Transacciones

![Transacciones](https://github.com/AndresFelipe23/NexusFinance/blob/main/Capturas/transacciones.png)

### 📊 Reportes y Gráficos

![Reportes](https://github.com/AndresFelipe23/NexusFinance/blob/main/Capturas/reportes.png)

### ✈️ Planificación de Viajes

![Viajes](https://github.com/AndresFelipe23/NexusFinance/blob/main/Capturas/mis_planes_de_vacaciones.png)

---

## 🔧 Configuración Adicional

### Variables de Entorno (Backend)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "tu_cadena_de_conexion_sql_server"
  },
  "JwtSettings": {
    "SecretKey": "tu_clave_secreta_jwt",
    "Issuer": "NexusFinance",
    "Audience": "NexusFinanceUsers"
  },
  "Firebase": {
    "StorageBucket": "tu_bucket_firebase"
  }
}
```

### Configuración Firebase (Frontend)
```typescript
// src/config/firebase.ts
export const firebaseConfig = {
  apiKey: "tu_api_key",
  authDomain: "tu_auth_domain",
  projectId: "tu_project_id",
  storageBucket: "tu_storage_bucket",
  messagingSenderId: "tu_sender_id",
  appId: "tu_app_id"
};
```

---

## 📝 API Endpoints Principales

### 🔐 Autenticación
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/registro` - Registrar usuario

### 💳 Cuentas
- `GET /api/cuenta` - Listar cuentas
- `POST /api/cuenta` - Crear cuenta
- `PUT /api/cuenta/{id}` - Actualizar cuenta

### 💰 Transacciones
- `GET /api/transaccione` - Listar transacciones
- `POST /api/transaccione` - Crear transacción
- `DELETE /api/transaccione/{id}` - Eliminar transacción

### 📊 Dashboard
- `GET /api/dashboard` - Datos del dashboard
- `GET /api/reportes` - Generar reportes

*[Ver documentación completa en Swagger una vez ejecutado el backend]*

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Equipo de Desarrollo

**Desarrollado con ❤️ por el equipo de NexusFinance**

- **Backend**: ASP.NET Core + Entity Framework
- **Frontend**: React + TypeScript + Tailwind CSS
- **Base de Datos**: SQL Server
- **Cloud**: Firebase Storage

---

## 📞 Soporte

¿Tienes preguntas o necesitas ayuda?

- 📧 Email: soporte@nexusfinance.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/nexusfinance/issues)
- 📖 Documentación: [Wiki del Proyecto](https://github.com/tu-usuario/nexusfinance/wiki)

---

**¡Gracias por usar NexusFinance! 🚀💰**
