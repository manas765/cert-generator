import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";

const img = await loadImage("assets/certificate-template.png");
const canvas = createCanvas(img.width, img.height);
canvas.getContext("2d").drawImage(img, 0, 0);
fs.writeFileSync("assets/certificate-template.jpg", canvas.toBuffer("image/jpeg", 92));
console.log("saved assets/certificate-template.jpg");