const {Client, Util} = require('discord.js')
const fs = require('fs')
const ytdl = require('ytdl-core')
const botSettings = require('./settings.json')
const prefix = botSettings.prefix
const request = require('request')
const bot = new Client({disabledEveryone: true})
const streamOptions = {seek:0,volume:1}
var YouTube = require('simple-youtube-api')
var youtube = new YouTube('AIzaSyAYGlod1nt7f-sfm7AWKqRoKnSwWh8TkaA')

const queue = new Map()

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
        const voiceChannel = message.member.voiceChannel
        if(!voiceChannel) return message.channel.send('You need to be in a voice channel for this to work')

        var url = args[0]
        var searchString = args.join(' ')

        if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            var playlist = await youtube.getPlaylist(url)
            var videos = await playlist.getVideos()
            console.log(videos)
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id)
                await handleVid(video2, message, voiceChannel, true)
            }
        } else {
            try {
                var video = await getVideo(url)
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10)
                    let index = 0
                    message.channel.send(`
                    __**Song selection:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Please provide a value to select one of the search results ranging from 1-10.`)
                    try {
                        var response = await message.channel.awaitMessages(msg2 => msg2.content > 0 && msg2 < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        })
                    } catch (err) {
                        console.error(err)
                        return message.channel.send('No or invalid value entered')
                    }
                    const videoIndex = parseInt(response.first().content)
                    var video = await youtube.getVideoByID(videos[videoIndex-1].id)
                } catch (err) {
                    console.error(err)
                    return message.channel.send(`I could not find any search results`)
                }
            }
        return handleVid(video, message, voiceChannel)
        }
    }

    if(command == `${prefix}`) {

    }
})

bot.login(botSettings.token)

async function handleVid(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id)
    console.log(video)
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    }
    if(!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        }
        queue.set(msg.guild.id, queueConstruct)

        queueConstruct.songs.push(song)

        try {
            var connection = await voiceChannel.join()
            queueConstruct.connection = connection
            play(msg.guild, queueConstruct.songs[0])
        } catch (error) {
            console.error(`cant join voice channel: ${error}`)
            queue.delete(msg.guild.id)
        }
    } else {
        serverQueue.songs.push(song)
        console.log(serverQueue.songs)
        if (playlist) return undefined
        else return msg.channel.send(`${song.title} has been added to the que`)
    }
    return undefined
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id)

    if(!song) {
        serverQueue.voiceChannel.leave()
        queue.delete(guild.id)
        return;
    }
    console.log(serverQueue.songs)

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
		if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
        else console.log(reason);
        serverQueue.songs.shift()
        play(guild, serverQueue.songs[0])
        })
        .on('error', error => console.error(error))
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
    serverQueue.textChannel.send(`Started playing: ${song.title}`)
}