use crate::db::get_pool;
use crate::error::{AppError, AppResult};
use sqlx::SqlitePool;
use tauri::AppHandle;
use uuid::Uuid;
use chrono::{Utc, NaiveDate, Duration};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct DashboardData {
    pub upcoming_commitments: Vec<UpcomingCommitment>,
    pub pending_reviews: PendingReviews,
    pub recent_documents: Vec<RecentDocument>,
    pub study_stats: StudyStats,
    pub error_summary: ErrorSummary,
    pub mastery_overview: Vec<MasteryTopic>,
}

#[derive(Debug, Serialize)]
pub struct UpcomingCommitment {
    pub id: Uuid,
    pub title: String,
    pub type: String,
    pub scheduled_at: String,
    pub due_in_hours: i64,
}

#[derive(Debug, Serialize)]
pub struct PendingReviews {
    pub total_due: i64,
    pub due_today: i64,
    pub overdue: i64,
    pub by_deck: Vec<DeckReviewCount>,
}

#[derive(Debug, Serialize)]
pub struct DeckReviewCount {
    pub deck_id: Uuid,
    pub deck_name: String,
    pub due_count: i64,
}

#[derive(Debug, Serialize)]
pub struct RecentDocument {
    pub id: Uuid,
    pub title: String,
    pub file_path: String,
    pub imported_at: String,
}

#[derive(Debug, Serialize)]
pub struct StudyStats {
    pub total_study_hours: f64,
    pub sessions_this_week: i64,
    pub current_streak_days: i32,
    pub focus_sessions_this_week: i64,
    pub total_pomodoros: i64,
}

#[derive(Debug, Serialize)]
pub struct ErrorSummary {
    pub total_errors: i64,
    pub unconfirmed_errors: i64,
    pub by_cause: Vec<ErrorCauseCount>,
    pub recent_recurrences: i64,
}

