use crate::db::get_pool;
use crate::error::{AppError, AppResult};
use sqlx::SqlitePool;
use tauri::AppHandle;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub entity_types: Option<Vec<String>>,
    pub source_types: Option<Vec<String>>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub title: String,
    pub snippet: String,
    pub source_type: Option<String>,
    pub created_at: String,
    pub rank: f64,
}

#[tauri::command]
pub async fn search(app: AppHandle, profile_id: Uuid, params: SearchQuery) -> AppResult<Vec<SearchResult>> {
    let pool = get_pool(&app).await?;
    let limit = params.limit.unwrap_or(50).min(200);
    let offset = params.offset.unwrap_or(0);
    
    // Construir query FTS5
    let mut fts_query = params.query.clone();
    
    // Filtrar por entity_types se especificado
    let entity_filter = params.entity_types.map(|types| {
        types.iter().map(|t| format!("entity_type = '{}'", t)).collect::<Vec<_>>().join(" OR ")
    });
    
    // Filtrar por source_types se especificado
    let source_filter = params.source_types.map(|types| {
        types.iter().map(|t| format!("source_type = '{}'", t)).collect::<Vec<_>>().join(" OR ")
    });
    
    // Filtrar por datas
    let date_filter = match (params.date_from, params.date_to) {
        (Some(from), Some(to)) => Some(format!("created_at BETWEEN '{}' AND '{}'", from, to)),
        (Some(from), None) => Some(format!("created_at >= '{}'", from)),
        (None, Some(to)) => Some(format!("created_at <= '{}'", to)),
        _ => None,
    };
    
    let mut where_clauses = vec!["search_index MATCH ?".to_string()];
    if let Some(f) = entity_filter { where_clauses.push(format!("({})", f)); }
    if let Some(f) = source_filter { where_clauses.push(format!("({})", f)); }
    if let Some(f) = date_filter { where_clauses.push(f); }
    
    let where_clause = where_clauses.join(" AND ");
    
    let sql = format!(
        r#"
        SELECT entity_type, entity_id, title, snippet, source_type, created_at, rank
        FROM (
            SELECT entity_type, entity_id, title, 
                   snippet(search_index, 1, '<mark>', '</mark>', '...', 32) as snippet,
                   source_type, created_at,
                   bm25(search_index) as rank
            FROM search_index
            WHERE {}
            ORDER BY rank ASC
            LIMIT ? OFFSET ?
        )
        "#,
        where_clause
    );
    
    let rows = sqlx::query(&sql)
        .bind(&fts_query)
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;
    
    let results: Vec<SearchResult> = rows.into_iter().map(|row| SearchResult {
        entity_type: row.try_get("entity_type").unwrap_or_default(),
        entity_id: row.try_get("entity_id").unwrap_or_else(|_| Uuid::nil()),
        title: row.try_get("title").unwrap_or_default(),
        snippet: row.try_get("snippet").unwrap_or_default(),
        source_type: row.try_get("source_type").ok(),
        created_at: row.try_get("created_at").unwrap_or_default(),
        rank: row.try_get("rank").unwrap_or(0.0),
    }).collect();
    
    Ok(results)
}

#[tauri::command]
pub async fn reindex(app: AppHandle, profile_id: Uuid) -> AppResult<i64> {
    let pool = get_pool(&app).await?;
    
    // Limpar índice existente
    sqlx::query("DELETE FROM search_index")
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    
    // Reindexar documentos
    let docs = sqlx::query!(
        r#"
        SELECT d.id, d.title, d.content_hash, s.type as source_type, d.created_at
        FROM document d
        JOIN source_version sv ON d.source_version_id = sv.id
        JOIN source s ON sv.source_id = s.id
        WHERE d.deleted_at IS NULL
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let mut count = 0;
    for doc in docs {
        sqlx::query!(
            r#"
            INSERT INTO search_index (entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
            VALUES ('document', ?, ?, '', '', ?, ?, ?)
            "#,
            doc.id,
            doc.title,
            profile_id,
            doc.source_type as i32,
            doc.created_at,
        )
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
        count += 1;
    }
    
    // Reindexar questões
    let questions = sqlx::query!(
        r#"
        SELECT q.id, q.stem, q.origin, q.created_at
        FROM question q
        WHERE q.deleted_at IS NULL
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    for q in questions {
        sqlx::query!(
            r#"
            INSERT INTO search_index (entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
            VALUES ('question', ?, ?, ?, ?, ?, ?, ?)
            "#,
            q.id,
            "", // title vazio para questões
            q.stem,
            q.tags_json.unwrap_or(serde_json::json!([])).to_string(),
            profile_id,
            q.origin as i32,
            q.created_at,
        )
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
        count += 1;
    }
    
    // Reindexar conversas LIA
    let conversations = sqlx::query!(
        r#"
        SELECT lc.id, lc.title, lc.created_at
        FROM lia_conversation lc
        WHERE lc.profile_id = ?
        "#,
        profile_id
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    for conv in conversations {
        sqlx::query!(
            r#"
            INSERT INTO search_index (entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
            VALUES ('conversation', ?, ?, '', '', ?, ?, ?)
            "#,
            conv.id,
            conv.title.unwrap_or_default(),
            profile_id,
            0, // source_type genérico
            conv.created_at,
        )
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
        count += 1;
    }
    
    // Reindexar tarefas
    let tasks = sqlx::query!(
        r#"
        SELECT t.id, t.title, t.description, t.created_at
        FROM task t
        JOIN project p ON t.project_id = p.id
        WHERE p.profile_id = ?
        "#,
        profile_id
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    for task in tasks {
        sqlx::query!(
            r#"
            INSERT INTO search_index (entity_type, entity_id, title, content, tags, profile_id, source_type, created_at)
            VALUES ('task', ?, ?, ?, '', ?, ?, ?)
            "#,
            task.id,
            task.title,
            task.description.unwrap_or_default(),
            profile_id,
            0,
            task.created_at,
        )
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
        count += 1;
    }
    
    tracing::info!("Reindexação concluída: {} itens", count);
    Ok(count)
}