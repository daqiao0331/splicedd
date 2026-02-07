

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod files;

/// The fixed aspect ratio (width / height) to enforce on window resize.
const ASPECT_RATIO: f64 = 2.0;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_drag::init())
        .invoke_handler(tauri::generate_handler![
            files::write_sample_file,
            files::file_exists,
            files::create_placeholder_file
        ])
        .on_window_event(|event| {
            if let tauri::WindowEvent::Resized(size) = event.event() {
                let window = event.window();
                let width = size.width as f64;
                let expected_height = (width / ASPECT_RATIO).round() as u32;
                if size.height != expected_height {
                    let _ = window.set_size(tauri::Size::Physical(
                        tauri::PhysicalSize {
                            width: size.width,
                            height: expected_height,
                        },
                    ));
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
