-- =============================================
-- Procedimientos Almacenados Básicos para Tabla GASTOSVIAJE
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: GastosViaje_Insert
-- Descripción: Inserta un nuevo gasto de viaje
-- =============================================
CREATE PROCEDURE GastosViaje_Insert
    @PlanId UNIQUEIDENTIFIER,
    @CategoriaViajeId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2),
    @MonedaGasto NVARCHAR(3),
    @Descripcion NVARCHAR(500),
    @FechaGasto DATETIME2 = NULL,
    @Ubicacion NVARCHAR(300) = NULL,
    @NumeroPersonas INT = 1,
    @ActividadId UNIQUEIDENTIFIER = NULL,
    @TransaccionId UNIQUEIDENTIFIER = NULL,
    @TasaCambioUsada DECIMAL(10,4) = NULL,
    @UrlRecibo NVARCHAR(500) = NULL,
    @Notas NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @GastoViajeId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @MonedaUsuario NVARCHAR(3);
    DECLARE @MontoEnMonedaLocal DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que el plan existe y obtener datos del usuario
        SELECT @UsuarioId = pv.UsuarioId, @MonedaUsuario = u.Moneda
        FROM PlanesVacaciones pv
        INNER JOIN Usuarios u ON pv.UsuarioId = u.UsuarioId
        WHERE pv.PlanId = @PlanId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar que la categoría de viaje existe y está activa
        IF NOT EXISTS (
            SELECT 1 FROM CategoriasGastosViaje 
            WHERE CategoriaViajeId = @CategoriaViajeId AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('La categoría de gastos de viaje no existe o está inactiva.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @Monto IS NULL OR @Monto <= 0
        BEGIN
            RAISERROR('El monto debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        IF @MonedaGasto IS NULL OR LTRIM(RTRIM(@MonedaGasto)) = ''
        BEGIN
            RAISERROR('La moneda del gasto es obligatoria.', 16, 1);
            RETURN;
        END
        
        IF @Descripcion IS NULL OR LTRIM(RTRIM(@Descripcion)) = ''
        BEGIN
            RAISERROR('La descripción del gasto es obligatoria.', 16, 1);
            RETURN;
        END
        
        -- Establecer fecha actual si no se especifica
        IF @FechaGasto IS NULL
        BEGIN
            SET @FechaGasto = GETUTCDATE();
        END
        
        -- Validar número de personas
        IF @NumeroPersonas <= 0
        BEGIN
            RAISERROR('El número de personas debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar actividad si se especifica
        IF @ActividadId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM ActividadesViaje 
                WHERE ActividadId = @ActividadId AND PlanId = @PlanId
            )
            BEGIN
                RAISERROR('La actividad especificada no existe o no pertenece al plan.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar transacción si se especifica
        IF @TransaccionId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Transacciones 
                WHERE TransaccionId = @TransaccionId AND UsuarioId = @UsuarioId
            )
            BEGIN
                RAISERROR('La transacción especificada no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
        END
        
        -- Calcular monto en moneda local del usuario
        IF @MonedaGasto = @MonedaUsuario
        BEGIN
            -- Misma moneda, no hay conversión
            SET @MontoEnMonedaLocal = @Monto;
            SET @TasaCambioUsada = 1.0000;
        END
        ELSE
        BEGIN
            -- Moneda diferente, usar tasa de cambio proporcionada o asumir 1:1 si no se especifica
            IF @TasaCambioUsada IS NULL OR @TasaCambioUsada <= 0
            BEGIN
                SET @TasaCambioUsada = 1.0000;
                SET @MontoEnMonedaLocal = @Monto;
            END
            ELSE
            BEGIN
                SET @MontoEnMonedaLocal = @Monto * @TasaCambioUsada;
            END
        END
        
        -- Validar que la fecha del gasto esté dentro de un rango razonable del viaje
        IF NOT EXISTS (
            SELECT 1 FROM PlanesVacaciones 
            WHERE PlanId = @PlanId 
              AND @FechaGasto BETWEEN DATEADD(MONTH, -1, FechaInicio) AND DATEADD(MONTH, 1, FechaFin)
        )
        BEGIN
            RAISERROR('La fecha del gasto debe estar en un rango razonable respecto a las fechas del viaje.', 16, 1);
            RETURN;
        END
        
        -- Insertar gasto de viaje
        INSERT INTO GastosViaje (
            GastoViajeId, PlanId, TransaccionId, CategoriaViajeId, ActividadId,
            Monto, MonedaGasto, MontoEnMonedaLocal, TasaCambioUsada, Descripcion,
            FechaGasto, Ubicacion, NumeroPersonas, UrlRecibo, Notas, FechaCreacion
        )
        VALUES (
            @GastoViajeId, @PlanId, @TransaccionId, @CategoriaViajeId, @ActividadId,
            @Monto, @MonedaGasto, @MontoEnMonedaLocal, @TasaCambioUsada, @Descripcion,
            @FechaGasto, @Ubicacion, @NumeroPersonas, @UrlRecibo, @Notas, GETUTCDATE()
        );
        
        -- Retornar el gasto creado con información adicional
        SELECT 
            gv.GastoViajeId, gv.PlanId, gv.TransaccionId, gv.CategoriaViajeId, gv.ActividadId,
            cgv.NombreCategoria, cgv.Color, cgv.Icono,
            av.NombreActividad,
            gv.Monto, gv.MonedaGasto, gv.MontoEnMonedaLocal, gv.TasaCambioUsada,
            gv.Descripcion, gv.FechaGasto, gv.Ubicacion, gv.NumeroPersonas,
            gv.UrlRecibo, gv.Notas, gv.FechaCreacion,
            -- Información adicional calculada
            CASE 
                WHEN gv.NumeroPersonas > 1 THEN gv.Monto / gv.NumeroPersonas
                ELSE gv.Monto 
            END AS MontoPorPersona,
            CASE 
                WHEN gv.NumeroPersonas > 1 THEN gv.MontoEnMonedaLocal / gv.NumeroPersonas
                ELSE gv.MontoEnMonedaLocal 
            END AS MontoLocalPorPersona
        FROM GastosViaje gv
        INNER JOIN CategoriasGastosViaje cgv ON gv.CategoriaViajeId = cgv.CategoriaViajeId
        LEFT JOIN ActividadesViaje av ON gv.ActividadId = av.ActividadId
        WHERE gv.GastoViajeId = @GastoViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: GastosViaje_Update
-- Descripción: Actualiza un gasto de viaje existente
-- =============================================
CREATE PROCEDURE GastosViaje_Update
    @GastoViajeId UNIQUEIDENTIFIER,
    @CategoriaViajeId UNIQUEIDENTIFIER = NULL,
    @Monto DECIMAL(18,2) = NULL,
    @MonedaGasto NVARCHAR(3) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @FechaGasto DATETIME2 = NULL,
    @Ubicacion NVARCHAR(300) = NULL,
    @NumeroPersonas INT = NULL,
    @ActividadId UNIQUEIDENTIFIER = NULL,
    @TasaCambioUsada DECIMAL(10,4) = NULL,
    @UrlRecibo NVARCHAR(500) = NULL,
    @Notas NVARCHAR(1000) = NULL,
    @CambiarActividad BIT = 0, -- Flag para cambiar actividad a NULL
    @RecalcularMontoLocal BIT = 0 -- Flag para recalcular el monto en moneda local
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @PlanId UNIQUEIDENTIFIER;
    DECLARE @MonedaUsuario NVARCHAR(3);
    DECLARE @MontoEnMonedaLocal DECIMAL(18,2);
    DECLARE @MonedaActual NVARCHAR(3);
    DECLARE @MontoActual DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que el gasto existe y obtener datos
        SELECT 
            @PlanId = gv.PlanId,
            @MonedaUsuario = u.Moneda,
            @MonedaActual = gv.MonedaGasto,
            @MontoActual = gv.Monto
        FROM GastosViaje gv
        INNER JOIN PlanesVacaciones pv ON gv.PlanId = pv.PlanId
        INNER JOIN Usuarios u ON pv.UsuarioId = u.UsuarioId
        WHERE gv.GastoViajeId = @GastoViajeId;
        
        IF @PlanId IS NULL
        BEGIN
            RAISERROR('El gasto de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar campos si se especifican
        IF @Monto IS NOT NULL AND @Monto <= 0
        BEGIN
            RAISERROR('El monto debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        IF @NumeroPersonas IS NOT NULL AND @NumeroPersonas <= 0
        BEGIN
            RAISERROR('El número de personas debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar categoría de viaje si se especifica
        IF @CategoriaViajeId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM CategoriasGastosViaje 
                WHERE CategoriaViajeId = @CategoriaViajeId AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La categoría de gastos de viaje no existe o está inactiva.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar actividad si se especifica
        IF @ActividadId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM ActividadesViaje 
                WHERE ActividadId = @ActividadId AND PlanId = @PlanId
            )
            BEGIN
                RAISERROR('La actividad especificada no existe o no pertenece al plan.', 16, 1);
                RETURN;
            END
        END
        
        -- Calcular nuevo monto en moneda local si es necesario
        IF @RecalcularMontoLocal = 1 OR @Monto IS NOT NULL OR @MonedaGasto IS NOT NULL OR @TasaCambioUsada IS NOT NULL
        BEGIN
            DECLARE @NuevoMonto DECIMAL(18,2) = ISNULL(@Monto, @MontoActual);
            DECLARE @NuevaMoneda NVARCHAR(3) = ISNULL(@MonedaGasto, @MonedaActual);
            DECLARE @NuevaTasa DECIMAL(10,4) = ISNULL(@TasaCambioUsada, 1.0000);
            
            IF @NuevaMoneda = @MonedaUsuario
            BEGIN
                SET @MontoEnMonedaLocal = @NuevoMonto;
                SET @NuevaTasa = 1.0000;
            END
            ELSE
            BEGIN
                SET @MontoEnMonedaLocal = @NuevoMonto * @NuevaTasa;
            END
        END
        
        -- Actualizar gasto de viaje
        UPDATE GastosViaje 
        SET 
            CategoriaViajeId = ISNULL(@CategoriaViajeId, CategoriaViajeId),
            Monto = ISNULL(@Monto, Monto),
            MonedaGasto = ISNULL(@MonedaGasto, MonedaGasto),
            MontoEnMonedaLocal = ISNULL(@MontoEnMonedaLocal, MontoEnMonedaLocal),
            TasaCambioUsada = CASE 
                WHEN @RecalcularMontoLocal = 1 OR @TasaCambioUsada IS NOT NULL THEN ISNULL(@TasaCambioUsada, TasaCambioUsada)
                ELSE TasaCambioUsada 
            END,
            Descripcion = ISNULL(@Descripcion, Descripcion),
            FechaGasto = ISNULL(@FechaGasto, FechaGasto),
            Ubicacion = ISNULL(@Ubicacion, Ubicacion),
            NumeroPersonas = ISNULL(@NumeroPersonas, NumeroPersonas),
            ActividadId = CASE 
                WHEN @CambiarActividad = 1 THEN @ActividadId 
                WHEN @ActividadId IS NOT NULL THEN @ActividadId
                ELSE ActividadId 
            END,
            UrlRecibo = ISNULL(@UrlRecibo, UrlRecibo),
            Notas = ISNULL(@Notas, Notas)
        WHERE GastoViajeId = @GastoViajeId;
        
        -- Retornar el gasto actualizado
        SELECT 
            gv.GastoViajeId, gv.PlanId, gv.TransaccionId, gv.CategoriaViajeId, gv.ActividadId,
            cgv.NombreCategoria, cgv.Color, cgv.Icono,
            av.NombreActividad,
            gv.Monto, gv.MonedaGasto, gv.MontoEnMonedaLocal, gv.TasaCambioUsada,
            gv.Descripcion, gv.FechaGasto, gv.Ubicacion, gv.NumeroPersonas,
            gv.UrlRecibo, gv.Notas, gv.FechaCreacion,
            -- Información adicional calculada
            CASE 
                WHEN gv.NumeroPersonas > 1 THEN gv.Monto / gv.NumeroPersonas
                ELSE gv.Monto 
            END AS MontoPorPersona,
            CASE 
                WHEN gv.NumeroPersonas > 1 THEN gv.MontoEnMonedaLocal / gv.NumeroPersonas
                ELSE gv.MontoEnMonedaLocal 
            END AS MontoLocalPorPersona
        FROM GastosViaje gv
        INNER JOIN CategoriasGastosViaje cgv ON gv.CategoriaViajeId = cgv.CategoriaViajeId
        LEFT JOIN ActividadesViaje av ON gv.ActividadId = av.ActividadId
        WHERE gv.GastoViajeId = @GastoViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: GastosViaje_Delete
-- Descripción: Elimina un gasto de viaje
-- =============================================
CREATE PROCEDURE GastosViaje_Delete
    @GastoViajeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que el gasto existe
        IF NOT EXISTS (SELECT 1 FROM GastosViaje WHERE GastoViajeId = @GastoViajeId)
        BEGIN
            RAISERROR('El gasto de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Eliminar gasto (los gastos de viaje no tienen dependencias que impidan la eliminación)
        DELETE FROM GastosViaje WHERE GastoViajeId = @GastoViajeId;
        
        SELECT 'Gasto de viaje eliminado exitosamente' AS Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: GastosViaje_Select
-- Descripción: Obtiene un gasto de viaje por ID
-- =============================================
CREATE PROCEDURE GastosViaje_Select
    @GastoViajeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        gv.GastoViajeId, gv.PlanId, gv.TransaccionId, gv.CategoriaViajeId, gv.ActividadId,
        cgv.NombreCategoria, cgv.Color, cgv.Icono,
        av.NombreActividad, av.FechaActividad, av.HoraInicio, av.HoraFin,
        plv.NombrePlan, plv.Destino, plv.FechaInicio AS FechaInicioPlan, plv.FechaFin AS FechaFinPlan,
        gv.Monto, gv.MonedaGasto, gv.MontoEnMonedaLocal, gv.TasaCambioUsada,
        gv.Descripcion, gv.FechaGasto, gv.Ubicacion, gv.NumeroPersonas,
        gv.UrlRecibo, gv.Notas, gv.FechaCreacion,
        -- Información adicional calculada
        CASE 
            WHEN gv.NumeroPersonas > 1 THEN gv.Monto / gv.NumeroPersonas
            ELSE gv.Monto 
        END AS MontoPorPersona,
        CASE 
            WHEN gv.NumeroPersonas > 1 THEN gv.MontoEnMonedaLocal / gv.NumeroPersonas
            ELSE gv.MontoEnMonedaLocal 
        END AS MontoLocalPorPersona,
        DATEDIFF(DAY, plv.FechaInicio, gv.FechaGasto) + 1 AS DiaDelViaje,
        DATENAME(WEEKDAY, gv.FechaGasto) AS DiaSemana
    FROM GastosViaje gv
    INNER JOIN CategoriasGastosViaje cgv ON gv.CategoriaViajeId = cgv.CategoriaViajeId
    INNER JOIN PlanesVacaciones plv ON gv.PlanId = plv.PlanId
    LEFT JOIN ActividadesViaje av ON gv.ActividadId = av.ActividadId
    WHERE gv.GastoViajeId = @GastoViajeId;
END;
GO

-- =============================================
-- SP: GastosViaje_SelectByPlan
-- Descripción: Obtiene todos los gastos de un plan de viaje
-- =============================================
CREATE PROCEDURE GastosViaje_SelectByPlan
    @PlanId UNIQUEIDENTIFIER,
    @CategoriaViajeId UNIQUEIDENTIFIER = NULL, -- Filtrar por categoría específica
    @ActividadId UNIQUEIDENTIFIER = NULL, -- Filtrar por actividad específica
    @FechaDesde DATETIME2 = NULL, -- Filtrar por rango de fechas
    @FechaHasta DATETIME2 = NULL,
    @MontoMinimo DECIMAL(18,2) = NULL, -- Filtrar por rango de montos
    @MontoMaximo DECIMAL(18,2) = NULL,
    @MonedaGasto NVARCHAR(3) = NULL, -- Filtrar por moneda específica
    @OrdenarPor NVARCHAR(20) = 'Fecha', -- 'Fecha', 'Monto', 'Categoria', 'Actividad'
    @IncluirResumen BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    -- Verificar que el plan existe
    SELECT @UsuarioId = UsuarioId
    FROM PlanesVacaciones 
    WHERE PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    -- Consulta principal de gastos
    SELECT 
        gv.GastoViajeId, gv.PlanId, gv.TransaccionId, gv.CategoriaViajeId, gv.ActividadId,
        cgv.NombreCategoria, cgv.Color, cgv.Icono, cgv.OrdenVisualizacion,
        av.NombreActividad,
        gv.Monto, gv.MonedaGasto, gv.MontoEnMonedaLocal, gv.TasaCambioUsada,
        gv.Descripcion, gv.FechaGasto, gv.Ubicacion, gv.NumeroPersonas,
        gv.UrlRecibo, gv.Notas, gv.FechaCreacion,
        -- Información adicional calculada
        CASE 
            WHEN gv.NumeroPersonas > 1 THEN gv.Monto / gv.NumeroPersonas
            ELSE gv.Monto 
        END AS MontoPorPersona,
        CASE 
            WHEN gv.NumeroPersonas > 1 THEN gv.MontoEnMonedaLocal / gv.NumeroPersonas
            ELSE gv.MontoEnMonedaLocal 
        END AS MontoLocalPorPersona,
        CAST(gv.FechaGasto AS DATE) AS FechaSoloGasto,
        DATENAME(WEEKDAY, gv.FechaGasto) AS DiaSemana
    FROM GastosViaje gv
    INNER JOIN CategoriasGastosViaje cgv ON gv.CategoriaViajeId = cgv.CategoriaViajeId
    LEFT JOIN ActividadesViaje av ON gv.ActividadId = av.ActividadId
    WHERE gv.PlanId = @PlanId
      AND (@CategoriaViajeId IS NULL OR gv.CategoriaViajeId = @CategoriaViajeId)
      AND (@ActividadId IS NULL OR gv.ActividadId = @ActividadId)
      AND (@FechaDesde IS NULL OR gv.FechaGasto >= @FechaDesde)
      AND (@FechaHasta IS NULL OR gv.FechaGasto <= @FechaHasta)
      AND (@MontoMinimo IS NULL OR gv.MontoEnMonedaLocal >= @MontoMinimo)
      AND (@MontoMaximo IS NULL OR gv.MontoEnMonedaLocal <= @MontoMaximo)
      AND (@MonedaGasto IS NULL OR gv.MonedaGasto = @MonedaGasto)
    ORDER BY 
        CASE 
            WHEN @OrdenarPor = 'Fecha' THEN gv.FechaGasto
            ELSE gv.FechaGasto
        END DESC,
        CASE 
            WHEN @OrdenarPor = 'Monto' THEN gv.MontoEnMonedaLocal
            ELSE 0
        END DESC,
        CASE 
            WHEN @OrdenarPor = 'Categoria' THEN cgv.OrdenVisualizacion
            ELSE 999
        END,
        CASE 
            WHEN @OrdenarPor = 'Categoria' THEN cgv.NombreCategoria
            WHEN @OrdenarPor = 'Actividad' THEN av.NombreActividad
            ELSE gv.Descripcion
        END;
    
    -- Resumen si se solicita
    IF @IncluirResumen = 1
    BEGIN
        SELECT 
            @PlanId AS PlanId,
            COUNT(*) AS TotalGastos,
            SUM(gv.MontoEnMonedaLocal) AS TotalGastado,
            AVG(gv.MontoEnMonedaLocal) AS PromedioGasto,
            MIN(gv.MontoEnMonedaLocal) AS GastoMinimo,
            MAX(gv.MontoEnMonedaLocal) AS GastoMaximo,
            COUNT(DISTINCT gv.CategoriaViajeId) AS CategoriasUtilizadas,
            COUNT(DISTINCT CAST(gv.FechaGasto AS DATE)) AS DiasConGastos,
            COUNT(DISTINCT gv.MonedaGasto) AS MonedasUtilizadas,
            -- Gasto más alto
            (SELECT TOP 1 Descripcion FROM GastosViaje 
             WHERE PlanId = @PlanId ORDER BY MontoEnMonedaLocal DESC) AS GastoMasAlto,
            -- Categoría con más gastos
            (SELECT TOP 1 cgv2.NombreCategoria 
             FROM GastosViaje gv2
             INNER JOIN CategoriasGastosViaje cgv2 ON gv2.CategoriaViajeId = cgv2.CategoriaViajeId
             WHERE gv2.PlanId = @PlanId
             GROUP BY cgv2.CategoriaViajeId, cgv2.NombreCategoria
             ORDER BY SUM(gv2.MontoEnMonedaLocal) DESC) AS CategoriaConMayorGasto
        FROM GastosViaje gv
        WHERE gv.PlanId = @PlanId
          AND (@CategoriaViajeId IS NULL OR gv.CategoriaViajeId = @CategoriaViajeId)
          AND (@ActividadId IS NULL OR gv.ActividadId = @ActividadId)
          AND (@FechaDesde IS NULL OR gv.FechaGasto >= @FechaDesde)
          AND (@FechaHasta IS NULL OR gv.FechaGasto <= @FechaHasta)
          AND (@MontoMinimo IS NULL OR gv.MontoEnMonedaLocal >= @MontoMinimo)
          AND (@MontoMaximo IS NULL OR gv.MontoEnMonedaLocal <= @MontoMaximo)
          AND (@MonedaGasto IS NULL OR gv.MonedaGasto = @MonedaGasto);
    END
END;
GO

-- =============================================
-- SP: GastosViaje_GetAnalisisPorCategoria
-- Descripción: Análisis detallado de gastos por categoría
-- =============================================
CREATE PROCEDURE GastosViaje_GetAnalisisPorCategoria
    @PlanId UNIQUEIDENTIFIER,
    @IncluirSinGastos BIT = 0 -- Incluir categorías sin gastos registrados
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    -- Verificar que el plan existe
    SELECT @UsuarioId = UsuarioId
    FROM PlanesVacaciones 
    WHERE PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    -- Análisis por categoría
    SELECT 
        cgv.CategoriaViajeId,
        cgv.NombreCategoria,
        cgv.Color,
        cgv.Icono,
        cgv.OrdenVisualizacion,
        ISNULL(COUNT(gv.GastoViajeId), 0) AS CantidadGastos,
        ISNULL(SUM(gv.MontoEnMonedaLocal), 0) AS TotalGastado,
        ISNULL(AVG(gv.MontoEnMonedaLocal), 0) AS PromedioGasto,
        ISNULL(MIN(gv.MontoEnMonedaLocal), 0) AS GastoMinimo,
        ISNULL(MAX(gv.MontoEnMonedaLocal), 0) AS GastoMaximo,
        -- Presupuesto asignado si existe
        pv.PresupuestoEstimado,
        pv.GastoReal AS GastoRealPresupuesto,
        CASE 
            WHEN pv.PresupuestoEstimado > 0 THEN
                ROUND((ISNULL(SUM(gv.MontoEnMonedaLocal), 0) * 100.0) / pv.PresupuestoEstimado, 2)
            ELSE NULL 
        END AS PorcentajePresupuestoUtilizado,
        CASE 
            WHEN pv.PresupuestoEstimado > 0 THEN
                pv.PresupuestoEstimado - ISNULL(SUM(gv.MontoEnMonedaLocal), 0)
            ELSE NULL 
        END AS SaldoPresupuesto,
        CASE 
            WHEN pv.PresupuestoEstimado > 0 AND ISNULL(SUM(gv.MontoEnMonedaLocal), 0) > pv.PresupuestoEstimado THEN 1
            ELSE 0 
        END AS ExcedioPresupuesto,
        -- Información temporal
        MIN(gv.FechaGasto) AS PrimerGasto,
        MAX(gv.FechaGasto) AS UltimoGasto,
        COUNT(DISTINCT CAST(gv.FechaGasto AS DATE)) AS DiasConGastos,
        -- Participación en el total del viaje
        ROUND(
            CASE 
                WHEN (SELECT SUM(MontoEnMonedaLocal) FROM GastosViaje WHERE PlanId = @PlanId) > 0 THEN
                    (ISNULL(SUM(gv.MontoEnMonedaLocal), 0) * 100.0) / 
                    (SELECT SUM(MontoEnMonedaLocal) FROM GastosViaje WHERE PlanId = @PlanId)
                ELSE 0 
            END, 2
        ) AS PorcentajeDelTotal
    FROM CategoriasGastosViaje cgv
    LEFT JOIN GastosViaje gv ON cgv.CategoriaViajeId = gv.CategoriaViajeId AND gv.PlanId = @PlanId
    LEFT JOIN PresupuestoViaje pv ON cgv.CategoriaViajeId = pv.CategoriaViajeId AND pv.PlanId = @PlanId
    WHERE cgv.EstaActivo = 1
      AND (@IncluirSinGastos = 1 OR EXISTS (SELECT 1 FROM GastosViaje WHERE CategoriaViajeId = cgv.CategoriaViajeId AND PlanId = @PlanId))
    GROUP BY 
        cgv.CategoriaViajeId, cgv.NombreCategoria, cgv.Color, cgv.Icono, cgv.OrdenVisualizacion,
        pv.PresupuestoEstimado, pv.GastoReal
    ORDER BY ISNULL(SUM(gv.MontoEnMonedaLocal), 0) DESC, cgv.OrdenVisualizacion;
END;
GO

-- =============================================
-- SP: GastosViaje_GetAnalisisTemporal
-- Descripción: Análisis de gastos por períodos de tiempo
-- =============================================
CREATE PROCEDURE GastosViaje_GetAnalisisTemporal
    @PlanId UNIQUEIDENTIFIER,
    @TipoAnalisis NVARCHAR(20) = 'Diario' -- 'Diario', 'Semanal', 'PorDiaViaje'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @FechaInicio DATE, @FechaFin DATE;
    
    -- Verificar que el plan existe y obtener fechas
    SELECT @UsuarioId = UsuarioId, @FechaInicio = FechaInicio, @FechaFin = FechaFin
    FROM PlanesVacaciones 
    WHERE PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    IF @TipoAnalisis = 'Diario'
    BEGIN
        -- Análisis diario
        SELECT 
            CAST(gv.FechaGasto AS DATE) AS Fecha,
            DATENAME(WEEKDAY, gv.FechaGasto) AS DiaSemana,
            COUNT(*) AS CantidadGastos,
            SUM(gv.MontoEnMonedaLocal) AS TotalGasto,
            AVG(gv.MontoEnMonedaLocal) AS PromedioGasto,
            MIN(gv.MontoEnMonedaLocal) AS GastoMinimo,
            MAX(gv.MontoEnMonedaLocal) AS GastoMaximo,
            COUNT(DISTINCT gv.CategoriaViajeId) AS CategoriasUtilizadas,
            -- Concatenar categorías manualmente para compatibilidad
            STUFF((
                SELECT DISTINCT ', ' + cgv2.NombreCategoria
                FROM GastosViaje gv2
                INNER JOIN CategoriasGastosViaje cgv2 ON gv2.CategoriaViajeId = cgv2.CategoriaViajeId
                WHERE gv2.PlanId = @PlanId AND CAST(gv2.FechaGasto AS DATE) = CAST(gv.FechaGasto AS DATE)
                FOR XML PATH('')
            ), 1, 2, '') AS Categorias
        FROM GastosViaje gv
        INNER JOIN CategoriasGastosViaje cgv ON gv.CategoriaViajeId = cgv.CategoriaViajeId
        WHERE gv.PlanId = @PlanId
        GROUP BY CAST(gv.FechaGasto AS DATE)
        ORDER BY CAST(gv.FechaGasto AS DATE);
    END
    ELSE IF @TipoAnalisis = 'Semanal'
    BEGIN
        -- Análisis semanal
        SELECT 
            DATEPART(WEEK, gv.FechaGasto) AS NumeroSemana,
            YEAR(gv.FechaGasto) AS Año,
            MIN(CAST(gv.FechaGasto AS DATE)) AS FechaInicioSemana,
            MAX(CAST(gv.FechaGasto AS DATE)) AS FechaFinSemana,
            COUNT(*) AS CantidadGastos,
            SUM(gv.MontoEnMonedaLocal) AS TotalGasto,
            AVG(gv.MontoEnMonedaLocal) AS PromedioGasto,
            COUNT(DISTINCT CAST(gv.FechaGasto AS DATE)) AS DiasConGastos,
            COUNT(DISTINCT gv.CategoriaViajeId) AS CategoriasUtilizadas
        FROM GastosViaje gv
        WHERE gv.PlanId = @PlanId
        GROUP BY DATEPART(WEEK, gv.FechaGasto), YEAR(gv.FechaGasto)
        ORDER BY YEAR(gv.FechaGasto), DATEPART(WEEK, gv.FechaGasto);
    END
    ELSE IF @TipoAnalisis = 'PorDiaViaje'
    BEGIN
        -- Análisis por día del viaje (Día 1, Día 2, etc.)
        SELECT 
            DATEDIFF(DAY, @FechaInicio, CAST(gv.FechaGasto AS DATE)) + 1 AS DiaDelViaje,
            CAST(gv.FechaGasto AS DATE) AS Fecha,
            DATENAME(WEEKDAY, gv.FechaGasto) AS DiaSemana,
            COUNT(*) AS CantidadGastos,
            SUM(gv.MontoEnMonedaLocal) AS TotalGasto,
            AVG(gv.MontoEnMonedaLocal) AS PromedioGasto,
            COUNT(DISTINCT gv.CategoriaViajeId) AS CategoriasUtilizadas,
            -- Gastos acumulados hasta ese día
            SUM(SUM(gv.MontoEnMonedaLocal)) OVER (ORDER BY CAST(gv.FechaGasto AS DATE) ROWS UNBOUNDED PRECEDING) AS GastoAcumulado
        FROM GastosViaje gv
        WHERE gv.PlanId = @PlanId
        GROUP BY CAST(gv.FechaGasto AS DATE)
        ORDER BY CAST(gv.FechaGasto AS DATE);
    END
END;
GO

-- =============================================
-- SP: GastosViaje_GetGastosPorActividad
-- Descripción: Análisis de gastos asociados a actividades específicas
-- =============================================
CREATE PROCEDURE GastosViaje_GetGastosPorActividad
    @PlanId UNIQUEIDENTIFIER,
    @IncluirSinActividad BIT = 1 -- Incluir gastos no asociados a actividades
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    -- Verificar que el plan existe
    SELECT @UsuarioId = UsuarioId
    FROM PlanesVacaciones 
    WHERE PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    -- Gastos por actividad
    SELECT 
        ISNULL(av.ActividadId, CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER)) AS ActividadId,
        ISNULL(av.NombreActividad, 'Sin actividad asociada') AS NombreActividad,
        av.FechaActividad,
        av.CostoEstimado,
        av.CostoReal AS CostoRealActividad,
        av.EstadoActividad,
        COUNT(gv.GastoViajeId) AS CantidadGastos,
        ISNULL(SUM(gv.MontoEnMonedaLocal), 0) AS TotalGastado,
        ISNULL(AVG(gv.MontoEnMonedaLocal), 0) AS PromedioGasto,
        -- Comparación con costo estimado de la actividad
        CASE 
            WHEN av.CostoEstimado > 0 THEN
                ROUND((ISNULL(SUM(gv.MontoEnMonedaLocal), 0) * 100.0) / av.CostoEstimado, 2)
            ELSE NULL 
        END AS PorcentajeCostoEstimado,
        CASE 
            WHEN av.CostoEstimado > 0 THEN
                av.CostoEstimado - ISNULL(SUM(gv.MontoEnMonedaLocal), 0)
            ELSE NULL 
        END AS DiferenciaCostoEstimado,
        -- Categorías de gastos más frecuentes para esta actividad
        (SELECT TOP 1 cgv2.NombreCategoria 
         FROM GastosViaje gv2
         INNER JOIN CategoriasGastosViaje cgv2 ON gv2.CategoriaViajeId = cgv2.CategoriaViajeId
         WHERE gv2.PlanId = @PlanId AND gv2.ActividadId = av.ActividadId
         GROUP BY cgv2.CategoriaViajeId, cgv2.NombreCategoria
         ORDER BY COUNT(*) DESC) AS CategoriaFrecuente
    FROM ActividadesViaje av
    LEFT JOIN GastosViaje gv ON av.ActividadId = gv.ActividadId
    WHERE av.PlanId = @PlanId
      AND av.EstadoActividad != 'cancelada'
    GROUP BY 
        av.ActividadId, av.NombreActividad, av.FechaActividad, 
        av.CostoEstimado, av.CostoReal, av.EstadoActividad
    
    UNION ALL
    
    -- Gastos sin actividad asociada (si se incluyen)
    SELECT 
        CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER) AS ActividadId,
        'Sin actividad asociada' AS NombreActividad,
        NULL AS FechaActividad,
        0 AS CostoEstimado,
        0 AS CostoRealActividad,
        'N/A' AS EstadoActividad,
        COUNT(gv.GastoViajeId) AS CantidadGastos,
        SUM(gv.MontoEnMonedaLocal) AS TotalGastado,
        AVG(gv.MontoEnMonedaLocal) AS PromedioGasto,
        NULL AS PorcentajeCostoEstimado,
        NULL AS DiferenciaCostoEstimado,
        (SELECT TOP 1 cgv2.NombreCategoria 
         FROM GastosViaje gv2
         INNER JOIN CategoriasGastosViaje cgv2 ON gv2.CategoriaViajeId = cgv2.CategoriaViajeId
         WHERE gv2.PlanId = @PlanId AND gv2.ActividadId IS NULL
         GROUP BY cgv2.CategoriaViajeId, cgv2.NombreCategoria
         ORDER BY COUNT(*) DESC) AS CategoriaFrecuente
    FROM GastosViaje gv
    WHERE gv.PlanId = @PlanId 
      AND gv.ActividadId IS NULL
      AND @IncluirSinActividad = 1
    
    ORDER BY TotalGastado DESC, NombreActividad;
END;
GO

-- =============================================
-- SP: GastosViaje_GetConversionMonedas
-- Descripción: Análisis de gastos por moneda utilizada
-- =============================================
CREATE PROCEDURE GastosViaje_GetConversionMonedas
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @MonedaUsuario NVARCHAR(3);
    
    -- Verificar que el plan existe y obtener moneda del usuario
    SELECT @UsuarioId = pv.UsuarioId, @MonedaUsuario = u.Moneda
    FROM PlanesVacaciones pv
    INNER JOIN Usuarios u ON pv.UsuarioId = u.UsuarioId
    WHERE pv.PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    -- Análisis por moneda
    SELECT 
        gv.MonedaGasto,
        COUNT(*) AS CantidadGastos,
        SUM(gv.Monto) AS TotalEnMonedaOriginal,
        SUM(gv.MontoEnMonedaLocal) AS TotalEnMonedaLocal,
        AVG(gv.TasaCambioUsada) AS TasaCambioPromedio,
        MIN(gv.TasaCambioUsada) AS TasaCambioMinima,
        MAX(gv.TasaCambioUsada) AS TasaCambioMaxima,
        AVG(gv.Monto) AS PromedioGastoOriginal,
        AVG(gv.MontoEnMonedaLocal) AS PromedioGastoLocal,
        MIN(gv.FechaGasto) AS PrimerUso,
        MAX(gv.FechaGasto) AS UltimoUso,
        -- Participación en el total
        ROUND(
            (SUM(gv.MontoEnMonedaLocal) * 100.0) / 
            (SELECT SUM(MontoEnMonedaLocal) FROM GastosViaje WHERE PlanId = @PlanId), 2
        ) AS PorcentajeDelTotal
    FROM GastosViaje gv
    WHERE gv.PlanId = @PlanId
    GROUP BY gv.MonedaGasto
    ORDER BY SUM(gv.MontoEnMonedaLocal) DESC;
    
    -- Resumen de conversiones
    SELECT 
        @MonedaUsuario AS MonedaUsuario,
        COUNT(DISTINCT gv.MonedaGasto) AS TotalMonedasUtilizadas,
        SUM(CASE WHEN gv.MonedaGasto = @MonedaUsuario THEN gv.MontoEnMonedaLocal ELSE 0 END) AS GastosEnMonedaLocal,
        SUM(CASE WHEN gv.MonedaGasto != @MonedaUsuario THEN gv.MontoEnMonedaLocal ELSE 0 END) AS GastosConversion,
        ROUND(
            CASE 
                WHEN SUM(gv.MontoEnMonedaLocal) > 0 THEN
                    (SUM(CASE WHEN gv.MonedaGasto != @MonedaUsuario THEN gv.MontoEnMonedaLocal ELSE 0 END) * 100.0) / 
                    SUM(gv.MontoEnMonedaLocal)
                ELSE 0 
            END, 2
        ) AS PorcentajeConversiones
    FROM GastosViaje gv
    WHERE gv.PlanId = @PlanId;
END;
GO

-- =============================================
-- SP: GastosViaje_ActualizarCostosActividades
-- Descripción: Actualiza los costos reales de las actividades basándose en los gastos registrados
-- =============================================
CREATE PROCEDURE GastosViaje_ActualizarCostosActividades
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @RegistrosActualizados INT = 0;
    
    BEGIN TRY
        -- Verificar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Actualizar costos reales de actividades basándose en gastos asociados
        UPDATE av 
        SET 
            CostoReal = ISNULL(gastos.TotalGasto, 0),
            FechaActualizacion = GETUTCDATE()
        FROM ActividadesViaje av
        LEFT JOIN (
            SELECT 
                gv.ActividadId,
                SUM(gv.MontoEnMonedaLocal) AS TotalGasto
            FROM GastosViaje gv
            WHERE gv.PlanId = @PlanId AND gv.ActividadId IS NOT NULL
            GROUP BY gv.ActividadId
        ) gastos ON av.ActividadId = gastos.ActividadId
        WHERE av.PlanId = @PlanId;
        
        SET @RegistrosActualizados = @@ROWCOUNT;
        
        -- Retornar resultado de la actualización
        SELECT 
            @RegistrosActualizados AS ActividadesActualizadas,
            'Costos reales de actividades actualizados exitosamente' AS Resultado;
        
        -- Mostrar resumen de actividades con diferencias significativas
        SELECT 
            av.ActividadId,
            av.NombreActividad,
            av.CostoEstimado,
            av.CostoReal,
            (av.CostoReal - av.CostoEstimado) AS Diferencia,
            CASE 
                WHEN av.CostoEstimado > 0 THEN
                    ROUND(((av.CostoReal - av.CostoEstimado) * 100.0) / av.CostoEstimado, 2)
                ELSE NULL 
            END AS PorcentajeDiferencia,
            CASE 
                WHEN av.CostoReal > av.CostoEstimado THEN 'Excedió'
                WHEN av.CostoReal < av.CostoEstimado THEN 'Por debajo'
                ELSE 'Exacto'
            END AS EstadoPresupuesto
        FROM ActividadesViaje av
        WHERE av.PlanId = @PlanId 
          AND av.EstadoActividad != 'cancelada'
          AND (av.CostoEstimado != av.CostoReal OR av.CostoReal > 0)
        ORDER BY ABS(av.CostoReal - av.CostoEstimado) DESC;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados básicos para tabla GASTOSVIAJE creados exitosamente';
PRINT 'SPs creados: GastosViaje_Insert, GastosViaje_Update, GastosViaje_Delete, GastosViaje_Select, GastosViaje_SelectByPlan, GastosViaje_GetAnalisisPorCategoria, GastosViaje_GetAnalisisTemporal, GastosViaje_GetGastosPorActividad, GastosViaje_GetConversionMonedas, GastosViaje_ActualizarCostosActividades';