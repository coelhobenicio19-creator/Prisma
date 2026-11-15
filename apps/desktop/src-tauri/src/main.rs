#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};
use tauri_plugin_sql::{Migration, MigrationKind};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod commands;
mod db;
mod error;
mod models;

use commands::*;
use db::init_db;
use error::AppError;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar tracing
    init_tracing();

    // Migrações do banco
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial_schema.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "fts5_search_index",
            sql: include_str!("../migrations/002_fts5_search_index.up.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new()
            .add_migrations("sqlite:prisma.db", migrations)
            .build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(move |app| {
            // Inicializar banco de dados
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = init_db(&app_handle).await {
                    tracing::error!("Falha ao inicializar banco: {}", e);
                }
            });

            // Configurar system tray
            setup_tray(app.handle())?;

            // Configurar atalhos globais
            setup_global_shortcuts(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Profile commands
            profile::create_profile,
            profile::get_profile,
            profile::list_profiles,
            profile::update_profile,
            profile::delete_profile,
            // Settings commands
            settings::get_settings,
            settings::update_settings,
            settings::export_data,
            settings::import_data,
            // Library commands
            library::import_file,
            library::list_documents,
            library::get_document,
            library::delete_document,
            library::open_document,
            // Search commands
            search::search,
            search::reindex,
            // Dashboard commands
            dashboard::get_dashboard_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_tracing() {
    let log_dir = directories::ProjectDirs::from("com", "nanomuse", "prisma")
        .map(|dirs| dirs.data_dir().join("logs"))
        .unwrap_or_else(|| PathBuf::from(".").join("logs"));

    std::fs::create_dir_all(&log_dir).ok();

    let file_appender = tracing_appender::rolling::daily(&log_dir, "prisma.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "prisma=info,tauri=warn,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking).json())
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stdout))
        .init();

    // Guard precisa ser mantido vivo - em produção usar Box::leak ou similar
    std::mem::forget(_guard);
}

fn setup_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Mostrar PRISMA", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().ok();
                    window.set_focus().ok();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    window.show().ok();
                    window.set_focus().ok();
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_global_shortcuts<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    app.global_shortcut().register(Shortcut::new(Some(tauri_plugin_global_shortcut::Modifiers::CONTROL), tauri_plugin_global_shortcut::Code::KeyK))?;
    
    app.on_global_shortcut_event(|app, shortcut, event| {
        if shortcut.matches(tauri_plugin_global_shortcut::Modifiers::CONTROL, tauri_plugin_global_shortcut::Code::KeyK) {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().ok();
                } else {
                    window.show().ok();
                    window.set_focus().ok();
                }
            }
        }
    });

    Ok(())
}