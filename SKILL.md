---
name: wip-universal-installer
version: 2.0.0
description: Reference installer for agent-native software. Detects and installs all doors from any repo.
homepage: https://github.com/wipcomputer/wip-universal-installer
metadata:
  category: dev-tools
  capabilities:
    - detect-doors
    - install-cli
    - install-mcp
    - install-openclaw-plugin
    - install-claude-code-hook
  dependencies: []
  interface: CLI
openclaw:
  emoji: "🚪"
  install:
    env: []
author:
  name: Parker Todd Brooks
---

# wip-universal-installer

Reference installer for agent-native software. Scans a repo, detects which "doors" (interfaces) it exposes, and installs them all.

## When to Use This Skill

**Use wip-install for:**
- Installing any repo that follows the Six Doors pattern
- Detecting what interfaces a repo provides
- Setting up CLI tools, MCP servers, OpenClaw plugins, and Claude Code hooks in one command

**Use detect.mjs for:**
- Programmatically detecting doors in a repo
- Building custom installers or CI pipelines
- Validating that a repo follows the spec

### Do NOT Use For

- Installing standard npm packages (use npm directly)
- Repos that don't follow the Six Doors conventions
- Building or compiling code (this only installs)

## API Reference

### CLI

```bash
wip-install /path/to/repo           # install all doors
wip-install org/repo                 # clone from GitHub + install
wip-install --dry-run /path/to/repo  # detect only, no changes
wip-install --json /path/to/repo     # JSON output
```

### Module (detect.mjs)

```javascript
import { detectDoors, describeDoors, detectDoorsJSON } from './detect.mjs';

const { doors, pkg } = detectDoors('/path/to/repo');
console.log(describeDoors(doors));

const json = detectDoorsJSON('/path/to/repo');
console.log(JSON.stringify(json, null, 2));
```

## Six Doors

See [SPEC.md](https://github.com/wipcomputer/wip-universal-installer/blob/main/SPEC.md) for the full specification.

1. **CLI** ... `package.json` bin field
2. **Module** ... `package.json` main/exports
3. **MCP Server** ... `mcp-server.mjs`
4. **OpenClaw Plugin** ... `openclaw.plugin.json`
5. **Skill** ... `SKILL.md`
6. **Claude Code Hook** ... `guard.mjs` or `claudeCode.hook`
