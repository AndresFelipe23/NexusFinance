-- =============================================
-- Esquema de Base de Datos NexusFinance - CORREGIDO
-- Implementaci�n en SQL Server
-- =============================================

-- Crear la base de datos
CREATE DATABASE NexusFinance;
GO

USE NexusFinance;
GO

-- =============================================
-- Tabla de Usuarios
-- =============================================
CREATE TABLE Usuarios (
    UsuarioId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    ClaveHash NVARCHAR(255) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Moneda NVARCHAR(3) DEFAULT 'USD', -- C�digos de moneda ISO 4217
    ZonaHoraria NVARCHAR(50) DEFAULT 'UTC',
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    EstaActivo BIT DEFAULT 1
);

-- =============================================
-- Tabla de Cuentas Bancarias/Billeteras
-- =============================================
CREATE TABLE Cuentas (
    CuentaId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    NombreCuenta NVARCHAR(100) NOT NULL,
    TipoCuenta NVARCHAR(50) NOT NULL, -- 'corriente', 'ahorros', 'tarjeta_credito', 'efectivo', 'inversion'
    Saldo DECIMAL(18,2) DEFAULT 0.00,
    Moneda NVARCHAR(3) DEFAULT 'USD',
    NombreBanco NVARCHAR(100),
    NumeroCuenta NVARCHAR(50), -- Encriptado en producci�n
    EstaActivo BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE
);

