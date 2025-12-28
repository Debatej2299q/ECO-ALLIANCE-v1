export const info = {
  name: 'ping',
  aliases: [],
  description: "Check the bot's response time",
};

export const pingCommand = async (m, sock, startTime) => {
  const end = Date.now();
  const ping = end - startTime;
  const text = `🍀 Pong! Response time: *${ping}ms*`;
  await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
};