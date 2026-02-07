// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};

mod files;

/// The fixed aspect ratio (width / height) to enforce on window resize.
const ASPECT_RATIO: f64 = 2.0;

/// Guard to prevent recursive resize events.
static RESIZING: AtomicBool = AtomicBool::new(false);

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
                if RESIZING.load(Ordering::SeqCst) {
                    return;
                }
                let width = size.width as f64;
                let expected_height = (width / ASPECT_RATIO).round() as u32;
                // Only adjust if the difference exceeds a small tolerance (2px)
                if (size.height as i32 - expected_height as i32).unsigned_abs() > 2 {
                    RESIZING.store(true, Ordering::SeqCst);
                    let _ = event.window().set_size(tauri::Size::Physical(
                        tauri::PhysicalSize {
                            width: size.width,
                            height: expected_height,
                        },
                    ));
                    RESIZING.store(false, Ordering::SeqCst);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