-- =============================================
-- Tabla de Categor�as
-- =============================================
CREATE TABLE Categorias (
    CategoriaId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    NombreCategoria NVARCHAR(100) NOT NULL,
    TipoCategoria NVARCHAR(20) NOT NULL, -- 'ingreso', 'gasto'
    CategoriaIdPadre UNIQUEIDENTIFIER NULL, -- Para subcategor�as
    Color NVARCHAR(7) DEFAULT '#3B82F6', -- Color hexadecimal
    Icono NVARCHAR(50) DEFAULT 'categoria',
    EstaActivo BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (CategoriaIdPadre) REFERENCES Categorias(CategoriaId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Metas Financieras
-- =============================================
CREATE TABLE MetasFinancieras (
    MetaId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    NombreMeta NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    MontoObjetivo DECIMAL(18,2) NOT NULL,
    MontoActual DECIMAL(18,2) DEFAULT 0.00,
    FechaObjetivo DATETIME2,
    TipoMeta NVARCHAR(50) NOT NULL, -- 'ahorro', 'pago_deuda', 'inversion'
    CuentaId UNIQUEIDENTIFIER, -- Cuenta asociada para el ahorro
    EstaCompletada BIT DEFAULT 0,
    FechaComplecion DATETIME2 NULL,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (CuentaId) REFERENCES Cuentas(CuentaId) ON DELETE NO ACTION
);


-- =============================================
-- Tabla de Transacciones Recurrentes
-- =============================================
CREATE TABLE TransaccionesRecurrentes (
    RecurrenteId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    CuentaId UNIQUEIDENTIFIER NOT NULL,
    CategoriaId UNIQUEIDENTIFIER NOT NULL,
    Monto DECIMAL(18,2) NOT NULL,
    TipoTransaccion NVARCHAR(20) NOT NULL,
    Descripcion NVARCHAR(500),
    Frecuencia NVARCHAR(20) NOT NULL, -- 'diario', 'semanal', 'mensual', 'anual'
    FechaInicio DATETIME2 NOT NULL,
    FechaFin DATETIME2,
    ProximaFechaEjecucion DATETIME2 NOT NULL,
    EstaActivo BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (CuentaId) REFERENCES Cuentas(CuentaId) ON DELETE NO ACTION,
    FOREIGN KEY (CategoriaId) REFERENCES Categorias(CategoriaId) ON DELETE NO ACTION
);


-- =============================================
-- Tabla de Transacciones
-- =============================================
CREATE TABLE Transacciones (
    TransaccionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    CuentaId UNIQUEIDENTIFIER NOT NULL,
    CategoriaId UNIQUEIDENTIFIER NOT NULL,
    Monto DECIMAL(18,2) NOT NULL,
    TipoTransaccion NVARCHAR(20) NOT NULL, -- 'ingreso', 'gasto', 'transferencia'
    Descripcion NVARCHAR(500),
    Notas NVARCHAR(1000),
    FechaTransaccion DATETIME2 NOT NULL,
    TransaccionRecurrenteId UNIQUEIDENTIFIER NULL, -- Si es parte de una transacci�n recurrente
    UrlRecibo NVARCHAR(500), -- URL del recibo adjunto
    EstaConciliado BIT DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (CuentaId) REFERENCES Cuentas(CuentaId) ON DELETE NO ACTION,
    FOREIGN KEY (CategoriaId) REFERENCES Categorias(CategoriaId) ON DELETE NO ACTION,
    FOREIGN KEY (TransaccionRecurrenteId) REFERENCES TransaccionesRecurrentes(RecurrenteId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Transferencias entre Cuentas
-- =============================================
CREATE TABLE Transferencias (
    TransferenciaId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    CuentaOrigenId UNIQUEIDENTIFIER NOT NULL,
    CuentaDestinoId UNIQUEIDENTIFIER NOT NULL,
    Monto DECIMAL(18,2) NOT NULL,
    ComisionTransferencia DECIMAL(18,2) DEFAULT 0.00,
    Descripcion NVARCHAR(500),
    FechaTransferencia DATETIME2 NOT NULL,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (CuentaOrigenId) REFERENCES Cuentas(CuentaId) ON DELETE NO ACTION,
    FOREIGN KEY (CuentaDestinoId) REFERENCES Cuentas(CuentaId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Presupuestos
-- =============================================
CREATE TABLE Presupuestos (
    PresupuestoId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    NombrePresupuesto NVARCHAR(100) NOT NULL,
    PeriodoPresupuesto NVARCHAR(20) NOT NULL, -- 'mensual', 'semanal', 'anual'
    FechaInicio DATETIME2 NOT NULL,
    FechaFin DATETIME2,
    PresupuestoTotal DECIMAL(18,2) NOT NULL,
    EstaActivo BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE
);


-- =============================================
-- Tabla de Categorias de Presupuesto
-- =============================================
CREATE TABLE CategoriasPresupuesto (
    CategoriaPresupuestoId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PresupuestoId UNIQUEIDENTIFIER NOT NULL,
    CategoriaId UNIQUEIDENTIFIER NOT NULL,
    MontoAsignado DECIMAL(18,2) NOT NULL,
    MontoGastado DECIMAL(18,2) DEFAULT 0.00,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PresupuestoId) REFERENCES Presupuestos(PresupuestoId) ON DELETE CASCADE,
    FOREIGN KEY (CategoriaId) REFERENCES Categorias(CategoriaId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Contribuciones a Metas
-- =============================================
CREATE TABLE ContribucionesMetas (
    ContribucionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MetaId UNIQUEIDENTIFIER NOT NULL,
    TransaccionId UNIQUEIDENTIFIER NULL, -- Referencia a la transacci�n si aplica
    Monto DECIMAL(18,2) NOT NULL,
    FechaContribucion DATETIME2 NOT NULL,
    Notas NVARCHAR(500),
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (MetaId) REFERENCES MetasFinancieras(MetaId) ON DELETE CASCADE,
    FOREIGN KEY (TransaccionId) REFERENCES Transacciones(TransaccionId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Planes de Vacaciones
-- =============================================
CREATE TABLE PlanesVacaciones (
    PlanId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL,
    NombrePlan NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(1000),
    Destino NVARCHAR(200) NOT NULL,
    Pais NVARCHAR(100) NOT NULL,
    Ciudad NVARCHAR(100),
    FechaInicio DATETIME2 NOT NULL,
    FechaFin DATETIME2 NOT NULL,
    CantidadPersonas INT DEFAULT 1,
    PresupuestoEstimado DECIMAL(18,2),
    PresupuestoReal DECIMAL(18,2) DEFAULT 0.00,
    MonedaDestino NVARCHAR(3), -- Moneda del pa�s de destino
    TasaCambio DECIMAL(10,4), -- Tasa de cambio al momento de la planificaci�n
    EstadoPlan NVARCHAR(20) DEFAULT 'planificando', -- 'planificando', 'confirmado', 'en_curso', 'completado', 'cancelado'
    EsViajeInternacional BIT DEFAULT 0,
    MetaFinancieraId UNIQUEIDENTIFIER NULL, -- Vinculaci�n con meta de ahorro
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId) ON DELETE CASCADE,
    FOREIGN KEY (MetaFinancieraId) REFERENCES MetasFinancieras(MetaId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Categor�as de Gastos de Viaje
-- =============================================
CREATE TABLE CategoriasGastosViaje (
    CategoriaViajeId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    NombreCategoria NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Icono NVARCHAR(50) DEFAULT 'travel',
    Color NVARCHAR(7) DEFAULT '#3B82F6',
    EsObligatoria BIT DEFAULT 0, -- Si es una categor�a que siempre debe considerarse
    OrdenVisualizacion INT DEFAULT 0,
    EstaActivo BIT DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- Tabla de Presupuesto por Categor�a de Viaje
-- =============================================
CREATE TABLE PresupuestoViaje (
    PresupuestoViajeId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlanId UNIQUEIDENTIFIER NOT NULL,
    CategoriaViajeId UNIQUEIDENTIFIER NOT NULL,
    PresupuestoEstimado DECIMAL(18,2) NOT NULL,
    GastoReal DECIMAL(18,2) DEFAULT 0.00,
    Notas NVARCHAR(500),
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PlanId) REFERENCES PlanesVacaciones(PlanId) ON DELETE CASCADE,
    FOREIGN KEY (CategoriaViajeId) REFERENCES CategoriasGastosViaje(CategoriaViajeId) ON DELETE NO ACTION,
    
    -- Evitar duplicados de categor�a por plan
    UNIQUE(PlanId, CategoriaViajeId)
);

-- =============================================
-- Tabla de Actividades Planificadas
-- =============================================
CREATE TABLE ActividadesViaje (
    ActividadId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlanId UNIQUEIDENTIFIER NOT NULL,
    NombreActividad NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(1000),
    FechaHoraInicio DATETIME2,
    FechaHoraFin DATETIME2,
    CostoEstimado DECIMAL(18,2) DEFAULT 0.00,
    CostoReal DECIMAL(18,2) DEFAULT 0.00,
    Ubicacion NVARCHAR(300),
    CategoriaViajeId UNIQUEIDENTIFIER,
    Prioridad NVARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baja'
    EstadoActividad NVARCHAR(20) DEFAULT 'planificada', -- 'planificada', 'confirmada', 'completada', 'cancelada'
    UrlReferencia NVARCHAR(500), -- Para guardar links de reservas, etc.
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PlanId) REFERENCES PlanesVacaciones(PlanId) ON DELETE CASCADE,
    FOREIGN KEY (CategoriaViajeId) REFERENCES CategoriasGastosViaje(CategoriaViajeId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Checklist de Viaje
-- =============================================
CREATE TABLE ChecklistViaje (
    ChecklistId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlanId UNIQUEIDENTIFIER NOT NULL,
    Item NVARCHAR(300) NOT NULL,
    Descripcion NVARCHAR(500),
    CategoriaChecklist NVARCHAR(50) DEFAULT 'general', -- 'documentos', 'equipaje', 'salud', 'finanzas', 'general'
    EstaCompletado BIT DEFAULT 0,
    FechaLimite DATETIME2,
    Prioridad NVARCHAR(20) DEFAULT 'media',
    OrdenVisualizacion INT DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaCompletado DATETIME2 NULL,
    
    FOREIGN KEY (PlanId) REFERENCES PlanesVacaciones(PlanId) ON DELETE CASCADE
);

-- =============================================
-- Tabla de Gastos Reales del Viaje
-- =============================================
CREATE TABLE GastosViaje (
    GastoViajeId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlanId UNIQUEIDENTIFIER NOT NULL,
    TransaccionId UNIQUEIDENTIFIER NULL, -- Vinculaci�n con transacci�n real del sistema
    CategoriaViajeId UNIQUEIDENTIFIER NOT NULL,
    ActividadId UNIQUEIDENTIFIER NULL, -- Si el gasto est� asociado a una actividad espec�fica
    Monto DECIMAL(18,2) NOT NULL,
    MonedaGasto NVARCHAR(3) NOT NULL,
    MontoEnMonedaLocal DECIMAL(18,2), -- Conversi�n a la moneda del usuario
    TasaCambioUsada DECIMAL(10,4),
    Descripcion NVARCHAR(500),
    FechaGasto DATETIME2 NOT NULL,
    Ubicacion NVARCHAR(300),
    NumeroPersonas INT DEFAULT 1, -- Para gastos grupales
    UrlRecibo NVARCHAR(500),
    Notas NVARCHAR(1000),
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PlanId) REFERENCES PlanesVacaciones(PlanId) ON DELETE CASCADE,
    FOREIGN KEY (TransaccionId) REFERENCES Transacciones(TransaccionId) ON DELETE NO ACTION,
    FOREIGN KEY (CategoriaViajeId) REFERENCES CategoriasGastosViaje(CategoriaViajeId) ON DELETE NO ACTION,
    FOREIGN KEY (ActividadId) REFERENCES ActividadesViaje(ActividadId) ON DELETE NO ACTION
);

-- =============================================
-- Tabla de Documentos de Viaje
-- =============================================
CREATE TABLE DocumentosViaje (
    DocumentoId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlanId UNIQUEIDENTIFIER NOT NULL,
    TipoDocumento NVARCHAR(50) NOT NULL, -- 'pasaporte', 'visa', 'boleto_avion', 'reserva_hotel', 'seguro', 'otro'
    NombreDocumento NVARCHAR(200) NOT NULL,
    NumeroDocumento NVARCHAR(100),
    FechaExpedicion DATETIME2,
    FechaVencimiento DATETIME2,
    UrlArchivo NVARCHAR(500), -- URL del documento escaneado/foto
    Notas NVARCHAR(500),
    EsObligatorio BIT DEFAULT 0,
    EstaVerificado BIT DEFAULT 0,
    FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (PlanId) REFERENCES PlanesVacaciones(PlanId) ON DELETE CASCADE
);


-- =============================================
-- INDICES PRINCIPALES - Tablas Core
-- =============================================

-- Indices para tabla USUARIOS
-- Ya tiene �ndice �nico en Email por el constraint UNIQUE
CREATE INDEX IX_Usuarios_EstaActivo ON Usuarios(EstaActivo) 
WHERE EstaActivo = 1; -- �ndice filtrado para usuarios activos

-- Indices para tabla CUENTAS
CREATE INDEX IX_Cuentas_UsuarioId_Activo ON Cuentas(UsuarioId, EstaActivo) 
INCLUDE (NombreCuenta, TipoCuenta, Saldo, Moneda);

CREATE INDEX IX_Cuentas_TipoCuenta ON Cuentas(TipoCuenta, EstaActivo);

-- Indices para tabla CATEGORIAS
CREATE INDEX IX_Categorias_UsuarioId_Tipo ON Categorias(UsuarioId, TipoCategoria, EstaActivo)
INCLUDE (NombreCategoria, Color, Icono);

CREATE INDEX IX_Categorias_Padre ON Categorias(CategoriaIdPadre)
WHERE CategoriaIdPadre IS NOT NULL; -- Solo subcategor�as

-- =============================================
-- INDICES CRITICOS - Tabla TRANSACCIONES (mas consultada)
-- =============================================

-- Indice principal para consultas por usuario y fecha (mas comun)
CREATE INDEX IX_Transacciones_Usuario_Fecha ON Transacciones(UsuarioId, FechaTransaccion DESC)
INCLUDE (CuentaId, CategoriaId, Monto, TipoTransaccion, Descripcion);

-- Indice para consultas por cuenta especifica
CREATE INDEX IX_Transacciones_Cuenta_Fecha ON Transacciones(CuentaId, FechaTransaccion DESC)
INCLUDE (Monto, TipoTransaccion, Descripcion);

-- Indice para consultas por categoria y analisis de gastos
CREATE INDEX IX_Transacciones_Categoria_Fecha ON Transacciones(CategoriaId, FechaTransaccion DESC)
INCLUDE (UsuarioId, Monto, TipoTransaccion);

-- Indice para filtros por tipo de transaccion
CREATE INDEX IX_Transacciones_Tipo_Usuario_Fecha ON Transacciones(TipoTransaccion, UsuarioId, FechaTransaccion DESC)
INCLUDE (Monto, CategoriaId);

-- Indice para transacciones por mes (reportes mensuales) - usando columnas calculadas
-- Primero agregar columnas calculadas persistidas
ALTER TABLE Transacciones ADD A�oTransaccion AS YEAR(FechaTransaccion) PERSISTED;
ALTER TABLE Transacciones ADD MesTransaccion AS MONTH(FechaTransaccion) PERSISTED;

-- Ahora crear el i ndice usando las columnas calculadas
CREATE INDEX IX_Transacciones_Mes_Usuario ON Transacciones(UsuarioId, A�oTransaccion, MesTransaccion)
INCLUDE (Monto, TipoTransaccion, CategoriaId);

-- Indice para transacciones recurrentes
CREATE INDEX IX_Transacciones_Recurrente ON Transacciones(TransaccionRecurrenteId)
WHERE TransaccionRecurrenteId IS NOT NULL;

-- =============================================
-- INDICES PARA PRESUPUESTOS
-- =============================================

-- Indices para PRESUPUESTOS
CREATE INDEX IX_Presupuestos_Usuario_Activo ON Presupuestos(UsuarioId, EstaActivo, PeriodoPresupuesto)
INCLUDE (NombrePresupuesto, FechaInicio, FechaFin, PresupuestoTotal);

CREATE INDEX IX_Presupuestos_Periodo_Fechas ON Presupuestos(PeriodoPresupuesto, FechaInicio, FechaFin)
WHERE EstaActivo = 1;

-- �ndices para CATEGORIAS_PRESUPUESTO
CREATE INDEX IX_CategoriasPresupuesto_Presupuesto ON CategoriasPresupuesto(PresupuestoId)
INCLUDE (CategoriaId, MontoAsignado, MontoGastado);

CREATE INDEX IX_CategoriasPresupuesto_Categoria ON CategoriasPresupuesto(CategoriaId);

-- =============================================
-- �NDICES PARA METAS FINANCIERAS
-- =============================================

-- �ndices para METAS_FINANCIERAS
CREATE INDEX IX_MetasFinancieras_Usuario_Estado ON MetasFinancieras(UsuarioId, EstaCompletada)
INCLUDE (NombreMeta, MontoObjetivo, MontoActual, FechaObjetivo, TipoMeta);

CREATE INDEX IX_MetasFinancieras_Fecha_Objetivo ON MetasFinancieras(FechaObjetivo, EstaCompletada)
WHERE FechaObjetivo IS NOT NULL AND EstaCompletada = 0;

CREATE INDEX IX_MetasFinancieras_Tipo ON MetasFinancieras(TipoMeta, EstaCompletada);

-- �ndices para CONTRIBUCIONES_METAS
CREATE INDEX IX_ContribucionesMetas_Meta_Fecha ON ContribucionesMetas(MetaId, FechaContribucion DESC)
INCLUDE (Monto, TransaccionId);

-- =============================================
-- �NDICES PARA TRANSFERENCIAS
-- =============================================

CREATE INDEX IX_Transferencias_Usuario_Fecha ON Transferencias(UsuarioId, FechaTransferencia DESC)
INCLUDE (CuentaOrigenId, CuentaDestinoId, Monto);

CREATE INDEX IX_Transferencias_CuentaOrigen ON Transferencias(CuentaOrigenId, FechaTransferencia DESC);
CREATE INDEX IX_Transferencias_CuentaDestino ON Transferencias(CuentaDestinoId, FechaTransferencia DESC);

-- =============================================
-- �NDICES PARA TRANSACCIONES RECURRENTES
-- =============================================

CREATE INDEX IX_TransaccionesRecurrentes_Usuario_Activo ON TransaccionesRecurrentes(UsuarioId, EstaActivo)
INCLUDE (Descripcion, Monto, Frecuencia, ProximaFechaEjecucion);

CREATE INDEX IX_TransaccionesRecurrentes_ProximaEjecucion ON TransaccionesRecurrentes(ProximaFechaEjecucion, EstaActivo)
WHERE EstaActivo = 1; -- Para procesar transacciones pendientes

CREATE INDEX IX_TransaccionesRecurrentes_Frecuencia ON TransaccionesRecurrentes(Frecuencia, EstaActivo);

-- =============================================
-- �NDICES PARA PLANIFICADOR DE VACACIONES
-- =============================================

-- �ndices para PLANES_VACACIONES
CREATE INDEX IX_PlanesVacaciones_Usuario_Estado ON PlanesVacaciones(UsuarioId, EstadoPlan)
INCLUDE (NombrePlan, Destino, FechaInicio, FechaFin, PresupuestoEstimado);

CREATE INDEX IX_PlanesVacaciones_Fechas ON PlanesVacaciones(FechaInicio, FechaFin, EstadoPlan);

CREATE INDEX IX_PlanesVacaciones_Destino ON PlanesVacaciones(Pais, Ciudad, EstadoPlan);

CREATE INDEX IX_PlanesVacaciones_Meta ON PlanesVacaciones(MetaFinancieraId)
WHERE MetaFinancieraId IS NOT NULL;

-- �ndices para CATEGORIAS_GASTOS_VIAJE
CREATE INDEX IX_CategoriasGastosViaje_Activo_Orden ON CategoriasGastosViaje(EstaActivo, OrdenVisualizacion)
INCLUDE (NombreCategoria, Icono, Color, EsObligatoria);

-- �ndices para PRESUPUESTO_VIAJE
CREATE INDEX IX_PresupuestoViaje_Plan ON PresupuestoViaje(PlanId)
INCLUDE (CategoriaViajeId, PresupuestoEstimado, GastoReal);

-- �ndices para ACTIVIDADES_VIAJE
CREATE INDEX IX_ActividadesViaje_Plan_Fecha ON ActividadesViaje(PlanId, FechaActividad, HoraInicio)
INCLUDE (NombreActividad, CostoEstimado, CostoReal, EstadoActividad);

CREATE INDEX IX_ActividadesViaje_Estado ON ActividadesViaje(EstadoActividad, FechaActividad);

-- �ndices para CHECKLIST_VIAJE
CREATE INDEX IX_ChecklistViaje_Plan_Estado ON ChecklistViaje(PlanId, EstaCompletado, CategoriaChecklist)
INCLUDE (Item, Prioridad, FechaLimite);

CREATE INDEX IX_ChecklistViaje_FechaLimite ON ChecklistViaje(FechaLimite, EstaCompletado)
WHERE FechaLimite IS NOT NULL AND EstaCompletado = 0;

-- �ndices para GASTOS_VIAJE
CREATE INDEX IX_GastosViaje_Plan_Fecha ON GastosViaje(PlanId, FechaGasto DESC)
INCLUDE (CategoriaViajeId, Monto, MontoEnMonedaLocal, Descripcion);

CREATE INDEX IX_GastosViaje_Categoria ON GastosViaje(CategoriaViajeId, FechaGasto DESC);

CREATE INDEX IX_GastosViaje_Actividad ON GastosViaje(ActividadId)
WHERE ActividadId IS NOT NULL;

CREATE INDEX IX_GastosViaje_Transaccion ON GastosViaje(TransaccionId)
WHERE TransaccionId IS NOT NULL;

-- �ndices para DOCUMENTOS_VIAJE
CREATE INDEX IX_DocumentosViaje_Plan_Tipo ON DocumentosViaje(PlanId, TipoDocumento)
INCLUDE (NombreDocumento, FechaVencimiento, EsObligatorio, EstaVerificado);

CREATE INDEX IX_DocumentosViaje_Vencimiento ON DocumentosViaje(FechaVencimiento, EstaVerificado)
WHERE FechaVencimiento IS NOT NULL;

-- =============================================
-- �NDICES COMPUESTOS ESPECIALES PARA REPORTES
-- =============================================

-- Agregar columna calculada para fechas sin hora
ALTER TABLE Transacciones ADD FechaSoloTransaccion AS CAST(FechaTransaccion AS DATE) PERSISTED;

-- �ndice para dashboard financiero (resumen por usuario)
CREATE INDEX IX_Dashboard_Usuario_Fecha ON Transacciones(UsuarioId, FechaSoloTransaccion)
INCLUDE (TipoTransaccion, CategoriaId, Monto);

-- �ndice para an�lisis de gastos por categor�a y mes
CREATE INDEX IX_Analisis_Categoria_Mes ON Transacciones(
    CategoriaId, 
    A�oTransaccion, 
    MesTransaccion,
    TipoTransaccion
) INCLUDE (UsuarioId, Monto);

-- �ndice para comparaci�n de presupuestos vs gastos reales
CREATE INDEX IX_Presupuesto_Analisis ON Transacciones(
    UsuarioId,
    TipoTransaccion,
    A�oTransaccion,
    MesTransaccion,
    CategoriaId
) INCLUDE (Monto)
WHERE TipoTransaccion = 'gasto';

-- =============================================
-- ESTAD�STICAS Y MANTENIMIENTO
-- =============================================

-- Actualizar estad�sticas de todos los �ndices (ejecutar peri�dicamente)
/*
-- Script para actualizar estad�sticas (ejecutar como trabajo programado)
UPDATE STATISTICS Usuarios;
UPDATE STATISTICS Cuentas;
UPDATE STATISTICS Categorias;
UPDATE STATISTICS Transacciones;
UPDATE STATISTICS Presupuestos;
UPDATE STATISTICS MetasFinancieras;
UPDATE STATISTICS PlanesVacaciones;
UPDATE STATISTICS GastosViaje;
*/

-- =============================================
-- �NDICES �NICOS ADICIONALES PARA INTEGRIDAD
-- =============================================

-- Evitar categor�as duplicadas por usuario
CREATE UNIQUE INDEX IX_Categorias_Usuario_Nombre_Tipo ON Categorias(UsuarioId, NombreCategoria, TipoCategoria)
WHERE EstaActivo = 1;

-- Evitar cuentas con nombres duplicados por usuario
CREATE UNIQUE INDEX IX_Cuentas_Usuario_Nombre ON Cuentas(UsuarioId, NombreCuenta)
WHERE EstaActivo = 1;

-- Evitar presupuestos activos duplicados por per�odo
CREATE UNIQUE INDEX IX_Presupuestos_Usuario_Periodo_Activo ON Presupuestos(UsuarioId, PeriodoPresupuesto, FechaInicio)
WHERE EstaActivo = 1;


