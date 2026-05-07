const Jimp = require('jimp')
global.Jimp = Jimp

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

process.on('unhandledRejection', (reason) => console.log('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.log('Uncaught Exception:', err));

const NOMBRE_GRUPO = '𝐃𝐄𝐀𝐓𝐇 𝐂𝐑𝐀𝐊𝐙𝐘';
const DESCRIPCION_GRUPO = `𝐍𝐔𝐊𝐄𝐀𝐃𝐎 𝐏𝐎𝐑 𝐂𝐑𝐀𝐊𝐙𝐘 𝐃𝐈𝐎𝐒 𝐓𝐎𝐃𝐎 𝐏𝐎𝐃𝐄𝐑𝐎𝐒𝐎\nSalmos 37:8-9 (TLA)\n\n📢 𝐂𝐀𝐍𝐀𝐋 𝐃𝐄 𝐂𝐑𝐀𝐊𝐘:\nhttps://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07`;

// NÚMERO DEL BOT
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

// ========== SISTEMA ECONOMIA CRAKZY 👑 ==========
if (!fs.existsSync('./database.json')) fs.writeFileSync('./database.json', JSON.stringify({ users: {} }, null, 2));
global.db = JSON.parse(fs.readFileSync('./database.json'));

function saveDB() {
  fs.writeFileSync('./database.json', JSON.stringify(global.db, null, 2));
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

// FIX: COOLDOWN POR USUARIO
function checkCooldown(userId, cmd, tiempo) {
  if (!cooldowns[userId]) cooldowns[userId] = {}
  let now = Date.now()
  if (cooldowns[userId][cmd] && cooldowns[userId][cmd] > now) {
    return msToTime(cooldowns[userId][cmd] - now)
  }
  cooldowns[userId][cmd] = now + tiempo
  return false
}
// ========== FIN ECONOMIA ==========

/* =========================
   OWNERS DINÁMICOS
========================= */
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

      const isBotAdmins =
        metadata.participants.find(p => p.id === botJid)?.admin!== null;

      // alias
      if (text === '.follar') text = '.raid';
      if (text === '.follar2') text = '.raid2';

      // ========== INIT ECONOMIA ==========
      if (!global.db.users[sender]) global.db.users[sender] = {}
      let user = global.db.users[sender]
      user.money = user.money || 0
      user.bank = user.bank || 0
      // ========== FIN INIT ==========

      /* =========================
         🔐 PERMISOS MOD
      ========================= */

      const hardOwners = [
        BOT_NUMERO,
        BOT_OWNER,
        BOT_OWNER_LID,
        BOT_OWNER_2,
        BOT_OWNER_LID_2,
        BOT_OWNER_3,
        BOT_OWNER_LID_3
      ];

      const isMod =
        hardOwners.includes(senderNum) ||
        getOwners().includes(senderNum) ||
        senderNum === botNum;

      /* =========================
         COMANDOS PÚBLICOS - TODOS PUEDEN USAR
      ========================= */

      if (text === '.menu') {
        await sock.sendMessage(from, {
          text: `╭─⊹ \`MENÚ CRAKZY\` ⊹\n│\n│ 🔐 *COMANDOS MOD*\n│ •.lock - Cierra el grupo\n│ •.unlock - Abre el grupo\n│ •.setup - Cambia foto/nombre/desc\n│ •.tag [msg] - Menciona a todos\n│ •.mylid - Ver tu ID de WhatsApp\n│ •.follar - Raid + kick + rename\n│ •.follar2 - Raid sin cambiar foto\n│ •.addowner 521xxx - Agrega owner\n│ •.delowner 521xxx - Quita owner\n│ •.listowner - Lista de owners\n│\n│ 💰 *ECONOMÍA*\n│ •.bal - Ver tu dinero\n│ •.daily - Recompensa diaria 1k\n│ •.work - Trabaja cada 5min\n│ •.crime - Roba bancos 15min\n│ •.slut - Véndete cada 10min\n│ •.rob @user - Roba a alguien\n│ •.cf 500 cara - Coinflip\n│ •.rt 200 red - Ruleta casino\n│ •.dep 500 - Depositar al banco\n│ •.with 500 - Retirar del banco\n│ •.pay @user 500 - Transferir\n│ •.baltop - Top 10 millonarios\n│ •.einfo - Ver tus cooldowns\n│\n│ 👑 *OWNER SOLO*\n│ •.giveme 999999 - Dar dinero\n│ •.setmoney 999999 - Setear dinero\n╰─────────────`
        });
      }

      else if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, {
          text: `Tu lid es:\n${sender}\nSolo número:\n${senderNum}`
        });
      }

      // ========== COMANDOS ECONOMIA 👑 ==========
      else if (text === '.bal' || text === '.balance' || text === '.coins') {
        let who = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
        let userBal = global.db.users[who] || {}
        let nombre = await sock.getName(who)
        await sock.sendMessage(from, {
          text: `╭─⊹ \`Economía\` ⊹\n│ *Usuario:* ${nombre}\n│ *Mano:* ¥${userBal.money || 0} coins\n│ *Banco:* ¥${userBal.bank || 0} coins\n│ *Total:* ¥${(userBal.money || 0) + (userBal.bank || 0)} coins\n╰─────────────`
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

      else if (text.startsWith('.cf ') || text.startsWith('.coinflip ')) {
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

      else if (text.startsWith('.dep ') || text.startsWith('.deposit ') || text === '.d') {
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

      else if (text.startsWith('.pay ') || text.startsWith('.givecoins ')) {
        let mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        let args = text.split(' ')
        if (!mentioned) return sock.sendMessage(from, { text: `✧ Menciona a alguien\nEjemplo:.pay @user 500` })
        let cantidad = parseInt(args[args.length - 1]) // FIX: Último argumento es la cantidad
        if (isNaN(cantidad) || cantidad < 1) return sock.sendMessage(from, { text: `✧ Cantidad inválida\nEjemplo:.pay @user 500` })
        if (user.money < cantidad) return sock.sendMessage(from, { text: `✧ Solo tienes ¥${user.money} coins` })
        if (!global.db.users[mentioned]) global.db.users[mentioned] = { money: 0, bank: 0 }
        user.money -= cantidad
        global.db.users[mentioned].money += cantidad
        saveDB()
        let nombre = await sock.getName(mentioned)
        await sock.sendMessage(from, { text: `╭─⊹ *TRANSFERENCIA* ⊹\n│ 💸 Le diste ¥${cantidad} coins a ${nombre}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────` })
      }

      else if (text.startsWith('.rob ') || text.startsWith('.robar ') || text.startsWith('.steal ')) {
        let tiempo = checkCooldown(sender, 'rob', 30 * 60 * 1000)
        if (tiempo) return sock.sendMessage(from, { text: `✧ La policía te busca, espera *${tiempo}*` })
        let mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if (!mentioned) return sock.sendMessage(from, { text: `✧ Menciona a quien robar\nEjemplo:.rob @user` })
        if (mentioned === sender) return sock.sendMessage(from, { text: `✧ No te robes a ti mismo otário` })
        let victima = global.db.users[mentioned]
        let nombreVictima = await sock.getName(mentioned)
        if (!victima || (victima.money || 0) < 100) return sock.sendMessage(from, { text: `✧ ${nombreVictima} está pobre` })
        if (Math.random() < 0.3) {
          let robado = Math.floor(victima.money * 0.3)
          robado = Math.min(robado, 2000)
          user.money += robado
          victima.money -= robado
          saveDB()
          await sock.sendMessage(from, { text: `╭─⊹ *ROBO* ⊹\n│ 🐦‍⬛ Le robaste ¥${robado} coins a ${nombreVictima}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────` })
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
        let sorted = users.sort((a, b) => ((b.money || 0) + (b.bank || 0)) - ((a.money || 0) + (a.bank || 0)))
        let txt = `╭─⊹ *TOP ECONOMÍA* ⊹\n│\n`
        let mentions = []
        for (let i = 0; i < Math.min(10, sorted.length); i++) {
          let total = (sorted[i].money || 0) + (sorted[i].bank || 0)
          let nombre = await sock.getName(sorted[i].jid)
          txt += `│ ${i + 1}. ${nombre} - ¥${total} coins\n`
          mentions.push(sorted[i].jid)
        }
        txt += `╰─────────────`
        await sock.sendMessage(from, { text: txt, mentions: mentions })
      }

      else if (text === '.einfo' || text === '.economyinfo') {
        let crimeCd = cooldowns[sender]?.crime > Date.now()? msToTime(cooldowns[sender].crime - Date.now()) : 'Listo'
        let workCd = cooldowns[sender]?.work > Date.now()? msToTime(cooldowns[sender].work - Date.now()) : 'Listo'
        let slutCd = cooldowns[sender]?.slut > Date.now()? msToTime(cooldowns[sender].slut - Date.now()) : 'Listo'
        let dailyCd = cooldowns[sender]?.daily > Date.now()? msToTime(cooldowns[sender].daily - Date.now()) : 'Listo'
        let robCd = cooldowns[sender]?.rob > Date.now()? msToTime(cooldowns[sender].rob - Date.now()) : 'Listo'
        await sock.sendMessage(from, { text: `╭─⊹ *TU ECONOMÍA* ⊹\n│ 💰 Mano: ¥${user.money} coins\n│ 🏦 Banco: ¥${user.bank} coins\n│ 📊 Total: ¥${user.money + user.bank} coins\n│\n│ *COOLDOWNS:*\n│ ⚒️ Work: ${workCd}\n│ 🔫 Crime: ${crimeCd}\n│ 🔥 Slut: ${slutCd}\n│ 🎁 Daily: ${dailyCd}\n│ 🐦‍⬛ Rob: ${robCd}\n╰─────────────` })
      }

      /* =========================
         👑 OWNER COMMANDS
      ========================= */

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

        let nombre = target === sender? 'Tú' : await sock.getName(target)
        await sock.sendMessage(from, {
          text: `╭─⊹ *DINERO INFINITO* ⊹\n│ 👑 ${nombre} recibió\n│ 💰 ¥${cantidad} coins\n│ 💵 Mano: ¥${global.db.users[target].money} coins\n╰─────────────`
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

        let nombre = target === sender? 'Tu dinero' : `Dinero de ${await sock.getName(target)}`
        await sock.sendMessage(from, {
          text: `╭─⊹ *SET MONEY* ⊹\n│ 👑 ${nombre} establecido en\n│ 💰 ¥${cantidad} coins\n╰─────────────`
        })
      }
      // ========== FIN ECONOMIA ==========

      /* =========================
         COMANDOS MOD
      ========================= */

      if (!isMod) return;

      if (text === '.lock') {
        await sock.groupSettingUpdate(from, 'announcement');
      }

      else if (text === '.unlock') {
        await sock.groupSettingUpdate(from, 'not_announcement');
      }

      else if (text === '.setup') {
        await sock.updateProfilePicture(from, FOTO_BUFFER);
        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
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

        if (!isBotAdmins) return;

        await sock.groupSettingUpdate(from, 'announcement');

        if (text === '.raid') {
          await sock.updateProfilePicture(from, FOTO_BUFFER);
        }

        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);

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
