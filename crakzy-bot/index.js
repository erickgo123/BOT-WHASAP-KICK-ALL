const Jimp = require('jimp')
global.Jimp = Jimp

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios')
const ytdl = require('ytdl-core')
const { youtubedl, tiktokdl, facebookdl, twitterdl, instagramdl, mediafiredl, pinterest } = require('@bochilteam/scraper')

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
   fs.writeFileSync('./owners.json', JSON.stringify(cleanOwners, null, 2));
}

async function crearCollage(stickersBase64) {
  const img = new Jimp(300, 300, 0xFF202020)
  let stickersValidos = 0

  for (let i = 0; i < stickersBase64.length && stickersValidos < 4; i++) {
    try {
      let buffer = Buffer.from(stickersBase64[i], 'base64')
      let sticker = await Jimp.read(buffer)
      sticker.resize(140, 140)
      let x = (stickersValidos % 2) * 150 + 5
      let y = Math.floor(stickersValidos / 2) * 150 + 5
      img.composite(sticker, x, y)
      stickersValidos++
    } catch (e) {
      console.log('Sticker saltado:', e.message)
    }
  }

  if (stickersValidos === 0) {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
    img.print(font, 100, 130, 'PACK VACIO')
  }

  return await img.getBufferAsync(Jimp.MIME_JPEG)
}

