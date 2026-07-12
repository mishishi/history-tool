#!/usr/bin/env node
/**
 * scripts/install-hooks.mjs
 *
 * 自动安装 .githooks/ 下的 git hooks
 * 由 package.json 的 postinstall 自动调用
 * - 找不到 .git/ (例如在 CI container 里) 静默跳过
 * - 找到 .git/ 就 git config core.hooksPath .githooks
 *
 * 为什么不在 .git/hooks/ 直接放:
 *   .git/hooks/ 不进 git, 团队其他人 clone 不会自动拿到
 *   .githooks/ 跟代码一起 commit, 配 core.hooksPath 共享
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const GIT_DIR = resolve(ROOT, '.git');

if (!existsSync(GIT_DIR)) {
  // CI 或 npm install 在没 .git 的环境里 — 静默跳过
  process.exit(0);
}

try {
  execSync('git config core.hooksPath .githooks', {
    cwd: ROOT,
    stdio: 'ignore',
  });
  console.log('✅ git hooks installed (core.hooksPath = .githooks)');
} catch (err) {
  console.warn('⚠️ failed to install git hooks:', err.message);
}
