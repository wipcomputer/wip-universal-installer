###### WIP Computer

[![npm](https://img.shields.io/npm/v/@wipcomputer/universal-installer)](https://www.npmjs.com/package/@wipcomputer/universal-installer) [![CLI / TUI](https://img.shields.io/badge/interface-CLI_/_TUI-black)](https://github.com/wipcomputer/wip-universal-installer/blob/main/install.mjs) [![OpenClaw Skill](https://img.shields.io/badge/interface-OpenClaw_Skill-black)](https://clawhub.ai/parkertoddbrooks/wip-universal-installer) [![Claude Code Skill](https://img.shields.io/badge/interface-Claude_Code_Skill-black)](https://github.com/wipcomputer/wip-universal-installer/blob/main/SKILL.md) [![Universal Interface Spec](https://img.shields.io/badge/Universal_Interface_Spec-black?style=flat&color=black)](https://github.com/wipcomputer/wip-universal-installer/blob/main/SPEC.md)

# Universal Installer

Here's how to build software in 2026.

## The Problem

Most software is built for humans. GUIs, dashboards, web apps. Humans click buttons, fill forms, read screens.

But the users are changing. AI agents are the new users. They don't click. They call functions. They read instructions. They compose tools. They need a **universal interface** ... multiple ways into the same logic, native to however the consumer works.

Software built for humans doesn't work for agents. And software built only for agents doesn't work for humans. You need both.

## The Karpathy Argument

Andrej Karpathy put it clearly:

> "I think the app store, the move to mobile, the concept of an app ... is an increasingly outdated concept. What matters are sensors and actuators. Sensors are things that convert physical state into digital state. Actuators are things that convert digital intent into physical change."
>
> "All LLMs care about are tools and the tools fall into this sensor/actuator divide. Software shouldn't be built into apps, but into small bespoke tools. Apps are for people. Tools are for LLMs, and increasingly, LLMs are the ones using software."

[Source](https://x.com/karpathy/status/2024583544157458452)

This is the future of software. Not apps. Tools. Sensors and actuators that agents compose together.

## Sensors and Actuators

Every tool is a sensor, an actuator, or both:

**Sensors** convert state into data:
- Search the web (wip-grok search_web)
- Search X/Twitter (wip-grok search_x, wip-x search_recent)
- Fetch a post (wip-x fetch_post)
- Read bookmarks (wip-x get_bookmarks)
- Check system health (wip-healthcheck)

**Actuators** convert intent into action:
- Generate an image (wip-grok generate_image)
- Post a tweet (wip-x post_tweet)
- Guard a file from edits (wip-file-guard)
- Generate a video (wip-grok generate_video)

## The Universal Interface

Agents don't all speak the same language. Some run shell commands. Some import modules. Some talk MCP. Some read markdown instructions.

So every tool should expose multiple interfaces into the same core logic:

| Interface | What | Who uses it |
|-----------|------|-------------|
| **CLI** | Shell command | Humans, any agent with bash |
| **Module** | ES import | Other tools, scripts |
| **MCP Server** | JSON-RPC over stdio | Claude Code, Cursor, any MCP client |
| **OpenClaw Plugin** | Lifecycle hooks + tools | OpenClaw agents |
| **Skill** | Markdown instructions (SKILL.md) | Any agent that reads files |
| **Claude Code Hook** | PreToolUse/Stop events | Claude Code |

Not every tool needs all six. Build what makes sense. But the more interfaces you expose, the more agents can use your tool.

See [SPEC.md](SPEC.md) for the full specification.

## How to Build It

The architecture is simple. Four files:

```
your-tool/
  core.mjs            <- pure logic, zero deps if possible
  cli.mjs             <- thin CLI wrapper
  mcp-server.mjs      <- MCP server wrapping core as tools
  SKILL.md            <- when/how to use it, for agents
```

`core.mjs` does the work. Everything else is a thin wrapper. CLI parses argv and calls core. MCP server maps tools to core functions. SKILL.md teaches agents when to call what.

This means one codebase, one set of tests, multiple interfaces.

## The Reference Installer

`wip-install` scans any repo, detects which interfaces exist, and installs them all. One command.

```bash
# From GitHub
wip-install wipcomputer/wip-grok

# From a local path
wip-install /path/to/repo

# Detect only (no install)
wip-install --dry-run wipcomputer/wip-x

# Machine-readable output
wip-install --json /path/to/repo
```

### Example Output

```
  Installing: wip-grok
  ────────────────────────────────────────
  Detected 4 interface(s): cli, module, mcp, skill

  ✓ CLI: wip-grok installed globally
  ✓ Module: import from "core.mjs"
  MCP Server detected: mcp-server.mjs
  ✓ Skill: SKILL.md available

  Done. 4 interface(s) processed.
```

### What It Detects

| Pattern | Interface | Install action |
|---------|-----------|---------------|
| `package.json` with `bin` | CLI | `npm install -g` |
| `main` or `exports` in `package.json` | Module | Reports import path |
| `mcp-server.mjs` | MCP | Prints `.mcp.json` config |
| `openclaw.plugin.json` | OpenClaw | Copies to `~/.openclaw/extensions/` |
| `SKILL.md` | Skill | Reports path |
| `guard.mjs` or `claudeCode.hook` | CC Hook | Adds to `~/.claude/settings.json` |

## Install

Open your AI coding tool and say:

```
Read the SPEC.md and SKILL.md at github.com/wipcomputer/wip-universal-installer.
Then explain to me:
1. What is this tool?
2. What does it do?
3. What would it change or fix in our current system?

Then ask me:
- Do you have more questions?
- Do you want to integrate it into our system?
- Do you want to clone it (use as-is) or fork it (so you can contribute back if you find bugs)?
```

Your agent will read the repo, explain the tool, and walk you through integration interactively.

Also see **[wip-release](https://github.com/wipcomputer/wip-release)** ... one-command release pipeline for agent-native software.

See [SPEC.md](SPEC.md) for the full Universal Interface specification.

## Real Examples

| Tool | Type | Interfaces | What it does |
|------|------|------------|-------------|
| [wip-grok](https://github.com/wipcomputer/wip-grok) | Sensor + Actuator | CLI + Module + MCP + Skill | xAI Grok API: search web/X, generate images/video |
| [wip-x](https://github.com/wipcomputer/wip-x) | Sensor + Actuator | CLI + Module + MCP + Skill | X Platform API: read/write tweets, bookmarks |
| [wip-file-guard](https://github.com/wipcomputer/wip-file-guard) | Actuator | CLI + OpenClaw + CC Hook | Protect files from AI edits |
| [wip-healthcheck](https://github.com/wipcomputer/wip-healthcheck) | Sensor | CLI + Module | System health monitoring |

## Supported Tools

Works with any AI agent or coding tool that can run shell commands:

| Tool | How |
|------|-----|
| Claude Code | CLI via bash, hooks via settings.json, MCP via .mcp.json |
| OpenAI Codex CLI | CLI via bash, skills via AGENTS.md |
| Cursor | CLI via terminal, MCP via config |
| Windsurf | CLI via terminal, MCP via config |
| OpenClaw | Plugins, skills, MCP |
| Any agent | CLI works everywhere. If it has a shell, it works. |

---

## License

MIT

Built by Parker Todd Brooks, with Claude Code and Lēsa (OpenClaw).
