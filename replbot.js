#!/usr/bin/node
'use strict';

const TOKEN = 'MzQzMzA2OTYyMjk5MjU2ODMz.DGcTVg.aCwgMyt1BvKgaViT-O_ZxeXoh2c';

const Discord = require('discord.js');
const { spawn } = require('child_process');

function inputCommand(repl, command, message)
{
    console.log(command);
    repl.message = message;
    repl.shell.stdin.write(command + '\n');
}

const client = new Discord.Client();
client.on('ready', () => {
    console.log('I am ready!');
});

const repls = [];
const aliases = [];

repls.py = [];
repls.py.shell = spawn('python', ['-i']);
repls.py.shell.stdout.on('data', (data) => {
    if('message' in repls.py)
        repls.py.message.channel.send(`${data}`);
    else
        console.log('message is undefined');
});

repls.js = [];
repls.js.shell = spawn('node', ['-i']);
repls.js.shell.stdout.on('data', (data) => {
    if(`${data}` === '> ')
        return;
    if('message' in repls.js)
        repls.js.message.channel.send(`${data}`);
    else
        console.log('node: message is undefined');
});

repls.sc = [];
repls.sc.shell = spawn('scala', ['-i']);
repls.sc.shell.stdout.on('data', (data) => {
    if(`${data}` === '\nscala> ')
        return;
    if('message' in repls.sc)
        repls.sc.message.channel.send(`${data}`);
    else
        console.log('scala: message is undefined');
});

client.on('message', (message) => {
    const params = message.content.split(' ');
    if(params.length === 0)
        return;
    if(params[0] === '!repl')
    {
        if(params.length === 1)
        {
            message.reply('Hi! I\'m REPL Bot.');
            return;
        }
        
        if(params[1] === 'alias')
        {
            if(params.length > 3)
            {
                if(params[3] in repls)
                {
                    aliases['!' + params[2]] = {
                        repl: repls[params[3]],
                        macro: params.slice(4).join(' ')
                    };
                }
                else
                    message.reply('invalid command \'' + params[3] + '\'');
            }
            else
                message.reply('invalid command');
            return;
        }
        
        const repl = repls[params[1]];
        const command = params.slice(2).join(' ');
        if(repl === null)
            return;
        inputCommand(repl, command, message);
    }
    else
    {
        if(params[0] in aliases)
        {
            const alias = aliases[params[0]];
            inputCommand(alias.repl, alias.macro + ' ' + params.slice(1).join(' '), message);
        }
    }
});

client.login(TOKEN);
