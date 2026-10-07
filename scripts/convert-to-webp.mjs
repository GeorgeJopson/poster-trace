// Converts every PNG in the image folders below to WebP, then removes the PNG.
// Usage: node scripts/convert-to-webp.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dirs = ["public/analytics-images", "public/poster-images"];

for (const dir of dirs) {
  const pngs = fs.readdirSync(dir).filter((file) => file.endsWith(".png"));
  for (const file of pngs) {
    const input = path.join(dir, file);
    const output = input.replace(/\.png$/, ".webp");
    await sharp(input).webp({ quality: 80 }).toFile(output);
    const before = fs.statSync(input).size;
    const after = fs.statSync(output).size;
    fs.unlinkSync(input);
    console.log(
      `${output}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`,
    );
  }
}
