#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const testBuildDir = await mkdtemp(path.join(os.tmpdir(), "truekind-test-"));
const nodePath = path.join(projectRoot, "node_modules");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_PATH: process.env.NODE_PATH
          ? `${nodePath}${path.delimiter}${process.env.NODE_PATH}`
          : nodePath,
      },
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

try {
  await run(process.execPath, [
    path.join(projectRoot, "node_modules", "typescript", "bin", "tsc"),
    "-p",
    "tsconfig.test.json",
    "--outDir",
    testBuildDir,
  ]);
  await run(process.execPath, [path.join(testBuildDir, "tests", "run-tests.js")]);
} finally {
  await rm(testBuildDir, { recursive: true, force: true });
}
