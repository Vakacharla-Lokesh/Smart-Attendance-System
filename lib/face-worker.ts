// lib/face-worker.ts
// Run by the API route as a child process using: node lib/face-worker.js
// Receives JSON on stdin: { registered: string, punch: string }
// Writes JSON on stdout: { match: boolean, status: boolean, distance: number | null }
// Never import this file from Next.js — it must only run in plain Node.js.

// Polyfill TextEncoder for face-api
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextEncoder: UtilTextEncoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.TextEncoder = UtilTextEncoder;
}

// Set up TensorFlow with WASM backend FIRST
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tf = require("@tensorflow/tfjs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@tensorflow/tfjs-backend-wasm");

// CRITICAL: Use the explicit WASM version, NOT the default export which tries to load tfjs-node
// eslint-disable-next-line @typescript-eslint/no-require-imports
const faceapi = require("@vladmandic/face-api/dist/face-api.node-wasm.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const canvas = require("canvas");

const { Canvas } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function initTensorFlow() {
  // Set WASM backend for TensorFlow
  await tf.ready();
  try {
    await tf.setBackend("wasm");
  } catch (err) {
    // If WASM fails, fall back to CPU backend
    console.warn("WASM backend failed, falling back to CPU", err);
    await tf.setBackend("cpu");
  }
}

async function loadModels() {
  if (modelsLoaded) return;
  await initTensorFlow();
  // Load models from CDN (official face-api model host)
  const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
  await faceapi.nets.ssdMobilenetv1.load(modelUrl);
  await faceapi.nets.faceLandmark68Net.load(modelUrl);
  await faceapi.nets.faceRecognitionNet.load(modelUrl);
  modelsLoaded = true;
}

async function getDescriptor(source: string) {
  let imgSource: string | Buffer = source;
  if (source.startsWith("data:image/")) {
    imgSource = Buffer.from(
      source.replace(/^data:image\/\w+;base64,/, ""),
      "base64",
    );
  } else if (source.length > 200 && /^[A-Za-z0-9+/]+={0,2}$/.test(source)) {
    try {
      imgSource = Buffer.from(source, "base64");
    } catch {
      /* leave as string */
    }
  }

  const img = await canvas.loadImage(imgSource);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
}

async function main() {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const { registered, punch } = JSON.parse(Buffer.concat(chunks).toString());

  await loadModels();

  const [regDesc, punchDesc] = await Promise.all([
    getDescriptor(registered),
    getDescriptor(punch),
  ]);

  if (!regDesc || !punchDesc) {
    process.stdout.write(
      JSON.stringify({ match: false, status: false, distance: null }),
    );
    return;
  }

  const distance = faceapi.euclideanDistance(regDesc, punchDesc);
  const matched = distance < 0.6;
  process.stdout.write(
    JSON.stringify({
      match: matched,
      status: matched,
      distance: parseFloat(distance.toFixed(4)),
    }),
  );
}

main().catch((err) => {
  process.stderr.write(String(err));
  process.exit(1);
});
