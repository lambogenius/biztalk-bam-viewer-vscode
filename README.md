# BizTalk BAM Viewer

[![Source on GitHub](https://img.shields.io/badge/source-GitHub-181717?logo=github)](https://github.com/lambogenius/biztalk-bam-viewer-vscode)

A local-first, read-only VS Code custom editor for exported BizTalk Business Activity Monitoring definition XML.

## Features

- Opens exported `.xml` and `.bam` definition files through **Open With...**.
- Reads the BAMDefinition format exported by `bm.exe get-defxml` and the BAM Excel add-in: `DATETIME` checkpoints show as milestones, other checkpoints as data items, and ID references (`ActivityRef`, `CheckpointRef`, `ViewRef`) show as names.
- Browses activities, business milestones, data items, and relationships.
- Browses views, activity references, aliases and durations, and the measures and dimensions of each view's cube.
- Filters definitions by names, types, and references.
- Refreshes when the underlying XML document changes.
- Keeps BAM definitions local; the extension makes no network calls.

The initial release reads exported BAM definition XML. Live BAM portal data, Tracking Profile Editor files, BAM database queries, deployment, and definition modification are outside this read-only scope.

## Install locally

Source code: [GitHub repository](https://github.com/lambogenius/biztalk-bam-viewer-vscode)

```powershell
npm run package:vsix
code --install-extension artifacts/biztalk-bam-viewer.vsix --force
```

Reload VS Code, open an exported BAM XML file, choose **Open With...**, and select **BizTalk BAM Viewer**. XML remains associated with the standard text editor unless you explicitly choose the viewer.
