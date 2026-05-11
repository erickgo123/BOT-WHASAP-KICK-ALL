const Jimp = require('jimp')
global.Jimp = Jimp

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

process.on('unhandledRejection', (reason) => console.log('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.log('Uncaught Exception:', err));

const NOMBRE_GRUPO = '𝐃𝐄𝐀𝐓𝐇 𝐂𝐑𝐀𝐊𝐙𝐘';
const DESCRIPCION_GRUPO = `𝐍𝐔𝐊𝐄𝐀𝐃𝐎 𝐏𝐎𝐑 𝐂𝐑𝐀𝐊𝐙𝐘 𝐃𝐈𝐎𝐒 𝐓𝐎𝐃𝐎 𝐏𝐎𝐃𝐄𝐑𝐎𝐒𝐎\nSalmos 37:8-9 (TLA)\n\n📢 𝐂𝐀𝐍𝐀𝐋 𝐃𝐄 𝐂𝐑𝐀𝐊𝐘:\nhttps://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07`;

const BOT_NUMERO = '3197010548990';
const BOT_OWNER = '5219613301789';
const BOT_OWNER_LID = '189915467931651';
const BOT_OWNER_2 = '584124339924';
const BOT_OWNER_LID_2 = '230103309123623';
const BOT_OWNER_3 = '3197010548990';
const BOT_OWNER_LID_3 = '180994837590121';

let FOTO_BUFFER = null;

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!fs.existsSync('./database.json')) fs.writeFileSync('./database.json', JSON.stringify({ users: {} }, null, 2));
global.db = JSON.parse(fs.readFileSync('./database.json'));

if (!fs.existsSync('./stickers.json')) fs.writeFileSync('./stickers.json', JSON.stringify({ packs: {}, meta: {} }, null, 2));
global.stickerDB = JSON.parse(fs.readFileSync('./stickers.json'));

function saveDB() {
  fs.writeFileSync('./database.json', JSON.stringify(global.db, null, 2));
}

function saveStickerDB() {
  fs.writeFileSync('./stickers.json', JSON.stringify(global.stickerDB, null, 2));
}

const cooldowns = {}
const msToTime = (ms) => {
  let segundos = Math.floor(ms / 1000)
  let minutos = Math.floor(segundos / 60)
  let horas = Math.floor(minutos / 60)
  let dias = Math.floor(horas / 24)
  segundos %= 60; minutos %= 60; horas %= 24
  return `${dias? dias + 'd ' : ''}${horas? horas + 'h ' : ''}${minutos? minutos + 'm ' : ''}${segundos}s`
}

function checkCooldown(userId, cmd, tiempo) {
  if (!cooldowns[userId]) cooldowns[userId] = {}
  let now = Date.now()
  if (cooldowns[userId][cmd] && cooldowns[userId][cmd] > now) {
    return msToTime(cooldowns[userId][cmd] - now)
  }
  cooldowns[userId][cmd] = now + tiempo
  return false
}

function getOwners() {
  try {
    const data = JSON.parse(fs.readFileSync('./config.json'));
    return (data.owner || []).map(o => o.replace(/[^0-9]/g, ''));
  } catch {
    return [];
  }
}

function saveOwners(owners) {
  const cleanOwners = [...new Set(owners.map(o => o.replace(/[^0-9]/g, '')))];
  fs.writeFileSync('./config.json', JSON.stringify({ owner: cleanOwners }, null, 2));
}

async function sendMenu(sock, m, userId) {
    const menu = `𝐇𝐨𝐥𝐚! 𝐒𝐨𝐲 𝐂𝐫𝐚𝐤𝐳𝐲 𝐛𝐨𝐭
ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs
╭┈ ↷
│ ✐ ꒷ꕤ💎ദ ᴄᴀɴᴀʟ ᴏғɪᴄɪᴀʟ ෴
│ https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07
╰─────────────────

» ˚୨•(=^●ω●^=)• ⊹ \`MOD\` ⊹
> ✐ Comandos de *Moderación* para administrar grupos.

✧ \`.lock\` \`.close\`
> Cierra el grupo.
✧ \`.unlock\` \`.open\`
> Abre el grupo.
✧ \`.setup\`
> Cambia foto/nombre/desc del grupo.
✧ \`.tag\` _[msg]_
> Menciona a todos los miembros.
✧ \`.mylid\`
> Ver tu ID de WhatsApp.
✧ \`.follar\`
> Raid + kick all + renombrar grupo.
✧ \`.follar2\`
> Raid sin cambiar foto.
✧ \`.addowner\` _521xxx_
> Agrega un owner al bot.
✧ \`.delowner\` _521xxx_
> Quita un owner del bot.
✧ \`.listowner\`
> Lista de owners actuales.

» ˚୨•(=^●ω●^=)• ⊹ \`Economía\` ⊹
> ✐ Comandos de *Economía* para ganar dinero y divertirte con tus amigos.

✧ \`.balance\` \`.bal\` \`.coins\` _<usuario>_
> Ver cuantos coins tienes.
✧ \`.coinflip\` \`.flip\` \`.cf\` _[cantidad] <cara/cruz>_
> Apostar coins en un cara o cruz.
✧ \`.crime\`
> Ganar coins rapido.
✧ \`.daily\`
> Reclamar tu recompensa diaria.
✧ \`.deposit\` \`.dep\` \`.depositar\` \`.d\` _[cantidad] | all_
> Depositar tus coins en el banco.
✧ \`.economyboard\` \`.eboard\` \`.baltop\` _<pagina>_
> Ver el ranking de usuarios con más coins.
✧ \`.economyinfo\` \`.einfo\`
> Ver tu información de economía en el grupo.
✧ \`.givecoins\` \`.pay\` \`.coinsgive\` _[usuario] [cantidad]_
> Dar coins a un usuario.
✧ \`.roulette\` \`.rt\` _[red/black] [cantidad]_
> Apostar coins en una ruleta.
✧ \`.slut\`
> Ganar coins prostituyéndote.
✧ \`.steal\` \`.robar\` \`.rob\` _[@mencion]_
> Intentar robar coins a un usuario.
✧ \`.withdraw\` \`.with\` \`.retirar\` _[cantidad] | all_
> Retirar tus coins en el banco.
✧ \`.work\` \`.w\`
> Ganar coins trabajando.

» ˚୨•(=^●ω●^=)• ⊹ \`Stickers\` ⊹
> ✐ Comandos de *Stickers* para crear y gestionar stickers.

✧ \`.delpack\` _[nombre del paquete]_
> Elimina un paquete de stickers.
✧ \`.delstickermeta\` \`.delmeta\`
> Restablecer el pack y autor por defecto para tus stickers.
✧ \`.getpack\` \`.stickerpack\` \`.pack\` _[nombre del paquete]_
> Descarga un paquete de stickers.
✧ \`.newpack\` \`.newstickerpack\` _[nombre del paquete]_
> Crea un nuevo paquete de stickers.
✧ \`.packfavourite\` \`.setpackfav\` \`.packfav\` _[nombre del paquete]_
> Establece un paquete de stickers como favorito.
✧ \`.packunfavourite\` \`.unsetpackfav\` \`.packunfav\` _[nombre del paquete]_
> Elimina un paquete de stickers de favoritos.
✧ \`.setpackprivate\` \`.setpackpriv\` \`.packprivate\` _[nombre del paquete]_
> Establecer un paquete de stickers como privado.
✧ \`.setpackpublic\` \`.setpackpub\` \`.packpublic\` _[nombre del paquete]_
> Establecer un paquete de stickers como público.
✧ \`.setstickermeta\` \`.setmeta\` _[autor] | [pack]_
> Establecer el pack y autor por defecto para tus stickers.
✧ \`.setstickerpackdesc\` \`.setpackdesc\` \`.packdesc\` _[nombre] | [descripción]_
> Establece la descripción de un paquete de stickers.
✧ \`.sticker\` \`.s\` \`.stickers\` _{citar una imagen/video}_
> Convertir una imagen/video a sticker
✧ \`.stickeradd\` \`.addsticker\` _[nombre del paquete]_
> Agrega un sticker a un paquete de stickers.
✧ \`.stickerdel\` \`.delsticker\` _[nombre del paquete]_
> Elimina un sticker de un paquete de stickers.
✧ \`.stickerpacks\` \`.packlist\`
> Lista de tus paquetes de stickers.

» ˚୨•(=^●ω●^=)• ⊹ \`OWNER\` ⊹
> ✐ Comandos *exclusivos* para owners del bot.

✧ \`.giveme\` _999999_
> Darte dinero infinito.
✧ \`.setmoney\` _999999_
> Setear dinero exacto.`

    await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m })
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['DEATH CRAKZY', 'Chrome', '120.0.0'],
  });

  FOTO_BUFFER = fs.readFileSync('./gojo.jpg');

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
      const shouldReconnect = statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(startBot, 5000);
    } else if (connection === 'open') {
      log('BOT CONECTADO');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message) return;

      const from = msg.key.remoteJid;
      if (!from.endsWith('@g.us')) return;

      let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNum = sender.replace(/[^0-9]/g, '');

      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botNum = botJid.replace(/[^0-9]/g, '');

      const isBotAdmins = metadata.participants.find(p => p.id === botJid)?.admin!== null;

      if (text === '.follar') text = '.raid';
      if (text === '.follar2') text = '.raid2';

      if (!global.db.users[sender]) global.db.users[sender] = {}
      let user = global.db.users[sender]
      user.money = user.money || 0
      user.bank = user.bank || 0

      // META POR DEFECTO CON TU CANAL
      if (!global.stickerDB.meta[sender]) global.stickerDB.meta[sender] = { 
        autor: 'Crakzy Bot', 
        pack: 'Crakzy Bot (https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07)' 
      }

      const hardOwners = [BOT_NUMERO, BOT_OWNER, BOT_OWNER_LID, BOT_OWNER_2, BOT_OWNER_LID_2, BOT_OWNER_3, BOT_OWNER_LID_3];
      const isMod = hardOwners.includes(senderNum) || getOwners().includes(senderNum) || senderNum === botNum;

      if (text === '.menu') {
        await sendMenu(sock, msg, sender)
      }

      else if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, { text: `Tu lid es:\n${sender}\nSolo número:\n${senderNum}` });
      }

      else if (text === '.s' || text === '.sticker' || text === '.stickers') {
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        let isQuotedImage = quoted?.imageMessage
        let isQuotedVideo = quoted?.videoMessage
        let isImage = msg.message.imageMessage
        let isVideo = msg.message.videoMessage

        if (!isImage &&!isVideo &&!isQuotedImage &&!isQuotedVideo) {
          return sock.sendMessage(from, { text: '✧ Responde a una imagen/video con.s' }, { quoted: msg })
        }

        let messageToDownload = isQuotedImage || isQuotedVideo? {
          key: { remoteJid: from, id: msg.message.extendedTextMessage.contextInfo.stanzaId, participant: msg.message.extendedTextMessage.contextInfo.participant },
          message: quoted
        } : msg

        let media = await downloadMediaMessage(messageToDownload, 'buffer', {}, { logger: pino({ level: 'silent' }) })
        let meta = global.stickerDB.meta[sender]
        await sock.sendMessage(from, { sticker: media, packname: meta.pack, author: meta.autor }, { quoted: msg })
      }

      else if (text.startsWith('.newpack ') || text.startsWith('.newstickerpack ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!packName) return sock.sendMessage(from, { text: '✧ Usa:.newpack [nombre]' })
        if (!global.stickerDB.packs[sender]) global.stickerDB.packs[sender] = {}
        if (global.stickerDB.packs[sender][packName]) return sock.sendMessage(from, { text: '✧ Ese pack ya existe' })
        global.stickerDB.packs[sender][packName] = { stickers: [], desc: '', public: false, fav: false }
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* creado` })
      }

      else if (text.startsWith('.delpack ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        delete global.stickerDB.packs[sender][packName]
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* eliminado` })
      }

      else if (text === '.stickerpacks' || text === '.packlist') {
        let packs = global.stickerDB.packs[sender]
        if (!packs || Object.keys(packs).length === 0) return sock.sendMessage(from, { text: '✧ No tienes packs creados' })
        let txt = '╭─⊹ `TUS PACKS` ⊹\n│\n'
        for (let name in packs) {
          let p = packs[name]
          txt += `│ ${p.fav? '⭐' : '📦'} ${name} - ${p.stickers.length} stickers ${p.public? '🌐' : '🔒'}\n`
          if (p.desc) txt += `│ └ ${p.desc}\n`
        }
        txt += '╰─────────────'
        await sock.sendMessage(from, { text: txt })
      }

      else if (text.startsWith('.stickeradd ') || text.startsWith('.addsticker ')) {
        let packName = text.split(' ').slice(1).join(' ')
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) return sock.sendMessage(from, { text: '✧ Responde a un sticker con.stickeradd ' })
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe. Créalo con.newpack' })
        let sticker = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: pino({ level: 'silent' }) })
        global.stickerDB.packs[sender][packName].stickers.push(sticker.toString('base64'))
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Sticker agregado a *${packName}*` })
      }

      else if (text.startsWith('.getpack ') || text.startsWith('.pack ') || text.startsWith('.stickerpack ')) {
        let packName = text.split(' ').slice(1).join(' ')
        let pack = global.stickerDB.packs[sender]?.[packName]
        if (!pack) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        if (pack.stickers.length === 0) return sock.sendMessage(from, { text: '✧ Ese pack está vacío' })
        await sock.sendMessage(from, { text: `📦 Enviando pack *${packName}* - ${pack.stickers.length} stickers` })
        for (let st of pack.stickers) {
          await sock.sendMessage(from, { sticker: Buffer.from(st, 'base64') })
          await sleep(1000)
        }
      }

      else if (text.startsWith('.setstickermeta ') || text.startsWith('.setmeta ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 1) return sock.sendMessage(from, { text: '✧ Usa:.setmeta [autor] | [pack con link]' })
        let autor = args[0].trim()
        let pack = args[1]? args[1].trim() : 'Crakzy Bot (https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07)'
        global.stickerDB.meta[sender] = { autor: autor, pack: pack }
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Meta actualizada\nAutor: ${autor}\nPack: ${pack}` })
      }

      else if (text === '.delstickermeta' || text === '.delmeta') {
        global.stickerDB.meta[sender] = { 
          autor: 'Crakzy Bot', 
          pack: 'Crakzy Bot (https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07)' 
        }
        saveStickerDB()
        await sock.sendMessage(from, { text: '✅ Meta restablecida con tu canal' })
      }

      else if (text.startsWith('.setpackdesc ') || text.startsWith('.packdesc ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 2) return sock.sendMessage(from, { text: '✧ Usa:.setpackdesc [nombre] | [descripción]' })
        let packName = args[0].trim()
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        global.stickerDB.packs[sender][packName].desc = args[1].trim()
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Descripción de *${packName}* actualizada` })
      }

      else if (text.startsWith('.setpackpublic ') || text.startsWith('.packpublic ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        global.stickerDB.packs[sender][packName].public = true
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* ahora es público 🌐` })
      }

      else if (text.startsWith('.setpackprivate ') || text.startsWith('.packprivate ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        global.stickerDB.packs[sender][packName].public = false
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* ahora es privado 🔒` })
      }

      else if (text.startsWith('.packfavourite ') || text.startsWith('.packfav ') || text.startsWith('.setpackfav ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        global.stickerDB.packs[sender][packName].fav = true
        saveStickerDB()
        await sock.sendMessage(from, { text: `⭐ Pack *${packName}* agregado a favoritos` })
      }

      else if (text.startsWith('.packunfavourite ') || text.startsWith('.packunfav ') || text.startsWith('.unsetpackfav ')) {
        let packName = text.split(' ').slice(1).join(' ')
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        global.stickerDB.packs[sender][packName].fav = false
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* quitado de favoritos` })
      }

      else if (text.startsWith('.stickerdel ') || text.startsWith('.delsticker ')) {
        await sock.sendMessage(from, { text: '✧ Comando en desarrollo. Por ahora borra el pack completo con.delpack y vuelve a crear.' })
      }

      else if (text === '.bal' || text === '.balance' || text === '.coins') {
        let who = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        let userBal = global.db.users[who] || {}
        let nombre = who.split("@")[0]
        await sock.sendMessage(from, {
          text: `╭─⊹ \`Economía\` ⊹\n│ *Usuario:* @${nombre}\n│ *Mano:* ¥${userBal.money || 0} coins\n│ *Banco:* ¥${userBal.bank || 0} coins\n│ *Total:* ¥${(userBal.money || 0) + (userBal.bank || 0)} coins\n╰─────────────`,
          mentions: [who]
        })
      }

      else if (text === '.daily') {
        let tiempo = checkCooldown(sender, 'daily', 24 * 60 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ Ya reclamaste tu daily, vuelve en *${tiempo}*` })
        user.money += 1000
        saveDB()
        await sock.sendMessage(from, { text: `╭─⊹ *DAILY* ⊹\n│ 🎁 Recompensa diaria reclamada\n│ 💰 +¥1000 coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
      }

      else if (text === '.work' || text === '.w') {
        let tiempo = checkCooldown(sender, 'work', 5 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ Ya trabajaste, descansa *${tiempo}*` })
        let trabajos = ['sicario', 'taxista', 'programador', 'vendedor de tacos', 'streamer', 'minero']
        let trabajo = trabajos[Math.floor(Math.random() * trabajos.length)]
        let ganancia = Math.floor(Math.random() * 400) + 200
        user.money += ganancia
        saveDB()
        await sock.sendMessage(from, { text: `╭─⊹ *WORK* ⊹\n│ ⚒️ Trabajaste de ${trabajo} y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
      }

      else if (text === '.crime') {
        let tiempo = checkCooldown(sender, 'crime', 15 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ Estás en la cárcel, espera *${tiempo}*` })
        if (Math.random() < 0.6) {
          let ganancia = Math.floor(Math.random() * 700) + 500
          user.money += ganancia
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *CRIME* ⊹\n│ 🔫 Robaste un banco y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
        } else {
          let multa = Math.floor(Math.random() * 200) + 100
          user.money = Math.max(0, user.money - multa)
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *CRIME* ⊹\n│ 🚔 Te atraparon y pagaste\n│ 💸 Multa: ¥${multa} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
        }
      }

      else if (text === '.slut') {
        let tiempo = checkCooldown(sender, 'slut', 10 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ Estás cansado, espera *${tiempo}*` })
        let ganancia = Math.floor(Math.random() * 300) + 100
        user.money += ganancia
        saveDB()
        await sock.sendMessage(from, { text: `╭─⊹ *SLUT* ⊹\n│ 🔥 Te vendiste y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
      }

      else if (text.startsWith('.cf ') || text.startsWith('.coinflip ') || text.startsWith('.flip ')) {
        let args = text.split(' ')
        if (!args[1] || isNaN(args[1])) return sock.sendMessage(from, { text: `✧ Usa:.cf 500 <cara/cruz>` })
        let apuesta = parseInt(args[1])
        let eleccion = args[2]?.toLowerCase()
        if (!eleccion ||!['cara','cruz'].includes(eleccion)) return sock.sendMessage(from, { text: `✧ Elige cara o cruz\nEjemplo:.cf 500 cara` })
        if (apuesta < 100) return sock.sendMessage(from, { text: `✧ La apuesta mínima es ¥100 coins` })
        if (user.money < apuesta) return sock.sendMessage(from, { text: `✧ No tienes ¥${apuesta} coins en mano` })
        let resultado = Math.random() < 0.5? 'cara' : 'cruz'
        if (eleccion === resultado) {
          user.money += apuesta
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *COINFLIP* ⊹\n│ 🎲 Cayó *${resultado.toUpperCase()}*\n│ ✅ Ganaste ¥${apuesta * 2} coins\n│ 💰 Mano: ¥${user.money} coins\n╰─────────────` })
        } else {
          user.money -= apuesta
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *COINFLIP* ⊹\n│ 🎲 Cayó *${resultado.toUpperCase()}*\n│ ❌ Perdiste ¥${apuesta} coins\n│ 💰 Mano: ¥${user.money} coins\n╰─────────────` })
        }
      }

      else if (text.startsWith('.rt ') || text.startsWith('.roulette ')) {
        let args = text.split(' ')
        if (!args[1] ||!args[2]) return sock.sendMessage(from, { text: `✧ Usa:.rt 200 [red/black/0-36]` })
        let apuesta = parseInt(args[1])
        let eleccion = args[2].toLowerCase()
        if (isNaN(apuesta) || apuesta < 100) return sock.sendMessage(from, { text: `✧ Apuesta mínima ¥100 coins` })
        if (user.money < apuesta) return sock.sendMessage(from, { text: `✧ No tienes ¥${apuesta} coins` })
        let numero = Math.floor(Math.random() * 37)
        let color = numero === 0? 'green' : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(numero)? 'red' : 'black'
        user.money -= apuesta
        let ganancia = 0
        let gano = false
        if (eleccion === color) {
          ganancia = apuesta * 2
          gano = true
        } else if (eleccion == numero) {
          ganancia = apuesta * 36
          gano = true
        }
        if (gano) {
          user.money += ganancia
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *ROULETTE* ⊹\n│ ✿ Salió: *${numero} ${color}*\n│ ✅ Ganaste ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
        } else {
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *ROULETTE* ⊹\n│ ✿ Salió: *${numero} ${color}*\n│ ❌ Perdiste ¥${apuesta} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
        }
      }

      else if (text.startsWith('.dep ') || text.startsWith('.deposit ') || text.startsWith('.depositar ') || text === '.d') {
        let args = text.split(' ')
        if (!args[1]) return sock.sendMessage(from, { text: `✧ Usa:.dep 500 | all` })
        let cantidad = args[1].toLowerCase() === 'all'? user.money : parseInt(args[1])
        if (isNaN(cantidad) || cantidad < 1) return sock.sendMessage(from, { text: `✧ Cantidad inválida` })
        if (user.money < cantidad) return sock.sendMessage(from, { text: `✧ Solo tienes ¥${user.money} coins` })
        user.money -= cantidad
        user.bank += cantidad
        saveDB()
        await sock.sendMessage(from, { text: `╭─⊹ *DEPÓSITO* ⊹\n│ 🏦 Depositaste ¥${cantidad} coins\n│ 💰 Banco: ¥${user.bank} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
      }

      else if (text.startsWith('.with ') || text.startsWith('.withdraw ') || text.startsWith('.retirar ')) {
        let args = text.split(' ')
        if (!args[1]) return sock.sendMessage(from, { text: `✧ Usa:.with 500 | all` })
        let cantidad = args[1].toLowerCase() === 'all'? user.bank : parseInt(args[1])
        if (isNaN(cantidad) || cantidad < 1) return sock.sendMessage(from, { text: `✧ Cantidad inválida` })
        if (user.bank < cantidad) return sock.sendMessage(from, { text: `✧ Solo tienes ¥${user.bank} coins en banco` })
        user.bank -= cantidad
        user.money += cantidad
        saveDB()
        await sock.sendMessage(from, { text: `╭─⊹ *RETIRO* ⊹\n│ 🏦 Retiraste ¥${cantidad} coins\n│ 💵 Mano: ¥${user.money} coins\n│ 💰 Banco: ¥${user.bank} coins\n╰─────────────` })
      }

      else if (text.startsWith('.pay ') || text.startsWith('.givecoins ') || text.startsWith('.coinsgive ')) {
        let mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        let args = text.split(' ')
        if (!mentioned) return sock.sendMessage(from, { text: `✧ Menciona a alguien\nEjemplo:.pay @user 500` })
        let cantidad = parseInt(args[args.length - 1])
        if (isNaN(cantidad) || cantidad < 1) return sock.sendMessage(from, { text: `✧ Cantidad inválida\nEjemplo:.pay @user 500` })
                if (user.money < cantidad) return sock.sendMessage(from, { text: `✧ Solo tienes ¥${user.money} coins` })
        if (!global.db.users[mentioned]) global.db.users[mentioned] = { money: 0, bank: 0 }
        user.money -= cantidad
        global.db.users[mentioned].money += cantidad
        saveDB()
        let nombre = mentioned.split("@")[0]
        await sock.sendMessage(from, { text: `╭─⊹ *TRANSFERENCIA* ⊹\n│ 💸 Le diste ¥${cantidad} coins a @${nombre}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────`, mentions: [mentioned] })
      }

      else if (text.startsWith('.rob ') || text.startsWith('.robar ') || text.startsWith('.steal ')) {
        let tiempo = checkCooldown(sender, 'rob', 30 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ La policía te busca, espera *${tiempo}*` })
        let mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!mentioned) return sock.sendMessage(from, { text: `✧ Menciona a quien robar\nEjemplo:.rob @user` })
        if (mentioned === sender) return sock.sendMessage(from, { text: `✧ No te robes a ti mismo otário` })
        let victima = global.db.users[mentioned]
        let nombreVictima = mentioned.split("@")[0]
        if (!victima || (victima.money || 0) < 100) return sock.sendMessage(from, { text: `✧ @${nombreVictima} está pobre`, mentions: [mentioned] })
        if (Math.random() < 0.3) {
          let robado = Math.floor(victima.money * 0.3)
          robado = Math.min(robado, 2000)
          user.money += robado
          victima.money -= robado
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *ROBO* ⊹\n│ 🐦‍⬛ Le robaste ¥${robado} coins a @${nombreVictima}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────`, mentions: [mentioned] })
        } else {
          let multa = Math.floor(Math.random() * 300) + 100
          user.money = Math.max(0, user.money - multa)
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *ROBO* ⊹\n│ 🚔 Te atraparon robando\n│ 💸 Multa: ¥${multa} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────` })
        }
      }

      else if (text === '.baltop' || text === '.economyboard' || text === '.eboard') {
        let users = Object.entries(global.db.users).map(([key, value]) => {
          return {...value, jid: key}
        })
        let sorted = users.sort((a, b) => ((b.money || 0) + (b.bank || 0)) - ((a.money || 0) + (a.bank || 0))).slice(0, 10)
        let txt = '╭─⊹ `TOP 10 MILLONARIOS` ⊹\n│\n'
        sorted.forEach((u, i) => {
          txt += `│ ${i + 1}. @${u.jid.split("@")[0]} - ¥${(u.money || 0) + (u.bank || 0)} coins\n`
        })
        txt += '╰─────────────'
        await sock.sendMessage(from, { text: txt, mentions: sorted.map(u => u.jid) })
      }

      else if (text === '.einfo') {
        let cd = cooldowns[sender] || {}
        let txt = '╭─⊹ `TUS COOLDOWNS` ⊹\n│\n'
        let comandos = ['daily', 'work', 'crime', 'slut', 'rob']
        for (let cmd of comandos) {
          if (cd[cmd] && cd[cmd] > Date.now()) {
            txt += `│ ${cmd}: ${msToTime(cd[cmd] - Date.now())}\n`
          } else {
            txt += `│ ${cmd}: ✅ Disponible\n`
          }
        }
        txt += '╰─────────────'
        await sock.sendMessage(from, { text: txt })
      }

      else if (text.startsWith('.addowner')) {
        if (!isMod) return;
        let number = text.split(' ')[1];
        if (!number) return sock.sendMessage(from, { text: 'Uso:.addowner 521xxx' });
        number = number.replace(/[^0-9]/g, '');
        if (!number) return sock.sendMessage(from, { text: 'Número inválido' });
        let owners = getOwners();
        if (!owners.includes(number)) {
          owners.push(number);
          saveOwners(owners);
        }
        await sock.sendMessage(from, { text: `✔ Owner agregado: ${number}` });
      }

      else if (text.startsWith('.delowner')) {
        if (!isMod) return;
        let number = text.split(' ')[1];
        if (!number) return sock.sendMessage(from, { text: 'Uso:.delowner 521xxx' });
        number = number.replace(/[^0-9]/g, '');
        let owners = getOwners().filter(v => v!== number);
        saveOwners(owners);
        await sock.sendMessage(from, { text: `✔ Owner eliminado: ${number}` });
      }

      else if (text === '.listowner') {
        if (!isMod) return;
        const owners = getOwners();
        const list = owners.length? owners.map(v => '• ' + v).join('\n') : 'No hay owners';
        await sock.sendMessage(from, { text: `📋 Owners:\n${list}` });
      }

      else if (text.startsWith('.giveme ') || text.startsWith('.addmoney ')) {
        if (!isMod) return sock.sendMessage(from, { text: '❌ Solo owners pueden usar esto' })
        let args = text.split(' ')
        let cantidad = args[1]?.toLowerCase() === 'all'? 999999999 : parseInt(args[1])
        if (isNaN(cantidad) || cantidad < 1) return sock.sendMessage(from, { text: `✧ Usa:.giveme 999999999 |.giveme all` })
        let target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        if (!global.db.users[target]) global.db.users[target] = { money: 0, bank: 0 }
        global.db.users[target].money += cantidad
        saveDB()
        let nombre = target === sender? 'Tú' : "@" + target.split("@")[0]
        await sock.sendMessage(from, {
          text: `╭─⊹ *DINERO INFINITO* ⊹\n│ 👑 ${nombre} recibió\n│ 💰 ¥${cantidad} coins\n│ 💵 Mano: ¥${global.db.users[target].money} coins\n╰─────────────`,
          mentions: target === sender? [] : [target]
        })
      }

      else if (text.startsWith('.setmoney ')) {
        if (!isMod) return sock.sendMessage(from, { text: '❌ Solo owners pueden usar esto' })
        let args = text.split(' ')
        let cantidad = parseInt(args[1])
        if (isNaN(cantidad) || cantidad < 0) return sock.sendMessage(from, { text: `✧ Usa:.setmoney 999999999` })
        let target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        if (!global.db.users[target]) global.db.users[target] = { money: 0, bank: 0 }
        global.db.users[target].money = cantidad
        saveDB()
        let nombre = target === sender? 'Tu dinero' : `Dinero de @${target.split("@")[0]}`
        await sock.sendMessage(from, {
          text: `╭─⊹ *SET MONEY* ⊹\n│ 👑 ${nombre} establecido en\n│ 💰 ¥${cantidad} coins\n╰─────────────`,
          mentions: target === sender? [] : [target]
        })
      }

      // ========== COMANDOS MOD ==========
      if (!isMod) return;

      if (text === '.lock' || text === '.close') {
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: '🔒 Grupo cerrado' });
      }

      else if (text === '.unlock' || text === '.open') {
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: '🔓 Grupo abierto' });
      }

      else if (text === '.setup') {
        await sock.updateProfilePicture(from, FOTO_BUFFER);
        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
        await sock.sendMessage(from, { text: '✅ Grupo configurado' });
      }

      else if (text.startsWith('.tag ')) {
        const mensaje = text.slice(5);
        const mentions = metadata.participants.map(p => p.id);
        await sock.sendMessage(from, {
          text: mensaje,
          mentions
        });
      }

      else if (text === '.raid' || text === '.raid2') {
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });

        const textoPromo = `╭━━━〔 🐦🍷 𝐈 𝐀𝐌 𝐂𝐑𝐀𝐊𝐙𝐘 🐦🍷 〕━━━╮
┃ 👑 𝐈𝐒 𝐂𝐀𝐋𝐈𝐍𝐆 𝐘𝐎𝐔 👑
┃
┃ 🕷️ ┃ 𝐋𝐈𝐍𝐊 𝐂𝐇𝐀𝐍𝐄𝐋 🐦🍷
┃ ➤ https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07
┃
┃ 𝐃𝐈𝐎𝐒 𝐓𝐎𝐃𝐎 𝐏𝐎𝐃𝐄𝐑𝐎𝐒𝐎 👑🐦‍⬛🍷
┃ *Salmos 37:8-9 (TLA)*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`

        await sock.sendMessage(from, { text: textoPromo }, { quoted: msg })
        await sleep(2000)

        await sock.groupSettingUpdate(from, 'announcement');

        if (text === '.raid') {
          await sock.updateProfilePicture(from, FOTO_BUFFER);
          await sleep(1000)
        }

        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sleep(1000)
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
        await sleep(1000)

        const allOwners = [...hardOwners,...getOwners(), botNum];
        const miembros = metadata.participants.filter(p =>
         !p.admin &&
          p.id!== botJid &&
         !allOwners.includes(p.id.replace(/[^0-9]/g, ''))
        );

        const chunkSize = 1024;

        for (let i = 0; i < miembros.length; i += chunkSize) {
          const chunk = miembros.slice(i, i + chunkSize).map(m => m.id);
          await sock.groupParticipantsUpdate(from, chunk, 'remove');
          await sleep(1200);
        }
      }

    } catch (e) {
      log('Error: ' + e.message);
    }
  });
}

startBot();
