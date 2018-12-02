const Discord = require('discord.js');

const client = new Discord.Client();

const ytdl = require('ytdl-core');

const request = require('request');

const fs = require('fs');

const getYoutubeID = require('get-youtube-id');

const fetchVideoInfo = require('youtube-info');


const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";

const prefix = '7';

client.on('ready', function() {

    console.log(`ءلبوت ءلقمدن ءونلاين هه يدينم ${client.user.username}`);

});

/*

////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\

////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\

////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\

////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\

*/

var servers = [];

var queue = [];

var guilds = [];

var queueNames = [];

var isPlaying = false;

var dispatcher = null;

var voiceChannel = null;

var skipReq = 0;

var skippers = [];

var now_playing = [];

/*

\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////

\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////

\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////

\\\\\\\\\\\\\\\\\\\\\\\\V/////////////////////////

*/

client.on('ready', () => {});

var download = function(uri, filename, callback) {

    request.head(uri, function(err, res, body) {

        console.log('content-type:', res.headers['content-type']);

        console.log('content-length:', res.headers['content-length']);


        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);

    });

};


client.on('message', function(message) {

    const member = message.member;

    const mess = message.content.toLowerCase();

    const args = message.content.split(' ').slice(1).join(' ');


    if (mess.startsWith(prefix + 'play')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        // if user is not insert the URL or song title

        if (args.length == 0) {

            let play_info = new Discord.RichEmbed()

                .setAuthor(client.user.username, client.user.avatarURL)

                .setFooter('' + message.author.tag)

                .setDescription('**1play [Link or query]**')

            message.channel.sendEmbed(play_info)

            return;

        }

        if (queue.length > 0 || isPlaying) {

            getID(args, function(id) {

                add_to_queue(id);

                fetchVideoInfo(id, function(err, videoInfo) {

                    if (err) throw new Error(err);

                    let play_info = new Discord.RichEmbed()

                        .setAuthor(client.user.username, client.user.avatarURL)

                        .addField('Added To Queue', `**

${videoInfo.title}

**`)

                        .setColor("#a637f9")

                        .setFooter('' + message.author.tag)

                        .setThumbnail(videoInfo.thumbnailUrl)

                    message.channel.sendEmbed(play_info);

                    queueNames.push(videoInfo.title);

                    now_playing.push(videoInfo.title);


                });

            });

        }

        else {


            isPlaying = true;

            getID(args, function(id) {

                queue.push('placeholder');

                playMusic(id, message);

                fetchVideoInfo(id, function(err, videoInfo) {

                    if (err) throw new Error(err);

                    let play_info = new Discord.RichEmbed()

                        .setAuthor(client.user.username, client.user.avatarURL)

                        .addField('Searching 🔎', `**${videoInfo.title}

**`)

                      .setColor("RANDOM")

                        .addField(`بواسطه`, message.author.username)

                        .setThumbnail(videoInfo.thumbnailUrl)


                    // .setDescription('?')

                    message.channel.sendEmbed(play_info)

               message.channel.send(`

**Playing 🎶** **${videoInfo.title}**`)

               client.user.setActivity(videoInfo.title, {type:'LISTENING'});

                });

            });

        }

    }

    else if (mess.startsWith(prefix + 'skip')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        message.channel.send('**⏩ Skipped 👍**').then(() => {

            skip_song(message);

            var server = server = servers[message.guild.id];

            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

        });

    }

    else if (message.content.startsWith(prefix + 'volume')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        // console.log(args)

        if (args > 100) return message.channel.send('**100-1**')

        if (args < 1) return message.channel.send('**100-1**')

        dispatcher.setVolume(1 * args / 50);

        message.channel.sendMessage(`**Volume: ** **${dispatcher.volume*50}%** `);

    }

    else if (mess.startsWith(prefix + 'pause')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        message.channel.send('**Paused ⏸**').then(() => {

            dispatcher.pause();

        });

    }

    else if (mess.startsWith(prefix + 'resume')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

            message.channel.send('**⏯ Resuming 👍**').then(() => {

            dispatcher.resume();

        });

    }

    else if (mess.startsWith(prefix + 'leave')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        message.channel.send('**📭 Successfully disconnected**');

        var server = server = servers[message.guild.id];

        if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

    }

    else if (mess.startsWith(prefix + 'join')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        message.member.voiceChannel.join().then(message.channel.send('**👍 Joined**'));

    }

    else if (mess.startsWith(prefix + 'play')) {

        if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

        if (isPlaying == false) return message.channel.send('**❌ The player is not paused**');

        let playing_now_info = new Discord.RichEmbed()

            .setAuthor(client.user.username, client.user.avatarURL)

            .addField('Searching 🔎', `**

${videoInfo.title}

**`)

            .setColor("RANDOM")

            .setFooter('Added To Queue: ' + message.author.tag)

            .setThumbnail(videoInfo.thumbnailUrl)

        //.setDescription('?')

        message.channel.sendEmbed(playing_now_info);

    }

});


function skip_song(message) {

    if (!message.member.voiceChannel) return message.channel.send('**❌ You have to be in a voice channel to use this command.**');

    dispatcher.end();

}


