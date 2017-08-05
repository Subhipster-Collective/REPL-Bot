#!/usr/bin/node
'use strict';

const TOKEN = 'MzQzMzA2OTYyMjk5MjU2ODMz.DGcTVg.aCwgMyt1BvKgaViT-O_ZxeXoh2c';

const Discord = require('discord.js');
const { spawn } = require('child_process');

const client = new Discord.Client();
client.on('ready', () => {
    console.log('I am ready!');
});

const repls = [];
repls.py = [];
repls.py.shell = spawn('python', ['-i']);
repls.py.shell.stdout.on('data', (data) => {
    if('message' in repls.py)
    {
        console.log(`${data}`);
        repls.py.message.channel.send(`${data}`);
    }
    else
        console.log('message is undefined');
});

client.on('message', (message) => {
    const params = message.content.split(' ');
    if(params.length !== 0 && params[0] === '!repl')
    {
        if(params.length === 1)
        {
            message.reply('Hi! I\'m REPL Bot.');
            return;
        }
        
        const repl = repls[params[1]];
        if(repl === null)
            return;
        repl.message = message;
        
        console.log(params.slice(2).join(' '));
        repl.shell.stdin.write(params.slice(2).join(' ') + '\n');
        //repl.shell.stdin.write('1 + 1\n');
    }
});

client.login(TOKEN);
