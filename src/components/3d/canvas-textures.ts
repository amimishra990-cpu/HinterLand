import * as THREE from "three";

export type CardTextureKind =
  | "message"
  | "refined"
  | "project"
  | "calendar"
  | "tasks"
  | "agenda"
  | "talking-1"
  | "talking-2"
  | "talking-3"
  | "decision"
  | "action"
  | "question"
  | "notes"
  | "record-1"
  | "record-2"
  | "record-3";

const PAPER = "#f4efe2";
const INK = "#25332b";
const FOREST = "#304e3e";
const MUTED = "#657165";
const HAIRLINE = "rgba(37, 51, 43, 0.18)";
const TERRACOTTA = "#a95f42";
const GOLD = "#a98b4f";

const TEXTURE_WIDTH = 576;
const MAX_TEXTURE_HEIGHT = 900;
const MIN_TEXTURE_HEIGHT = 300;

function cssFont(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
}

function families() {
  return {
    serif: cssFont("--font-newsreader", "Georgia, serif"),
    sans: cssFont("--font-dm-sans", "Arial, sans-serif"),
  };
}

function seeded(seedText: string) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seedText: string
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, "rgba(255, 252, 244, 0.55)");
  wash.addColorStop(0.55, "rgba(244, 239, 226, 0)");
  wash.addColorStop(1, "rgba(214, 203, 181, 0.32)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const random = seeded(seedText);
  for (let i = 0; i < 260; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = random() * 0.9 + 0.25;
    ctx.fillStyle =
      random() > 0.55
        ? "rgba(70, 61, 45, 0.045)"
        : "rgba(255, 255, 255, 0.07)";
    ctx.fillRect(x, y, size, size);
  }

  ctx.strokeStyle = "rgba(37, 51, 43, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  ctx.fillStyle = "rgba(169, 95, 66, 0.75)";
  ctx.fillRect(0, 0, 3, height);
}

function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + spacing;
  }
  return cursor;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 12
) {
  const lines = wrapLines(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function header(
  ctx: CanvasRenderingContext2D,
  family: string,
  label: string,
  right: string,
  width: number,
  rightColor = MUTED
) {
  ctx.fillStyle = TERRACOTTA;
  ctx.fillRect(44, 42, 22, 2);

  ctx.font = `600 11px ${family}`;
  ctx.fillStyle = FOREST;
  tracked(ctx, label.toUpperCase(), 44, 66, 1.7);

  ctx.font = `600 10px ${family}`;
  ctx.fillStyle = rightColor;
  const rightWidth = ctx.measureText(right).width + (right.length - 1) * 1.2;
  tracked(ctx, right.toUpperCase(), width - 44 - rightWidth, 66, 1.2);

  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, 82);
  ctx.lineTo(width - 44, 82);
  ctx.stroke();
}

function footer(
  ctx: CanvasRenderingContext2D,
  family: string,
  left: string,
  right: string,
  width: number,
  height: number
) {
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, height - 54);
  ctx.lineTo(width - 44, height - 54);
  ctx.stroke();

  ctx.font = `500 10px ${family}`;
  ctx.fillStyle = MUTED;
  tracked(ctx, left.toUpperCase(), 44, height - 33, 1.1);

  const rightWidth = ctx.measureText(right).width + (right.length - 1) * 1.1;
  tracked(ctx, right.toUpperCase(), width - 44 - rightWidth, height - 33, 1.1);
}

function quoteMark(
  ctx: CanvasRenderingContext2D,
  serif: string,
  x: number,
  y: number,
  size = 82
) {
  ctx.font = `500 ${size}px ${serif}`;
  ctx.fillStyle = "rgba(169, 139, 79, 0.42)";
  ctx.fillText("\u201C", x, y);
}

function check(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = GOLD
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.52);
  ctx.lineTo(x + size * 0.38, y + size * 0.86);
  ctx.lineTo(x + size, y + size * 0.12);
  ctx.stroke();
}

