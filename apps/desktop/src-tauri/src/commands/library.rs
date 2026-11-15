use crate::db::get_pool;
use crate::error::{AppError, AppResult};
use crate::models::{Document, OcrStatus, ExtractionStatus, Source, SourceType, SourceVersion, VerificationStatus};
use sqlx::SqlitePool;
use tauri::AppHandle;
use uuid::Uuid;
use chrono::Utc;
use std::path::Path;
use sha2::{Sha256, Digest};
use walkdir::WalkDir;

#[tauri::command]
pub async fn import_file(
    app: AppHandle,
    profile_id: Uuid,
    file_path: String,
) -> AppResult<Document> {
    let pool = get_pool(&app).await?;
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err(AppError::InvalidFile("Arquivo não encontrado".to_string()));
    }
    
    // Calcular hash SHA-256
    let content = std::fs::read(path).map_err(AppError::Io)?;
    let hash = format!("{:x}", Sha256::digest(&content));
    let file_size = content.len() as i64;
    
    // Verificar duplicata por hash
    let existing = sqlx::query!(
        "SELECT id FROM document WHERE content_hash = ? AND deleted_at IS NULL",
        hash
    )
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;
    
    if let Some(existing) = existing {
        return Err(AppError::Conflict(format!("Documento já importado (ID: {})", existing.id)));
    }
    
    // Determinar mime type
    let mime_type = mime_guess::from_path(path)
        .first_or_octet_stream()
        .to_string();
    
    // Criar source (user_file)
    let source_id = Uuid::now_v7();
    let now = Utc::now();
    
    sqlx::query!(
        r#"
        INSERT INTO source (id, type, title, access_date, credibility_score, verification_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        source_id,
        SourceType::UserFile as i32,
        path.file_name().and_then(|s| s.to_str()).unwrap_or("documento"),
        now.date_naive(),
        0.5,
        VerificationStatus::Unverified as i32,
        now,
        now,
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    // Criar source_version
    let version_id = Uuid::now_v7();
    sqlx::query!(
        r#"
        INSERT INTO source_version (id, source_id, version_number, content_hash, file_path, file_size, mime_type, created_at)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?)
        "#,
        version_id,
        source_id,
        hash,
        file_path,
        file_size,
        mime_type,
        now,
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    // Determinar page_count para PDFs (simplificado)
    let page_count = if mime_type == "application/pdf" {
        // TODO: Usar pdfium ou similar para contar páginas reais
        Some(1)
    } else {
        None
    };
    
    // Criar document
    let doc_id = Uuid::now_v7();
    let title = path.file_stem().and_then(|s| s.to_str()).unwrap_or("documento").to_string();
    
    sqlx::query!(
        r#"
        INSERT INTO document (id, source_version_id, title, content_hash, file_path, file_size, mime_type, page_count, language, ocr_status, extraction_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pt-BR', ?, ?, ?, ?)
        "#,
        doc_id,
        version_id,
        title,
        hash,
        file_path,
        file_size,
        mime_type,
        page_count,
        if mime_type == "application/pdf" { OcrStatus::Pending as i32 } else { OcrStatus::NotNeeded as i32 },
        if mime_type.starts_with("text/") || mime_type == "application/pdf" { ExtractionStatus::Pending as i32 } else { ExtractionStatus::Failed as i32 },
        now,
        now,
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    // Inserir no FTS5 (será feito via trigger, mas podemos forçar)
    // O trigger cuidará disso automaticamente
    
    tracing::info!("Documento importado: {} ({})", title, hash);
    
    // Retornar documento criado
    get_document(app, doc_id).await?.ok_or_else(|| AppError::Internal("Falha ao recuperar documento criado".to_string()))
}

#[tauri::command]
pub async fn list_documents(app: AppHandle, profile_id: Uuid) -> AppResult<Vec<Document>> {
    let pool = get_pool(&app).await?;
    
    let docs = sqlx::query_as!(
        Document,
        r#"
        SELECT d.id, d.source_version_id, d.title, d.content_hash, d.file_path, d.file_size, d.mime_type, d.page_count, d.language, d.ocr_status as "ocr_status: OcrStatus", d.extraction_status as "extraction_status: ExtractionStatus", d.created_at, d.updated_at
        FROM document d
        JOIN source_version sv ON d.source_version_id = sv.id
        JOIN source s ON sv.source_id = s.id
        WHERE d.deleted_at IS NULL
        ORDER BY d.created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    Ok(docs)
}

#[tauri::command]
pub async fn get_document(app: AppHandle, id: Uuid) -> AppResult<Option<Document>> {
    let pool = get_pool(&app).await?;
    
    let doc = sqlx::query_as!(
        Document,
        r#"
        SELECT id, source_version_id, title, content_hash, file_path, file_size, mime_type, page_count, language, ocr_status as "ocr_status: OcrStatus", extraction_status as "extraction_status: ExtractionStatus", created_at, updated_at
        FROM document
        WHERE id = ? AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;
    
    Ok(doc)
}

#[tauri::command]
pub async fn delete_document(app: AppHandle, id: Uuid) -> AppResult<()> {
    let pool = get_pool(&app).await?;
    
    sqlx::query!(
        "UPDATE document SET deleted_at = ?, updated_at = ? WHERE id = ?",
        Utc::now(),
        Utc::now(),
        id
    )
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;
    
    tracing::info!("Documento deletado (soft): {}", id);
    Ok(())
}

#[tauri::command]
pub async fn open_document(app: AppHandle, id: Uuid) -> AppResult<String> {
    let pool = get_pool(&app).await?;
    
    let doc = sqlx::query!(
        "SELECT file_path FROM document WHERE id = ? AND deleted_at IS NULL",
        id
    )
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Documento não encontrado".to_string()))?;
    
    // Abrir com aplicativo padrão do Windows
    std::process::Command::new("cmd")
        .args(["/C", "start", "", &doc.file_path])
        .spawn()
        .map_err(|e| AppError::Internal(format!("Falha ao abrir arquivo: {}", e)))?;
    
    Ok(doc.file_path)
}