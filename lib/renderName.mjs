import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";

GlobalFonts.registerFromPath(
  fileURLToPath(new URL("../assets/Caveat.ttf", import.meta.url)),
  "Caveat"
);

// All numbers are in template pixels (the template is 2264 x 1600)
export const NAME_BOX = { x: 332, y: 820, w: 1600, h: 220 }; // centred on x = 1132
const BASELINE_Y = 990;        // name baseline, from the top of the page
const GRADIENT_TOP = 862;      // white starts here
const GRADIENT_BOTTOM = 1030;  // orange ends here
const FONT_SIZE = 128;         // Figma 64px at 2x
const LETTER_SPACING = 10.24;  // Figma 5.12px at 2x
const MAX_WIDTH = 1300;        // longer names shrink to fit
const X_OFFSET = 0;            // nudge left/right if needed
const SCALE = 2;               // render at 2x so it stays sharp

export function renderName(name) {
  const canvas = createCanvas(NAME_BOX.w * SCALE, NAME_BOX.h * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  const chars = Array.from(name);
  let size = FONT_SIZE;
  let spacing = LETTER_SPACING;

  const measure = () => {
    ctx.font = `${size}px Caveat`;
    return (
      chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
      spacing * (chars.length - 1)
    );
  };

  let total = measure();
  while (total > MAX_WIDTH && size > 40) {
    size -= 4;
    spacing = LETTER_SPACING * (size / FONT_SIZE);
    total = measure();
  }

  const grad = ctx.createLinearGradient(
    0, GRADIENT_TOP - NAME_BOX.y,
    0, GRADIENT_BOTTOM - NAME_BOX.y
  );
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(1, "#FF6A00");
  ctx.fillStyle = grad;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  let x = NAME_BOX.w / 2 - total / 2 + X_OFFSET;
  const y = BASELINE_Y - NAME_BOX.y;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }

  return canvas.toBuffer("image/png");
}
