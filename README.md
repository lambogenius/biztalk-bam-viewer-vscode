# BizTalk BAM Viewer

A local-first, read-only VS Code custom editor for exported BizTalk Business Activity Monitoring definition XML.

## Features

- Opens exported `.xml` and `.bam` definition files through **Open With...**.
- Browses activities, business milestones, data items, and relationships.
- Browses views, activity references, aliases, measures, and dimensions.
- Filters definitions by names, types, and references.
- Refreshes when the underlying XML document changes.
- Keeps BAM definitions local; the extension makes no network calls.

The initial release reads exported BAM definition XML. Live BAM portal data, Tracking Profile Editor files, BAM database queries, deployment, and definition modification are outside this read-only scope.

## Install locally

```powershell
npm run package:vsix
code --install-extension artifacts/biztalk-bam-viewer.vsix --force
```

Reload VS Code, open an exported BAM XML file, choose **Open With...**, and select **BizTalk BAM Viewer**. XML remains associated with the standard text editor unless you explicitly choose the viewer.
