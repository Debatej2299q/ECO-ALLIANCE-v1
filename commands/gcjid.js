export const info = {
  name: "gcjid",
  aliases: ["gjid"],
  description: "Get the Group JID or extract from a group link",
};

export const gcjidCommand = async (m, sock, { body }) => {

  // Case 1: Group link provided by user
  if (body && body.includes("chat.whatsapp.com")) {
    const code = body.split("chat.whatsapp.com/")[1].trim();

    if (!code)
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Invalid group link." }, { quoted: m });

    try {
      const resp = await sock.groupGetInviteInfo(code);
      const groupJid = resp.id;

      return sock.sendMessage(
        m.key.remoteJid,
        {
          text: `🔗 *Group Link Extracted Successfully!*\n\n• Group Name: ${resp.subject}\n• Group JID: \`${groupJid}\``
        },
        { quoted: m }
      );
    } catch (err) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Invalid or expired group link." }, { quoted: m });
    }
  }

  // Case 2: Message sent inside a group
  if (m.key.remoteJid.endsWith("@g.us")) {
    return sock.sendMessage(
      m.key.remoteJid,
      {
        text: `📍 *Group JID:*\n\`${m.key.remoteJid}\``
      },
      { quoted: m }
    );
  }

  // Case 3: Used in DM
  return sock.sendMessage(
    m.key.remoteJid,
    { text: "❌ This command only works in a group or with a group link." },
    { quoted: m }
  );
};
