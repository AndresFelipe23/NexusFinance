-- =============================================
-- Script para verificar los SPs del Dashboard
-- =============================================

-- 1. Verificar que los SPs existen
SELECT 
    name as 'Stored Procedure',
    create_date as 'Fecha Creación',
    modify_date as 'Fecha Modificación'
FROM sys.procedures 
WHERE name IN (
    'sp_ObtenerEstadisticasGenerales',
    'sp_ObtenerTransaccionesPorCategoria', 
    'sp_ObtenerTendenciasMensuales',
    'sp_ObtenerResumenMetas',
    'sp_ObtenerResumenCuentas',
    'sp_ObtenerTransaccionesRecientes',
    'sp_ObtenerDashboardCompleto'
)
ORDER BY name;

-- 2. Verificar que las tablas principales existen y tienen datos
SELECT 'Usuarios' as Tabla, COUNT(*) as Registros FROM Usuarios
UNION ALL
SELECT 'Cuentas', COUNT(*) FROM Cuentas  
UNION ALL
SELECT 'Categorias', COUNT(*) FROM Categorias
UNION ALL
SELECT 'Transacciones', COUNT(*) FROM Transacciones
UNION ALL
SELECT 'MetasFinancieras', COUNT(*) FROM MetasFinancieras
UNION ALL
SELECT 'Presupuestos', COUNT(*) FROM Presupuestos;

-- 3. Probar el SP de estadísticas generales con un usuario específico
-- REEMPLAZA 'TU_USUARIO_ID' con un ID válido de tu tabla Usuarios
DECLARE @TestUsuarioId UNIQUEIDENTIFIER;
SELECT TOP 1 @TestUsuarioId = UsuarioId FROM Usuarios;

IF @TestUsuarioId IS NOT NULL
BEGIN
    PRINT 'Probando SPs con Usuario ID: ' + CAST(@TestUsuarioId AS VARCHAR(50));
    PRINT '';
    
    -- Probar estadísticas generales
    PRINT '=== Estadísticas Generales ===';
    EXEC sp_ObtenerEstadisticasGenerales @TestUsuarioId;
    PRINT '';
    
    -- Probar transacciones por categoría (gastos)
    PRINT '=== Gastos por Categoría ===';
    EXEC sp_ObtenerTransaccionesPorCategoria @TestUsuarioId, 'gasto';
    PRINT '';
    
    -- Probar resumen de cuentas
    PRINT '=== Resumen de Cuentas ===';
    EXEC sp_ObtenerResumenCuentas @TestUsuarioId, 5;
END
ELSE
BEGIN
    PRINT 'No se encontraron usuarios en la base de datos para hacer las pruebas.';
END

-- 4. Verificar estructura de las tablas principales
PRINT '=== Estructura de Tabla Categorias ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Categorias'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '=== Estructura de Tabla Transacciones ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Transacciones'
ORDER BY ORDINAL_POSITION;