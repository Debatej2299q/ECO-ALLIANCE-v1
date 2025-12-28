
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const info = {
  name: "autoreply",
  aliases: ["ar"],
  description: "Auto-reply to a target user in a specific group.",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= STORAGE =================
let targetUser = null;
let targetGroup = null;
let targetFile = "spam1";
let targetIndex = 0;
let isAutoReplyEnabled = false;

// ================= LOAD SPAM FILE =================
function loadSpamFile(fileName = "spam1") {
  const filePath = path.join(__dirname, `${fileName}.txt`);
  if (!fs.existsSync(filePath)) return ["❌ Spam file not found"];

  const data = fs.readFileSync(filePath, "utf-8");
  const lines = data.split("\n").map(t => t.trim()).filter(Boolean);
  return lines.length ? lines : ["❌ Spam file is empty"];
}

// ================= GET NEXT LINE =================
function getNextTargetLine(fileName) {
  const lines = loadSpamFile(fileName);
  if (targetIndex >= lines.length) targetIndex = 0;

  const line = lines[targetIndex];
  targetIndex++;
  return line;
}

// =======================================================
// ===================== MAIN COMMAND =====================
// =======================================================
export const autoreplyCommand = async (m, sock, { body }) => {
  const args = body.split(" ").filter(Boolean);
  const action = args[0]?.toLowerCase(); // start | stop | status

  // --- Owner Check ---
  const sender = m.key.participant || m.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");
  const owner = String(global.owner).replace(/[^0-9]/g, "");

  if (senderNum !== owner) {
    return sock.sendMessage(
      m.key.remoteJid,
      { text: "❌ Only *Bot Owner* can use this command!" },
      { quoted: m }
    );
  }

  // --- START ---
  if (action === "start") {
    const [groupJid, targetNumber, fileName] = args.slice(1);

    if (!groupJid || !targetNumber || !fileName) {
      return sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ Usage: .autoreply start <group_jid> <target_number> <file_name>" },
        { quoted: m }
      );
    }

    targetGroup = groupJid;
    targetUser = targetNumber.replace(/[^0-9]/g, "");
    targetFile = fileName;
    targetIndex = 0;
    isAutoReplyEnabled = true;

    return sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `🎯 Auto-reply ENABLED\n\n` +
          `👥 Group: ${targetGroup}\n` +
          `👤 Target: @${targetUser}\n` +
          `📂 File: ${targetFile}.txt`,
        mentions: [`${targetUser}@s.whatsapp.net`],
      },
      { quoted: m }
    );
  }

  // --- STOP ---
  if (action === "stop") {
    isAutoReplyEnabled = false;
    targetUser = null;
    targetGroup = null;
    return sock.sendMessage(
      m.key.remoteJid,
      { text: "🛑 Auto-reply DISABLED" },
      { quoted: m }
    );
  }

  // --- STATUS ---
  if (action === "status") {
    if (!isAutoReplyEnabled || !targetUser) {
        return sock.sendMessage(
            m.key.remoteJid,
            { text: "🔴 Auto-reply is not active." },
            { quoted: m }
        );
    }
    return sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `🎯 Auto-reply is ACTIVE\n\n` +
          `👥 Group: ${targetGroup}\n` +
          `👤 Target: @${targetUser}\n` +
          `📂 File: ${targetFile}.txt`,
        mentions: [`${targetUser}@s.whatsapp.net`],
      },
      { quoted: m }
    );
  }

  // --- HELP ---
    return sock.sendMessage(
    m.key.remoteJid,
    { text: "Usage: .autoreply <start|stop|status> [options]" },
    { quoted: m }
  );
};

// =======================================================
// ===================== EVENT HANDLER =====================
// =======================================================
export const handleAutoReply = async (m, sock) => {
  if (!isAutoReplyEnabled || !targetUser || !targetGroup) return;

  const currentGroupJid = m.key.remoteJid;
  const sender = m.key.participant || m.key.remoteJid;
  const senderNum = sender.replace(/[^0-9]/g, "");

  if (currentGroupJid === targetGroup && senderNum === targetUser) {
    const replyLine = getNextTargetLine(targetFile);

    await sock.sendMessage(
      currentGroupJid,
      { text: replyLine },
      { quoted: m }
    );
  }
};
