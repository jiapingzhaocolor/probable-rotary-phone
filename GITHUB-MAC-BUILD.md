# Browser-only macOS build instructions

You do not need to install Node.js, Rust, Xcode or Tauri on your own computer.

## Upload

At the repository root, you should see:

```text
.github/
public/
src-tauri/
package.json
README.md
```

The workflow must be located at:

```text
.github/workflows/build-macos.yml
```

## Build

1. Open the GitHub repository.
2. Select **Actions**.
3. Select **Build macOS app** in the left sidebar.
4. Select **Run workflow**.
5. Choose `main` and run it.
6. Open the workflow run after it receives a green checkmark.
7. Scroll to **Artifacts**.
8. Download the artifact ending in `dmg`.
9. Extract the downloaded ZIP to obtain the `.dmg` installer.

## Supported Macs

The workflow uses `--target universal-apple-darwin`, producing one universal app for:

- Apple Silicon: M1, M2, M3, M4 and later
- Intel Macs

Minimum configured macOS version: macOS 11 Big Sur.

## Unsigned app warning

Without an Apple Developer ID certificate, the app is not notarized. On first launch:

1. Move the app into Applications.
2. Control-click the app.
3. Choose **Open**.
4. Choose **Open** again.

## Releases

Create and push a version tag such as `v1.5.0` to attach the DMG to the repository's Releases page automatically.

## v1.5.1 correction

The earlier workflow failed because `src-tauri/capabilities/default.json` used
`webview:allow-print`. Tauri 2 requires `core:webview:allow-print`.

After the fixed workflow finishes, open the run summary and download:

`Shot-List-Maker-macOS-universal-DMG`
