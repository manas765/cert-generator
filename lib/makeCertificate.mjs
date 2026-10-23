import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import fs from "node:fs";

const TEMPLATE_BYTES = fs.readFileSync(new URL("../assets/certificate-template.png", import.meta.url));
const FONT_BYTES = fs.readFileSync(new URL("../assets/Roboto-Bold.ttf", import.meta.url));

const PAGE_W = 841.89; // A4 landscape width in points
const VERIFY_BASE = process.env.VERIFY_BASE_URL || "https://example.com/verify";
const TEXT_COLOR = rgb(0.1, 0.1, 0.1);

// All numbers below are in template pixels. Replace with Akshata's final values.
const NAME_Y = 620;          // distance of the name baseline from the top
const NAME_MAX_WIDTH = 1200;
const NAME_SIZE = 90;
const QR_X = 80;
const QR_Y = 60;             // distance of the QR bottom edge from the bottom
const QR_SIZE = 220;

export async function makeCertificate(person) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(FONT_BYTES, { subset: true });
  const img = await pdf.embedPng(TEMPLATE_BYTES);

  const scale = PAGE_W / img.width;
  const W = img.width * scale;
  const H = img.height * scale;
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });

  // Name: centered, shrinks until it fits
  let size = NAME_SIZE;
  while (font.widthOfTextAtSize(person.name, size) > NAME_MAX_WIDTH && size > 20) {
    size -= 2;
  }
  const nameW = font.widthOfTextAtSize(person.name, size) * scale;
  page.drawText(person.name, {
    x: (W - nameW) / 2,
    y: H - NAME_Y * scale,
    size: size * scale,
    font,
    color: TEXT_COLOR,
  });

  // Certificate ID, bottom right
  const idText = `Certificate ID: ${person.code}`;
  const idSize = 24 * scale;
  const idW = font.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: W - 80 * scale - idW,
    y: 60 * scale,
    size: idSize,
    font,
    color: TEXT_COLOR,
  });

  // QR code linking to the verification page, bottom left
  const qrPng = await QRCode.toBuffer(`${VERIFY_BASE}/${person.code}`, {
    type: "png",
    margin: 1,
    width: 400,
  });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, {
    x: QR_X * scale,
    y: QR_Y * scale,
    width: QR_SIZE * scale,
    height: QR_SIZE * scale,
  });

  pdf.setTitle(`Certificate - ${person.name}`);
  return await pdf.save();
}