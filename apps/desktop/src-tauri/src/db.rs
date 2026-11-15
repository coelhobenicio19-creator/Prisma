use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tauri::AppHandle;
use tracing::{info, error};

use crate::error::{AppError, AppResult};

pub async fn init_db(app: &AppHandle) -> AppResult<SqlitePool> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    std::fs::create_dir_all(&app_dir).map_err(|e| AppError::Io(e))?;
    
    let db_path = app_dir.join("prisma.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    info!("Conectando ao banco: {}", db_url);
    
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .map_err(AppError::Database)?;
    
    // Habilitar WAL mode para melhor concorrência
    sqlx::query("PRAGMA journal_mode = WAL;")
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    
    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    
    sqlx::query("PRAGMA synchronous = NORMAL;")
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    
    info!("Banco de dados inicializado com sucesso");
    
    Ok(pool)
}

pub async fn get_pool(app: &AppHandle) -> AppResult<SqlitePool> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("prisma.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .map_err(AppError::Database)?;
    
    Ok(pool)
}