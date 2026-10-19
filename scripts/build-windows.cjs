const { spawnSync } = require("node:child_process");
const { copyFileSync, mkdirSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { build, Platform } = require("electron-builder");
const packageJson = require("../package.json");

const projectRoot = path.resolve(__dirname, "..");
const tempOutput = path.join(os.tmpdir(), `SynexOS-build-${Date.now()}`);
const releaseOutput = path.join(projectRoot, "release");
const installerName = `SynexOS-Setup-${packageJson.version}.exe`;

async function main() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Run this script through npm run desktop:win.");

  const buildResult = spawnSync(process.execPath, [npmCli, "run", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  if (buildResult.status !== 0) process.exit(buildResult.status || 1);

  await build({
    projectDir: projectRoot,
    targets: Platform.WINDOWS.createTarget("nsis"),
    publish: "never",
    config: {
      directories: { output: tempOutput },
    },
  });

  mkdirSync(releaseOutput, { recursive: true });
  copyFileSync(path.join(tempOutput, installerName), path.join(releaseOutput, installerName));
  rmSync(tempOutput, { recursive: true, force: true });
  console.log(`Windows installer created at ${path.join("release", installerName)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
