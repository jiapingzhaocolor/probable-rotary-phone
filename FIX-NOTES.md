# Build failure fixed

The failed GitHub run reached the Rust/Tauri compilation stage and stopped on this capability error:

```text
Permission webview:allow-print not found
```

The valid Tauri 2 permission is:

```text
core:webview:allow-print
```

This project contains that correction in `src-tauri/capabilities/default.json`.

The workflow was also simplified so it:

1. Installs Node and Rust.
2. Installs the project dependencies.
3. Generates the macOS icons.
4. Builds the universal Intel + Apple Silicon `.dmg` directly.
5. Uploads it as `Shot-List-Maker-macOS-universal-DMG`.

No package lock is required; the workflow intentionally uses `npm install`.
