use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SaveResult {
    canceled: bool,
    path: Option<String>,
}

#[tauri::command]
async fn save_text_file(
    app: tauri::AppHandle,
    default_name: String,
    contents: String,
) -> Result<SaveResult, String> {
    let selection = app
        .dialog()
        .file()
        .set_file_name(default_name)
        .blocking_save_file();

    let Some(file_path) = selection else {
        return Ok(SaveResult {
            canceled: true,
            path: None,
        });
    };

    let path = file_path
        .into_path()
        .map_err(|error| format!("Could not resolve the selected path: {error}"))?;

    std::fs::write(&path, contents)
        .map_err(|error| format!("Could not save the file: {error}"))?;

    Ok(SaveResult {
        canceled: false,
        path: Some(path.to_string_lossy().into_owned()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_text_file])
        .run(tauri::generate_context!())
        .expect("error while running Shot List Maker");
}
