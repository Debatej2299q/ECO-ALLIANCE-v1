export const info = {
  name: 'uptime',
  aliases: [],
  description: 'Show how long the bot has been running',
};

export const uptimeCommand = async (m, sock) => {
  const seconds = process.uptime();
  const h = Math.floor(seconds / 3600);
  const m_ = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const uptimeStr = `${h}h ${m_}m ${s}s`;
  const text = `⏱ Bot uptime: *${uptimeStr}*`;
  await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
};