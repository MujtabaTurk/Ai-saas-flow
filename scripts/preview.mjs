import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

function readOption(name, fallback) {
  const longOption = `--${name}`;
  const equalsOption = `${longOption}=`;
  const longIndex = process.argv.indexOf(longOption);
  const shortIndex = name === "port" ? process.argv.indexOf("-p") : -1;
  const equalsValue = process.argv.find((value) =>
    value.startsWith(equalsOption)
  );

  if (equalsValue) {
    return equalsValue.slice(equalsOption.length);
  }

  if (longIndex !== -1 && process.argv[longIndex + 1]) {
    return process.argv[longIndex + 1];
  }

  if (shortIndex !== -1 && process.argv[shortIndex + 1]) {
    return process.argv[shortIndex + 1];
  }

  return fallback;
}

function validatePort(port) {
  const parsedPort = Number(port);

  if (
    !Number.isInteger(parsedPort) ||
    parsedPort < 1 ||
    parsedPort > 65535
  ) {
    throw new Error(`Invalid preview port: ${port}`);
  }

  return String(parsedPort);
}

const port = validatePort(readOption("port", process.env.PORT || "3100"));
const host = readOption("host", process.env.HOSTNAME || "127.0.0.1");
const publicHost = host === "0.0.0.0" ? "127.0.0.1" : host;
const previewUrl = `http://${publicHost}:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const environment = {
  ...process.env,
  HOSTNAME: host,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || previewUrl,
  PORT: port,
  SERVICEFLOW_LOCAL_PREVIEW: "true"
};
const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");

if (!existsSync(buildIdPath)) {
  console.log("[preview] No production build found. Running npm run build.");

  const build = spawnSync(npmCommand, ["run", "build"], {
    env: environment,
    stdio: "inherit"
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
} else {
  console.log("[preview] Existing production build found.");
}

console.log(`[preview] Starting ServiceFlow on ${previewUrl}`);
console.log("[preview] Health check route: /api/health");

const server = spawn(
  npmCommand,
  ["run", "start", "--", "-H", host, "-p", port],
  {
    env: environment,
    stdio: "inherit"
  }
);

server.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[preview] Server stopped by signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 0);
});
