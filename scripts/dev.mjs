// Starts `next dev` with a larger HTTP header limit (64 KB instead of Node's 16 KB).
// On localhost every app shares the same cookies; with the Server Action headers added,
// requests can exceed 16 KB and fail with "431 Request Header Fields Too Large".
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const nodeOptions = [process.env.NODE_OPTIONS, "--max-http-header-size=65536"].filter(Boolean).join(" ");

const child = spawn(process.execPath, [nextBin, "dev", "-p", "3001", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => child.kill(event));
