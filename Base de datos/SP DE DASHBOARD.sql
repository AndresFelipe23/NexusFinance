-- =============================================
-- Stored Procedures para Dashboard de NexusFinance
-- =============================================

-- 1. SP para obtener estadísticas generales del usuario
CREATE OR ALTER PROCEDURE sp_ObtenerEstadisticasGenerales
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalIngresos DECIMAL(18,2) = 0;
    DECLARE @TotalGastos DECIMAL(18,2) = 0;
    DECLARE @Balance DECIMAL(18,2) = 0;
    DECLARE @TransaccionesCount INT = 0;
    DECLARE @CuentasCount INT = 0;
    DECLARE @MetasCount INT = 0;
    DECLARE @MetasCompletadas INT = 0;
    DECLARE @PresupuestosCount INT = 0;
    
    -- Obtener estadísticas de transacciones
    SELECT 
        @TotalIngresos = ISNULL(SUM(CASE WHEN TipoTransaccion = 'ingreso' THEN Monto ELSE 0 END), 0),
        @TotalGastos = ISNULL(SUM(CASE WHEN TipoTransaccion = 'gasto' THEN Monto ELSE 0 END), 0),
        @TransaccionesCount = COUNT(*)
    FROM Transacciones 
    WHERE UsuarioId = @UsuarioId
    AND MONTH(FechaTransaccion) = MONTH(GETDATE())
    AND YEAR(FechaTransaccion) = YEAR(GETDATE());
    
    SET @Balance = @TotalIngresos - @TotalGastos;
    
    -- Obtener count de cuentas activas
    SELECT @CuentasCount = COUNT(*)
    FROM Cuentas 
    WHERE UsuarioId = @UsuarioId AND EstaActivo = 1;
    
    -- Obtener estadísticas de metas
    SELECT 
        @MetasCount = COUNT(*),
        @MetasCompletadas = SUM(CASE WHEN EstaCompletada = 1 THEN 1 ELSE 0 END)
    FROM MetasFinancieras 
    WHERE UsuarioId = @UsuarioId;
    
    -- Obtener count de presupuestos (opcional)
    SELECT @PresupuestosCount = COUNT(*)
    FROM Presupuestos 
    WHERE UsuarioId = @UsuarioId;
    
    -- Retornar resultados
    SELECT 
        @TotalIngresos AS TotalIngresos,
        @TotalGastos AS TotalGastos,
        @Balance AS Balance,
        @TransaccionesCount AS TransaccionesCount,
        @CuentasCount AS CuentasCount,
        @MetasCount AS MetasCount,
        @MetasCompletadas AS MetasCompletadas,
        @PresupuestosCount AS PresupuestosCount;
END;
GO

-- 2. SP para obtener transacciones por categoría
CREATE OR ALTER PROCEDURE sp_ObtenerTransaccionesPorCategoria
    @UsuarioId UNIQUEIDENTIFIER,
    @Tipo VARCHAR(20) = NULL -- 'ingreso', 'gasto', o NULL para ambos
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoriaId,
        c.NombreCategoria,
        c.TipoCategoria,
        ISNULL(c.Icono, '📊') AS IconoCategoria,
        ISNULL(c.Color, '#6B7280') AS Color,
        SUM(t.Monto) AS MontoTotal,
        COUNT(t.TransaccionId) AS TransaccionesCount
    FROM Transacciones t
    INNER JOIN Categorias c ON t.CategoriaId = c.CategoriaId
    WHERE t.UsuarioId = @UsuarioId
    AND MONTH(t.FechaTransaccion) = MONTH(GETDATE())
    AND YEAR(t.FechaTransaccion) = YEAR(GETDATE())
    AND (@Tipo IS NULL OR t.TipoTransaccion = @Tipo)
    GROUP BY c.CategoriaId, c.NombreCategoria, c.TipoCategoria, c.Icono, c.Color
    ORDER BY MontoTotal DESC;
END;
GO

-- 3. SP para obtener tendencias mensuales (últimos 6 meses)
CREATE OR ALTER PROCEDURE sp_ObtenerTendenciasMensuales
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Generar los últimos 6 meses
    WITH Meses AS (
        SELECT 0 AS MesOffset
        UNION ALL SELECT 1
        UNION ALL SELECT 2
        UNION ALL SELECT 3
        UNION ALL SELECT 4
        UNION ALL SELECT 5
    ),
    MesesBase AS (
        SELECT 
            YEAR(DATEADD(MONTH, -MesOffset, GETDATE())) AS Anio,
            MONTH(DATEADD(MONTH, -MesOffset, GETDATE())) AS Mes,
            DATENAME(MONTH, DATEADD(MONTH, -MesOffset, GETDATE())) + ' ' + 
            CAST(YEAR(DATEADD(MONTH, -MesOffset, GETDATE())) AS VARCHAR(4)) AS MesNombre
        FROM Meses
    )
    SELECT 
        mb.MesNombre,
        mb.Anio,
        mb.Mes,
        ISNULL(SUM(CASE WHEN t.TipoTransaccion = 'ingreso' THEN t.Monto ELSE 0 END), 0) AS Ingresos,
        ISNULL(SUM(CASE WHEN t.TipoTransaccion = 'gasto' THEN t.Monto ELSE 0 END), 0) AS Gastos,
        ISNULL(SUM(CASE WHEN t.TipoTransaccion = 'ingreso' THEN t.Monto ELSE 0 END), 0) - 
        ISNULL(SUM(CASE WHEN t.TipoTransaccion = 'gasto' THEN t.Monto ELSE 0 END), 0) AS Balance
    FROM MesesBase mb
    LEFT JOIN Transacciones t ON 
        YEAR(t.FechaTransaccion) = mb.Anio 
        AND MONTH(t.FechaTransaccion) = mb.Mes
        AND t.UsuarioId = @UsuarioId
    GROUP BY mb.MesNombre, mb.Anio, mb.Mes
    ORDER BY mb.Anio DESC, mb.Mes DESC;
