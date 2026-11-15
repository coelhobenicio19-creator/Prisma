use crate::db::get_pool;
use crate::error::{AppError, AppResult};
use crate::models::{GoalType, StudyProfile};
use sqlx::SqlitePool;
use tauri::AppHandle;
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub async fn create_profile(
    app: AppHandle,
    name: String,
    goal_type: GoalType,
    goal_description: Option<String>,
    target_exam_id: Option<Uuid>,
    institution_id: Option<Uuid>,
    timezone: Option<String>,
) -> AppResult<StudyProfile> {
    let pool = get_pool(&app).await?;
    let tz = timezone.unwrap_or_else(|| "America/Sao_Paulo".to_string());
    let now = Utc::now();
    
    let profile = StudyProfile {
        id: Uuid::now_v7(),
        name,
        goal_type,
        goal_description,
        target_exam_id,
        institution_id,
        timezone: tz,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        version: 1,
    };
    
    sqlx::query!(
        r#"
        INSERT INTO study_profile (id, name, goal_type, goal_description, target_exam_id, institution_id, timezone, created_at, updated_at, deleted_at, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1)
        "#,
        profile.id,
        profile.name,
        profile.goal_type as i32,
        profile.goal_description,
        profile.target_exam_id,
        profile.institution_id,
        profile.timezone,
        profile.created_at,
        profile.updated_at,
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    tracing::info!("Perfil criado: {}", profile.id);
    Ok(profile)
}

#[tauri::command]
pub async fn get_profile(app: AppHandle, id: Uuid) -> AppResult<Option<StudyProfile>> {
    let pool = get_pool(&app).await?;
    
    let profile = sqlx::query_as!(
        StudyProfile,
        r#"
        SELECT id, name, goal_type as "goal_type: GoalType", goal_description, target_exam_id, institution_id, timezone, created_at, updated_at, deleted_at, version
        FROM study_profile
        WHERE id = ? AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;
    
    Ok(profile)
}

#[tauri::command]
pub async fn list_profiles(app: AppHandle) -> AppResult<Vec<StudyProfile>> {
    let pool = get_pool(&app).await?;
    
    let profiles = sqlx::query_as!(
        StudyProfile,
        r#"
        SELECT id, name, goal_type as "goal_type: GoalType", goal_description, target_exam_id, institution_id, timezone, created_at, updated_at, deleted_at, version
        FROM study_profile
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    Ok(profiles)
}

#[tauri::command]
pub async fn update_profile(
    app: AppHandle,
    id: Uuid,
    name: Option<String>,
    goal_type: Option<GoalType>,
    goal_description: Option<String>,
    target_exam_id: Option<Uuid>,
    institution_id: Option<Uuid>,
    timezone: Option<String>,
) -> AppResult<StudyProfile> {
    let pool = get_pool(&app).await?;
    
    let mut profile = get_profile(app.clone(), id).await?
        .ok_or_else(|| AppError::NotFound("Perfil não encontrado".to_string()))?;
    
    if let Some(v) = name { profile.name = v; }
    if let Some(v) = goal_type { profile.goal_type = v; }
    if let Some(v) = goal_description { profile.goal_description = Some(v); }
    if let Some(v) = target_exam_id { profile.target_exam_id = Some(v); }
    if let Some(v) = institution_id { profile.institution_id = Some(v); }
    if let Some(v) = timezone { profile.timezone = v; }
    
    profile.updated_at = Utc::now();
    profile.version += 1;
    
    sqlx::query!(
        r#"
        UPDATE study_profile
        SET name = ?, goal_type = ?, goal_description = ?, target_exam_id = ?, institution_id = ?, timezone = ?, updated_at = ?, version = ?
        WHERE id = ? AND deleted_at IS NULL
        "#,
        profile.name,
        profile.goal_type as i32,
        profile.goal_description,
        profile.target_exam_id,
        profile.institution_id,
        profile.timezone,
        profile.updated_at,
        profile.version,
        profile.id,
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    tracing::info!("Perfil atualizado: {}", profile.id);
    Ok(profile)
}

#[tauri::command]
pub async fn delete_profile(app: AppHandle, id: Uuid) -> AppResult<()> {
    let pool = get_pool(&app).await?;
    
    sqlx::query!(
        "UPDATE study_profile SET deleted_at = ?, version = version + 1 WHERE id = ? AND deleted_at IS NULL",
        Utc::now(),
        id
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    tracing::info!("Perfil deletado (soft): {}", id);
    Ok(())
}