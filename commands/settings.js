import { updateSetting } from '../settings.js'

export default {
  info: {
    name: 'settings',
    alias: ['config', 'set'],
    desc: 'Manage bot settings'
  },
  execute: async (m, sock, text) => {
    const args = text.split(' ').filter(Boolean)
    const action = args[0]?.toLowerCase()
    
    if (action === 'get') {
      const path = args[1]
      if (!path) {
        const settings = global.settings.getSetting('')
        const display = JSON.stringify(settings, null, 2)
        return sock.sendMessage(m.key.remoteJid, { text: `Settings:\n\`\`\`${display}\`\`\`` }, { quoted: m })
      }
      
      const value = global.settings.getSetting(path)
      await sock.sendMessage(m.key.remoteJid, { 
        text: `${path}: ${JSON.stringify(value)}` 
      }, { quoted: m })
    }
    
    else if (action === 'set') {
      const [path, ...valueParts] = args.slice(1)
      if (!path || !valueParts.length) {
        return sock.sendMessage(m.key.remoteJid, { 
          text: 'Usage: .settings set <path> <value>' 
        }, { quoted: m })
      }
      
      let value = valueParts.join(' ')
      try {
        value = JSON.parse(value)
      } catch {
        // Keep as string if not valid JSON
      }
      
      updateSetting(path, value)
      await sock.sendMessage(m.key.remoteJid, { 
        text: `Updated ${path} to ${JSON.stringify(value)}` 
      }, { quoted: m })
    }
    
    else {
      await sock.sendMessage(m.key.remoteJid, { 
        text: 'Usage:\n.settings get [path]\n.settings set <path> <value>' 
      }, { quoted: m })
    }
  }
}