async function sendMenu(sock, m, userId) {
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const user = global.db.users[userId] || {}
    const totalUsers = Object.keys(global.db.users).length
    const uptime = process.uptime() * 1000
    const tiempo = msToTime(uptime)

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

» ˚୨•(=^●ω●^=)• ⊹ \`Descargas\` ⊹
> ✐ Comandos de *Descargas* para descargar archivos de varias fuentes.

✧ \`#play\` \`#yt\` _[Canción]_
> Descargar audio de YouTube
✧ \`#mp4\` \`#ytmp4\` _[Video]_
> Descargar video de YouTube
✧ \`#ytsearch\` \`#search\` _[búsqueda]_
> Buscar videos de YouTube
✧ \`#tiktok\` \`#tt\` _[Link]_
> Descargar video de TikTok
✧ \`#facebook\` \`#fb\` _[Link]_
> Descargar video de Facebook
✧ \`#instagram\` \`#ig\` \`#reel\` _[Link]_
> Descargar reel/post de Instagram
✧ \`#twitter\` \`#x\` _[Link]_
> Descargar video de Twitter/X
✧ \`#mediafire\` \`#mf\` _[Link]_
> Descargar archivo de MediaFire
✧ \`#pinterest\` \`#pin\` _[búsqueda]_
> Buscar imágenes de Pinterest
✧ \`#nhentai\` \`#nh\` _[código]_
> Descargar info de doujin +18

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
> Ver un paquete de stickers de Stickerly.
✧ \`.newpack\` \`.newstickerpack\` _[nombre] | [link stickerly]_
> Crea un nuevo paquete de stickers.
✧ \`.packfavourite\` \`.setpackfav\` \`.packfav\` _[nombre del paquete]_
> Establece un paquete de stickers como favorito.
✧ \`.packunfavourite\` \`.unsetpackfav\` \`.packunfav\` _[nombre del paquete]_
> Elimina un paquete de stickers de favoritos.
✧ \`.renamepack\` \`.renombrarpack\` _[viejo] | [nuevo]_
> Renombrar un paquete de stickers.
✧ \`.setpackdesc\` \`.packdesc\` _[nombre] | [descripción]_
> Establece la descripción de un paquete de stickers.
✧ \`.setpacklink\` \`.packlink\` _[nombre] | [link]_
> Guarda el link de Stickerly de un paquete.
✧ \`.setpackprivate\` \`.setpackpriv\` \`.packprivate\` _[nombre del paquete]_
> Establecer un paquete de stickers como privado.
✧ \`.setpackpublic\` \`.setpackpub\` \`.packpublic\` _[nombre del paquete]_
> Establecer un paquete de stickers como público.
✧ \`.setstickermeta\` \`.setmeta\` _[autor] | _
> Establecer el pack y autor por defecto para tus stickers.
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

      if (!global.stickerDB.meta[sender]) global.stickerDB.meta[sender] = {
        autor: 'Crakzy Bot',
        pack: 'Crakzy Bot (https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07)'
      }

      const hardOwners = [BOT_NUMERO, BOT_OWNER_LID, BOT_OWNER_2, BOT_OWNER_LID_2, BOT_OWNER_3, BOT_OWNER_LID_3];
      const isMod = hardOwners.includes(senderNum) || getOwners().includes(senderNum) || senderNum === botNum;

      if (text === '.menu') {
        await sendMenu(sock, msg, sender)
      }

      else if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, { text: `Tu lid es:\n${sender}\nSolo número:\n${senderNum}` });
      }

      // ========== DESCARGAS ==========

      else if (text.startsWith('#play ') || text.startsWith('#yt ')) {
        let query = text.split(' ').slice(1).join(' ')
        if (!query) return sock.sendMessage(from, { text: '✧ Usa:#play [nombre de la canción]' })
        await sock.sendMessage(from, { text: '⏳ Buscando...' })
        try {
          let res = await youtubedl(query)
          let { title, audio } = await res.audio['128kbps'].download()
          await sock.sendMessage(from, {
            audio: { url: audio },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar el audio' })
        }
      }

      else if (text.startsWith('#mp4 ') || text.startsWith('#ytmp4 ')) {
        let query = text.split(' ').slice(1).join(' ')
        if (!query) return sock.sendMessage(from, { text: '✧ Usa:#mp4 [nombre del video]' })
        await sock.sendMessage(from, { text: '⏳ Buscando...' })
        try {
          let res = await youtubedl(query)
          let { title, video } = await res.video['360p'].download()
          await sock.sendMessage(from, {
            video: { url: video },
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: `✧ *${title}*`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar el video' })
        }
      }

      else if (text.startsWith('#ytsearch ') || text.startsWith('#search ')) {
        let query = text.split(' ').slice(1).join(' ')
        if (!query) return sock.sendMessage(from, { text: '✧ Usa:#ytsearch [búsqueda]' })
        try {
          let res = await youtubedl(query)
          let txt = `✧ *Resultados para:* ${query}\n\n`
          res.videos.slice(0, 5).forEach((v, i) => {
            txt += `${i + 1}. *${v.title}*\n ⏱️ ${v.duration} | 👁️ ${v.views}\n 🔗 ${v.url}\n\n`
          })
          await sock.sendMessage(from, { text: txt.trim() })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al buscar' })
        }
      }

      else if (text.startsWith('#tiktok ') || text.startsWith('#tt ')) {
        let url = text.split(' ')[1]
        if (!url ||!url.includes('tiktok.com')) return sock.sendMessage(from, { text: '✧ Usa:#tiktok [link]' })
        await sock.sendMessage(from, { text: '⏳ Descargando...' })
        try {
          let res = await tiktokdl(url)
          await sock.sendMessage(from, {
            video: { url: res.video.no_watermark },
            caption: `✧ *${res.description}*\n👤 @${res.author.unique_id}`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar el tiktok' })
        }
      }

      else if (text.startsWith('#facebook ') || text.startsWith('#fb ')) {
        let url = text.split(' ')[1]
        if (!url ||!url.includes('facebook.com')) return sock.sendMessage(from, { text: '✧ Usa:#fb [link]' })
        await sock.sendMessage(from, { text: '⏳ Descargando...' })
        try {
          let res = await facebookdl(url)
          await sock.sendMessage(from, {
            video: { url: res.result[0].url },
            caption: `✧ *Video de Facebook*`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar de Facebook' })
        }
      }

      else if (text.startsWith('#instagram ') || text.startsWith('#ig ') || text.startsWith('#reel ')) {
        let url = text.split(' ')[1]
        if (!url ||!url.includes('instagram.com')) return sock.sendMessage(from, { text: '✧ Usa:#ig [link]' })
        await sock.sendMessage(from, { text: '⏳ Descargando...' })
        try {
          let res = await instagramdl(url)
          for (let i of res) {
            if (i.type === 'video') {
              await sock.sendMessage(from, { video: { url: i.url }, caption: '✧ *Reel de Instagram*' }, { quoted: msg })
            } else {
              await sock.sendMessage(from, { image: { url: i.url }, caption: '✧ *Post de Instagram*' }, { quoted: msg })
            }
            await sleep(1000)
          }
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar de Instagram' })
        }
      }

      else if (text.startsWith('#twitter ') || text.startsWith('#x ')) {
        let url = text.split(' ')[1]
        if (!url || (!url.includes('twitter.com') &&!url.includes('x.com'))) return sock.sendMessage(from, { text: '✧ Usa:#x [link]' })
        await sock.sendMessage(from, { text: '⏳ Descargando...' })
        try {
          let res = await twitterdl(url)
          await sock.sendMessage(from, {
            video: { url: res.video },
            caption: `✧ *Tweet*\n${res.description}`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar de Twitter/X' })
        }
      }

      else if (text.startsWith('#mediafire ') || text.startsWith('#mf ')) {
        let url = text.split(' ')[1]
        if (!url ||!url.includes('mediafire.com')) return sock.sendMessage(from, { text: '✧ Usa:#mf [link]' })
        await sock.sendMessage(from, { text: '⏳ Descargando...' })
        try {
          let res = await mediafiredl(url)
          await sock.sendMessage(from, {
            document: { url: res.url },
            mimetype: res.mime,
            fileName: res.filename,
            caption: `✧ *${res.filename}*\n📦 Tamaño: ${res.filesize}`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al descargar de MediaFire' })
        }
      }

      else if (text.startsWith('#pinterest ') || text.startsWith('#pin ')) {
        let query = text.split(' ').slice(1).join(' ')
        if (!query) return sock.sendMessage(from, { text: '✧ Usa:#pin [búsqueda]' })
        await sock.sendMessage(from, { text: '⏳ Buscando...' })
        try {
          let res = await pinterest(query)
          let img = res[Math.floor(Math.random() * res.length)]
          await sock.sendMessage(from, {
            image: { url: img },
            caption: `✧ *Pinterest:* ${query}`
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error al buscar en Pinterest' })
        }
      }

      else if (text.startsWith('#nhentai ') || text.startsWith('#nh ')) {
        let code = text.split(' ')[1]
        if (!code) return sock.sendMessage(from, { text: '✧ Usa:#nh [código]' })
        await sock.sendMessage(from, { text: '⏳ Buscando doujin...\n⚠️ Contenido +18' })
        try {
          let res = await axios.get(`https://nhentai.net/api/gallery/${code}`)
          let data = res.data
          let txt = `✧ *${data.title.pretty}*\n\n`
          txt += `📖 Páginas: ${data.num_pages}\n`
          txt += `🏷️ Tags: ${data.tags.map(t => t.name).slice(0, 5).join(', ')}\n`
          txt += `🔗 https://nhentai.net/g/${code}`
          await sock.sendMessage(from, {
            image: { url: `https://i.nhentai.net/galleries/${data.media_id}/1.jpg` },
            caption: txt
          }, { quoted: msg })
        } catch (e) {
          await sock.sendMessage(from, { text: '✧ Error o doujin no encontrado' })
        }
      }

      // ========== MOD ==========

      else if (text === '.lock' || text === '.close') {
        if (!isMod) return;
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: '🔒 Grupo cerrado' });
      }

      else if (text === '.unlock' || text === '.open') {
        if (!isMod) return;
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: '🔓 Grupo abierto' });
      }

      else if (text === '.setup') {
        if (!isMod) return;
        await sock.updateProfilePicture(from, FOTO_BUFFER);
        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
        await sock.sendMessage(from, { text: '✅ Grupo configurado' });
      }

      else if (text.startsWith('.tag ')) {
        if (!isMod) return;
        const mensaje = text.slice(5);
        const mentions = metadata.participants.map(p => p.id);
        await sock.sendMessage(from, {
          text: mensaje,
          mentions
        });
      }

      else if (text === '.raid' || text === '.raid2') {
        if (!isMod) return;
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });

        const textoPromo = `╭━━━〔 🐦🍷 𝐈 𝐀𝐌 𝐂𝐑𝐀𝐊𝐙𝐘 🐦🍷 〕━━━╮
┃ 👑 𝐈𝐒 𝐂𝐀𝐋𝐈𝐍𝐆 𝐘𝐎𝐔 👑
┃ 🕷️ ┃ 𝐋𝐈𝐍𝐊 𝐂𝐇𝐀𝐍𝐄𝐋 🐦🍷
┃ ➤ https://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07
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

      // ========== ECONOMÍA ==========

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
        let tiempo = checkCooldown(sender, 'daily', 24 * 60 * 1000)
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

      // ========== STICKERS ==========

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
        let args = text.split(' ').slice(1).join(' ').split('|')
        let packName = args[0].trim()
        let stickerlyLink = args[1]? args[1].trim() : ''

        if (!packName) return sock.sendMessage(from, { text: '✧ Usa:.newpack [nombre] | [link stickerly opcional]' })
        if (!global.stickerDB.packs[sender]) global.stickerDB.packs[sender] = {}
        if (global.stickerDB.packs[sender][packName]) return sock.sendMessage(from, { text: '✧ Ese pack ya existe' })

        let fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        global.stickerDB.packs[sender][packName] = {
          stickers: [],
          desc: '',
          public: false,
          fav: false,
          creado: fecha,
          modificado: fecha,
          stickerly: stickerlyLink
        }
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Pack *${packName}* creado${stickerlyLink? '\n🔗 Link Stickerly: ' + stickerlyLink : '\n⚠️ Agrega el link con.setpacklink'}` })
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

        let total = Object.keys(packs).length
        let txt = `❀ *Lista de tus paquetes de stickers:*\n│ ▢ Total: ${total}\n│ ▢ Usuario: @${senderNum}\n│\n`

        for (let name in packs) {
          let p = packs[name]
          txt += `❖ *'${name}*\n`
          txt += `│ » Stickers: ${p.stickers.length}\n`
          txt += `│ » Modificado: ${p.modificado || p.creado || 'N/A'}\n`
          txt += `│ » Estado: ${p.public? 'Público' : 'Privado'}\n`
          if (p.stickerly) txt += `│ » Stickerly: ✅\n`
          if (p.desc) txt += `│ » Desc: ${p.desc}\n`
          txt += `│\n`
        }

        await sock.sendMessage(from, { text: txt.trim(), mentions: [sender] })
      }

      else if (text.startsWith('.stickeradd ') || text.startsWith('.addsticker ')) {
        let packName = text.split(' ').slice(1).join(' ')
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) return sock.sendMessage(from, { text: '✧ Responde a un sticker con.stickeradd ' })
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe. Créalo con.newpack' })
        let sticker = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: pino({ level: 'silent' }) })
        global.stickerDB.packs[sender][packName].stickers.push(sticker.toString('base64'))
        global.stickerDB.packs[sender][packName].modificado = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Sticker agregado a *${packName}*` })
      }

      else if (text.startsWith('.getpack ') || text.startsWith('.pack ') || text.startsWith('.stickerpack ')) {
        let packName = text.split(' ').slice(1).join(' ')
        let pack = global.stickerDB.packs[sender]?.[packName]
        if (!pack) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })

        if (!pack.stickerly) {
          return sock.sendMessage(from, {
            text: `✧ *${packName}* no tiene link de Stickerly\n\nUsa:.setpacklink ${packName} | https://wa.me/stickerpack/tu_codigo\n\nSube el pack a Stickerly primero: https://sticker.ly`
          })
        }

        let collage = await crearCollage(pack.stickers.slice(0, 4))
        let desc = pack.desc || `Pack de @${senderNum} • ${pack.stickers.length} stickers`

        await sock.sendMessage(from, {
          text: '',
          contextInfo: {
            externalAdReply: {
              title: packName,
              body: desc,
              thumbnail: collage,
              mediaType: 2,
              mediaUrl: pack.stickerly,
              sourceUrl: pack.stickerly,
              showAdAttribution: false,
              renderLargerThumbnail: true
            }
          }
        })
      }

      else if (text.startsWith('.setpacklink ') || text.startsWith('.packlink ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 2) return sock.sendMessage(from, { text: '✧ Usa:.setpacklink [nombre] | [link stickerly]' })
        let packName = args[0].trim()
        let link = args[1].trim()
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        if (!link.includes('wa.me/stickerpack/') &&!link.includes('sticker.ly')) return sock.sendMessage(from, { text: '✧ Link inválido. Debe ser de Stickerly' })

        global.stickerDB.packs[sender][packName].stickerly = link
        global.stickerDB.packs[sender][packName].modificado = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        saveStickerDB()
        await sock.sendMessage(from, { text: `✅ Link de Stickerly guardado para *${packName}*\n🔗 ${link}\n\nAhora usa.getpack ${packName} para ver el pack` })
      }

      else if (text.startsWith('.renamepack ') || text.startsWith('.renombrarpack ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 2) return sock.sendMessage(from, { text: '✧ Usa:.renamepack [nombre viejo] | [nombre nuevo]' })
        let nombreViejo = args[0].trim()
        let nombreNuevo = args[1].trim()
        if (!nombreNuevo) return sock.sendMessage(from, { text: '✧ El nombre no puede estar vacío' })
        if (!global.stickerDB.packs[sender]?.[nombreViejo]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })
        if (global.stickerDB.packs[sender]?.[nombreNuevo]) return sock.sendMessage(from, { text: '✧ Ya tienes un pack con ese nombre' })

        let packData = global.stickerDB.packs[sender][nombreViejo]
        packData.modificado = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        global.stickerDB.packs[sender][nombreNuevo] = packData
        delete global.stickerDB.packs[sender][nombreViejo]
        saveStickerDB()

        let aviso = `✅ Pack renombrado\n*Antes:* ${nombreViejo}\n*Ahora:* ${nombreNuevo}`
        if (packData.stickerly) {
          aviso += `\n\n⚠️ *IMPORTANTE:* Cambia el nombre también en Stickerly para que coincida\n🔗 ${packData.stickerly}`
        }
        await sock.sendMessage(from, { text: aviso })
      }

      else if (text.startsWith('.setpackdesc ') || text.startsWith('.packdesc ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 2) return sock.sendMessage(from, { text: '✧ Usa:.setpackdesc [nombre] | [descripción]' })
        let packName = args[0].trim()
        let desc = args[1].trim()
        if (!global.stickerDB.packs[sender]?.[packName]) return sock.sendMessage(from, { text: '✧ Ese pack no existe' })

        global.stickerDB.packs[sender][packName].desc = desc
        global.stickerDB.packs[sender][packName].modificado = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
        saveStickerDB()

        let aviso = `✅ Descripción de *${packName}* actualizada`
        if (global.stickerDB.packs[sender][packName].stickerly) {
          aviso += `\n\n⚠️ *IMPORTANTE:* Actualiza la descripción también en Stickerly\n🔗 ${global.stickerDB.packs[sender][packName].stickerly}`
        }
        await sock.sendMessage(from, { text: aviso })
      }

      else if (text.startsWith('.setstickermeta ') || text.startsWith('.setmeta ')) {
        let args = text.split(' ').slice(1).join(' ').split('|')
        if (args.length < 1) return sock.sendMessage(from, { text: '✧ Usa:.setmeta [autor] | ' })
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

      // ========== OWNER ==========

      else if (text.startsWith('.giveme ')) {
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

    } catch (e) {
      log('Error: ' + e.message);
    }
  });
}

startBot();
