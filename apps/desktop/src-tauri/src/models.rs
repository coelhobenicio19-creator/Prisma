use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StudyProfile {
    pub id: Uuid,
    pub name: String,
    pub goal_type: GoalType,
    pub goal_description: Option<String>,
    pub target_exam_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub timezone: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub version: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "goal_type", rename_all = "lowercase")]
pub enum GoalType {
    Free,
    Exam,
    Contest,
    Olympiad,
    Course,
    SelfStudy,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Goal {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub target_date: Option<chrono::NaiveDate>,
    pub priority: i32,
    pub status: GoalStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub version: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "goal_status", rename_all = "lowercase")]
pub enum GoalStatus {
    Active,
    Paused,
    Completed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Institution {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub website: Option<String>,
    pub verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Exam {
    pub id: Uuid,
    pub institution_id: Uuid,
    pub name: String,
    pub edition: Option<String>,
    pub date: Option<chrono::NaiveDate>,
    pub description: Option<String>,
    pub official_url: Option<String>,
    pub official_hash: Option<String>,
    pub status: ExamStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "exam_status", rename_all = "lowercase")]
pub enum ExamStatus {
    Planned,
    Open,
    Closed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Subject {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub color: Option<String>,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Topic {
    pub id: Uuid,
    pub subject_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub difficulty: Option<i32>,
    pub estimated_hours: Option<f64>,
    pub mastery_level: f64,
    pub verification_status: VerificationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub version: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PrerequisiteEdge {
    pub id: Uuid,
    pub from_topic_id: Uuid,
    pub to_topic_id: Uuid,
    pub strength: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Skill {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub bloom_level: Option<BloomLevel>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "bloom_level", rename_all = "lowercase")]
pub enum BloomLevel {
    Remember,
    Understand,
    Apply,
    Analyze,
    Evaluate,
    Create,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Source {
    pub id: Uuid,
    pub source_type: SourceType,
    pub title: String,
    pub authors: Option<serde_json::Value>,
    pub year: Option<i32>,
    pub doi: Option<String>,
    pub isbn: Option<String>,
    pub url: Option<String>,
    pub domain: Option<String>,
    pub access_date: chrono::NaiveDate,
    pub credibility_score: Option<f64>,
    pub verification_status: VerificationStatus,
    pub metadata_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "source_type", rename_all = "lowercase")]
pub enum SourceType {
    Official,
    UserFile,
    Web,
    Generated,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "verification_status", rename_all = "lowercase")]
pub enum VerificationStatus {
    Verified,
    NeedsReview,
    Unverified,
    Generated,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SourceVersion {
    pub id: Uuid,
    pub source_id: Uuid,
    pub version_number: i32,
    pub content_hash: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub pages: Option<i32>,
    pub change_summary: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Document {
    pub id: Uuid,
    pub source_version_id: Uuid,
    pub title: String,
    pub content_hash: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub page_count: Option<i32>,
    pub language: String,
    pub ocr_status: OcrStatus,
    pub extraction_status: ExtractionStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "ocr_status", rename_all = "lowercase")]
pub enum OcrStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    NotNeeded,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "extraction_status", rename_all = "lowercase")]
pub enum ExtractionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Page {
    pub id: Uuid,
    pub document_id: Uuid,
    pub page_number: i32,
    pub text_content: Option<String>,
    pub text_hash: Option<String>,
    pub ocr_confidence: Option<f64>,
    pub annotations_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ContentChunk {
    pub id: Uuid,
    pub document_id: Uuid,
    pub page_id: Option<Uuid>,
    pub chunk_index: i32,
    pub text: String,
    pub token_count: Option<i32>,
    pub embedding_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Citation {
    pub id: Uuid,
    pub source_version_id: Uuid,
    pub chunk_id: Option<Uuid>,
    pub page_id: Option<Uuid>,
    pub text_excerpt: String,
    pub location_text: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct EvidenceLink {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub citation_id: Uuid,
    pub relevance: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Question {
    pub id: Uuid,
    pub stem: String,
    pub question_type: QuestionType,
    pub difficulty: Option<i32>,
    pub explanation: Option<String>,
    pub origin: QuestionOrigin,
    pub source_version_id: Option<Uuid>,
    pub exam_id: Option<Uuid>,
    pub exam_edition_id: Option<Uuid>,
    pub question_number: Option<String>,
    pub year: Option<i32>,
    pub tags_json: Option<serde_json::Value>,
    pub topic_ids_json: Option<serde_json::Value>,
    pub verification_status: VerificationStatus,
    pub content_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub version: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "question_type", rename_all = "lowercase")]
pub enum QuestionType {
    SingleChoice,
    MultipleChoice,
    Essay,
    Numeric,
    Ordering,
    Matching,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "question_origin", rename_all = "lowercase")]
pub enum QuestionOrigin {
    Official,
    Imported,
    GeneratedAi,
    Authored,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Alternative {
    pub id: Uuid,
    pub question_id: Uuid,
    pub label: String,
    pub text: String,
    pub is_correct: bool,
    pub explanation: Option<String>,
    pub display_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AnswerKey {
    pub id: Uuid,
    pub question_id: Uuid,
    pub correct_alternative_ids_json: String,
    pub essay_rubric: Option<String>,
    pub source: AnswerKeySource,
    pub official_url: Option<String>,
    pub divergence_note: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "answer_key_source", rename_all = "lowercase")]
pub enum AnswerKeySource {
    Official,
    Imported,
    Inferred,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct QuestionTopicMapping {
    pub id: Uuid,
    pub question_id: Uuid,
    pub topic_id: Uuid,
    pub weight: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReviewFlag {
    pub id: Uuid,
    pub question_id: Uuid,
    pub flag_type: ReviewFlagType,
    pub description: Option<String>,
    pub status: ReviewFlagStatus,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "review_flag_type", rename_all = "lowercase")]
pub enum ReviewFlagType {
    ContentError,
    Ambiguous,
    Outdated,
    Duplicate,
    DifficultyMismatch,
    OriginUnclear,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "review_flag_status", rename_all = "lowercase")]
pub enum ReviewFlagStatus {
    Open,
    InReview,
    Resolved,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExamTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub exam_profile_id: Option<Uuid>,
    pub duration_minutes: i32,
    pub instructions: Option<String>,
    pub section_config_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExamSession {
    pub id: Uuid,
    pub template_id: Uuid,
    pub profile_id: Uuid,
    pub mode: ExamMode,
    pub state: ExamState,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub deadline_at: Option<DateTime<Utc>>,
    pub paused_duration_seconds: i64,
    pub time_remaining_seconds: Option<i64>,
    pub current_question_index: i32,
    pub answers_json: Option<serde_json::Value>,
    pub events_json: Option<serde_json::Value>,
    pub integrity_alerts_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "exam_mode", rename_all = "lowercase")]
pub enum ExamMode {
    Training,
    Exam,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "exam_state", rename_all = "lowercase")]
pub enum ExamState {
    Draft,
    Ready,
    Running,
    Interrupted,
    Submitted,
    Scored,
    Reviewed,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExamEvent {
    pub id: Uuid,
    pub session_id: Uuid,
    pub event_type: ExamEventType,
    pub timestamp: DateTime<Utc>,
    pub monotonic_ms: i64,
    pub payload_json: Option<serde_json::Value>,
    pub sequence: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "exam_event_type", rename_all = "lowercase")]
pub enum ExamEventType {
    Start,
    Pause,
    Resume,
    AnswerChange,
    Navigation,
    FocusLost,
    FocusGained,
    WindowMinimize,
    WindowRestore,
    Submit,
    CrashRecovery,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IntegrityAlert {
    pub id: Uuid,
    pub session_id: Uuid,
    pub alert_type: IntegrityAlertType,
    pub severity: AlertSeverity,
    pub description: Option<String>,
    pub auto_resolved: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "integrity_alert_type", rename_all = "lowercase")]
pub enum IntegrityAlertType {
    TimeAnomaly,
    FocusLoss,
    WindowMinimize,
    MultipleSubmissions,
    ClockChange,
    DiskFull,
    NetworkLoss,
    ProcessKill,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "alert_severity", rename_all = "lowercase")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Attempt {
    pub id: Uuid,
    pub session_id: Uuid,
    pub attempt_number: i32,
    pub score: Option<f64>,
    pub max_score: Option<f64>,
    pub percentage: Option<f64>,
    pub passed: Option<bool>,
    pub scored_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Answer {
    pub id: Uuid,
    pub attempt_id: Uuid,
    pub question_id: Uuid,
    pub answer_data_json: String,
    pub is_correct: Option<bool>,
    pub score: Option<f64>,
    pub max_score: Option<f64>,
    pub time_spent_seconds: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ScoringEvent {
    pub id: Uuid,
    pub attempt_id: Uuid,
    pub question_id: Uuid,
    pub rule_applied: String,
    pub points_awarded: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MasteryEvidence {
    pub id: Uuid,
    pub topic_id: Uuid,
    pub profile_id: Uuid,
    pub source_type: MasterySourceType,
    pub source_id: String,
    pub evidence_value: f64,
    pub weight: f64,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "mastery_source_type", rename_all = "lowercase")]
pub enum MasterySourceType {
    ExamAnswer,
    RecallCard,
    ErrorLab,
    StudySession,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ErrorRecord {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub question_id: Uuid,
    pub attempt_id: Option<Uuid>,
    pub answer_id: Option<Uuid>,
    pub cause_hypothesis: ErrorCause,
    pub cause_confirmed: bool,
    pub confirmed_cause: Option<ErrorCause>,
    pub context_json: Option<serde_json::Value>,
    pub recurrence_count: i32,
    pub last_recurrence_at: Option<DateTime<Utc>>,
    pub recovery_strategy_ids_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "error_cause", rename_all = "lowercase")]
pub enum ErrorCause {
    Concept,
    Calculation,
    Interpretation,
    Haste,
    Forgetting,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReviewCard {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub deck_id: Uuid,
    pub front: String,
    pub back: String,
    pub card_type: CardType,
    pub tags_json: Option<serde_json::Value>,
    pub source_topic_ids_json: Option<serde_json::Value>,
    pub source_document_id: Option<Uuid>,
    pub source_error_id: Option<Uuid>,
    pub state: CardState,
    pub stability: f64,
    pub difficulty: f64,
    pub due_date: chrono::NaiveDate,
    pub last_review: Option<DateTime<Utc>>,
    pub reps: i32,
    pub lapses: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "card_type", rename_all = "lowercase")]
pub enum CardType {
    Basic,
    Cloze,
    ImageOcclusion,
    Formula,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "card_state", rename_all = "lowercase")]
pub enum CardState {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReviewDeck {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub fsrs_parameters_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReviewLog {
    pub id: Uuid,
    pub card_id: Uuid,
    pub rating: i32,
    pub state_before: i32,
    pub state_after: i32,
    pub stability_before: Option<f64>,
    pub stability_after: Option<f64>,
    pub difficulty_before: Option<f64>,
    pub difficulty_after: Option<f64>,
    pub elapsed_days: i32,
    pub scheduled_days: i32,
    pub reviewed_at: DateTime<Utc>,
    pub review_duration_ms: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StudySession {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub plan_item_id: Option<Uuid>,
    pub topic_ids_json: Option<serde_json::Value>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub focus_mode: bool,
    pub pomodoro_cycles: i32,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Plan {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub name: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: Option<chrono::NaiveDate>,
    pub status: PlanStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "plan_status", rename_all = "lowercase")]
pub enum PlanStatus {
    Active,
    Paused,
    Completed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PlanItem {
    pub id: Uuid,
    pub plan_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub item_type: PlanItemType,
    pub topic_ids_json: Option<serde_json::Value>,
    pub scheduled_start: DateTime<Utc>,
    pub scheduled_end: DateTime<Utc>,
    pub actual_start: Option<DateTime<Utc>>,
    pub actual_end: Option<DateTime<Utc>>,
    pub duration_planned_seconds: i64,
    pub duration_actual_seconds: Option<i64>,
    pub priority: i32,
    pub status: PlanItemStatus,
    pub recurrence_rule: Option<String>,
    pub parent_item_id: Option<Uuid>,
    pub justification: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "plan_item_type", rename_all = "lowercase")]
pub enum PlanItemType {
    Study,
    Review,
    Exam,
    Project,
    Break,
    Custom,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "plan_item_status", rename_all = "lowercase")]
pub enum PlanItemStatus {
    Pending,
    InProgress,
    Completed,
    Skipped,
    Rescheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Project {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub subject_id: Option<Uuid>,
    pub status: ProjectStatus,
    pub start_date: Option<chrono::NaiveDate>,
    pub due_date: Option<chrono::NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "project_status", rename_all = "lowercase")]
pub enum ProjectStatus {
    Planning,
    Active,
    OnHold,
    Completed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProjectColumn {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub position: i32,
    pub wip_limit: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub column_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub position: i32,
    pub due_date: Option<chrono::NaiveDate>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
    pub checklist_json: Option<serde_json::Value>,
    pub attachment_ids_json: Option<serde_json::Value>,
    pub topic_ids_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Artifact {
    pub id: Uuid,
    pub task_id: Option<Uuid>,
    pub project_id: Uuid,
    pub name: String,
    pub file_path: Option<String>,
    pub content_hash: Option<String>,
    pub mime_type: Option<String>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AcademicPeriod {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub name: String,
    pub start_date: chrono::NaiveDate,
    pub end_date: chrono::NaiveDate,
    pub is_current: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SchoolSubject {
    pub id: Uuid,
    pub period_id: Uuid,
    pub subject_id: Uuid,
    pub name: String,
    pub teacher: Option<String>,
    pub schedule_json: Option<serde_json::Value>,
    pub grade_formula: Option<String>,
    pub target_grade: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SchoolAssessment {
    pub id: Uuid,
    pub school_subject_id: Uuid,
    pub name: String,
    pub assessment_type: AssessmentType,
    pub weight: f64,
    pub max_score: f64,
    pub date: Option<chrono::NaiveDate>,
    pub score: Option<f64>,
    pub is_grade_confirmed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "assessment_type", rename_all = "lowercase")]
pub enum AssessmentType {
    Exam,
    Assignment,
    Project,
    Participation,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AttendanceRecord {
    pub id: Uuid,
    pub school_subject_id: Uuid,
    pub date: chrono::NaiveDate,
    pub status: AttendanceStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "attendance_status", rename_all = "lowercase")]
pub enum AttendanceStatus {
    Present,
    Absent,
    Late,
    Justified,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LiaConversation {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub title: Option<String>,
    pub context_scope: LiaContextScope,
    pub context_id: Option<Uuid>,
    pub memory_opt_in: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "lia_context_scope", rename_all = "lowercase")]
pub enum LiaContextScope {
    Profile,
    Exam,
    Project,
    Topic,
    Free,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LiaMessage {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub role: LiaRole,
    pub content: String,
    pub tool_invocations_json: Option<serde_json::Value>,
    pub citations_json: Option<serde_json::Value>,
    pub tokens_input: Option<i32>,
    pub tokens_output: Option<i32>,
    pub model_id: Option<String>,
    pub latency_ms: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "lia_role", rename_all = "lowercase")]
pub enum LiaRole {
    User,
    Assistant,
    System,
    Tool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ToolInvocation {
    pub id: Uuid,
    pub message_id: Uuid,
    pub tool_name: String,
    pub input_json: String,
    pub output_json: Option<String>,
    pub status: ToolStatus,
    pub approved_by: Option<String>,
    pub executed_at: Option<DateTime<Utc>>,
    pub rollback_at: Option<DateTime<Utc>>,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tool_status", rename_all = "lowercase")]
pub enum ToolStatus {
    Pending,
    Approved,
    Rejected,
    Executed,
    Failed,
    RolledBack,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Approval {
    pub id: Uuid,
    pub tool_invocation_id: Uuid,
    pub action_description: String,
    pub risk_level: RiskLevel,
    pub status: ApprovalStatus,
    pub decided_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "risk_level", rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "approval_status", rename_all = "lowercase")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AiProvenance {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub model_id: String,
    pub prompt_hash: String,
    pub generation_params_json: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct DataSharingConsent {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub scope: String,
    pub allowed: bool,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TelemetryConsent {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub category: String,
    pub allowed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BackupRecord {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub backup_type: BackupType,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub content_hash: Option<String>,
    pub tables_included_json: Option<serde_json::Value>,
    pub status: BackupStatus,
    pub restore_tested_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "backup_type", rename_all = "lowercase")]
pub enum BackupType {
    Full,
    Incremental,
    Manual,
    Auto,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "backup_status", rename_all = "lowercase")]
pub enum BackupStatus {
    Pending,
    Completed,
    Failed,
    Corrupted,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditEvent {
    pub id: Uuid,
    pub profile_id: Option<Uuid>,
    pub event_type: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub old_values_json: Option<serde_json::Value>,
    pub new_values_json: Option<serde_json::Value>,
    pub ip_hash: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserSetting {
    pub id: Uuid,
    pub profile_id: Uuid,
    pub key: String,
    pub value_json: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}