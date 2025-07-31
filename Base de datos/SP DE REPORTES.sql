-- =============================================
-- Procedimientos Almacenados para REPORTES - NexusFinance
-- Sistema de Reportes Financieros
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: Reportes_DashboardFinanciero
-- Descripción: Obtiene los KPIs principales para el dashboard
-- =============================================
CREATE OR ALTER PROCEDURE Reportes_DashboardFinanciero
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican fechas, usar el mes actual
    IF @FechaInicio IS NULL
        SET @FechaInicio = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    
    IF @FechaFin IS NULL
        SET @FechaFin = EOMONTH(GETDATE());
    
    -- Resultado 1: KPIs Principales
    SELECT 
        -- Balance total de todas las cuentas
        ISNULL(SUM(c.Saldo), 0) as balanceTotal,
        
        -- Ingresos del período
        ISNULL((
            SELECT SUM(t.Monto) 
            FROM Transacciones t 
            INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
            WHERE c.UsuarioId = @UsuarioId 
                AND t.TipoTransaccion = 'Ingreso'
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as ingresosPeriodo,
        
        -- Gastos del período
        ISNULL((
            SELECT SUM(t.Monto) 
            FROM Transacciones t 
            INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
            WHERE c.UsuarioId = @UsuarioId 
                AND t.TipoTransaccion = 'Gasto'
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as gastosPeriodo,
        
        -- Balance del período (ingresos - gastos)
        ISNULL((
            SELECT SUM(CASE WHEN t.TipoTransaccion = 'Ingreso' THEN t.Monto ELSE -t.Monto END)
            FROM Transacciones t 
            INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
            WHERE c.UsuarioId = @UsuarioId 
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as balancePeriodo,
        
        -- Total de metas activas
        (SELECT COUNT(*) FROM MetasFinancieras WHERE UsuarioId = @UsuarioId AND EstaCompletada = 0) as metasActivas,
        
        -- Progreso promedio de metas
        ISNULL((
            SELECT AVG(CAST((MontoActual * 100.0 / MontoObjetivo) AS DECIMAL(10,2)))
            FROM MetasFinancieras 
            WHERE UsuarioId = @UsuarioId AND EstaCompletada = 0 AND MontoObjetivo > 0
        ), 0) as progresoPromedioMetas,
        
        -- Presupuesto total del período
        ISNULL((
            SELECT SUM(p.PresupuestoTotal)
            FROM Presupuestos p
            WHERE p.UsuarioId = @UsuarioId 
                AND p.FechaInicio <= @FechaFin 
                AND p.FechaFin >= @FechaInicio
        ), 0) as presupuestoTotal,
        
        -- Presupuesto ejecutado (suma de gastos por categorías asignadas)
        ISNULL((
            SELECT SUM(cp.MontoGastado)
            FROM Presupuestos p
            INNER JOIN CategoriasPresupuesto cp ON p.PresupuestoId = cp.PresupuestoId
            WHERE p.UsuarioId = @UsuarioId 
                AND p.FechaInicio <= @FechaFin 
                AND p.FechaFin >= @FechaInicio
        ), 0) as presupuestoEjecutado,
        
        -- Número de transacciones del período
        (
            SELECT COUNT(*)
            FROM Transacciones t 
            INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
            WHERE c.UsuarioId = @UsuarioId 
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ) as numeroTransacciones,
        
        -- Fechas del reporte
        @FechaInicio as fechaInicio,
        @FechaFin as fechaFin
    FROM Cuentas c
    WHERE c.UsuarioId = @UsuarioId;
    
    -- Resultado 2: Top 5 Categorías de Gastos
    SELECT TOP 5
        cat.NombreCategoria as categoria,
        SUM(t.Monto) as totalGastado,
        COUNT(t.TransaccionId) as numeroTransacciones,
        AVG(t.Monto) as promedioTransaccion
    FROM Transacciones t
    INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
    WHERE c.UsuarioId = @UsuarioId 
        AND t.TipoTransaccion = 'Gasto'
        AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
    GROUP BY cat.CategoriaId, cat.NombreCategoria
    ORDER BY SUM(t.Monto) DESC;
    
    -- Resultado 3: Evolución de Balance (últimos 12 meses)
    WITH MesesBalance AS (
        SELECT 
            YEAR(t.FechaTransaccion) as anio,
            MONTH(t.FechaTransaccion) as mes,
            SUM(CASE WHEN t.TipoTransaccion = 'Ingreso' THEN t.Monto ELSE -t.Monto END) as balanceMes
        FROM Transacciones t
        INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
        WHERE c.UsuarioId = @UsuarioId 
            AND t.FechaTransaccion >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY YEAR(t.FechaTransaccion), MONTH(t.FechaTransaccion)
    )
    SELECT 
        anio,
        mes,
        DATENAME(MONTH, DATEFROMPARTS(anio, mes, 1)) as nombreMes,
        balanceMes,
        SUM(balanceMes) OVER (ORDER BY anio, mes ROWS UNBOUNDED PRECEDING) as balanceAcumulado
    FROM MesesBalance
    ORDER BY anio, mes;
END;
GO

-- =============================================
-- SP: Reportes_GastosPorCategoria
-- Descripción: Reporte detallado de gastos por categoría
-- =============================================
CREATE OR ALTER PROCEDURE Reportes_GastosPorCategoria
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @CategoriaId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican fechas, usar el mes actual
    IF @FechaInicio IS NULL
        SET @FechaInicio = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    
    IF @FechaFin IS NULL
        SET @FechaFin = EOMONTH(GETDATE());
    
    -- Resultado 1: Resumen por Categoría
    SELECT 
        cat.CategoriaId as categoriaId,
        cat.NombreCategoria as categoria,
        cat.Color as color,
        SUM(t.Monto) as totalGastado,
        COUNT(t.TransaccionId) as numeroTransacciones,
        AVG(t.Monto) as promedioTransaccion,
        MIN(t.Monto) as montoMinimo,
        MAX(t.Monto) as montoMaximo,
        -- Porcentaje del total de gastos
        CAST((SUM(t.Monto) * 100.0 / (
            SELECT SUM(t2.Monto) 
            FROM Transacciones t2 
            INNER JOIN Cuentas c2 ON t2.CuentaId = c2.CuentaId
            WHERE c2.UsuarioId = @UsuarioId 
                AND t2.TipoTransaccion = 'Gasto'
                AND t2.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        )) AS DECIMAL(10,2)) as porcentajeDelTotal,
        -- Comparación con mes anterior
        ISNULL((
            SELECT SUM(t3.Monto)
            FROM Transacciones t3
            INNER JOIN Cuentas c3 ON t3.CuentaId = c3.CuentaId
            WHERE c3.UsuarioId = @UsuarioId 
                AND t3.CategoriaId = cat.CategoriaId
                AND t3.TipoTransaccion = 'Gasto'
                AND t3.FechaTransaccion BETWEEN DATEADD(MONTH, -1, @FechaInicio) AND DATEADD(MONTH, -1, @FechaFin)
        ), 0) as totalMesAnterior
    FROM Transacciones t
    INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
    WHERE c.UsuarioId = @UsuarioId 
        AND t.TipoTransaccion = 'Gasto'
        AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        AND (@CategoriaId IS NULL OR cat.CategoriaId = @CategoriaId)
    GROUP BY cat.CategoriaId, cat.NombreCategoria, cat.Color
    ORDER BY SUM(t.Monto) DESC;
    
    -- Resultado 2: Detalle de Transacciones (si se especifica una categoría)
    IF @CategoriaId IS NOT NULL
    BEGIN
        SELECT 
            t.TransaccionId as transaccionId,
            t.Descripcion as descripcion,
            t.Monto as monto,
            t.FechaTransaccion as fecha,
            c.NombreCuenta as cuenta,
            cat.NombreCategoria as categoria
        FROM Transacciones t
        INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
        INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
        WHERE c.UsuarioId = @UsuarioId 
            AND t.CategoriaId = @CategoriaId
            AND t.TipoTransaccion = 'Gasto'
            AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ORDER BY t.FechaTransaccion DESC;
    END
    
    -- Resultado 3: Evolución Diaria de Gastos
    SELECT 
        CAST(t.FechaTransaccion AS DATE) as fecha,
        SUM(t.Monto) as totalDia,
        COUNT(t.TransaccionId) as transaccionesDia
    FROM Transacciones t
    INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
    WHERE c.UsuarioId = @UsuarioId 
        AND t.TipoTransaccion = 'Gasto'
        AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        AND (@CategoriaId IS NULL OR t.CategoriaId = @CategoriaId)
    GROUP BY CAST(t.FechaTransaccion AS DATE)
    ORDER BY CAST(t.FechaTransaccion AS DATE);
END;
GO

-- =============================================
-- SP: Reportes_ProgresoMetas
-- Descripción: Reporte de progreso de metas financieras
-- =============================================
CREATE OR ALTER PROCEDURE Reportes_ProgresoMetas
    @UsuarioId UNIQUEIDENTIFIER,
    @EstadoMeta NVARCHAR(20) = NULL -- 'activa', 'completada', 'pausada'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resultado 1: Resumen de Metas
    SELECT 
        m.MetaId as metaId,
        m.NombreMeta as nombreMeta,
        m.Descripcion as descripcion,
        m.MontoObjetivo as montoObjetivo,
        m.MontoActual as montoAcumulado,
        m.FechaObjetivo as fechaLimite,
        CASE WHEN m.EstaCompletada = 1 THEN 'completada' ELSE 'activa' END as estado,
        m.FechaCreacion as fechaCreacion,
        
        -- Porcentaje de progreso
        CASE 
            WHEN m.MontoObjetivo > 0 THEN CAST((m.MontoActual * 100.0 / m.MontoObjetivo) AS DECIMAL(10,2))
            ELSE 0
        END as porcentajeProgreso,
        
        -- Monto faltante
        CASE 
            WHEN m.MontoActual < m.MontoObjetivo THEN m.MontoObjetivo - m.MontoActual
            ELSE 0
        END as montoFaltante,
        
        -- Días restantes
        CASE 
            WHEN m.FechaObjetivo > GETDATE() THEN DATEDIFF(DAY, GETDATE(), m.FechaObjetivo)
            ELSE 0
        END as diasRestantes,
        
        -- Ahorro diario requerido
        CASE 
            WHEN m.FechaObjetivo > GETDATE() AND m.MontoActual < m.MontoObjetivo 
            THEN CAST(((m.MontoObjetivo - m.MontoActual) / DATEDIFF(DAY, GETDATE(), m.FechaObjetivo)) AS DECIMAL(10,2))
            ELSE 0
        END as ahorroRequeridoDiario,
        
        -- Total de contribuciones
        ISNULL((
            SELECT COUNT(*) 
            FROM ContribucionesMetas cm 
            WHERE cm.MetaId = m.MetaId
        ), 0) as numeroContribuciones,
        
        -- Promedio de contribuciones
        ISNULL((
            SELECT AVG(cm.Monto) 
            FROM ContribucionesMetas cm 
            WHERE cm.MetaId = m.MetaId
        ), 0) as promedioContribuciones,
        
        -- Última contribución
        (
            SELECT TOP 1 cm.FechaContribucion 
            FROM ContribucionesMetas cm 
            WHERE cm.MetaId = m.MetaId 
            ORDER BY cm.FechaContribucion DESC
        ) as ultimaContribucion
        
    FROM MetasFinancieras m
    WHERE m.UsuarioId = @UsuarioId
        AND (@EstadoMeta IS NULL OR 
             (@EstadoMeta = 'completada' AND m.EstaCompletada = 1) OR 
             (@EstadoMeta = 'activa' AND m.EstaCompletada = 0))
    ORDER BY 
        CASE 
            WHEN m.EstaCompletada = 0 THEN 1
            ELSE 2
        END,
        m.FechaObjetivo ASC;
    
    -- Resultado 2: Contribuciones Recientes (últimas 20)
    SELECT TOP 20
        cm.ContribucionId as contribucionId,
        cm.MetaId as metaId,
        m.NombreMeta as nombreMeta,
        cm.Monto as monto,
        cm.FechaContribucion as fecha,
        cm.Notas as descripcion
    FROM ContribucionesMetas cm
    INNER JOIN MetasFinancieras m ON cm.MetaId = m.MetaId
    WHERE m.UsuarioId = @UsuarioId
        AND (@EstadoMeta IS NULL OR 
             (@EstadoMeta = 'completada' AND m.EstaCompletada = 1) OR 
             (@EstadoMeta = 'activa' AND m.EstaCompletada = 0))
    ORDER BY cm.FechaContribucion DESC;
    
    -- Resultado 3: Estadísticas Generales
    SELECT 
        COUNT(*) as totalMetas,
        SUM(CASE WHEN EstaCompletada = 0 THEN 1 ELSE 0 END) as metasActivas,
        SUM(CASE WHEN EstaCompletada = 1 THEN 1 ELSE 0 END) as metasCompletadas,
        0 as metasPausadas, -- No hay estado pausada en el modelo actual
        
        -- Totales monetarios
        SUM(MontoObjetivo) as totalObjetivos,
        SUM(MontoActual) as totalAcumulado,
        SUM(CASE WHEN MontoActual < MontoObjetivo THEN MontoObjetivo - MontoActual ELSE 0 END) as totalFaltante,
        
        -- Promedios
        AVG(CASE WHEN MontoObjetivo > 0 THEN (MontoActual * 100.0 / MontoObjetivo) ELSE 0 END) as progresoPromedio,
        
        -- Metas próximas a vencer (30 días)
        SUM(CASE 
            WHEN EstaCompletada = 0 AND FechaObjetivo BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE()) 
            THEN 1 ELSE 0 
        END) as metasProximasVencer
        
    FROM MetasFinancieras
    WHERE UsuarioId = @UsuarioId;
END;
GO

-- =============================================
-- SP: Reportes_BalanceCuentas
-- Descripción: Reporte de balance y movimientos por cuenta
-- =============================================
CREATE OR ALTER PROCEDURE Reportes_BalanceCuentas
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si no se especifican fechas, usar el mes actual
    IF @FechaInicio IS NULL
        SET @FechaInicio = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    
    IF @FechaFin IS NULL
        SET @FechaFin = EOMONTH(GETDATE());
    
    -- Resultado 1: Balance por Cuenta
    SELECT 
        c.CuentaId as cuentaId,
        c.NombreCuenta as nombreCuenta,
        c.TipoCuenta as tipoCuenta,
        c.Saldo as saldoActual,
        
        -- Movimientos del período
        ISNULL((
            SELECT SUM(CASE WHEN t.TipoTransaccion = 'Ingreso' THEN t.Monto ELSE -t.Monto END)
            FROM Transacciones t
            WHERE t.CuentaId = c.CuentaId 
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as movimientoPeriodo,
        
        -- Ingresos del período
        ISNULL((
            SELECT SUM(t.Monto)
            FROM Transacciones t
            WHERE t.CuentaId = c.CuentaId 
                AND t.TipoTransaccion = 'Ingreso'
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as ingresosPeriodo,
        
        -- Gastos del período
        ISNULL((
            SELECT SUM(t.Monto)
            FROM Transacciones t
            WHERE t.CuentaId = c.CuentaId 
                AND t.TipoTransaccion = 'Gasto'
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as gastosPeriodo,
        
        -- Número de transacciones
        (
            SELECT COUNT(*)
            FROM Transacciones t
            WHERE t.CuentaId = c.CuentaId 
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ) as numeroTransacciones,
        
        -- Saldo al inicio del período (calculado)
        c.Saldo - ISNULL((
            SELECT SUM(CASE WHEN t.TipoTransaccion = 'Ingreso' THEN t.Monto ELSE -t.Monto END)
            FROM Transacciones t
            WHERE t.CuentaId = c.CuentaId 
                AND t.FechaTransaccion BETWEEN @FechaInicio AND @FechaFin
        ), 0) as saldoInicioPeriodo
        
    FROM Cuentas c
    WHERE c.UsuarioId = @UsuarioId
    ORDER BY c.Saldo DESC;
END;
GO

PRINT 'Procedimientos almacenados para REPORTES creados exitosamente.';