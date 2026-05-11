// ECONOMIA CRAKZY 👑🐦‍⬛🍷
// Guarda como: plugins/economia.js

const cooldowns = {}
const msToTime = (ms) => {
  let segundos = Math.floor(ms / 1000)
  let minutos = Math.floor(segundos / 60)
  let horas = Math.floor(minutos / 60)
  let dias = Math.floor(horas / 24)
  segundos %= 60; minutos %= 60; horas %= 24
  return `${dias? dias + 'd ' : ''}${horas? horas + 'h ' : ''}${minutos? minutos + 'm ' : ''}${segundos}s`
}

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
  let user = global.db.data.users[m.sender]
  user.money = user.money || 0
  user.bank = user.bank || 0

  function checkCooldown(cmd, tiempo) {
    if (!cooldowns[m.sender]) cooldowns[m.sender] = {}
    let now = Date.now()
    if (cooldowns[m.sender][cmd] && cooldowns[m.sender][cmd] > now) {
      return msToTime(cooldowns[m.sender][cmd] - now)
    }
    cooldowns[m.sender][cmd] = now + tiempo
    return false
  }

  switch (command) {
    case 'balance': case 'bal': case 'coins': {
      let who = m.mentionedJid[0]? m.mentionedJid[0] : m.sender
      let userBal = global.db.data.users[who] || {}
      let nombre = conn.contacts?.[who]?.name || conn.contacts?.[who]?.notify || who.split("@")[0]
      m.reply(`╭─⊹ \`Economía\` ⊹\n│ *Usuario:* ${nombre}\n│ *Mano:* ¥${userBal.money || 0} coins\n│ *Banco:* ¥${userBal.bank || 0} coins\n│ *Total:* ¥${(userBal.money || 0) + (userBal.bank || 0)} coins\n╰─────────────`)
    } break

    case 'coinflip': case 'cf': case 'flip': {
      if (!args[0] || isNaN(args[0])) return m.reply(`✧ Usa: ${usedPrefix + command} 500 <cara/cruz>`)
      let apuesta = parseInt(args[0])
      let eleccion = args[1]?.toLowerCase()
      if (!eleccion ||!['cara','cruz'].includes(eleccion)) return m.reply(`✧ Elige cara o cruz\nEjemplo: ${usedPrefix + command} 500 cara`)
      if (apuesta < 100) return m.reply(`✧ La apuesta mínima es ¥100 coins`)
      if (user.money < apuesta) return m.reply(`✧ No tienes ¥${apuesta} coins en mano`)
      let resultado = Math.random() < 0.5? 'cara' : 'cruz'
      if (eleccion === resultado) {
        user.money += apuesta
        m.reply(`╭─⊹ *COINFLIP* ⊹\n│ 🎲 Cayó *${resultado.toUpperCase()}*\n│ ✅ Ganaste ¥${apuesta * 2} coins\n│ 💰 Mano: ¥${user.money} coins\n╰─────────────`)
      } else {
        user.money -= apuesta
        m.reply(`╭─⊹ *COINFLIP* ⊹\n│ 🎲 Cayó *${resultado.toUpperCase()}*\n│ ❌ Perdiste ¥${apuesta} coins\n│ 💰 Mano: ¥${user.money} coins\n╰─────────────`)
      }
    } break

    case 'crime': {
      let tiempo = checkCooldown('crime', 15 * 60 * 1000)
      if (tiempo) return m.reply(`✧ Estás en la cárcel, espera *${tiempo}* para otro crimen`)
      if (Math.random() < 0.6) {
        let ganancia = Math.floor(Math.random() * 700) + 500
        user.money += ganancia
        m.reply(`╭─⊹ *CRIME* ⊹\n│ 🔫 Robaste un banco y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
      } else {
        let multa = Math.floor(Math.random() * 200) + 100
        user.money = Math.max(0, user.money - multa)
        m.reply(`╭─⊹ *CRIME* ⊹\n│ 🚔 Te atraparon y pagaste\n│ 💸 Multa: ¥${multa} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
      }
    } break

    case 'daily': {
      let tiempo = checkCooldown('daily', 24 * 60 * 60 * 1000)
      if (tiempo) return m.reply(`✧ Ya reclamaste tu daily, vuelve en *${tiempo}*`)
      user.money += 1000
      m.reply(`╭─⊹ *DAILY* ⊹\n│ 🎁 Recompensa diaria reclamada\n│ 💰 +¥1000 coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
    } break

    case 'deposit': case 'dep': case 'depositar': case 'd': {
      if (!args[0]) return m.reply(`✧ Usa: ${usedPrefix + command} 500 | all`)
      let cantidad = args[0].toLowerCase() === 'all'? user.money : parseInt(args[0])
      if (isNaN(cantidad) || cantidad < 1) return m.reply(`✧ Ingresa una cantidad válida`)
      if (user.money < cantidad) return m.reply(`✧ Solo tienes ¥${user.money} coins en mano`)
      user.money -= cantidad
      user.bank += cantidad
      m.reply(`╭─⊹ *DEPÓSITO* ⊹\n│ 🏦 Depositaste ¥${cantidad} coins\n│ 💰 Banco: ¥${user.bank} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
    } break

    case 'economyboard': case 'eboard': case 'baltop': {
      let users = Object.entries(global.db.data.users).map(([key, value]) => {
        return {...value, jid: key}
      })
      let sorted = users.sort((a, b) => ((b.money || 0) + (b.bank || 0)) - ((a.money || 0) + (a.bank || 0)))
      let page = parseInt(args[0]) || 1
      let totalPages = Math.ceil(sorted.length / 10)
      page = Math.max(1, Math.min(page, totalPages))
      let txt = `╭─⊹ *TOP ECONOMÍA* ⊹\n│ Página ${page}/${totalPages}\n│\n`
      for (let i = (page - 1) * 10; i < page * 10 && i < sorted.length; i++) {
        let total = (sorted[i].money || 0) + (sorted[i].bank || 0)
        txt += `│ ${i + 1}. @${sorted[i].jid.split('@')[0]} - ¥${total} coins\n`
      }
      txt += `╰─────────────\n\nUsa ${usedPrefix}baltop 2 para ver la siguiente página`
      m.reply(txt, null, { mentions: sorted.slice((page - 1) * 10, page * 10).map(u => u.jid) })
    } break

    case 'economyinfo': case 'einfo': {
      let crimeCd = cooldowns[m.sender]?.crime > Date.now()? msToTime(cooldowns[m.sender].crime - Date.now()) : 'Listo'
      let workCd = cooldowns[m.sender]?.work > Date.now()? msToTime(cooldowns[m.sender].work - Date.now()) : 'Listo'
      let slutCd = cooldowns[m.sender]?.slut > Date.now()? msToTime(cooldowns[m.sender].slut - Date.now()) : 'Listo'
      let dailyCd = cooldowns[m.sender]?.daily > Date.now()? msToTime(cooldowns[m.sender].daily - Date.now()) : 'Listo'
      let robCd = cooldowns[m.sender]?.rob > Date.now()? msToTime(cooldowns[m.sender].rob - Date.now()) : 'Listo'
      m.reply(`╭─⊹ *TU ECONOMÍA* ⊹\n│ 💰 Mano: ¥${user.money} coins\n│ 🏦 Banco: ¥${user.bank} coins\n│ 📊 Total: ¥${user.money + user.bank} coins\n│\n│ *COOLDOWNS:*\n│ ⚒️ Work: ${workCd}\n│ 🔫 Crime: ${crimeCd}\n│ 🔥 Slut: ${slutCd}\n│ 🎁 Daily: ${dailyCd}\n│ 🐦‍⬛ Rob: ${robCd}\n╰─────────────`)
    } break

    case 'givecoins': case 'pay': case 'coinsgive': {
      if (!args[0] ||!args[1]) return m.reply(`✧ Usa: ${usedPrefix + command} @user 500`)
      let quien = m.mentionedJid[0]
      if (!quien) return m.reply(`✧ Menciona a un usuario`)
      if (quien === m.sender) return m.reply(`✧ No te puedes dar coins a ti mismo`)
      let cantidad = parseInt(args[1])
      if (isNaN(cantidad) || cantidad < 1) return m.reply(`✧ Cantidad inválida`)
      if (user.money < cantidad) return m.reply(`✧ Solo tienes ¥${user.money} coins`)
      if (!global.db.data.users[quien]) global.db.data.users[quien] = { money: 0, bank: 0 }
      user.money -= cantidad
      global.db.data.users[quien].money += cantidad
      m.reply(`╭─⊹ *TRANSFERENCIA* ⊹\n│ 💸 Le diste ¥${cantidad} coins a @${quien.split('@')[0]}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────`, null, { mentions: [quien] })
    } break

    case 'roulette': case 'rt': {
      if (!args[0] ||!args[1]) return m.reply(`✧ Usa: ${usedPrefix + command} 200 [red/black/0-36]\nEjemplo: ${usedPrefix}rt 200 red`)
      let apuesta = parseInt(args[0])
      let eleccion = args[1].toLowerCase()
      if (isNaN(apuesta) || apuesta < 100) return m.reply(`✧ Apuesta mínima ¥100 coins`)
      if (user.money < apuesta) return m.reply(`✧ No tienes ¥${apuesta} coins en mano`)
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
        m.reply(`╭─⊹ *ROULETTE* ⊹\n│ ✿ Salió: *${numero} ${color}*\n│ ✅ Ganaste ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
      } else {
        m.reply(`╭─⊹ *ROULETTE* ⊹\n│ ✿ Salió: *${numero} ${color}*\n│ ❌ Perdiste ¥${apuesta} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
      }
    } break

    case 'slut': {
      let tiempo = checkCooldown('slut', 10 * 60 * 1000)
      if (tiempo) return m.reply(`✧ Estás cansado, espera *${tiempo}*`)
      let ganancia = Math.floor(Math.random() * 300) + 100
      user.money += ganancia
      m.reply(`╭─⊹ *SLUT* ⊹\n│ 🔥 Te vendiste y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
    } break

    case 'steal': case 'robar': case 'rob': {
      let tiempo = checkCooldown('rob', 30 * 60 * 1000)
      if (tiempo) return m.reply(`✧ La policía te busca, espera *${tiempo}*`)
      let quien = m.mentionedJid[0]
      if (!quien) return m.reply(`✧ Menciona a quien quieres robar\nEjemplo: ${usedPrefix}rob @user`)
      if (quien === m.sender) return m.reply(`✧ No te robes a ti mismo otário`)
      let victima = global.db.data.users[quien]
      if (!victima || (victima.money || 0) < 100) return m.reply(`✧ @${quien.split('@')[0]} está pobre, no tiene ni ¥100 coins`, null, { mentions: [quien] })
      if (Math.random() < 0.3) {
        let robado = Math.floor(victima.money * 0.3)
        robado = Math.min(robado, 2000)
        user.money += robado
        victima.money -= robado
        m.reply(`╭─⊹ *ROBO* ⊹\n│ 🐦‍⬛ Le robaste ¥${robado} coins a @${quien.split('@')[0]}\n│ 💵 Tu mano: ¥${user.money} coins\n╰─────────────`, null, { mentions: [quien] })
      } else {
        let multa = Math.floor(Math.random() * 300) + 100
        user.money = Math.max(0, user.money - multa)
        m.reply(`╭─⊹ *ROBO* ⊹\n│ 🚔 Te atraparon robando\n│ 💸 Multa: ¥${multa} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
      }
    } break

    case 'withdraw': case 'with': case 'retirar': {
      if (!args[0]) return m.reply(`✧ Usa: ${usedPrefix + command} 500 | all`)
      let cantidad = args[0].toLowerCase() === 'all'? user.bank : parseInt(args[0])
      if (isNaN(cantidad) || cantidad < 1) return m.reply(`✧ Ingresa una cantidad válida`)
      if (user.bank < cantidad) return m.reply(`✧ Solo tienes ¥${user.bank} coins en el banco`)
      user.bank -= cantidad
      user.money += cantidad
      m.reply(`╭─⊹ *RETIRO* ⊹\n│ 🏦 Retiraste ¥${cantidad} coins\n│ 💵 Mano: ¥${user.money} coins\n│ 💰 Banco: ¥${user.bank} coins\n╰─────────────`)
    } break

    case 'work': case 'w': {
      let tiempo = checkCooldown('work', 5 * 60 * 1000)
      if (tiempo) return m.reply(`✧ Ya trabajaste, descansa *${tiempo}*`)
      let trabajos = ['sicario', 'taxista', 'programador', 'vendedor de tacos', 'streamer', 'minero']
      let trabajo = trabajos[Math.floor(Math.random() * trabajos.length)]
      let ganancia = Math.floor(Math.random() * 400) + 200
      user.money += ganancia
      m.reply(`╭─⊹ *WORK* ⊹\n│ ⚒️ Trabajaste de ${trabajo} y ganaste\n│ 💰 ¥${ganancia} coins\n│ 💵 Mano: ¥${user.money} coins\n╰─────────────`)
    } break
  }
}

handler.help = ['balance', 'coinflip', 'crime', 'daily', 'deposit', 'economyboard', 'economyinfo', 'givecoins', 'roulette', 'slut', 'steal', 'withdraw', 'work']
handler.tags = ['economia']
handler.command = ['balance', 'bal', 'coins', 'coinflip', 'flip', 'cf', 'crime', 'daily', 'deposit', 'dep', 'depositar', 'd', 'economyboard', 'eboard', 'baltop', 'economyinfo', 'einfo', 'givecoins', 'pay', 'coinsgive', 'roulette', 'rt', 'slut', 'steal', 'robar', 'rob', 'withdraw', 'with', 'retirar', 'work', 'w']

export default handleandr 