function chip(
  ctx: CanvasRenderingContext2D,
  family: string,
  text: string,
  x: number,
  y: number,
  color = FOREST
) {
  ctx.font = `600 10px ${family}`;
  const width = ctx.measureText(text).width + 22;
  ctx.strokeStyle = `${color}55`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, 24);
  ctx.fillStyle = color;
  tracked(ctx, text.toUpperCase(), x + 11, y + 16, 0.9);
  return width;
}

function drawMessage(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Message \u00b7 Tuesday 14:32", "Unstructured", width, TERRACOTTA);
  quoteMark(ctx, family.serif, 42, 166, 86);

  ctx.fillStyle = TERRACOTTA;
  ctx.beginPath();
  ctx.arc(50, 116, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `600 16px ${family.sans}`;
  ctx.fillStyle = FOREST;
  ctx.fillText("Elena \u00b7 Programme", 64, 122);

  ctx.font = `500 25px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(
    ctx,
    "\u201CCan we move Thursday\u2019s review? I\u2019m not sure the pilot notes are ready.\u201D",
    44,
    202,
    width - 88,
    38,
    4
  );

  ctx.font = `400 13px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("No project attached. No decision recorded.", 44, height - 84);

  footer(ctx, family.sans, "Source \u00b7 conversation", "1 of 5 fragments", width, height);
}

function drawRefined(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Refined draft \u00b7 awaiting approval", "Original visible", width, TERRACOTTA);

  ctx.font = `500 25px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(
    ctx,
    "\u201CCould we confirm whether Thursday\u2019s review still works, given the pilot notes are not finalised?\u201D",
    44,
    144,
    width - 88,
    38,
    4
  );

  let y = 274;
  check(ctx, 44, y - 13, 16);
  ctx.font = `500 13px ${family.sans}`;
  ctx.fillStyle = FOREST;
  ctx.fillText("Intention preserved", 72, y);
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${family.sans}`;
  ctx.fillText("Ask for clarity without sounding defensive.", 72, y + 21);

  y += 62;
  check(ctx, 44, y - 13, 16);
  ctx.fillStyle = FOREST;
  ctx.font = `500 13px ${family.sans}`;
  ctx.fillText("Original wording retained", 72, y);
  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${family.sans}`;
  ctx.fillText("Side by side until you approve it.", 72, y + 21);

  ctx.strokeStyle = "rgba(169, 95, 66, 0.35)";
  ctx.strokeRect(44, height - 98, width - 88, 30);
  ctx.font = `500 11px ${family.sans}`;
  ctx.fillStyle = TERRACOTTA;
  ctx.fillText("Nothing is sent without review.", 55, height - 78);

  footer(ctx, family.sans, "Draft \u00b7 sample content", "2 of 5 fragments", width, height);
}

function drawProject(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Harbour \u00b7 Project document", "Section 2", width);
  ctx.font = `600 11px ${family.sans}`;
  ctx.fillStyle = TERRACOTTA;
  tracked(ctx, "PILOT SCOPE", 44, 128, 2.1);

  ctx.font = `500 42px ${family.serif}`;
  ctx.fillStyle = INK;
  const titleY = 188;
  ctx.fillText("Pilot scope", 44, titleY);

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Six weeks \u00b7 Two teams \u00b7 Review before commitment", 44, titleY + 32);

  ctx.strokeStyle = HAIRLINE;
  ctx.beginPath();
  ctx.moveTo(44, titleY + 58);
  ctx.lineTo(width - 44, titleY + 58);
  ctx.stroke();

  ctx.font = `400 16px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.82;
  let y = paragraph(
    ctx,
    "The pilot runs for six weeks across two teams. It measures whether the shared context changes how decisions are prepared, recorded and found again.",
    44,
    titleY + 96,
    width - 88,
    27,
    4
  );
  y = paragraph(
    ctx,
    "Phase two begins only after the pilot review is complete. The review owner and date were not recorded in the supplied material.",
    44,
    y + 18,
    width - 88,
    27,
    4
  );
  ctx.globalAlpha = 1;

  const highlightY = y + 22;
  ctx.fillStyle = "rgba(196, 123, 91, 0.12)";
  ctx.fillRect(38, highlightY - 20, width - 76, 38);
  ctx.font = `500 17px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText("Phase two is confirmed at the review.", 44, highlightY + 4);

  ctx.font = `600 10px ${family.sans}`;
  ctx.fillStyle = TERRACOTTA;
  ctx.fillText("[1]", width - 66, highlightY + 4);

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Excerpt shown for concept preview.", 44, height - 84);

  footer(ctx, family.sans, "Source \u00b7 Project document", "Page 03", width, height);
}

function drawCalendar(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "October 2026", "Schedule", width);

  ctx.font = `500 42px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText("October", 44, 156);

  ctx.font = `400 11px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("One review. No date agreed for phase two.", 44, 180);

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const gridTop = 224;
  const cellWidth = (width - 88) / 7;
  const cellHeight = 62;

  ctx.font = `600 10px ${family.sans}`;
  ctx.fillStyle = MUTED;
  weekdays.forEach((day, index) => {
    ctx.fillText(day, 44 + index * cellWidth + cellWidth / 2 - 3, gridTop);
  });

  ctx.strokeStyle = "rgba(37, 51, 43, 0.1)";
  for (let row = 0; row <= 5; row += 1) {
    ctx.beginPath();
    ctx.moveTo(44, gridTop + 16 + row * cellHeight);
    ctx.lineTo(width - 44, gridTop + 16 + row * cellHeight);
    ctx.stroke();
  }

  const offset = 3;
  ctx.font = `400 14px ${family.sans}`;
  for (let day = 1; day <= 31; day += 1) {
    const index = day - 1 + offset;
    const column = index % 7;
    const row = Math.floor(index / 7);
    const x = 44 + column * cellWidth + cellWidth / 2;
    const y = gridTop + 16 + row * cellHeight + 38;

    if (day === 24) {
      ctx.fillStyle = FOREST;
      ctx.beginPath();
      ctx.arc(x, y - 6, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = PAPER;
    } else {
      ctx.fillStyle = day === 1 ? INK : "rgba(37, 51, 43, 0.72)";
    }
    const label = String(day);
    ctx.fillText(label, x - ctx.measureText(label).width / 2, y);
  }

  ctx.fillStyle = TERRACOTTA;
  ctx.beginPath();
  ctx.arc(width - 72, gridTop + 46, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `500 13px ${family.sans}`;
  ctx.fillStyle = INK;
  ctx.fillText("Pilot review \u00b7 24 October \u00b7 4:00 pm", 44, height - 88);

  footer(ctx, family.sans, "Calendar context", "No phase-two date", width, height);
}

function drawTasks(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Task sheet", "Draft", width, TERRACOTTA);

  ctx.font = `500 34px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText("Open actions", 44, 144);

  const rows = [
    { label: "Confirm the phase-two scope", done: true, gap: "" },
    { label: "Prepare the review summary", done: false, gap: "Owner \u00b7 Not specified" },
    { label: "Circulate notes to both teams", done: false, gap: "Deadline \u00b7 Not specified" },
  ];

  rows.forEach((row, index) => {
    const y = 200 + index * 58;
    ctx.strokeStyle = "rgba(37, 51, 43, 0.3)";
    ctx.lineWidth = 1.3;
    ctx.strokeRect(44, y - 15, 17, 17);
    if (row.done) check(ctx, 46, y - 15, 14, FOREST);

    ctx.font = `500 13px ${family.sans}`;
    ctx.fillStyle = row.done ? MUTED : INK;
    ctx.fillText(row.label, 74, y);

    if (row.gap) {
      ctx.font = `600 9px ${family.sans}`;
      const gapWidth = ctx.measureText(row.gap).width + 14;
      ctx.strokeStyle = "rgba(169, 95, 66, 0.45)";
      ctx.strokeRect(width - 44 - gapWidth, y - 12, gapWidth, 18);
      ctx.fillStyle = TERRACOTTA;
      ctx.fillText(row.gap.toUpperCase(), width - 44 - gapWidth + 7, y);
    }

    ctx.strokeStyle = "rgba(37, 51, 43, 0.1)";
    ctx.beginPath();
    ctx.moveTo(44, y + 22);
    ctx.lineTo(width - 44, y + 22);
    ctx.stroke();
  });

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Missing details stay marked. They are never inferred.", 44, height - 84);

  footer(ctx, family.sans, "3 items \u00b7 Not approved", "Sample data", width, height);
}

function drawAgenda(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Meeting brief \u00b7 draft", "2 sources", width);

  ctx.font = `500 42px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText("Pilot review", 44, 162);

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Thursday \u00b7 4:00 pm \u00b7 45 minutes", 44, 190);

  const rows = [
    ["00:00", "Open with the review outcome."],
    ["00:15", "Ask who owns the phase-two decision."],
    ["00:30", "Leave with a dated next step."],
  ];

  rows.forEach(([time, title], index) => {
    const y = 260 + index * 82;
    ctx.font = `600 10px ${family.sans}`;
    ctx.fillStyle = TERRACOTTA;
    ctx.fillText(time, 44, y);
    ctx.font = `500 18px ${family.serif}`;
    ctx.fillStyle = INK;
    paragraph(ctx, title, 44, y + 30, width - 88, 26, 2);
    ctx.strokeStyle = "rgba(37, 51, 43, 0.14)";
    ctx.beginPath();
    ctx.moveTo(44, y + 50);
    ctx.lineTo(width - 44, y + 50);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(196, 123, 91, 0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(44, height - 150, width - 88, 56);
  ctx.font = `500 12px ${family.sans}`;
  ctx.fillStyle = TERRACOTTA;
  ctx.fillText("Gap \u00b7 No review owner or deadline is recorded.", 56, height - 126);
  ctx.font = `400 11px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Both stay open until you decide.", 56, height - 108);

  footer(ctx, family.sans, "Prepared from supplied material", "Draft", width, height);
}

const talkingPoints = [
  {
    title: "Open with the review outcome.",
    detail:
      "Anchor the discussion in what the six-week pilot measured, not in the phase-two ambition.",
    source: "Scope document [1]",
  },
  {
    title: "Ask who owns the phase-two decision.",
    detail:
      "The supplied notes name no decision owner. Frame this as an open question.",
    source: "Review notes [2]",
  },
  {
    title: "Leave with a dated next step.",
    detail:
      "No deadline appears in the material. Ask for one rather than inventing it.",
    source: "Review notes [2]",
  },
] as const;

function drawTalking(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number,
  index: number
) {
  const point = talkingPoints[index];
  header(ctx, family.sans, `Talking point 0${index + 1}`, point.source, width);

  ctx.font = `600 10px ${family.sans}`;
  ctx.fillStyle = TERRACOTTA;
  tracked(ctx, "CONTRIBUTION SEQUENCE", 44, 120, 1.6);

  ctx.font = `500 28px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(ctx, point.title, 44, 172, width - 88, 34, 3);

  ctx.font = `400 13px ${family.sans}`;
  ctx.fillStyle = MUTED;
  paragraph(ctx, point.detail, 44, 278, width - 88, 21, 3);

  ctx.strokeStyle = "rgba(169, 139, 79, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, 88);
  ctx.lineTo(102, 88);
  ctx.stroke();

  footer(ctx, family.sans, `Prompt 0${index + 1} / 03`, "For your judgement", width, height);
}

function drawDecision(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Decision \u00b7 01", "Draft record", width, TERRACOTTA);
  quoteMark(ctx, family.serif, 42, 162, 64);

  ctx.font = `500 27px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(
    ctx,
    "Phase two begins only after the pilot review.",
    44,
    178,
    width - 88,
    36,
    3
  );

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("One decision found in the supplied notes.", 44, height - 92);
  ctx.fillText("No owner inferred.", 44, height - 72);

  footer(ctx, family.sans, "Source \u00b7 Review notes", "24 October", width, height);
}

function drawAction(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Action \u00b7 01", "Draft record", width, TERRACOTTA);

  ctx.font = `500 27px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(
    ctx,
    "Prepare the review summary.",
    44,
    156,
    width - 88,
    34,
    2
  );

  let x = 44;
  x += chip(ctx, family.sans, "Owner \u00b7 Not specified", x, 218, TERRACOTTA) + 8;
  chip(ctx, family.sans, "Deadline \u00b7 Not specified", x, 218, TERRACOTTA);

  ctx.font = `400 13px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Marked explicitly. Not inferred.", 44, 282);

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Resolve the gaps before this can be approved.", 44, height - 84);

  footer(ctx, family.sans, "Source \u00b7 Review notes", "Awaiting review", width, height);
}

function drawQuestion(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Open question \u00b7 01", "Unresolved", width, TERRACOTTA);

  ctx.font = `500 27px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(
    ctx,
    "Which metric decides the review outcome?",
    44,
    156,
    width - 88,
    34,
    3
  );

  ctx.font = `400 13px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("The supplied sources name no criterion.", 44, 244);

  ctx.strokeStyle = "rgba(169, 139, 79, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, 286);
  ctx.lineTo(92, 286);
  ctx.stroke();

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Kept as a question. Not answered for you.", 44, height - 84);

  footer(ctx, family.sans, "Source \u00b7 Review notes", "Open", width, height);
}

function drawNotes(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number
) {
  header(ctx, family.sans, "Meeting notes \u00b7 supplied", "Unedited", width);

  ctx.font = `500 32px ${family.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText("Pilot review", 44, 138);

  const lines = [
    "Reviewed the six-week pilot with both teams.",
    "Phase two depends on the review outcome.",
    "Who signs off? Not recorded.",
    "Prepare the summary before Friday.",
    "Next step: confirm the phase-two scope.",
  ];

  lines.forEach((line, index) => {
    const y = 192 + index * 38;
    ctx.font = `italic 400 17px ${family.serif}`;
    ctx.fillStyle = index === 2 ? TERRACOTTA : "rgba(37, 51, 43, 0.8)";
    ctx.fillText(`\u2014  ${line}`, 56, y);
    if (index === 2) {
      ctx.strokeStyle = "rgba(196, 123, 91, 0.45)";
      ctx.beginPath();
      ctx.ellipse(width / 2, y - 6, width / 2 - 56, 21, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(48, 78, 62, 0.4)";
    ctx.fillRect(44, y - 4, 5, 5);
  });

  ctx.font = `400 12px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Raw notes. No summary yet.", 44, height - 84);

  footer(ctx, family.sans, "Source \u00b7 Supplied notes", "Not approved", width, height);
}

const records = [
  {
    title: "Pilot review \u00b7 24 October",
    meta: "Decision \u00b7 Project Harbour",
    quote:
      "Phase two begins after the pilot review; the timeline remains tied to that outcome.",
  },
  {
    title: "Phase-two planning \u00b7 2 October",
    meta: "Decision \u00b7 Project Harbour",
    quote:
      "The pilot timeline was set at six weeks, with a review before any phase-two commitment.",
  },
  {
    title: "Scope review \u00b7 18 September",
    meta: "Open question \u00b7 Project Harbour",
    quote:
      "Which metric decides the pilot outcome, and who owns the review?",
  },
] as const;

function drawRecord(
  ctx: CanvasRenderingContext2D,
  family: { serif: string; sans: string },
  width: number,
  height: number,
  index: number
) {
  const record = records[index];
  header(ctx, family.sans, "Approved record", "Approved", width, FOREST);

  check(ctx, width - 92, 100, 14, FOREST);

  ctx.font = `500 24px ${family.serif}`;
  ctx.fillStyle = INK;
  paragraph(ctx, record.title, 44, 142, width - 88, 30, 2);

  ctx.font = `600 9px ${family.sans}`;
  ctx.fillStyle = FOREST;
  tracked(ctx, record.meta.toUpperCase(), 44, 200, 1.2);

  ctx.strokeStyle = HAIRLINE;
  ctx.beginPath();
  ctx.moveTo(44, 222);
  ctx.lineTo(width - 44, 222);
  ctx.stroke();

  ctx.font = `400 14px ${family.serif}`;
  ctx.fillStyle = "rgba(37, 51, 43, 0.82)";
  paragraph(ctx, `\u201C${record.quote}\u201D`, 44, 254, width - 88, 23, 4);

  ctx.font = `400 11px ${family.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("Source retained. Visible on request.", 44, height - 84);

  footer(ctx, family.sans, "Human approval recorded", "Read-only", width, height);
}

export function createCardTexture(
  kind: CardTextureKind,
  aspect: number,
  fontsReady = true
): THREE.CanvasTexture {
  const width = TEXTURE_WIDTH;
  const height = Math.min(
    MAX_TEXTURE_HEIGHT,
    Math.max(MIN_TEXTURE_HEIGHT, Math.round(width * aspect))
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create the document texture context.");
  }

  const family = fontsReady
    ? families()
    : { serif: "Georgia, serif", sans: "Arial, sans-serif" };
  drawPaper(ctx, width, height, kind);

  switch (kind) {
    case "message":
      drawMessage(ctx, family, width, height);
      break;
    case "refined":
      drawRefined(ctx, family, width, height);
      break;
    case "project":
      drawProject(ctx, family, width, height);
      break;
    case "calendar":
      drawCalendar(ctx, family, width, height);
      break;
    case "tasks":
      drawTasks(ctx, family, width, height);
      break;
    case "agenda":
      drawAgenda(ctx, family, width, height);
      break;
    case "talking-1":
      drawTalking(ctx, family, width, height, 0);
      break;
    case "talking-2":
      drawTalking(ctx, family, width, height, 1);
      break;
    case "talking-3":
      drawTalking(ctx, family, width, height, 2);
      break;
    case "decision":
      drawDecision(ctx, family, width, height);
      break;
    case "action":
      drawAction(ctx, family, width, height);
      break;
    case "question":
      drawQuestion(ctx, family, width, height);
      break;
    case "notes":
      drawNotes(ctx, family, width, height);
      break;
    case "record-1":
      drawRecord(ctx, family, width, height, 0);
      break;
    case "record-2":
      drawRecord(ctx, family, width, height, 1);
      break;
    case "record-3":
      drawRecord(ctx, family, width, height, 2);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createDeskTexture() {
  const size = 768;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create the desk texture context.");
  }

  ctx.fillStyle = "#d7cab4";
  ctx.fillRect(0, 0, size, size);

  const wash = ctx.createLinearGradient(0, 0, size, size);
  wash.addColorStop(0, "rgba(255, 250, 238, 0.36)");
  wash.addColorStop(0.5, "rgba(215, 202, 180, 0)");
  wash.addColorStop(1, "rgba(166, 151, 125, 0.22)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);

  const random = seeded("hinterland-travertine");
  for (let vein = 0; vein < 28; vein += 1) {
    const startY = random() * size;
    const startX = random() * size * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + size * 0.2,
      startY + (random() - 0.5) * 60,
      startX + size * 0.5,
      startY + (random() - 0.5) * 90,
      startX + size * 0.85,
      startY + (random() - 0.5) * 120
    );
    ctx.strokeStyle = `rgba(112, 98, 76, ${0.025 + random() * 0.04})`;
    ctx.lineWidth = 0.8 + random() * 2.2;
    ctx.stroke();
  }

  for (let i = 0; i < 1200; i += 1) {
    const tone = random() > 0.5 ? "255, 252, 243" : "104, 91, 70";
    ctx.fillStyle = `rgba(${tone}, ${0.015 + random() * 0.035})`;
    ctx.fillRect(random() * size, random() * size, 1.2, 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1.3);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createHaloTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create the highlight texture context.");
  }

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.5
  );
  gradient.addColorStop(0, "rgba(255, 246, 220, 0.85)");
  gradient.addColorStop(0.45, "rgba(214, 184, 124, 0.32)");
  gradient.addColorStop(1, "rgba(214, 184, 124, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
