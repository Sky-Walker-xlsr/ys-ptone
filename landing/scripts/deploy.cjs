'use strict';
// Cross-platform deploy script.
// On Windows: builds in WSL (Linux env required by OpenNext), then deploys via Wrangler.
// On Linux/Mac: runs everything directly.
const { spawnSync } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const os = require('os');

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (os.platform() !== 'win32') {
  run('npx', ['opennextjs-cloudflare', 'build'], { shell: true });
  run('npx', ['wrangler', 'deploy'], { shell: true });
  process.exit(0);
}

// ── Windows path ──────────────────────────────────────────────────────────────
const winCwd = process.cwd();
const wslCwd = winCwd
  .replace(/\\/g, '/')
  .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);

const tmpScriptWin = join(os.tmpdir(), 'ptone-landing-build.sh');
const tmpScriptWsl = tmpScriptWin
  .replace(/\\/g, '/')
  .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);

// The build script runs inside WSL.
// We source nvm/.bashrc so the correct Linux Node.js is used, then strip all
// Windows /mnt/ paths from PATH to prevent Windows npm from being picked up.
const buildScript = `#!/bin/bash
# Load Linux Node.js (nvm or system)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && . "$HOME/.bashrc" 2>/dev/null || true

# Remove Windows interop paths so Windows npm is never called from WSL
export PATH=$(echo "$PATH" | tr ':' '\\n' | grep -v '^/mnt/' | tr '\\n' ':' | sed 's/:$//')

# Verify we have Linux node
echo "Using node: $(which node) $(node --version)"
echo "Using npm:  $(which npm) $(npm --version)"

set -e

TMP=$(mktemp -d)
trap "rm -rf \$TMP" EXIT

echo ""
echo "[1/4] Copying source to Linux filesystem: \$TMP"
tar --exclude='./node_modules' \\
    --exclude='./.next' \\
    --exclude='./.open-next' \\
    -C "${wslCwd}" -cf - . | tar -xf - -C "\$TMP"

cd "\$TMP"
echo "[2/4] Installing Linux dependencies..."
npm install

echo "[3/4] Building with OpenNext (Linux)..."
npx opennextjs-cloudflare build

echo "[4/4] Copying .open-next back to project..."
rm -rf "${wslCwd}/.open-next"
cp -r .open-next "${wslCwd}/.open-next"

echo ""
echo "Build complete."
`;

writeFileSync(tmpScriptWin, buildScript, 'utf8');

console.log('\n> Building in WSL (OpenNext requires a Linux environment)...\n');
run('wsl', ['bash', tmpScriptWsl]);

try { unlinkSync(tmpScriptWin); } catch (_) {}

console.log('\n> Deploying to Cloudflare Workers...\n');
run('npx', ['wrangler', 'deploy'], { shell: true });
