export const info = {
  name: "jid",
  aliases: ["myjid"],
  description: "Get your JID or the JID of this chat",
};

export const jidCommand = async (m, sock) => {
  const jid = m.key.participant || m.key.remoteJid;

  await sock.sendMessage(
    m.key.remoteJid,
    {
      text: `🔗 *JID Info*\n\n• Sender JID:\n\`${jid}\``
    },
    { quoted: m }
  );
};
