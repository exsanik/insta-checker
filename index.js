const TelegramBot = require('node-telegram-bot-api')
const config = require('./config.js')
const mongoose = require('mongoose')
const cron = require('node-cron')
const Nightmare = require('nightmare')


mongoose.connect('mongodb://exsa:357nik@ds040167.mlab.com:40167/instachekerbot')
	.then(() => console.log('MongoDb connected'))
	.catch((err) => console.log(err))

require('./insta.model.js')
const Admin = mongoose.model('admin')
const Vip = mongoose.model('vip')
const Link = mongoose.model('link')

//data.VIP.forEach(vi => new Vip(vi).save())
//data.Link.forEach(l => new Link(l).save())

require('http').createServer().listen(process.env.PORT || 5000).on('request', function(req, res){
    res.end('')
})

function debug(obj = {}) 
{
	return JSON.stringify(obj, null, 4)
}

//------------------------------------------------------
cron.schedule('0 5 * * *', () => {
  mongoose.connection.db.dropCollection('links', (err, results) => {
	 	console.log(results)
	 })
})

const bot = new TelegramBot(config.TOKEN, {
	polling: true
})

bot.on('message', msg => {
	const {chat: {id}} = msg
	console.log(debug(msg))
	if(msg.new_chat_participant)
	{
		bot.sendMessage(id, `Привет, @${msg.new_chat_participant.username}! Добро пожаловать в наш уютный чат! Под названием ${msg.chat.title}`)
		bot.sendMessage(config.master, `New partisipant\n\n========== ${debug(msg)} \n============\n@${msg.from.username}`)
	}
})

bot.onText(/\/start/, msg => {
	let id = msg.chat.id
	let text = `Привет, ${msg.from.first_name}`

	bot.sendMessage(id, text)
	bot.sendMessage(config.master, `New partisipant\n\n========== ${debug(msg)} \n============\n@${msg.from.username}`)
})

bot.onText((/(https?:\/\/www\.)?instagram\.com(\/p\/\w+\/?)(.+)/) || (/(https?:\/\/www\.)?instagram\.com(\/p\/\w+\/?) (.+)/), (msg, [source, match]) => {
	const {chat: {id}} = msg
	var linkdata = {
					"link": `${source}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
				}
	var link_db = [];
	var checkMsg = msg.message_id+1
	var allelectroncheck = 0
	var del = true
	var res = true
	var userWasAdm = false
	var firstCheckAdm = true
//---------------------------------------------------


	admvipCheck(1)
	setTimeout( () => {
		if(userWasAdm)
			bot.deleteMessage(id, checkMsg)
		else
			searchLinks()
	}, 400)


function searchLinks()
{
	Link.find({chatid: `${id}`}).then(l => {
				console.log(userWasAdm)
				l.map((f, i) => {
				link_db.push(f.link) 
			})
			console.log(link_db)
			var linkdb_len = link_db.length
			if(linkdb_len === 0)
			{
				linkdata = new Link(linkdata).save()
				lastCheck(false)
				return
			}
			for(var i = 0; i < linkdb_len; i++)
				getUserNames(link_db[i], msg.from.username, linkdb_len)
		})
}
function getUserNames(url, user, len)
{
	const nightmare = Nightmare(/*{show: true}*/)
  nightmare
    .goto(url)
  for(var i = 0; i < 200; i++)
    clickLoadMore()


  nightmare.catch(error => {
      console.error('Search failed:', error)
    }).then( () => {
      nightmare.evaluate( () => {
        return Array.from(document.querySelectorAll('.FPmhX')).map(element => element.innerText);       
      }).then((innerTexts) => {
        console.log(innerTexts)
        for(var i = 0; i < innerTexts.length; i++)
        {
          if(innerTexts[i].localeCompare(user) === 0)
          {
            res = true
            callback(url, len)
            nightmare.end()
            .then(function (result) {
          		allelectroncheck++;
        			console.log(`Electron Check: ${allelectroncheck}`)
        			admvipCheck(len)
      			})
            
            return
          }
        }
        res = false
        callback(url, len)
        nightmare.end()
        .then(function (result) {
      		allelectroncheck++;
    			console.log(`Electron Check: ${allelectroncheck}`)
    			admvipCheck(len)
  			})
        
        return
      })
    })

  function clickLoadMore() {
    nightmare
      .click('.vTJ4h')
      .wait(400)
  }
}

var needToCom = `@${msg.from.username} Вы не справились с заданием, для оправки своей ссылки еще нужно прокомментировать:\n`
var link_success = 1
var user_link_success = false
function callback(link, len)
{
	console.log(`Res: ${res}`)
  if(res === false)
  	needToCom += `${link}\n\n`
  else
  	link_success++
  console.log(`Need to comment: ${needToCom}`)
  console.log(`link success ${link_success}`)
  console.log(`Len: ${len}`)
  if(link_success >= len)
  	user_link_success = true
  else if(user_link_success === false)
  {
  	del = true
  	console.log(`Delete ${del}`)
  }

}
bot.sendMessage(id, "Проверка...")

//---------------------------------------------------
	function admvipCheck(len)
	{
		console.log("Есть контакт")
		if(allelectroncheck === len || firstCheckAdm === true)
		{
			Admin.find({chatid: `${id}`}).then(adm => {
				adm.map((f, i) => {
					if(f.username === msg.from.username)
					{
						userWasAdm = true
						del = false
						linkdata = new Link(linkdata).save()
					}
				})
			})

			Vip.find({chatid: `${id}`}).then(vi => {
				vi.map((f, i) => {
					if(f.username === msg.from.username)
					{
						userWasAdm = true
						del = false
						linkdata = new Link(linkdata).save()
					}
				})
				if(!firstCheckAdm)
					lastCheck(del)
				else
					firstCheckAdm = false
			})
		}
	}
	
	function lastCheck(del)
	{
		if(del != false)
		{
			needToCom += "Хочешь отправлять свои ссылки без проверки? Обратись к админу в лс, чтобы узнать условия получения VIP"
			bot.sendMessage(id, needToCom)
			bot.deleteMessage(id, checkMsg)	
  		bot.deleteMessage(id, msg.message_id)	
		}else
			bot.deleteMessage(id, checkMsg)	
	}
})

bot.onText(/\/vip (.+)/, (msg, [source, match]) => {
	const {chat: {id}} = msg
	var admin = false

	Admin.find({chatid: `${id}`}).then(adm => {
		adm.map((f, i) => {
			if(f.username === msg.from.username)
				admin = true
		})

		if(admin === false)
  		bot.sendMessage(id, "Вам не доступна эта команда, так как вы не администратор!")
  	else
  	{
  		var vipdata = {
					"username": `${match}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
				}
  		vipdata = new Vip(vipdata).save()
  		bot.sendMessage(id, `${match} стал(а) VIP'ом`)
  	}
	})
})

