use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  Manager, WindowEvent,
};

#[derive(Default)]
pub struct AppState {
  pub minimize_to_tray: AtomicBool,
}

#[tauri::command]
fn set_minimize_to_tray(state: tauri::State<'_, Arc<AppState>>, enabled: bool) {
  state.minimize_to_tray.store(enabled, Ordering::SeqCst);
}

#[tauri::command]
fn get_minimize_to_tray(state: tauri::State<'_, Arc<AppState>>) -> bool {
  state.minimize_to_tray.load(Ordering::SeqCst)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let app_state = Arc::new(AppState::default());

  tauri::Builder::default()
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![
      set_minimize_to_tray,
      get_minimize_to_tray
    ])
    .setup(|app| {
      #[cfg(target_os = "macos")]
      {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: 420.0,
            height: 660.0,
          }));
          let _ = window.center();
        }
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(desktop)]
      {
        let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
        let show_i = MenuItem::with_id(app, "show", "Show Smart2FA", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

        let mut tray_builder = TrayIconBuilder::new()
          .menu(&menu)
          .tooltip("Smart2FA-OXID")
          .show_menu_on_left_click(false)
          .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
              app.exit(0);
            }
            "show" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
              }
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
              let app = tray.app_handle();
              if let Some(window) = app.get_webview_window("main") {
                if let Ok(is_visible) = window.is_visible() {
                  if is_visible {
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                  } else {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                  }
                } else {
                  let _ = window.show();
                  let _ = window.unminimize();
                  let _ = window.set_focus();
                }
              }
            }
          });

        if let Some(icon) = app.default_window_icon() {
          tray_builder = tray_builder.icon(icon.clone());
        }

        let _tray = tray_builder.build(app)?;
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        let state = window.state::<Arc<AppState>>();
        if state.minimize_to_tray.load(Ordering::SeqCst) {
          api.prevent_close();
          let _ = window.hide();
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
