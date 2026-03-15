// lib/imageMatecher.ts
import { spawn } from "child_process";
import path from "path";

interface MatchResult {
  match: boolean;
  status: boolean;
  distance: number | null;
}

export default async function MatchFaces(
  registeredImageSource: string | Buffer,
  punchImageSource: string | Buffer,
): Promise<MatchResult> {
  const toStr = (s: string | Buffer) =>
    Buffer.isBuffer(s) ? s.toString("base64") : s;

  const payload = JSON.stringify({
    registered: toStr(registeredImageSource),
    punch: toStr(punchImageSource),
  });

  const cwd = process.cwd();
  const workerPath = path.join(cwd, "lib", "face-worker.ts");
  const tsxBin = path.join(cwd, "node_modules", ".bin", "tsx.cmd");

  return new Promise((resolve) => {
    // On Windows with shell:true, paths with spaces MUST be double-quoted.
    // We pass the whole command as a single string to cmd.exe.
    const command =
      process.platform === "win32"
        ? `"${tsxBin}" "${workerPath}"`
        : `"${tsxBin}" "${workerPath}"`;

    const child = spawn(command, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    child.on("close", (code) => {
      // Strip Mongoose duplicate index warnings from stderr before logging —
      // they come from face-worker loading models and are harmless noise.
      const realErrors = stderr
        .split("\n")
        .filter(
          (l) =>
            l.trim() &&
            !l.includes("[MONGOOSE]") &&
            !l.includes("DeprecationWarning"),
        )
        .join("\n");

      if (code !== 0) {
        if (realErrors) console.error("[FaceWorker] stderr:", realErrors);
        console.error("[FaceWorker] exited with code", code);
        resolve({ match: false, status: false, distance: null });
        return;
      }

      // stdout may contain tsx startup noise before the JSON — find the JSON object
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[FaceWorker] no JSON in output:", stdout);
        resolve({ match: false, status: false, distance: null });
        return;
      }

      try {
        resolve(JSON.parse(jsonMatch[0]) as MatchResult);
      } catch {
        console.error("[FaceWorker] bad JSON:", jsonMatch[0]);
        resolve({ match: false, status: false, distance: null });
      }
    });

    child.on("error", (err) => {
      console.error("[FaceWorker] spawn error:", err);
      resolve({ match: false, status: false, distance: null });
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}
