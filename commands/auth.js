import { updateSetting } from '../settings.js'

export default {
  info: {
    name: 'auth',
    alias: ['authmode'],
    desc: 'Switch authentication mode'
  },
  execute: async (m, sock, text) => {
    const mode = text?.toLowerCase()
    
    if (!mode) {
      const current = global.settings.getSetting('bot.auth')
      return sock.sendMessage(m.key.remoteJid, { 
        text: `Current auth mode: ${current}\nUsage: .auth <qr|pr>` 
      }, { quoted: m })
    }
    
    if (mode !== 'qr' && mode !== 'pr') {
      return sock.sendMessage(m.key.remoteJid, { 
        text: 'Invalid mode. Use: qr or pr' 
      }, { quoted: m })
    }
    
    updateSetting('bot.auth', mode)
    
    await sock.sendMessage(m.key.remoteJid, { 
      text: `Auth mode set to: ${mode}\nRestart bot to apply changes` 
    }, { quoted: m })
  }
}