const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

process.on('unhandledRejection', (reason) => console.log('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.log('Uncaught Exception:', err));

const NOMBRE_GRUPO = '𝐃𝐄𝐀𝐓𝐇 𝐂𝐑𝐀𝐊𝐙𝐘';
const DESCRIPCION_GRUPO = `𝐍𝐔𝐊𝐄𝐀𝐃𝐎 𝐏𝐎𝐑 𝐂𝐑𝐀𝐊𝐙𝐘 𝐃𝐈𝐎𝐒 𝐓𝐎𝐃𝐎 𝐏𝐎𝐃𝐄𝐑𝐎𝐒𝐎\nSalmos 37:8-9 (TLA)\n\n📢 𝐂𝐀𝐍𝐀𝐋 𝐃𝐄 𝐂𝐑𝐀𝐊𝐘:\nhttps://whatsapp.com/channel/0029VbCP81gADTOEOgWQxW07`;

const BOT_OWNER = '5219613301789@s.whatsapp.net';
const BOT_OWNER_LID = '189915467931651@lid';
const BOT_OWNER_2 = '584124339924@s.whatsapp.net';
const BOT_OWNER_LID_2 = '230103309123623@lid';
const BOT_OWNER_3 = '3197010548990@s.whatsapp.net';

let FOTO_BUFFER = null;

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* =========================
   🔧 FIX OWNER DINÁMICO
========================= */
function getOwners() {
  try {
    return JSON.parse(fs.readFileSync('./config.json')).owner || [];
  } catch {
    return [];
  }
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
      if (!msg.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      if (!from.endsWith('@g.us')) return;

      let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const rawSender = msg.key.participant || msg.key.remoteJid;
      const senderNum = rawSender.replace(/[^0-9]/g, ''); // Solo números

      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      const isBotAdmins = metadata.participants.find(p => p.id === botJid)?.admin!== null;

      // alias
      if (text === '.follar') text = '.raid';
      if (text === '.follar2') text = '.raid2';

      /* =========================
         🔐 FIX ISMOD - COMPARA SOLO NÚMEROS
      ========================= */
      const ownersList = getOwners();
      const isMod = (
        senderNum === BOT_OWNER.replace(/[^0-9]/g, '') ||
        rawSender === BOT_OWNER_LID ||
        senderNum === BOT_OWNER_2.replace(/[^0-9]/g, '') ||
        rawSender === BOT_OWNER_LID_2 ||
        senderNum === BOT_OWNER_3.replace(/[^0-9]/g, '') ||
        ownersList.some(o => o.replace(/[^0-9]/g, '') === senderNum)
      );

      if (text === '.menu') {
        if (!isMod) return;
        await sock.sendMessage(from, {
          text: `📋 MENÚ\n.lock\n.unlock\n.setup\n.tag\n.mylid\n.follar\n.follar2\n.addowner\n.delowner\n.listowner`
        });
      }

      if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, {
          text: `Tu lid es:\n${rawSender}\nSolo números:\n${senderNum}`
        });
      }

      /* =========================
         👑 OWNER COMMANDS
      ========================= */

      else if (text.startsWith('.addowner')) {
        if (!isMod) return;

        let owners = getOwners();
        let number = text.split(' ')[1];
        if (!number) return sock.sendMessage(from, { text: 'Uso:.addowner 521xxx o.addowner @lid' });

        number = number.replace(/[^0-9]/g, ''); // guarda solo números
        if (!number) return;

        if (!owners.includes(number)) {
          owners.push(number);
          fs.writeFileSync('./config.json', JSON.stringify({ owner: owners }, null, 2));
        }

        await sock.sendMessage(from, {
          text: `✔ Owner agregado: ${number}`
        });
      }

      else if (text.startsWith('.delowner')) {
        if (!isMod) return;

        let owners = getOwners();
        let number = text.split(' ')[1];
        if (!number) return sock.sendMessage(from, { text: 'Uso:.delowner 521xxx' });

        number = number.replace(/[^0-9]/g, '');
        owners = owners.filter(v => v.replace(/[^0-9]/g, '')!== number);

        fs.writeFileSync('./config.json', JSON.stringify({ owner: owners }, null, 2));

        await sock.sendMessage(from, {
          text: `✔ Owner eliminado: ${number}`
        });
      }

      else if (text === '.listowner') {
        if (!isMod) return;
        const owners = getOwners();
        const list = owners.length
         ? owners.map(v => '• ' + v).join('\n')
          : 'No hay owners';

        await sock.sendMessage(from, {
          text: `📋 Owners:\n${list}`
        });
      }

      /* ========================= */

      if (!isMod) return;

      if (text === '.lock') {
        await sock.groupSettingUpdate(from, 'announcement');
      }
      else if (text === '.unlock') {
        await sock.groupSettingUpdate(from, 'not_announcement');
      }

    } catch (e) {
      log('Error: ' + e.message);
    }
  });
}

startBot();