function playMusic(id, message) {

    voiceChannel = message.member.voiceChannel;



    voiceChannel.join().then(function(connectoin) {

        let stream = ytdl('https://www.youtube.com/watch?v=' + id, {

            filter: 'audioonly'

        });

        skipReq = 0;

        skippers = [];


        dispatcher = connectoin.playStream(stream);

        dispatcher.on('end', function() {

            skipReq = 0;

            skippers = [];

            queue.shift();

            queueNames.shift();

            if (queue.length === 0) {

                queue = [];

                queueNames = [];

                isPlaying = false;

            }

            else {

                setTimeout(function() {

                    playMusic(queue[0], message);

                }, 500);

            }

        });

    });

}


function getID(str, cb) {

    if (isYoutube(str)) {

        cb(getYoutubeID(str));

    }

    else {

        search_video(str, function(id) {

            cb(id);

        });

    }

}


function add_to_queue(strID) {

    if (isYoutube(strID)) {

        queue.push(getYoutubeID(strID));

    }

    else {

        queue.push(strID);

    }

}


function search_video(query, cb) {

    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {

        var json = JSON.parse(body);

        cb(json.items[0].id.videoId);

    });

}



function isYoutube(str) {

    return str.toLowerCase().indexOf('youtube.com') > -1;

}





















const developers = ["457174878530043907","another id","another another id"]

const adminprefix = prefix

client.on('message', message => {

    var argresult = message.content.split(` `).slice(1).join(' ');

      if (!developers.includes(message.author.id)) return;

      

  if (message.content.startsWith(adminprefix + 'playing')) {

    client.user.setGame(argresult);

          if(!message.channel.guild) return;

                            var msg = `${Date.now() - message.createdTimestamp}`

                            var api = `${Math.round(client.ping)}`

                            if (message.author.bot) return;

                        let embed = new Discord.RichEmbed()

                        .setAuthor(message.author.username,message.author.avatarURL)

                        .setColor('RANDOM')

                 .addField("**PLAYING 🎮 **","** **")

         message.channel.send({embed:embed});

                        }

  

     if (message.content === (adminprefix + "leaveserver")) {

    message.guild.leave(); 

  } else 

  if (message.content.startsWith(adminprefix + 'watching')) {

  client.user.setActivity(argresult, {type:'WATCHING'});

         if(!message.channel.guild) return;

                            var msg = `${Date.now() - message.createdTimestamp}`

                            var api = `${Math.round(client.ping)}`

                            if (message.author.bot) return;

                        let embed = new Discord.RichEmbed()

                        .setAuthor(message.author.username,message.author.avatarURL)

                        .setColor('RANDOM')

                        .addField("**WATCHING 📹 **","** **")

         message.channel.send({embed:embed});

                        }

  

  if (message.content.startsWith(adminprefix + 'listening')) {

  client.user.setActivity(argresult , {type:'LISTENING'});

       if(!message.channel.guild) return;

                            var msg = `${Date.now() - message.createdTimestamp}`

                            var api = `${Math.round(client.ping)}`

                            if (message.author.bot) return;

                        let embed = new Discord.RichEmbed()

                        .setAuthor(message.author.username,message.author.avatarURL)

                        .setColor('RANDOM')

                        .addField("**LISTENING 🎼 **","** **")

         message.channel.send({embed:embed});

                        }

  

  if (message.content.startsWith(adminprefix + 'streaming')) {

    client.user.setGame(argresult, "https://www.twitch.tv/idk");

        if(!message.channel.guild) return;

                            var msg = `${Date.now() - message.createdTimestamp}`

                            var api = `${Math.round(client.ping)}`

                            if (message.author.bot) return;

                        let embed = new Discord.RichEmbed()

                        .setAuthor(message.author.username,message.author.avatarURL)

                        .setColor('RANDOM')

                        .addField("**STREAMING 👾 **","** **")

         message.channel.send({embed:embed});

                        }

  if (message.content.startsWith(adminprefix + 'setname')) {

  client.user.setUsername(argresult).then

      message.channel.send(`**Changing The Name To , ⚡ ****${argresult}** `)

} else

if (message.content.startsWith(adminprefix + 'setavatar')) {

  client.user.setAvatar(argresult);

    message.channel.send(`**Changing The Avatar To , ⚡ ****${argresult}** `);

}

});














client.on('message', message => {

    if (message.author.bot) return;

     if (message.content === (prefix + "help")) {

  let embed = new Discord.RichEmbed()

          .setAuthor(message.author.username, message.author.avatarURL)

           .setThumbnail(message.author.avatarURL)

                 .setTimestamp()

    .setDescription(`

	 ** اوامر الموسيقى 🎶 **

**${prefix}play** : لتشغيل الاغاني

**${prefix}skip** : لتخطي الاغنية

**${prefix}volume** : لتحديد مستوى الصوت

**${prefix}pause** : للأيقاف المؤقت

**${prefix}resume** : للأستئناف

**${prefix}join** : لكي ينضم البوت للروم الصوتي

**${prefix}leave** : لكي يخرج البوت من الروم الصوتي

`)

.setColor('RANDOM')

message.author.sendEmbed(embed)

}

});


client.on('message', msg => {

      if(!msg.channel.guild) return;

    if(msg.content.startsWith (prefix + 'help')) {

    msg.reply('`تم أرسال المساعدة في الخاص`');

  }

});












client.login(process.env.BOT_TOKEN);
