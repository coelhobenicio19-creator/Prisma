pub mod profile;
pub mod settings;
pub mod library;
pub mod search;
pub mod dashboard;

use tauri::AppHandle;
use crate::error::AppError;

pub async fn init_commands(app: &AppHandle) -> Result<(), AppError> {
    Ok(())
}