use crate::db::get_pool;
use crate::error::{AppError, AppResult};
use crate::models::{BackupType, BackupStatus, UserSetting};
use sqlx::SqlitePool;
use tauri::AppHandle;
use uuid::Uuid;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingsData {
    pub theme: String,
    pub language: String,
    pub telemetry_enabled: bool,
    pub telemetry_categories: TelemetryCategories,
    pub ai_api_key_configured: bool,
    pub auto_backup: bool,
    pub backup_interval_hours: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryCategories {
    pub usage: bool,
    pub performance: bool,
    pub errors: bool,
    pub ai_usage: bool,
}

impl Default for SettingsData {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "pt-BR".to_string(),
            telemetry_enabled: false,
            telemetry_categories: TelemetryCategories {
                usage: false,
                performance: false,
                errors: false,
                ai_usage: false,
            },
            ai_api_key_configured: false,
            auto_backup: true,
            backup_interval_hours: 24,
        }
    }
}

const SETTINGS_KEYS: &[&str] = &[
    "theme", "language", "telemetry_enabled", "telemetry_categories",
    "ai_api_key_configured", "auto_backup", "backup_interval_hours"
];

#[tauri::command]
pub async fn get_settings(app: AppHandle, profile_id: Uuid) -> AppResult<SettingsData> {
    let pool = get_pool(&app).await?;
    
    let mut settings = SettingsData::default();
    
    for key in SETTINGS_KEYS {
        let row = sqlx::query!(
            "SELECT value_json FROM user_setting WHERE profile_id = ? AND key = ?",
            profile_id, key
        )
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;
        
        if let Some(row) = row {
            match key {
                "theme" => settings.theme = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "language" => settings.language = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "telemetry_enabled" => settings.telemetry_enabled = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "telemetry_categories" => settings.telemetry_categories = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "ai_api_key_configured" => settings.ai_api_key_configured = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "auto_backup" => settings.auto_backup = serde_json::from_str(&row.value_json).unwrap_or_default(),
                "backup_interval_hours" => settings.backup_interval_hours = serde_json::from_str(&row.value_json).unwrap_or_default(),
                _ => {}
            }
        }
    }
    
    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(
    app: AppHandle,
    profile_id: Uuid,
    theme: Option<String>,
    language: Option<String>,
    telemetry_enabled: Option<bool>,
    telemetry_categories: Option<TelemetryCategories>,
    ai_api_key_configured: Option<bool>,
    auto_backup: Option<bool>,
    backup_interval_hours: Option<i32>,
) -> AppResult<SettingsData> {
    let pool = get_pool(&app).await?;
    let now = Utc::now();
    
    let updates: Vec<(&str, serde_json::Value)> = vec![
        ("theme", serde_json::to_value(theme).unwrap()),
        ("language", serde_json::to_value(language).unwrap()),
        ("telemetry_enabled", serde_json::to_value(telemetry_enabled).unwrap()),
        ("telemetry_categories", serde_json::to_value(telemetry_categories).unwrap()),
        ("ai_api_key_configured", serde_json::to_value(ai_api_key_configured).unwrap()),
        ("auto_backup", serde_json::to_value(auto_backup).unwrap()),
        ("backup_interval_hours", serde_json::to_value(backup_interval_hours).unwrap()),
    ];
    
    for (key, value) in updates {
        if value.is_null() { continue; }
        
        sqlx::query!(
            r#"
            INSERT INTO user_setting (id, profile_id, key, value_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(profile_id, key) DO UPDATE SET value_json = ?, updated_at = ?
            "#,
            Uuid::now_v7(),
            profile_id,
            key,
            value,
            now,
            now,
            value,
            now,
        )
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    }
    
    get_settings(app, profile_id).await
}

#[tauri::command]
pub async fn export_data(app: AppHandle, profile_id: Uuid) -> AppResult<String> {
    let pool = get_pool(&app).await?;
    
    // Exportar todas as tabelas principais como JSON
    let tables = vec![
        "study_profile", "goal", "institution", "exam", "exam_edition",
        "subject", "topic", "prerequisite_edge", "skill",
        "source", "source_version", "document", "page", "content_chunk",
        "citation", "evidence_link",
        "question", "alternative", "answer_key", "question_topic_mapping", "review_flag",
        "exam_template", "exam_session", "exam_event", "integrity_alert",
        "attempt", "answer", "scoring_event",
        "mastery_evidence", "error_record", "error_cause_hypothesis",
        "review_card", "review_deck", "review_log",
        "study_session", "plan", "plan_item",
        "project", "project_column", "task", "artifact",
        "academic_period", "school_subject", "school_assessment", "attendance_record",
        "lia_conversation", "lia_message", "tool_invocation", "approval",
        "ai_provenance", "data_sharing_consent", "telemetry_consent",
        "backup_record", "audit_event", "user_setting"
    ];
    
    let mut export = serde_json::Map::new();
    export.insert("exported_at".to_string(), serde_json::to_value(Utc::now()).unwrap());
    export.insert("profile_id".to_string(), serde_json::to_value(profile_id).unwrap());
    
    for table in tables {
        let rows = sqlx::query(&format!("SELECT * FROM {} WHERE profile_id = ? OR profile_id IS NULL", table))
            .bind(profile_id)
            .fetch_all(&pool)
            .await
            .map_err(AppError::Database)?;
        
        let json_rows: Vec<serde_json::Value> = rows.iter().map(|row| {
            let mut obj = serde_json::Map::new();
            for (idx, col) in row.columns().iter().enumerate() {
                obj.insert(col.name().to_string(), row.try_get::<serde_json::Value, _>(idx).unwrap_or(serde_json::Value::Null));
            }
            serde_json::Value::Object(obj)
        }).collect();
        
        export.insert(table.to_string(), serde_json::Value::Array(json_rows));
    }
    
    serde_json::to_string_pretty(&export).map_err(AppError::Serialization)
}

#[tauri::command]
pub async fn import_data(app: AppHandle, profile_id: Uuid, json_data: String) -> AppResult<()> {
    let pool = get_pool(&app).await?;
    let data: serde_json::Value = serde_json::from_str(&json_data).map_err(AppError::Serialization)?;
    
    // TODO: Implementar importação com validação e upsert
    // Por enquanto apenas log
    tracing::info!("Importação solicitada para profile: {}", profile_id);
    
    Ok(())
}

#[tauri::command]
pub async fn create_backup(
    app: AppHandle,
    profile_id: Uuid,
    backup_type: BackupType,
) -> AppResult<String> {
    let pool = get_pool(&app).await?;
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_dir = app_dir.join("backups");
    std::fs::create_dir_all(&backup_dir).map_err(AppError::Io)?;
    
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_name = format!("prisma_backup_{}_{}.sql", backup_type as u8, timestamp);
    let backup_path = backup_dir.join(&backup_name);
    
    // Usar sqlite3 .dump via command
    let db_path = app_dir.join("prisma.db");
    let output = std::process::Command::new("sqlite3")
        .arg(&db_path)
        .arg(".dump")
        .output()
        .map_err(|e| AppError::Internal(format!("sqlite3 não encontrado: {}", e)))?;
    
    std::fs::write(&backup_path, output.stdout).map_err(AppError::Io)?;
    
    // Calcular hash
    let content = std::fs::read(&backup_path).map_err(AppError::Io)?;
    let hash = format!("{:x}", sha2::Sha256::digest(&content));
    let file_size = content.len() as i64;
    
    let record_id = Uuid::now_v7();
    sqlx::query!(
        r#"
        INSERT INTO backup_record (id, profile_id, type, file_path, file_size, content_hash, tables_included_json, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        record_id,
        profile_id,
        backup_type as i32,
        backup_path.to_string_lossy().to_string(),
        file_size,
        hash,
        serde_json::json!(["all"]),
        BackupStatus::Completed as i32,
        Utc::now(),
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    tracing::info!("Backup criado: {}", backup_path.display());
    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_backups(app: AppHandle, profile_id: Uuid) -> AppResult<Vec<crate::models::BackupRecord>> {
    let pool = get_pool(&app).await?;
    
    let backups = sqlx::query_as!(
        crate::models::BackupRecord,
        r#"
        SELECT id, profile_id, type as "backup_type: BackupType", file_path, file_size, content_hash, tables_included_json, status as "status: BackupStatus", restore_tested_at, created_at
        FROM backup_record
        WHERE profile_id = ?
        ORDER BY created_at DESC
        "#,
        profile_id
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    Ok(backups)
}