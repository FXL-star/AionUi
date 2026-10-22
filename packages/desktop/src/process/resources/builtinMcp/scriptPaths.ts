/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';

/**
 * Resolve the directory that hosts the built-in MCP entry scripts.
 *
 * Only an absolute main-module path may be trusted as the anchor: under Electron 44
 * `require.main` is the internal "electron" bootstrap module, so its `filename` is the
 * bare string "electron" — `dirname()` then yields "." and `path.resolve()` silently
 * falls back to the process cwd, pointing the built-in MCP entries at the wrong place.
 * Anything that is not an absolute file path falls back to the directory of this bundle.
 *
 * @param mainModuleFile `require.main?.filename` as seen from the caller's module scope
 * @param moduleDir the caller's `__dirname`
 */
export const resolveBuiltinMcpBaseDir = (mainModuleFile: string | undefined, moduleDir: string): string => {
  const dir = mainModuleFile && path.isAbsolute(mainModuleFile) ? path.dirname(mainModuleFile) : moduleDir;
  // This module may itself be code-split into out/main/chunks/; the entry scripts
  // are emitted next to the main entry in out/main/.
  return path.basename(dir) === 'chunks' ? path.dirname(dir) : dir;
};
