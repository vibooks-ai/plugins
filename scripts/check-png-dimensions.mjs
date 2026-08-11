#!/usr/bin/env node

import { readFileSync } from "node:fs";

const [imagePath, minimumWidthRaw, minimumHeightRaw] = process.argv.slice(2);
const minimumWidth = Number.parseInt(minimumWidthRaw, 10);
const minimumHeight = Number.parseInt(minimumHeightRaw, 10);

if (!imagePath || !Number.isInteger(minimumWidth) || !Number.isInteger(minimumHeight)) {
  console.error("Usage: check-png-dimensions.mjs <image.png> <minimum-width> <minimum-height>");
  process.exit(2);
}

const png = readFileSync(imagePath);
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (png.length < 24 || !png.subarray(0, 8).equals(signature) || png.toString("ascii", 12, 16) !== "IHDR") {
  console.error(`Not a valid PNG with an IHDR header: ${imagePath}`);
  process.exit(1);
}

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width < minimumWidth || height < minimumHeight) {
  console.error(
    `PNG dimensions are too small: ${imagePath} is ${width}x${height}; minimum is ${minimumWidth}x${minimumHeight}.`,
  );
  process.exit(1);
}

console.log(`PNG dimensions passed: ${imagePath} is ${width}x${height}.`);
