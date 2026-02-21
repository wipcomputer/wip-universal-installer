/**
 * wip-universal-installer/detect.mjs
 * Door detection logic. Scans a repo and reports which interfaces it exposes.
 * Importable by other tools. Zero dependencies.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Detect all doors (interfaces) in a repo.
 * Returns { doors, pkg } where doors is an object keyed by door type.
 */
export function detectDoors(repoPath) {
  const doors = {};
  const pkg = readJSON(join(repoPath, 'package.json'));

  // 1. CLI door: package.json has bin entry
  if (pkg?.bin) {
    doors.cli = { bin: pkg.bin, name: pkg.name };
  }

  // 2. Module door: package.json has main or exports
  if (pkg?.main || pkg?.exports) {
    doors.module = { main: pkg.main || pkg.exports };
  }

  // 3. MCP server door: mcp-server.mjs/js/ts or dist/mcp-server.js
  const mcpFiles = ['mcp-server.mjs', 'mcp-server.js', 'mcp-server.ts', 'dist/mcp-server.js'];
  for (const f of mcpFiles) {
    if (existsSync(join(repoPath, f))) {
      doors.mcp = { file: f, name: pkg?.name || basename(repoPath) };
      break;
    }
  }

  // 4. OpenClaw plugin door: openclaw.plugin.json exists
  const ocPlugin = join(repoPath, 'openclaw.plugin.json');
  if (existsSync(ocPlugin)) {
    doors.openclaw = { config: readJSON(ocPlugin), path: ocPlugin };
  }

  // 5. Skill door: SKILL.md exists
  if (existsSync(join(repoPath, 'SKILL.md'))) {
    doors.skill = { path: join(repoPath, 'SKILL.md') };
  }

  // 6. Claude Code hook door: guard.mjs or claudeCode.hook in package.json
  if (pkg?.claudeCode?.hook) {
    doors.claudeCodeHook = pkg.claudeCode.hook;
  } else if (existsSync(join(repoPath, 'guard.mjs'))) {
    doors.claudeCodeHook = {
      event: 'PreToolUse',
      matcher: 'Edit|Write',
      command: `node "${join(repoPath, 'guard.mjs')}"`,
      timeout: 5
    };
  }

  return { doors, pkg };
}

/**
 * Describe detected doors as a human-readable summary.
 */
export function describeDoors(doors) {
  const lines = [];
  const doorNames = Object.keys(doors);

  if (doorNames.length === 0) {
    return 'No doors detected.';
  }

  if (doors.cli) {
    const bins = typeof doors.cli.bin === 'string' ? [doors.cli.name] : Object.keys(doors.cli.bin);
    lines.push(`CLI: ${bins.join(', ')}`);
  }
  if (doors.module) lines.push(`Module: ${JSON.stringify(doors.module.main)}`);
  if (doors.mcp) lines.push(`MCP Server: ${doors.mcp.file}`);
  if (doors.openclaw) lines.push(`OpenClaw Plugin: ${doors.openclaw.config?.name || 'detected'}`);
  if (doors.skill) lines.push(`Skill: SKILL.md`);
  if (doors.claudeCodeHook) lines.push(`Claude Code Hook: ${doors.claudeCodeHook.event || 'PreToolUse'}`);

  return `${doorNames.length} door(s): ${doorNames.join(', ')}\n${lines.map(l => `  ${l}`).join('\n')}`;
}

/**
 * Detect doors and return a structured JSON-serializable result.
 */
export function detectDoorsJSON(repoPath) {
  const { doors, pkg } = detectDoors(repoPath);
  return {
    repo: basename(repoPath),
    package: pkg?.name || null,
    version: pkg?.version || null,
    doors: Object.fromEntries(
      Object.entries(doors).map(([type, info]) => [type, {
        detected: true,
        ...info,
      }])
    ),
    doorCount: Object.keys(doors).length,
  };
}
