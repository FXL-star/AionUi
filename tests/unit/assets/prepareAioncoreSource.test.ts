import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const nodeRequire = createRequire(import.meta.url);
const scriptPath = path.resolve('packages/shared-scripts/src/prepare-aioncore.js');
const verifier = nodeRequire('../../../packages/shared-scripts/src/verify-bundled-aioncore-resources');
const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture({
  platform = 'win32',
  arch = 'x64',
  buildError = false,
  noArtifact = false,
  incompleteResources = false,
  exportError = false,
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aionui-source-build-'));
  tempRoots.push(root);
  const projectRoot = path.join(root, 'AionUi');
  const sourceRoot = path.join(root, 'AionCore');
  const binaryName = platform === 'win32' ? 'aioncore.exe' : 'aioncore';
  const binaryPath = path.join(root, 'custom-cargo-target', binaryName);
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, 'scripts', 'just'), { recursive: true });
  fs.writeFileSync(path.join(sourceRoot, 'Cargo.toml'), '[workspace]');
  fs.writeFileSync(path.join(sourceRoot, 'scripts', 'just', 'cargo.ps1'), '');
  fs.writeFileSync(path.join(sourceRoot, 'scripts', 'just', 'cargo.sh'), '');
  fs.mkdirSync(path.dirname(binaryPath), { recursive: true });
  fs.writeFileSync(binaryPath, 'newly compiled source');
  const bundleDir = path.join(projectRoot, 'resources', 'bundled-aioncore', `${platform}-${arch}`);
  fs.mkdirSync(bundleDir, { recursive: true });
  fs.writeFileSync(path.join(bundleDir, binaryName), 'previous bundle');

  const packageId = 'path+file:///AionCore/crates/aionui-app#aionui-app@0.2.3';
  const calls: { command: string; args: string[]; options: Record<string, unknown> }[] = [];
  const execFileSync = (command: string, args: string[], options: Record<string, unknown>) => {
    calls.push({ command, args, options });
    if (command === 'cargo' && args[0] === 'metadata') {
      return JSON.stringify({
        packages: [
          { name: 'aionui-app', version: '0.2.3', id: packageId, targets: [{ name: 'aioncore', kind: ['bin'] }] },
        ],
      });
    }
    if (command === 'powershell.exe' || command === 'bash') {
      if (buildError) throw new Error('Rust compilation failed');
      if (noArtifact) return JSON.stringify({ reason: 'build-finished', success: true });
      return [
        'non-JSON build tool output',
        JSON.stringify({
          reason: 'compiler-artifact',
          package_id: packageId,
          target: { name: 'aioncore', kind: ['bin'] },
          executable: binaryPath,
        }),
        JSON.stringify({ reason: 'build-finished', success: true }),
      ].join('\n');
    }
    if (command === path.join(bundleDir, binaryName) && args[2] === 'prepare-managed-resources') {
      if (exportError) throw new Error('Managed resource export failed');
      const managedRoot = args[4];
      if (!incompleteResources) {
        fs.mkdirSync(path.join(managedRoot, 'node', 'runtime'), { recursive: true });
        fs.writeFileSync(path.join(managedRoot, 'node', 'runtime', 'node.exe'), '');
        fs.writeFileSync(
          path.join(managedRoot, 'manifest.json'),
          JSON.stringify({
            schemaVersion: 2,
            runtimeKey: `${platform}-${arch}`,
            node: { version: '24.11.0', root: 'node/runtime', executable: 'node.exe' },
            clis: [],
          })
        );
      }
      return '';
    }
    throw new Error(`Unexpected external command: ${command}`);
  };
  const sandbox = {
    module: {
      exports: {} as { prepareAioncore: (options: Record<string, unknown>) => { dir: string; sourceType: string } },
    },
    console: { log() {}, warn() {} },
    process: {
      platform,
      arch,
      cwd: () => projectRoot,
      env: {
        AIONUI_BACKEND_SOURCE_DIR: '../AionCore',
        AIONUI_BACKEND_RUN_ID: '1234',
        AIONUI_BACKEND_LOCAL_BINARY: '/unused/old-binary',
        AIONUI_BACKEND_LOCAL_BUNDLE_DIR: '/unused/old-bundle',
        AIONRS: path.join(root, 'aionrs'),
      },
    },
    require: (name: string) => {
      if (name === 'child_process')
        return {
          execFileSync,
          execSync: () => {
            throw new Error('Source builds must not download releases');
          },
        };
      if (name === './verify-bundled-aioncore-resources') return verifier;
      return nodeRequire(name);
    },
  };
  runInNewContext(fs.readFileSync(scriptPath, 'utf8'), sandbox, { filename: scriptPath });
  const prepare = (overrides = {}) =>
    sandbox.module.exports.prepareAioncore({ projectRoot, platform, arch, version: 'latest', ...overrides });
  return { prepare, projectRoot, sourceRoot, binaryPath, binaryName, bundleDir, calls };
}

