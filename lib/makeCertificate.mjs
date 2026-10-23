import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import fs from "node:fs";

const TEMPLATE_BYTES = fs.readFileSync(new URL("../assets/certificate-template.png", import.meta.url));
const FONT_BYTES = fs.readFileSync(new URL("../assets/Caveat-Regular.ttf", import.meta.url));
const ID_FONT_BYTES = fs.readFileSync(new URL("../assets/Roboto-Bold.ttf", import.meta.url));

const PAGE_W = 841.89; // A4 landscape width in points
const VERIFY_BASE = process.env.VERIFY_BASE_URL || "https://example.com/verify";
const TEXT_COLOR = rgb(1, 0.698, 0.478);
const ID_COLOR = rgb(0.7, 0.7, 0.7);

// All numbers below are in template pixels (template is 2264 x 1600).
const NAME_Y = 985;          // distance of the name baseline from the top
const NAME_MAX_WIDTH = 1400;
const NAME_SIZE = 128;
const NAME_LETTER_SPACING = 0.08; // in em, same as Figma (5.12 / 64)
const QR_X = 110;
const QR_Y = 125;            // distance of the QR bottom edge from the bottom
const QR_SIZE = 200;
const ID_SIZE = 20;
const ID_Y = 77;             // distance of the ID baseline from the bottom

export async function makeCertificate(person) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(FONT_BYTES, { subset: false });
  const idFont = await pdf.embedFont(ID_FONT_BYTES, { subset: true });
  const img = await pdf.embedPng(TEMPLATE_BYTES);

  const scale = PAGE_W / img.width;
  const W = img.width * scale;
  const H = img.height * scale;
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });

  // Name: drawn one character at a time, centered, shrinks until it fits
  const chars = Array.from(person.name.normalize("NFC"));
  const gap = (s) => s * NAME_LETTER_SPACING;
  const measure = (s) =>
    chars.reduce((sum, c) => sum + font.widthOfTextAtSize(c, s) + gap(s), 0) - gap(s);

  let size = NAME_SIZE;
  while (measure(size) > NAME_MAX_WIDTH && size > 20) {
    size -= 2;
  }
  let x = (W - measure(size) * scale) / 2;
  const nameY = H - NAME_Y * scale;
  for (const c of chars) {
    page.drawText(c, { x, y: nameY, size: size * scale, font, color: TEXT_COLOR });
    x += (font.widthOfTextAtSize(c, size) + gap(size)) * scale;
  }

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

  // Certificate ID, centered under the QR
  const idText = `ID: ${person.code}`;
  const idW = idFont.widthOfTextAtSize(idText, ID_SIZE);
  page.drawText(idText, {
    x: (QR_X + (QR_SIZE - idW) / 2) * scale,
    y: ID_Y * scale,
    size: ID_SIZE * scale,
    font: idFont,
    color: ID_COLOR,
  });

  pdf.setTitle(`Certificate - ${person.name}`);
  return await pdf.save();
}
