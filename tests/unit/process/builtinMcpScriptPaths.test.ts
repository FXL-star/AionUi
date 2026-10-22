/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveBuiltinMcpBaseDir } from '@process/resources/builtinMcp/scriptPaths';

// Absolute paths, so the assertions hold on every platform.
const MODULE_DIR = path.resolve('/app/out/main');
const ENTRY_FILE = path.join(MODULE_DIR, 'index.js');
const CHUNK_DIR = path.join(MODULE_DIR, 'chunks');

describe('resolveBuiltinMcpBaseDir', () => {
  it('anchors on the directory of an absolute main module path', () => {
    expect(resolveBuiltinMcpBaseDir(ENTRY_FILE, path.resolve('/elsewhere'))).toBe(MODULE_DIR);
  });

  it('falls back to the bundle directory when require.main is not a file path', () => {
    // Electron 44 exposes the internal "electron" bootstrap module as require.main.
    expect(resolveBuiltinMcpBaseDir('electron', MODULE_DIR)).toBe(MODULE_DIR);
    expect(resolveBuiltinMcpBaseDir('index.js', MODULE_DIR)).toBe(MODULE_DIR);
    expect(resolveBuiltinMcpBaseDir(undefined, MODULE_DIR)).toBe(MODULE_DIR);
  });

  it('normalizes a code-split chunk directory to its parent', () => {
    expect(resolveBuiltinMcpBaseDir(undefined, CHUNK_DIR)).toBe(MODULE_DIR);
  });
});
