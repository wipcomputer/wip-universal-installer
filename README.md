###### WIP Computer
# Universal Installer

Point it at any WIP.computer repo. It reads the repo, detects every available interface, and installs them all. One command. Every door.

## How It Works

The installer scans a repo for known patterns:

| What it finds | What it installs |
|--------------|-----------------|
| `package.json` with `bin` | CLI tool via `npm install -g` |
| `openclaw.plugin.json` | OpenClaw plugin to `~/.openclaw/extensions/` |
| `guard.mjs` or `claudeCode.hook` | Claude Code hook to `~/.claude/settings.json` |
| `mcp-server.mjs` | MCP server config (prints `.mcp.json` entry) |
| `SKILL.md` | OpenClaw skill (reports path) |
| ESM `main` or `exports` | Module (reports import path) |

No config files. No manual steps. It reads the repo and figures it out.

## Install

### For AI Agents

Open your AI coding tool and say:

```
Install @wipcomputer/universal-installer globally,
then use wip-install to set up any repo I point you at.
```

### npm

```bash
npm install -g @wipcomputer/universal-installer
```

### From Source

```bash
git clone https://github.com/wipcomputer/wip-universal-installer.git
cd wip-universal-installer
npm link
```

## Usage

```bash
# From a GitHub repo
wip-install wipcomputer/wip-file-guard

# From a full URL
wip-install https://github.com/wipcomputer/grok-search.git

# From a local path
wip-install /path/to/repo
```

### Example Output

```
  Installing: wip-file-guard
  ────────────────────────────────────────
  Detected 3 door(s): cli, openclaw, claudeCodeHook

  ✓ CLI: wip-file-guard installed globally
  ✓ OpenClaw: copied to ~/.openclaw/extensions/wip-file-guard
  ✓ Claude Code: PreToolUse hook added to settings.json

  Done. 3 door(s) processed.
```

## What It Detects

Every WIP.computer repo follows a multi-interface pattern. Each interface is a "door" into the same tool:

- **CLI** ... a shell command anyone can run
- **OpenClaw** ... plugin for OpenClaw agents
- **Claude Code** ... hook for Claude Code's PreToolUse/Stop events
- **MCP** ... JSON-RPC server for any MCP client
- **Skill** ... instructions teaching agents when and how to use the tool
- **Module** ... ESM import for use inside other tools

Not every repo has all six. The installer only installs what exists.

## Supported Repos

Any repo that follows WIP.computer conventions works. Currently:

- **[wip-file-guard](https://github.com/wipcomputer/wip-file-guard)** ... CLI + OpenClaw + Claude Code hook
- **[grok-search](https://github.com/wipcomputer/grok-search)** ... CLI + Skill + Module
- **[wip-markdown-viewer](https://github.com/wipcomputer/wip-markdown-viewer)** ... CLI + Module

Adding support to your own repo is simple: add a `package.json` with `bin`, an `openclaw.plugin.json`, or a `SKILL.md`. The installer picks them up automatically.

---

## License

MIT

Built by Parker Todd Brooks, with Claude Code and Lēsa (OpenClaw).
