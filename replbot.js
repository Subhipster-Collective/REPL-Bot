#!/usr/bin/node
'use strict';

/*
 * REPL Bot is a Discord bot that acts as a frontend to read-eval-print loop shells.
 * Copyright (C) 2017  Jeffrey Thomas Piercy
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const FIREJAIL_OPTIONS = '--blacklist=/var --private';

const Discord = require('discord.js');
const { spawn } = require('child_process');
const filesystem = require('fs');
const commandExists = require('command-exists');

function inputCommand(repl, input, message)
{
    //console.log(command);
    repl.message = message;
    repl.shell.stdin.write(`${input}\n`);
    console.log(`${message.author.username}: <${input}>`);
}

function spawnREPL(name, command, prompt)
{
    commandExists(command[0], (err, exists) => {
        if(exists)
        {
            repls[name] = [];
            const repl = repls[name];
            repl.buffer = '';
            repl.shell = spawn('firejail', [FIREJAIL_OPTIONS].concat(command));
            repl.name = command[0];
            
            const say = (data) => {
                const dataStr = data.toString();
                if(dataStr === prompt)
                    return;
                if('message' in repl)
                {
                    repl.buffer += dataStr;
                    if(dataStr.includes('\n'))
                    {
                        const parsedBuffer = repl.buffer.replace(RegExp('[\n]' + prompt, 'g'), '');
                        repl.buffer = '';
                        repl.message.channel.fetchMessage(repl.message.channel.lastMessageID).then((lastMessage) => {
                            if(lastMessage.author.id === client.user.id)
                                lastMessage.edit('```\n' + (lastMessage.content.replace(RegExp('```', 'g'), '') + '\n' + parsedBuffer) + '```');
                            else
                                repl.message.channel.send('```' + parsedBuffer + '```');
                        });
                        console.log(`${repl.name}: <${parsedBuffer}`.replace(/\n$/, '') + '>');
                    }
                    //else
                    //    console.log(dataStr);
                }
                else
                    console.log(`${command[0]}: message is undefined`);
            };
            
            repl.shell.stdout.on('data', say);
            repl.shell.stderr.on('data', say);
            repl.shell.on('close', () => {
                if('message' in repl)
                    repl.message.channel.send(`*${command[0]} is restarting*`);
                spawnREPL(name, command, prompt);
            });
            repl.shell.on('error', (err) => {
                console.log(`${command[0]}: ${err}`);
            });
        }
        else
            console.log(`failed to start ${command}: ${err}`);
    });
}

const repls = [];
const aliases = [];

//spawnREPL('sc', ['scala', '-i'], '\nscala> ');
//spawnREPL('sc', ['amm', '--color false'], '@ ');
spawnREPL('js', ['node', '-i'], '> ');
spawnREPL('py', ['python', '-i'], '>>> ');
spawnREPL('sql', ['sqlite3', '-interactive'], 'sqlite> ');
spawnREPL('hs', ['ghc', '--interactive'], 'Prelude> ');
spawnREPL('go', ['gore'], 'gore> ');

aliases['!sc'] = { repl: 'sc', macro: '' };
aliases['!js'] = { repl: 'js', macro: '' };
aliases['!py'] = { repl: 'py', macro: '' };
aliases['!sql'] = { repl: 'sql', macro: '' };
aliases['!hs'] = { repl: 'hs', macro: '' };
aliases['!go'] = { repl: 'go', macro: '' };

const client = new Discord.Client();
client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (message) => {
    const params = message.content.split(' ');
    if(params.length === 0)
        return;
    if(params[0] === '!repl')
    {
        if(params.length === 1)
            message.reply('Hi! I\'m REPL Bot.');
        else if(params[1] === 'alias')
        {
            if(params.length > 3)
            {
                if(params[3] in repls)
                {
                    aliases[`!${params[2]}`] = {
                        repl: params[3],
                        macro: params.slice(4).join(' ') + ' '
                    };
                }
                else
                    message.reply(`invalid command '${params[3]}'`);
            }
            else
                message.reply('invalid command');
        }
        else if(params[1] === 'restart')
        {
            if(params.length === 3 && params[2] in repls)
            {
                repls[params[2]].message = message;
                repls[params[2]].shell.kill();
            }
            else
                message.reply('invalid command');
        }
        else if(params[1] in repls)
        {
            const repl = repls[params[1]];
            const command = params.slice(2).join(' ');
            inputCommand(repl, command, message);
        }
    }
    else if(params[0] in aliases)
    {
        const alias = aliases[params[0]];
        inputCommand(repls[alias.repl], `${alias.macro}${params.slice(1).join(' ')}`, message);
    }
});

client.login(filesystem.readFileSync('token', 'utf8'));
