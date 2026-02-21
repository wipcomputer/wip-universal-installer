# Minimal Six-Door Template

The smallest possible agent-native tool. Four files, four doors.

```
core.mjs         ← your logic
cli.mjs          ← thin CLI wrapper
mcp-server.mjs   ← MCP server
SKILL.md         ← agent instructions
package.json     ← name, bin, exports
```

Copy this folder, rename everything, replace `hello()` with your functions.

## Test it

```bash
node cli.mjs world       # Hello, world!
wip-install --dry-run .  # Detected 4 door(s): cli, module, mcp, skill
```