END;
GO

-- 4. SP para obtener resumen de metas financieras
CREATE OR ALTER PROCEDURE sp_ObtenerResumenMetas
    @UsuarioId UNIQUEIDENTIFIER,
    @Limit INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        m.MetaId,
        m.NombreMeta,
        m.MontoObjetivo,
        ISNULL(m.MontoActual, 0) AS MontoActual,
        CASE 
            WHEN m.MontoObjetivo > 0 THEN 
                CAST((ISNULL(m.MontoActual, 0) * 100.0 / m.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END AS PorcentajeProgreso,
        CASE 
            WHEN m.FechaObjetivo IS NOT NULL AND m.EstaCompletada = 0 THEN
                DATEDIFF(DAY, GETDATE(), m.FechaObjetivo)
            ELSE NULL
        END AS DiasRestantes,
        ISNULL(m.EstaCompletada, 0) AS EstaCompletada,
        m.FechaObjetivo
    FROM MetasFinancieras m
    WHERE m.UsuarioId = @UsuarioId
    ORDER BY 
        CASE WHEN m.EstaCompletada = 1 THEN 0 ELSE 1 END,
        CASE 
            WHEN m.MontoObjetivo > 0 THEN 
                (ISNULL(m.MontoActual, 0) * 100.0 / m.MontoObjetivo)
            ELSE 0 
        END DESC;
END;
GO

-- 5. SP para obtener resumen de cuentas
CREATE OR ALTER PROCEDURE sp_ObtenerResumenCuentas
    @UsuarioId UNIQUEIDENTIFIER,
    @Limit INT = 6
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        c.CuentaId,
        c.NombreCuenta,
        c.TipoCuenta,
        ISNULL(c.Saldo, 0) AS Saldo,
        c.NombreBanco,
        ISNULL(c.Moneda, 'COP') AS Moneda
    FROM Cuentas c
    WHERE c.UsuarioId = @UsuarioId 
    AND c.EstaActivo = 1
    ORDER BY c.Saldo DESC;
END;
GO

-- 6. SP para obtener transacciones recientes
CREATE OR ALTER PROCEDURE sp_ObtenerTransaccionesRecientes
    @UsuarioId UNIQUEIDENTIFIER,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        t.TransaccionId,
        t.Monto,
        t.TipoTransaccion,
        t.Descripcion,
        t.FechaTransaccion,
        c.NombreCategoria,
        c.TipoCategoria,
        ISNULL(c.Icono, '📊') AS IconoCategoria,
        ISNULL(c.Color, '#6B7280') AS Color,
        cu.NombreCuenta,
        cu.TipoCuenta,
        cu.NombreBanco
    FROM Transacciones t
    INNER JOIN Categorias c ON t.CategoriaId = c.CategoriaId
    INNER JOIN Cuentas cu ON t.CuentaId = cu.CuentaId
    WHERE t.UsuarioId = @UsuarioId
    ORDER BY t.FechaTransaccion DESC;
END;
GO

-- 7. SP principal para obtener todos los datos del dashboard
CREATE OR ALTER PROCEDURE sp_ObtenerDashboardCompleto
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas generales
    EXEC sp_ObtenerEstadisticasGenerales @UsuarioId;
    
    -- Transacciones por categoría (gastos)
    EXEC sp_ObtenerTransaccionesPorCategoria @UsuarioId, 'gasto';
    
    -- Transacciones por categoría (ingresos)
    EXEC sp_ObtenerTransaccionesPorCategoria @UsuarioId, 'ingreso';
    
    -- Tendencias mensuales
    EXEC sp_ObtenerTendenciasMensuales @UsuarioId;
    
    -- Resumen de metas
    EXEC sp_ObtenerResumenMetas @UsuarioId, 5;
    
    -- Resumen de cuentas
    EXEC sp_ObtenerResumenCuentas @UsuarioId, 6;
    
    -- Transacciones recientes
    EXEC sp_ObtenerTransaccionesRecientes @UsuarioId, 10;
END;
GO

-- Índices para mejorar performance (si no existen)
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'IX_Transacciones_Usuario_Fecha_Tipo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Transacciones_Usuario_Fecha_Tipo
    ON Transacciones (UsuarioId, FechaTransaccion, TipoTransaccion)
    INCLUDE (Monto, CategoriaId, CuentaId);
END;

IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'IX_MetasFinancieras_Usuario_Estado')
BEGIN
    CREATE NONCLUSTERED INDEX IX_MetasFinancieras_Usuario_Estado
    ON MetasFinancieras (UsuarioId, EstaCompletada)
    INCLUDE (MontoObjetivo, MontoActual, FechaObjetivo);
END;

IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'IX_Cuentas_Usuario_Activo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Cuentas_Usuario_Activo
    ON Cuentas (UsuarioId, EstaActivo)
    INCLUDE (Saldo, TipoCuenta);
END;