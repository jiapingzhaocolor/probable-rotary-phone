# Shot List Maker — Tauri 2 for macOS

This is the latest v1.5 Shot List Maker packaged as a native Tauri 2 desktop app.

## Included functions

- Dark-mode shot list and storyboard interface
- CSV, TSV, JSON import
- Current-scene, full-film and all-shot-lists exports
- Shot-list PDF and storyboard PDF export
- Storyboard export uses up to 16 image-led frames per page
- Native macOS Save dialogs for CSV and JSON
- Offline local saving
- Universal macOS build for Intel and Apple Silicon

## Build entirely through GitHub

1. Create an empty GitHub repository.
2. Upload the contents of this folder to the repository root. Do not upload the parent folder as one nested folder.
3. Open **Actions**.
4. Select **Build macOS app**.
5. Click **Run workflow** and choose `main`.
6. Open the completed run and download the `Shot-List-Maker-macOS-...-dmg` artifact.
7. Extract the artifact ZIP and open the `.dmg` file on your Mac.
8. Drag **Shot List Maker** into **Applications**.

The build is unsigned. macOS may block it the first time. Control-click the app, choose **Open**, then confirm **Open**. For normal public distribution without warnings, add Apple Developer ID signing and notarization credentials.

## Version releases

Pushing a tag such as `v1.5.0` builds the app and attaches the DMG to a GitHub Release.

## Local build, optional

```bash
npm install
npm run icons
npm run build:mac
```

The DMG will be created under:

```text
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

## v1.5.1 build fix

The macOS capability now uses the valid Tauri 2 permission `core:webview:allow-print`.
The GitHub workflow builds Tauri directly and uploads the resulting universal `.dmg` as
`Shot-List-Maker-macOS-universal-DMG` on the workflow summary page.