#[derive(Debug, Serialize)]
pub struct ErrorCauseCount {
    pub cause: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct MasteryTopic {
    pub topic_id: Uuid,
    pub topic_name: String,
    pub subject_name: String,
    pub mastery_level: f64,
    pub evidence_count: i64,
}

#[tauri::command]
pub async fn get_dashboard_data(app: AppHandle, profile_id: Uuid) -> AppResult<DashboardData> {
    let pool = get_pool(&app).await?;
    let now = Utc::now();
    let week_ago = now - Duration::days(7);
    let today = now.date_naive();
    
    // 1. Próximos compromissos (plan_items + exams + assessments)
    let upcoming = sqlx::query!(
        r#"
        SELECT id, title, 'study' as type, scheduled_start as scheduled_at
        FROM plan_item
        WHERE plan_id IN (SELECT id FROM plan WHERE profile_id = ?)
          AND status IN ('pending', 'in_progress')
          AND scheduled_start >= ?
          AND scheduled_start <= ?
        UNION ALL
        SELECT id, name as title, 'exam' as type, date as scheduled_at
        FROM exam
        WHERE id IN (SELECT target_exam_id FROM study_profile WHERE id = ? AND target_exam_id IS NOT NULL)
          AND date >= ?
          AND date <= ?
        UNION ALL
        SELECT id, name as title, 'assessment' as type, date as scheduled_at
        FROM school_assessment
        WHERE school_subject_id IN (SELECT id FROM school_subject WHERE period_id IN (SELECT id FROM academic_period WHERE profile_id = ?))
          AND date >= ?
          AND date <= ?
        ORDER BY scheduled_at ASC
        LIMIT 10
        "#,
        profile_id, now, now + Duration::days(30),
        profile_id, now.date_naive(), (now + Duration::days(30)).date_naive(),
        profile_id, now.date_naive(), (now + Duration::days(30)).date_naive()
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let upcoming_commitments: Vec<UpcomingCommitment> = upcoming.into_iter().map(|row| {
        let scheduled = row.scheduled_at;
        let due_in = chrono::DateTime::parse_from_rfc3339(&scheduled)
            .map(|dt| (dt - now).num_hours())
            .unwrap_or(0);
        UpcomingCommitment {
            id: row.id,
            title: row.title,
            type: row.type,
            scheduled_at: scheduled,
            due_in_hours: due_in,
        }
    }).collect();
    
    // 2. Revisões pendentes (Recall)
    let pending_reviews_data = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as total_due,
            SUM(CASE WHEN due_date = ? THEN 1 ELSE 0 END) as due_today,
            SUM(CASE WHEN due_date < ? THEN 1 ELSE 0 END) as overdue
        FROM review_card
        WHERE deck_id IN (SELECT id FROM review_deck WHERE profile_id = ?)
          AND state IN (1, 2, 3)
        "#,
        today, today, profile_id
    )
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let by_deck = sqlx::query!(
        r#"
        SELECT rd.id as deck_id, rd.name as deck_name, COUNT(*) as due_count
        FROM review_card rc
        JOIN review_deck rd ON rc.deck_id = rd.id
        WHERE rd.profile_id = ? AND rc.state IN (1, 2, 3) AND rc.due_date <= ?
        GROUP BY rd.id, rd.name
        ORDER BY due_count DESC
        "#,
        profile_id, today
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let pending_reviews = PendingReviews {
        total_due: pending_reviews_data.total_due.unwrap_or(0),
        due_today: pending_reviews_data.due_today.unwrap_or(0),
        overdue: pending_reviews_data.overdue.unwrap_or(0),
        by_deck: by_deck.into_iter().map(|row| DeckReviewCount {
            deck_id: row.deck_id,
            deck_name: row.deck_name,
            due_count: row.due_count.unwrap_or(0),
        }).collect(),
    };
    
    // 3. Documentos recentes
    let recent_docs = sqlx::query!(
        r#"
        SELECT id, title, file_path, created_at as imported_at
        FROM document
        WHERE source_version_id IN (SELECT id FROM source_version WHERE source_id IN (SELECT id FROM source))
        ORDER BY created_at DESC
        LIMIT 5
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let recent_documents: Vec<RecentDocument> = recent_docs.into_iter().map(|row| RecentDocument {
        id: row.id,
        title: row.title,
        file_path: row.file_path,
        imported_at: row.imported_at.to_rfc3339(),
    }).collect();
    
    // 4. Estatísticas de estudo
    let study_stats_data = sqlx::query!(
        r#"
        SELECT 
            COALESCE(SUM(duration_seconds), 0) / 3600.0 as total_hours,
            COUNT(*) as sessions_week
        FROM study_session
        WHERE profile_id = ? AND start_time >= ?
        "#,
        profile_id, week_ago
    )
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let focus_stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as focus_sessions,
            SUM(pomodoro_cycles) as total_pomodoros
        FROM study_session
        WHERE profile_id = ? AND start_time >= ? AND focus_mode = 1
        "#,
        profile_id, week_ago
    )
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    
    // Calcular streak (dias consecutivos com sessão)
    let streak = calculate_streak(&pool, profile_id).await.unwrap_or(0);
    
    let study_stats = StudyStats {
        total_study_hours: study_stats_data.total_hours.unwrap_or(0.0),
        sessions_this_week: study_stats_data.sessions_week.unwrap_or(0),
        current_streak_days: streak,
        focus_sessions_this_week: focus_stats.focus_sessions.unwrap_or(0),
        total_pomodoros: focus_stats.total_pomodoros.unwrap_or(0),
    };
    
    // 5. Resumo de erros
    let error_stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN cause_confirmed = 0 THEN 1 ELSE 0 END) as unconfirmed
        FROM error_record
        WHERE profile_id = ?
        "#,
        profile_id
    )
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let by_cause = sqlx::query!(
        r#"
        SELECT confirmed_cause as cause, COUNT(*) as count
        FROM error_record
        WHERE profile_id = ? AND cause_confirmed = 1 AND confirmed_cause IS NOT NULL
        GROUP BY confirmed_cause
        ORDER BY count DESC
        "#,
        profile_id
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let recent_recurrences = sqlx::query!(
        "SELECT COUNT(*) as count FROM error_record WHERE profile_id = ? AND recurrence_count > 1 AND last_recurrence_at >= ?",
        profile_id, week_ago
    )
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let error_summary = ErrorSummary {
        total_errors: error_stats.total.unwrap_or(0),
        unconfirmed_errors: error_stats.unconfirmed.unwrap_or(0),
        by_cause: by_cause.into_iter().map(|row| ErrorCauseCount {
            cause: format!("{:?}", row.cause.unwrap_or(crate::models::ErrorCause::Other)),
            count: row.count.unwrap_or(0),
        }).collect(),
        recent_recurrences: recent_recurrences.count.unwrap_or(0),
    };
    
    // 6. Visão geral de domínio (Atlas)
    let mastery = sqlx::query!(
        r#"
        SELECT t.id as topic_id, t.name as topic_name, s.name as subject_name, t.mastery_level,
               COUNT(me.id) as evidence_count
        FROM topic t
        JOIN subject s ON t.subject_id = s.id
        LEFT JOIN mastery_evidence me ON me.topic_id = t.id AND me.profile_id = ?
        WHERE t.deleted_at IS NULL
        GROUP BY t.id, t.name, s.name, t.mastery_level
        ORDER BY t.mastery_level ASC
        LIMIT 10
        "#,
        profile_id
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;
    
    let mastery_overview: Vec<MasteryTopic> = mastery.into_iter().map(|row| MasteryTopic {
        topic_id: row.topic_id,
        topic_name: row.topic_name,
        subject_name: row.subject_name,
        mastery_level: row.mastery_level,
        evidence_count: row.evidence_count.unwrap_or(0),
    }).collect();
    
    Ok(DashboardData {
        upcoming_commitments,
        pending_reviews,
        recent_documents,
        study_stats,
        error_summary,
        mastery_overview,
    })
}

async fn calculate_streak(pool: &SqlitePool, profile_id: Uuid) -> AppResult<i32> {
    let sessions = sqlx::query!(
        "SELECT DISTINCT date(start_time) as session_date FROM study_session WHERE profile_id = ? ORDER BY session_date DESC",
        profile_id
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;
    
    if sessions.is_empty() {
        return Ok(0);
    }
    
    let today = Utc::now().date_naive();
    let mut streak = 0;
    let mut current_date = today;
    
    for session in sessions {
        if let Some(session_date) = session.session_date {
            if session_date == current_date || session_date == current_date - Duration::days(1) {
                streak += 1;
                current_date = session_date - Duration::days(1);
            } else if session_date < current_date - Duration::days(1) {
                break;
            }
        }
    }
    
    Ok(streak)
}