describe('prepare-aioncore source builds', () => {
  it('bundles the Cargo-reported executable and verifies exported resources without downloading a release', () => {
    const context = fixture();
    const result = context.prepare();
    expect(result.sourceType).toBe('local-source');
    expect(fs.readFileSync(path.join(result.dir, context.binaryName), 'utf8')).toBe('newly compiled source');
    expect(fs.existsSync(path.join(result.dir, '.prepare-data'))).toBe(false);
  });

  it('records the source package version instead of the frontend release pin', () => {
    const context = fixture();
    const result = context.prepare({ version: 'v0.1.0' });
    expect(JSON.parse(fs.readFileSync(path.join(result.dir, 'manifest.json'), 'utf8'))).toMatchObject({
      version: 'v0.2.3',
      sourceType: 'local-source',
      source: { path: context.sourceRoot, binaryPath: context.binaryPath, target: 'x86_64-pc-windows-msvc' },
    });
  });

  it('stops on compilation failure and preserves the previously prepared binary', () => {
    const context = fixture({ buildError: true });
    expect(() => context.prepare()).toThrow('Rust compilation failed');
    expect(fs.readFileSync(path.join(context.bundleDir, context.binaryName), 'utf8')).toBe('previous bundle');
  });

  it('rejects a successful command without an executable artifact instead of using a stale binary', () => {
    const context = fixture({ noArtifact: true });
    expect(() => context.prepare()).toThrow(/did not produce an aioncore executable/);
  });

  it('rejects a checkout missing the backend build wrapper', () => {
    const context = fixture();
    fs.unlinkSync(path.join(context.sourceRoot, 'scripts', 'just', 'cargo.ps1'));
    expect(() => context.prepare()).toThrow(/must point to an AionCore source checkout/);
  });

  it('rejects cross-architecture packaging before compiling', () => {
    const context = fixture();
    expect(() => context.prepare({ arch: 'arm64' })).toThrow(/require the host target win32-x64/);
    expect(context.calls).toHaveLength(0);
  });

  it('rejects exported resources that lack the managed-resources contract', () => {
    const context = fixture({ incompleteResources: true });
    expect(() => context.prepare()).toThrow(/managed-resources\/manifest\.json/);
  });

  it('stops packaging when managed resource export fails', () => {
    const context = fixture({ exportError: true });
    expect(() => context.prepare()).toThrow('Managed resource export failed');
  });

  it.each(['win32', 'darwin', 'linux'])(
    'uses the %s Cargo wrapper and forwards local SDK configuration',
    (platform) => {
      const context = fixture({ platform });
      context.prepare();
      const build = context.calls[1];
      expect(build.command).toBe(platform === 'win32' ? 'powershell.exe' : 'bash');
      expect(build.options).toMatchObject({
        cwd: context.sourceRoot,
        env: { AIONRS: expect.stringContaining('aionrs') },
      });
      expect(build.args).toContain(
        path.join(context.sourceRoot, 'scripts', 'just', platform === 'win32' ? 'cargo.ps1' : 'cargo.sh')
      );
    }
  );
});
