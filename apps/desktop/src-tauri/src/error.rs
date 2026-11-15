use std::fmt;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Erro de banco de dados: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Erro de serialização: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Erro de I/O: {0}")]
    Io(#[from] std::io::Error),

    #[error("Erro de validação: {0}")]
    Validation(String),

    #[error("Não encontrado: {0}")]
    NotFound(String),

    #[error("Conflito: {0}")]
    Conflict(String),

    #[error("Não autorizado: {0}")]
    Unauthorized(String),

    #[error("Erro interno: {0}")]
    Internal(String),

    #[error("Erro de IA: {0}")]
    AiError(String),

    #[error("Erro de criptografia: {0}")]
    CryptoError(String),

    #[error("Arquivo inválido: {0}")]
    InvalidFile(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("AppError", 2)?;
        state.serialize_field("code", &self.error_code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl AppError {
    pub fn error_code(&self) -> &'static str {
        match self {
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::Serialization(_) => "SERIALIZATION_ERROR",
            AppError::Io(_) => "IO_ERROR",
            AppError::Validation(_) => "VALIDATION_ERROR",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Conflict(_) => "CONFLICT",
            AppError::Unauthorized(_) => "UNAUTHORIZED",
            AppError::Internal(_) => "INTERNAL_ERROR",
            AppError::AiError(_) => "AI_ERROR",
            AppError::CryptoError(_) => "CRYPTO_ERROR",
            AppError::InvalidFile(_) => "INVALID_FILE",
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;