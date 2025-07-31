-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla CONTRIBUCIONES METAS
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: ContribucionesMetas_Insert
-- Descripci�n: Registra una contribuci�n a una meta financiera
-- =============================================
CREATE PROCEDURE ContribucionesMetas_Insert
    @MetaId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2),
    @FechaContribucion DATETIME2 = NULL,
    @Notas NVARCHAR(500) = NULL,
    @TransaccionId UNIQUEIDENTIFIER = NULL,
    @ActualizarMetaAutomaticamente BIT = 1 -- Si actualizar el MontoActual de la meta
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ContribucionId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @MontoActualMeta DECIMAL(18,2);
    DECLARE @MontoObjetivoMeta DECIMAL(18,2);
    DECLARE @EstaCompletada BIT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Establecer fecha por defecto si no se proporciona
        IF @FechaContribucion IS NULL
            SET @FechaContribucion = GETUTCDATE();
        
        -- Validar que la meta existe y obtener informaci�n
        SELECT @UsuarioId = UsuarioId, @MontoActualMeta = MontoActual, 
               @MontoObjetivoMeta = MontoObjetivo, @EstaCompletada = EstaCompletada
        FROM MetasFinancieras 
        WHERE MetaId = @MetaId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La meta financiera no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar que la meta no est� completada
        IF @EstaCompletada = 1
        BEGIN
            RAISERROR('No se pueden agregar contribuciones a una meta ya completada.', 16, 1);
            RETURN;
        END
        
        -- Validar monto
        IF @Monto <= 0
        BEGIN
            RAISERROR('El monto de la contribuci�n debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar transacci�n si se especifica
        IF @TransaccionId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Transacciones 
                WHERE TransaccionId = @TransaccionId 
                  AND UsuarioId = @UsuarioId
            )
            BEGIN
                RAISERROR('La transacci�n no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
            
            -- Verificar que la transacci�n no est� ya vinculada a otra contribuci�n
            IF EXISTS (
                SELECT 1 FROM ContribucionesMetas 
                WHERE TransaccionId = @TransaccionId
            )
            BEGIN
                RAISERROR('La transacci�n ya est� vinculada a otra contribuci�n.', 16, 1);
                RETURN;
            END
        END
        
        -- Insertar contribuci�n
        INSERT INTO ContribucionesMetas (
            ContribucionId, MetaId, TransaccionId, Monto, 
            FechaContribucion, Notas, FechaCreacion
        )
        VALUES (
            @ContribucionId, @MetaId, @TransaccionId, @Monto,
            @FechaContribucion, @Notas, GETUTCDATE()
        );
        
        -- Actualizar la meta autom�ticamente si se solicita
        IF @ActualizarMetaAutomaticamente = 1
        BEGIN
            DECLARE @NuevoMontoActual DECIMAL(18,2) = @MontoActualMeta + @Monto;
            DECLARE @NuevaCompletada BIT = CASE WHEN @NuevoMontoActual >= @MontoObjetivoMeta THEN 1 ELSE 0 END;
            
            UPDATE MetasFinancieras 
            SET 
                MontoActual = @NuevoMontoActual,
                EstaCompletada = @NuevaCompletada,
                FechaComplecion = CASE WHEN @NuevaCompletada = 1 AND @EstaCompletada = 0 THEN GETUTCDATE() ELSE FechaComplecion END,
                FechaActualizacion = GETUTCDATE()
            WHERE MetaId = @MetaId;
        END
        
        COMMIT TRANSACTION;
        
        -- Retornar la contribuci�n creada con informaci�n adicional
        SELECT 
            cm.ContribucionId, cm.MetaId, mf.NombreMeta, mf.TipoMeta,
            cm.TransaccionId, cm.Monto, cm.FechaContribucion, cm.Notas, cm.FechaCreacion,
            -- Informaci�n de la meta actualizada
            mf.MontoActual, mf.MontoObjetivo, 
            (mf.MontoObjetivo - mf.MontoActual) as MontoFaltante,
            CASE 
                WHEN mf.MontoObjetivo > 0 
                THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeCompletado,
            mf.EstaCompletada, mf.FechaComplecion
        FROM ContribucionesMetas cm
        INNER JOIN MetasFinancieras mf ON cm.MetaId = mf.MetaId
        WHERE cm.ContribucionId = @ContribucionId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ContribucionesMetas_Update
-- Descripci�n: Actualiza una contribuci�n existente
-- =============================================
CREATE PROCEDURE ContribucionesMetas_Update
    @ContribucionId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2) = NULL,
    @FechaContribucion DATETIME2 = NULL,
    @Notas NVARCHAR(500) = NULL,
    @ActualizarMetaAutomaticamente BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @MetaId UNIQUEIDENTIFIER;
    DECLARE @MontoAnterior DECIMAL(18,2);
    DECLARE @EstaCompletada BIT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la contribuci�n existe y obtener datos
        SELECT @MetaId = MetaId, @MontoAnterior = Monto
        FROM ContribucionesMetas 
        WHERE ContribucionId = @ContribucionId;
        
        IF @MetaId IS NULL
        BEGIN
            RAISERROR('La contribuci�n no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar que la meta no est� completada
        SELECT @EstaCompletada = EstaCompletada 
        FROM MetasFinancieras 
        WHERE MetaId = @MetaId;
        
        IF @EstaCompletada = 1 AND @Monto IS NOT NULL AND @Monto != @MontoAnterior
        BEGIN
            RAISERROR('No se puede modificar el monto de una contribuci�n en una meta completada.', 16, 1);
            RETURN;
        END
        
        -- Validar monto si se est� actualizando
        IF @Monto IS NOT NULL AND @Monto <= 0
        BEGIN
            RAISERROR('El monto de la contribuci�n debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE ContribucionesMetas 
        SET 
            Monto = ISNULL(@Monto, Monto),
            FechaContribucion = ISNULL(@FechaContribucion, FechaContribucion),
            Notas = ISNULL(@Notas, Notas)
        WHERE ContribucionId = @ContribucionId;
        
        -- Actualizar la meta autom�ticamente si se cambi� el monto
        IF @ActualizarMetaAutomaticamente = 1 AND @Monto IS NOT NULL AND @Monto != @MontoAnterior
        BEGIN
            DECLARE @DiferenciaMonto DECIMAL(18,2) = @Monto - @MontoAnterior;
            DECLARE @MontoActualMeta DECIMAL(18,2);
            DECLARE @MontoObjetivoMeta DECIMAL(18,2);
            
            SELECT @MontoActualMeta = MontoActual, @MontoObjetivoMeta = MontoObjetivo
            FROM MetasFinancieras 
            WHERE MetaId = @MetaId;
            
            DECLARE @NuevoMontoActual DECIMAL(18,2) = @MontoActualMeta + @DiferenciaMonto;
            DECLARE @NuevaCompletada BIT = CASE WHEN @NuevoMontoActual >= @MontoObjetivoMeta THEN 1 ELSE 0 END;
            
            UPDATE MetasFinancieras 
            SET 
                MontoActual = @NuevoMontoActual,
                EstaCompletada = @NuevaCompletada,
                FechaComplecion = CASE 
                    WHEN @NuevaCompletada = 1 AND @EstaCompletada = 0 THEN GETUTCDATE() 
                    WHEN @NuevaCompletada = 0 THEN NULL
                    ELSE FechaComplecion 
                END,
                FechaActualizacion = GETUTCDATE()
            WHERE MetaId = @MetaId;
        END
        
        COMMIT TRANSACTION;
        
        -- Retornar la contribuci�n actualizada
        SELECT 
            cm.ContribucionId, cm.MetaId, mf.NombreMeta, mf.TipoMeta,
            cm.TransaccionId, cm.Monto, cm.FechaContribucion, cm.Notas, cm.FechaCreacion,
            -- Informaci�n de la meta actualizada
            mf.MontoActual, mf.MontoObjetivo, 
            (mf.MontoObjetivo - mf.MontoActual) as MontoFaltante,
            CASE 
                WHEN mf.MontoObjetivo > 0 
                THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeCompletado,
            mf.EstaCompletada, mf.FechaComplecion
        FROM ContribucionesMetas cm
        INNER JOIN MetasFinancieras mf ON cm.MetaId = mf.MetaId
        WHERE cm.ContribucionId = @ContribucionId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ContribucionesMetas_Delete
-- Descripci�n: Elimina una contribuci�n y actualiza la meta
-- =============================================
CREATE PROCEDURE ContribucionesMetas_Delete
    @ContribucionId UNIQUEIDENTIFIER,
    @ActualizarMetaAutomaticamente BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @MetaId UNIQUEIDENTIFIER;
    DECLARE @Monto DECIMAL(18,2);
    DECLARE @EstaCompletada BIT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la contribuci�n existe y obtener datos
        SELECT @MetaId = MetaId, @Monto = Monto
        FROM ContribucionesMetas 
        WHERE ContribucionId = @ContribucionId;
        
        IF @MetaId IS NULL
        BEGIN
            RAISERROR('La contribuci�n no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar que la meta no est� completada si se va a actualizar
        SELECT @EstaCompletada = EstaCompletada 
        FROM MetasFinancieras 
        WHERE MetaId = @MetaId;
        
        IF @EstaCompletada = 1 AND @ActualizarMetaAutomaticamente = 1
        BEGIN
            RAISERROR('No se puede eliminar una contribuci�n de una meta completada.', 16, 1);
            RETURN;
        END
        
        -- Eliminar contribuci�n
        DELETE FROM ContribucionesMetas WHERE ContribucionId = @ContribucionId;
        
        -- Actualizar la meta autom�ticamente si se solicita
        IF @ActualizarMetaAutomaticamente = 1
        BEGIN
            DECLARE @MontoActualMeta DECIMAL(18,2);
            DECLARE @MontoObjetivoMeta DECIMAL(18,2);
            
            SELECT @MontoActualMeta = MontoActual, @MontoObjetivoMeta = MontoObjetivo
            FROM MetasFinancieras 
            WHERE MetaId = @MetaId;
            
            DECLARE @NuevoMontoActual DECIMAL(18,2) = @MontoActualMeta - @Monto;
            DECLARE @NuevaCompletada BIT = CASE WHEN @NuevoMontoActual >= @MontoObjetivoMeta THEN 1 ELSE 0 END;
            
            UPDATE MetasFinancieras 
            SET 
                MontoActual = @NuevoMontoActual,
                EstaCompletada = @NuevaCompletada,
                FechaComplecion = CASE WHEN @NuevaCompletada = 0 THEN NULL ELSE FechaComplecion END,
                FechaActualizacion = GETUTCDATE()
            WHERE MetaId = @MetaId;
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'Contribuci�n eliminada exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ContribucionesMetas_Select
-- Descripci�n: Obtiene una contribuci�n por ID
-- =============================================
CREATE PROCEDURE ContribucionesMetas_Select
    @ContribucionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cm.ContribucionId, cm.MetaId, mf.NombreMeta, mf.TipoMeta, mf.MontoObjetivo,
        cm.TransaccionId, t.Descripcion as DescripcionTransaccion, t.TipoTransaccion,
        cm.Monto, cm.FechaContribucion, cm.Notas, cm.FechaCreacion,
        -- Informaci�n adicional de la meta
        mf.MontoActual, mf.EstaCompletada, mf.FechaObjetivo,
        CASE 
            WHEN mf.MontoObjetivo > 0 
            THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeCompletadoMeta,
        -- Porcentaje que representa esta contribuci�n del total de la meta
        CASE 
            WHEN mf.MontoObjetivo > 0 
            THEN CAST((cm.Monto * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeContribucionDelTotal
    FROM ContribucionesMetas cm
    INNER JOIN MetasFinancieras mf ON cm.MetaId = mf.MetaId
    LEFT JOIN Transacciones t ON cm.TransaccionId = t.TransaccionId
    WHERE cm.ContribucionId = @ContribucionId;
END;
GO

-- =============================================
-- SP: ContribucionesMetas_SelectByMeta
-- Descripci�n: Obtiene todas las contribuciones de una meta
-- =============================================
CREATE PROCEDURE ContribucionesMetas_SelectByMeta
    @MetaId UNIQUEIDENTIFIER,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @OrdenarPor NVARCHAR(20) = 'fecha_desc' -- 'fecha_desc', 'fecha_asc', 'monto_desc', 'monto_asc'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cm.ContribucionId, cm.MetaId, cm.TransaccionId, 
        t.Descripcion as DescripcionTransaccion, t.TipoTransaccion,
        cm.Monto, cm.FechaContribucion, cm.Notas, cm.FechaCreacion,
        -- Porcentaje que representa esta contribuci�n del total de la meta
        CASE 
            WHEN mf.MontoObjetivo > 0 
            THEN CAST((cm.Monto * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeContribucionDelTotal,
        -- Informaci�n contextual
        ROW_NUMBER() OVER (ORDER BY cm.FechaContribucion ASC) as NumeroContribucion,
        SUM(cm.Monto) OVER (ORDER BY cm.FechaContribucion ASC ROWS UNBOUNDED PRECEDING) as MontoAcumulado
    FROM ContribucionesMetas cm
    INNER JOIN MetasFinancieras mf ON cm.MetaId = mf.MetaId
    LEFT JOIN Transacciones t ON cm.TransaccionId = t.TransaccionId
    WHERE cm.MetaId = @MetaId
      AND (@FechaInicio IS NULL OR CAST(cm.FechaContribucion AS DATE) >= @FechaInicio)
      AND (@FechaFin IS NULL OR CAST(cm.FechaContribucion AS DATE) <= @FechaFin)
    ORDER BY 
        CASE @OrdenarPor
            WHEN 'fecha_desc' THEN cm.FechaContribucion
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'fecha_asc' THEN cm.FechaContribucion
            ELSE NULL
        END ASC,
        CASE @OrdenarPor
            WHEN 'monto_desc' THEN cm.Monto
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'monto_asc' THEN cm.Monto
            ELSE NULL
        END ASC;
END;
GO

-- =============================================
-- SP: ContribucionesMetas_RecalcularMeta
-- Descripci�n: Recalcula el monto actual de una meta basado en sus contribuciones
-- =============================================
CREATE PROCEDURE ContribucionesMetas_RecalcularMeta
    @MetaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @MontoCalculado DECIMAL(18,2);
    DECLARE @MontoObjetivo DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que la meta existe
        SELECT @MontoObjetivo = MontoObjetivo
        FROM MetasFinancieras 
        WHERE MetaId = @MetaId;
        
        IF @MontoObjetivo IS NULL
        BEGIN
            RAISERROR('La meta financiera no existe.', 16, 1);
            RETURN;
        END
        
        -- Calcular monto total de contribuciones
        SELECT @MontoCalculado = COALESCE(SUM(Monto), 0)
        FROM ContribucionesMetas 
        WHERE MetaId = @MetaId;
        
        -- Determinar si la meta est� completada
        DECLARE @NuevaCompletada BIT = CASE WHEN @MontoCalculado >= @MontoObjetivo THEN 1 ELSE 0 END;
        
        -- Actualizar la meta
        UPDATE MetasFinancieras 
        SET 
            MontoActual = @MontoCalculado,
            EstaCompletada = @NuevaCompletada,
            FechaComplecion = CASE 
                WHEN @NuevaCompletada = 1 AND EstaCompletada = 0 THEN GETUTCDATE()
                WHEN @NuevaCompletada = 0 THEN NULL
                ELSE FechaComplecion 
            END,
            FechaActualizacion = GETUTCDATE()
        WHERE MetaId = @MetaId;
        
        -- Retornar resumen del rec�lculo
        SELECT 
            @MetaId as MetaId,
            @MontoCalculado as MontoRecalculado,
            @MontoObjetivo as MontoObjetivo,
            (@MontoObjetivo - @MontoCalculado) as MontoFaltante,
            CASE 
                WHEN @MontoObjetivo > 0 
                THEN CAST((@MontoCalculado * 100.0 / @MontoObjetivo) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeCompletado,
            @NuevaCompletada as EstaCompletada,
            (SELECT COUNT(*) FROM ContribucionesMetas WHERE MetaId = @MetaId) as TotalContribuciones,
            'Meta recalculada exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ContribucionesMetas_Estadisticas
-- Descripci�n: Obtiene estad�sticas de contribuciones para una meta
-- =============================================
CREATE PROCEDURE ContribucionesMetas_Estadisticas
    @MetaId UNIQUEIDENTIFIER,
    @PeriodoDias INT = 30 -- Per�odo para calcular tendencias (�ltimos N d�as)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estad�sticas b�sicas
    SELECT 
        cm.MetaId,
        mf.NombreMeta,
        mf.MontoObjetivo,
        mf.MontoActual,
        COUNT(*) as TotalContribuciones,
        MIN(cm.Monto) as ContribucionMinima,
        MAX(cm.Monto) as ContribucionMaxima,
        AVG(cm.Monto) as ContribucionPromedio,
        SUM(cm.Monto) as TotalContribuido,
        MIN(cm.FechaContribucion) as PrimeraContribucion,
        MAX(cm.FechaContribucion) as UltimaContribucion,
        DATEDIFF(DAY, MIN(cm.FechaContribucion), MAX(cm.FechaContribucion)) + 1 as DiasConContribuciones,
        -- Estad�sticas del per�odo reciente
        (SELECT COUNT(*) 
         FROM ContribucionesMetas cm2 
         WHERE cm2.MetaId = @MetaId 
           AND cm2.FechaContribucion >= DATEADD(DAY, -@PeriodoDias, GETDATE())
        ) as ContribucionesUltimosPeriodo,
        (SELECT COALESCE(SUM(Monto), 0) 
         FROM ContribucionesMetas cm2 
         WHERE cm2.MetaId = @MetaId 
           AND cm2.FechaContribucion >= DATEADD(DAY, -@PeriodoDias, GETDATE())
        ) as MontoUltimosPeriodo
    FROM ContribucionesMetas cm
    INNER JOIN MetasFinancieras mf ON cm.MetaId = mf.MetaId
    WHERE cm.MetaId = @MetaId
    GROUP BY cm.MetaId, mf.NombreMeta, mf.MontoObjetivo, mf.MontoActual;
    
    -- Distribuci�n mensual de contribuciones
    SELECT 
        YEAR(FechaContribucion) as A�o,
        MONTH(FechaContribucion) as Mes,
        DATENAME(MONTH, FechaContribucion) as NombreMes,
        COUNT(*) as ContribucionesDelMes,
        SUM(Monto) as MontoDelMes,
        AVG(Monto) as PromedioDelMes
    FROM ContribucionesMetas
    WHERE MetaId = @MetaId
    GROUP BY YEAR(FechaContribucion), MONTH(FechaContribucion), DATENAME(MONTH, FechaContribucion)
    ORDER BY YEAR(FechaContribucion), MONTH(FechaContribucion);
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla CONTRIBUCIONES METAS creados exitosamente';
PRINT 'SPs creados: ContribucionesMetas_Insert, ContribucionesMetas_Update, ContribucionesMetas_Delete, ContribucionesMetas_Select, ContribucionesMetas_SelectByMeta, ContribucionesMetas_RecalcularMeta, ContribucionesMetas_Estadisticas';