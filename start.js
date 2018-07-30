const Discord = require('discord.js')
const fs = require('fs')
const ytdl = require('ytdl-core')
const botSettings = require('./settings.json')
const prefix = botSettings.prefix
const bot = new Discord.Client({disabledEveryone: true})
const youtubeVidSearch = require('youtube-search')

const streamOptions = {seek:0,volume:1}

bot.on('ready', async() => {
    console.log('Bot is ready')
})

bot.on('message', async message => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;

    let messageArray = message.content.split(/\s+/g)
    let command = messageArray[0].toLowerCase()
    let args = messageArray.slice(1)

    if(!command.startsWith(prefix)) return

    if(command == `${prefix}play`) {
        if(!message.member.voiceChannel) return message.channel.send('Please be in a voice channel before playing music')
        var videoURL = args[0]
        console.log(videoURL)

        console.log(isURL(videoURL))
        
        var voiceChannel = message.member.voiceChannel

        voiceChannel.join().then(connection => {
            console.log('Joined the channel')
            var stream = ytdl(videoURL, {filter: 'audioonly'})
            var dispatcher = connection.playStream(stream, streamOptions)
            dispatcher.on('end', end => {
                console.log('left channel')
                voiceChannel.leave()
            })
        }).catch(err => {
            console.error(err)
        })
    }
})

bot.login(botSettings.token)

function isURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
}