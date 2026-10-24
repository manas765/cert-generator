import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fs from "node:fs";
import { renderName, NAME_BOX } from "./renderName.mjs";

const TEMPLATE_BYTES = fs.readFileSync(new URL("../assets/certificate-template.jpg", import.meta.url));

const PAGE_W = 841.89; // A4 landscape width in points
const VERIFY_BASE = process.env.VERIFY_BASE_URL || "https://example.com/verify";

// All numbers are in template pixels (the template is 2264 x 1600)
const QR_SIZE = 210;
const QR_X = 1132 - QR_SIZE / 2; // centred between the two signatures
const QR_TOP = 1285;             // distance from the top of the page to the QR's top edge
const ID_Y = 1530;               // baseline of the ID text, from the top
const ID_SIZE = 24;
const ID_COLOR = rgb(0.65, 0.65, 0.65);

export async function makeCertificate(person) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const img = await pdf.embedJpg(TEMPLATE_BYTES);

  const scale = PAGE_W / img.width;
  const W = img.width * scale;
  const H = img.height * scale;
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });

  // Name: Caveat with a white-to-orange gradient, drawn as a transparent image
  const nameImg = await pdf.embedPng(renderName(person.name));
  page.drawImage(nameImg, {
    x: NAME_BOX.x * scale,
    y: H - (NAME_BOX.y + NAME_BOX.h) * scale,
    width: NAME_BOX.w * scale,
    height: NAME_BOX.h * scale,
  });

  // QR code, centred between the two signatures
  const qrPng = await QRCode.toBuffer(`${VERIFY_BASE}/${person.code}`, {
    type: "png",
    margin: 2,
    width: 600,
  });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, {
    x: QR_X * scale,
    y: H - (QR_TOP + QR_SIZE) * scale,
    width: QR_SIZE * scale,
    height: QR_SIZE * scale,
  });

  // Certificate ID, centred under the QR
  const idText = `ID: ${person.code}`;
  const idSize = ID_SIZE * scale;
  const idW = font.widthOfTextAtSize(idText, idSize);
  page.drawText(idText, {
    x: (W - idW) / 2,
    y: H - ID_Y * scale,
    size: idSize,
    font,
    color: ID_COLOR,
  });

  pdf.setTitle(`Certificate - ${person.name}`);
  return await pdf.save();
}