bot.onText(/\/unvip (.+)/, (msg, [source, match]) => {
	const {chat: {id}} = msg
	var admin = false

	Admin.find({chatid: `${id}`}).then(adm => {
		adm.map((f, i) => {
			if(f.username === msg.from.username)
				admin = true
		})

		if(admin === false)
  		bot.sendMessage(id, "Вам не доступна эта команда, так как вы не администратор!")
  	else
  	{
  		var vipdata = {
					"username": `${match}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
				}
			Vip.findOneAndRemove(vipdata, err => {
				if(err)
					console.log(err)
				else
					console.log("deleted")
			})
  		bot.sendMessage(id, `${match} перестал(а) быть VIP'ом`)
  	}
	})
})

bot.onText(/\/setadmin (.+)/, (msg, [source, match]) => {
	const {chat: {id}} = msg
	if(msg.from.id === 342192414)
	{
		var admdata = {
					"username": `${match}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
				}
		admdata = new Admin(admdata).save()
  	bot.sendMessage(id, `${match} стал(а) администратом`)
	}
	else
		bot.sendMessage(id, "У вас нет доступа к этой функции, обратитесь к @ExsaNik")
})

bot.onText(/\/deladmin (.+)/, (msg, [source, match]) => {
	const {chat: {id}} = msg
	if(msg.from.id === 342192414)
	{
		var admdata = {
					"username": `${match}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
				}
		Admin.findOneAndRemove(admdata, err => {
				if(err)
					console.log(err)
				else
					console.log("deleted")
			})
  	bot.sendMessage(id, `${match} перестал(а) быть администратом`)
	}
	else
		bot.sendMessage(id, "У вас нет доступа к этой функции, обратитесь к @ExsaNik")
})


//GETLINKS
//-------------------------
//Никита сорян,
bot.onText(/\/getlinks/, msg => {
	const {chat: {id}} = msg
	var link_db = []
	var textLinks = `Список ссылок:`
	Link.find({chatid: `${id}`}).then(l => {
		l.map((f, i) => {
		link_db.push(f.link)
		})
		var linkdb_len = link_db.length

		if(linkdb_len != 0)
		{
			for(var i = 0; i < linkdb_len; i++)
				textLinks += `\n\u{2705}${link_db[i]} \u{2705} - /delete${i}\n`
		}
		else
			textLinks += " пуст"
		bot.sendMessage(id, textLinks,{
			disable_web_page_preview: true
		})
	})
})

bot.onText(/\/delete(.+)/, (msg, [source, match]) => {
	const {chat: {id}} = msg
	var admin = false
	var link_db = []
	var ind = parseInt(source.replace(/\D+/g,""))
	Admin.find({chatid: `${id}`}).then(adm => {
		adm.map((f, i) => {
			if(f.username === msg.from.username)
				admin = true
		})
		if(admin === false)
  		bot.sendMessage(id, "Вам не доступна эта команда, так как вы не администратор!")
  	else
  	{
  		Link.find({chatid: `${id}`}).then(l => {
				l.map((f, i) => {
				link_db.push(f.link)
			})
			console.log(ind)
			console.log(link_db)
			console.log(link_db[ind])
			var linkdata = {
					"link": `${link_db[ind]}`,
					"chatid": `${id}`,
					"title": `${msg.chat.title}`
			}
			
			Link.findOneAndRemove(linkdata, err => {
				if(err)
					console.log(err)
				else
					{
						link_db = [] ////Новый вывод ссылок
						var textLinks = `Готово\nСписок ссылок:`
						Link.find({chatid: `${id}`}).then(l => {
							l.map((f, i) => {
							link_db.push(f.link)
							})
							var linkdb_len = link_db.length

							if(linkdb_len != 0)
							{
								for(var i = 0; i < linkdb_len; i++)
									textLinks += `\n\u{2705}${link_db[i]} \u{2705} - /delete${i}\n`
							}
							else
								textLinks += " пуст"
							bot.sendMessage(id, textLinks,{
								disable_web_page_preview: true
							})
						})//---------------------
					}
				})
			})
  	}
	})
})

bot.onText(/\/help/, msg => {
	const {chat: {id}} = msg
	bot.sendMessage(id, "Инструкция подготавливается")
})