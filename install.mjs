#!/usr/bin/env node
// wip-universal-installer/install.mjs
// Universal Installer for WIP.computer repos.
// Reads a repo, detects available doors, installs them all.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const OPENCLAW_DIR = join(process.env.HOME, '.openclaw');
const EXTENSIONS_DIR = join(OPENCLAW_DIR, 'extensions');

function log(msg) { console.log(`  ${msg}`); }
function ok(msg) { console.log(`  ✓ ${msg}`); }
function skip(msg) { console.log(`  - ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); }

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function detectDoors(repoPath) {
  const doors = {};
  const pkg = readJSON(join(repoPath, 'package.json'));

  // CLI door: package.json has bin entry
  if (pkg?.bin) {
    doors.cli = { bin: pkg.bin, name: pkg.name };
  }

  // OpenClaw plugin door: openclaw.plugin.json exists
  const ocPlugin = join(repoPath, 'openclaw.plugin.json');
  if (existsSync(ocPlugin)) {
    doors.openclaw = { config: readJSON(ocPlugin), path: ocPlugin };
  }

  // Claude Code hook door: check for PreToolUse/Stop hook patterns in package.json
  if (pkg?.claudeCode?.hook) {
    doors.claudeCodeHook = pkg.claudeCode.hook;
  }
  // Also detect by convention: guard.mjs = PreToolUse hook
  if (existsSync(join(repoPath, 'guard.mjs'))) {
    doors.claudeCodeHook = {
      event: 'PreToolUse',
      matcher: 'Edit|Write',
      command: `node "${join(repoPath, 'guard.mjs')}"`,
      timeout: 5
    };
  }

  // MCP server door: .mcp.json or mcp-server.mjs/ts
  const mcpFiles = ['mcp-server.mjs', 'mcp-server.js', 'dist/mcp-server.js'];
  for (const f of mcpFiles) {
    if (existsSync(join(repoPath, f))) {
      doors.mcp = { file: f, name: pkg?.name || basename(repoPath) };
      break;
    }
  }

  // Skill door: SKILL.md exists
  if (existsSync(join(repoPath, 'SKILL.md'))) {
    doors.skill = { path: join(repoPath, 'SKILL.md') };
  }

  // Module door: package.json has main or exports
  if (pkg?.main || pkg?.exports) {
    doors.module = { main: pkg.main || pkg.exports };
  }

  return { doors, pkg };
}

function installCLI(repoPath, door) {
  try {
    execSync('npm install -g .', { cwd: repoPath, stdio: 'pipe' });
    const binNames = typeof door.bin === 'string' ? [basename(repoPath)] : Object.keys(door.bin);
    ok(`CLI: ${binNames.join(', ')} installed globally`);
    return true;
  } catch (e) {
    // Fallback: link instead of install
    try {
      execSync('npm link', { cwd: repoPath, stdio: 'pipe' });
      ok(`CLI: linked globally via npm link`);
      return true;
    } catch {
      fail(`CLI: install failed. Run manually: cd "${repoPath}" && npm install -g .`);
      return false;
    }
  }
}

function installOpenClaw(repoPath, door) {
  const name = door.config?.name || basename(repoPath);
  const dest = join(EXTENSIONS_DIR, name);

  if (existsSync(dest)) {
    skip(`OpenClaw: ${name} already installed at ${dest}`);
    return true;
  }

  try {
    mkdirSync(dest, { recursive: true });
    cpSync(repoPath, dest, { recursive: true, filter: (src) => !src.includes('.git') });
    ok(`OpenClaw: copied to ${dest}`);

    // Install deps if needed
    if (existsSync(join(dest, 'package.json'))) {
      try {
        execSync('npm install --omit=dev', { cwd: dest, stdio: 'pipe' });
        ok(`OpenClaw: dependencies installed`);
      } catch {
        skip(`OpenClaw: no deps needed`);
      }
    }
    return true;
  } catch (e) {
    fail(`OpenClaw: copy failed. ${e.message}`);
    return false;
  }
}

function installClaudeCodeHook(repoPath, door) {
  const settingsPath = join(process.env.HOME, '.claude', 'settings.json');
  let settings = readJSON(settingsPath);

  if (!settings) {
    skip(`Claude Code: no settings.json found at ${settingsPath}`);
    return false;
  }

  if (!settings.hooks) settings.hooks = {};
  const event = door.event || 'PreToolUse';

  if (!settings.hooks[event]) settings.hooks[event] = [];

  // Check if already installed
  const hookCommand = door.command || `node "${join(repoPath, 'guard.mjs')}"`;
  const existing = settings.hooks[event].some(entry =>
    entry.hooks?.some(h => h.command === hookCommand)
  );

  if (existing) {
    skip(`Claude Code: ${event} hook already configured`);
    return true;
  }

  settings.hooks[event].push({
    matcher: door.matcher || undefined,
    hooks: [{
      type: 'command',
      command: hookCommand,
      timeout: door.timeout || 10
    }]
  });

  try {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    ok(`Claude Code: ${event} hook added to settings.json`);
    return true;
  } catch (e) {
    fail(`Claude Code: failed to update settings.json. ${e.message}`);
    return false;
  }
}

async function main() {
  const target = process.argv[2];

  if (!target || target === '--help') {
    console.log('');
    console.log('  Universal Installer');
    console.log('  Detects and installs all available interfaces from a WIP.computer repo.');
    console.log('');
    console.log('  Usage:');
    console.log('    wip-install /path/to/repo');
    console.log('    wip-install https://github.com/wipcomputer/repo-name');
    console.log('    wip-install wipcomputer/repo-name');
    console.log('');
    console.log('  What it detects:');
    console.log('    CLI        ... package.json bin entry -> npm install -g');
    console.log('    OpenClaw   ... openclaw.plugin.json -> copies to extensions/');
    console.log('    CC Hook    ... guard.mjs or claudeCode.hook -> adds to settings.json');
    console.log('    MCP Server ... mcp-server.mjs -> prints config for .mcp.json');
    console.log('    Skill      ... SKILL.md -> available for OpenClaw agents');
    console.log('    Module     ... ESM exports -> importable by other tools');
    console.log('');
    process.exit(0);
  }

  // Resolve target: GitHub URL, org/repo shorthand, or local path
  let repoPath;

  if (target.startsWith('http') || target.startsWith('git@') || target.match(/^[\w-]+\/[\w-]+$/)) {
    // Clone from GitHub
    const url = target.match(/^[\w-]+\/[\w-]+$/)
      ? `https://github.com/${target}.git`
      : target;
    const repoName = basename(url).replace('.git', '');
    repoPath = join('/tmp', `wip-install-${repoName}`);

    console.log('');
    log(`Cloning ${url}...`);
    try {
      if (existsSync(repoPath)) {
        execSync(`rm -rf "${repoPath}"`);
      }
      execSync(`git clone "${url}" "${repoPath}"`, { stdio: 'pipe' });
      ok(`Cloned to ${repoPath}`);
    } catch (e) {
      fail(`Clone failed: ${e.message}`);
      process.exit(1);
    }
  } else {
    repoPath = resolve(target);
    if (!existsSync(repoPath)) {
      fail(`Path not found: ${repoPath}`);
      process.exit(1);
    }
  }

  // Detect doors
  console.log('');
  const repoName = basename(repoPath);
  console.log(`  Installing: ${repoName}`);
  console.log(`  ${'─'.repeat(40)}`);

  const { doors, pkg } = detectDoors(repoPath);
  const doorNames = Object.keys(doors);

  if (doorNames.length === 0) {
    skip('No installable interfaces detected.');
    process.exit(0);
  }

  log(`Detected ${doorNames.length} door(s): ${doorNames.join(', ')}`);
  console.log('');

  // Install each door
  let installed = 0;

  if (doors.cli) {
    installCLI(repoPath, doors.cli);
    installed++;
  }

  if (doors.openclaw) {
    installOpenClaw(repoPath, doors.openclaw);
    installed++;
  }

  if (doors.claudeCodeHook) {
    installClaudeCodeHook(repoPath, doors.claudeCodeHook);
    installed++;
  }

  if (doors.mcp) {
    console.log('');
    log(`MCP Server detected: ${doors.mcp.file}`);
    log(`Add to .mcp.json:`);
    console.log(JSON.stringify({
      [doors.mcp.name]: {
        command: 'node',
        args: [join(repoPath, doors.mcp.file)]
      }
    }, null, 2));
    installed++;
  }

  if (doors.skill) {
    ok(`Skill: SKILL.md available at ${doors.skill.path}`);
    installed++;
  }

  if (doors.module) {
    ok(`Module: import from "${doors.module.main}"`);
    installed++;
  }

  console.log('');
  console.log(`  Done. ${installed} door(s) processed.`);
  console.log('');
}

main().catch(e => {
  fail(e.message);
  process.exit(1);
});
