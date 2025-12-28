
import {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeWASocket,
  DisconnectReason
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAutoReply } from './commands/auto-reply.js'; // Import the event handler

const config = JSON.parse(fs.readFileSync('./config.json'));
// --- Constants ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prefix = '.';
global.owner = config.ownerNumber;
const usePairingCode = true;

// --- Auto Import Commands ---
async function loadCommands() {
  const commands = [];
  const files = fs.readdirSync(path.join(__dirname, 'commands'));
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    try {
      const module = await import(`./commands/${file}`);
      const commandName = module.info.name;
      if (module.info && typeof module[`${commandName}Command`] === 'function') {
        commands.push({
          info: module.info,
          execute: module[`${commandName}Command`],
        });
      }
    } catch (error) {
      console.error(`Error loading command from ${file}:`, error);
    }
  }
  return commands;
}

// --- Find Command Helper ---
function findCommand(commands, cmd) {
  return commands.find(
    ({ info }) => info.name === cmd || (info.aliases && info.aliases.includes(cmd))
  );
}

// --- Main Bot ---
const startBot = async () => {
  const commandsArr = await loadCommands();

  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: !usePairingCode,
  });

  // Pairing code
  if (usePairingCode && !sock.authState.creds.registered) {
    if (!config.ownerNumber) {
      console.log("Please add owner number in config.json");
    } else {
      console.log("Requesting pairing code for:", config.ownerNumber);
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(config.ownerNumber);
          console.log(`\nYour pairing code is: ${code}`);
        } catch (e) {
          console.error('Failed to request pairing code:', e);
        }
      }, 3000);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log('✅ Bot connected successfully!');
      await sock.sendMessage(`${global.owner}@s.whatsapp.net`, {
        text: '🟢 ALex-Techy BoTZ is now online!'
      });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });

  // =======================================================
  //                 MESSAGE HANDLER
  // =======================================================
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;

    const msg =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      '';

    const sender = m.key.participant || m.key.remoteJid || "";
    const senderNum = sender.replace(/[^0-9]/g, "");

    // --- Handle Auto-reply (for all users) ---
    await handleAutoReply(m, sock);

    // --- PRIVATE MODE: Only owner can proceed ---
    const owner = String(global.owner).replace(/[^0-9]/g, "");
    if (senderNum !== owner) {
      return; // Stop processing if sender is not the owner
    }

    // --- Command Handling (for owner only) ---
    if (!msg.startsWith(prefix)) return;

    const command = msg.slice(prefix.length).split(' ')[0].toLowerCase();
    const body = msg.slice(prefix.length + command.length).trim();

    const cmdObj = findCommand(commandsArr, command);
    if (cmdObj) {
      try {
        await cmdObj.execute(m, sock, { body });
      } catch (e) {
        console.error('❌ Command error:', e);
        await sock.sendMessage(
          m.key.remoteJid,
          { text: '❌ Error executing command.' },
          { quoted: m }
        );
      }
    }
  });
};

startBot();
