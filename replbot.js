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

const FIREJAIL_OPTIONS = '--blacklist=/var --private --quiet';

const Discord = require('discord.js');
const { spawn } = require('child_process');
const filesystem = require('fs');

function inputCommand(repl, command, message)
{
    //console.log(command);
    repl.message = message;
    repl.shell.stdin.write(command + '\n');
}

function spawnREPL(name, command, prompt)
{
    repls[name] = [];
    const repl = repls[name];
    repl.shell = spawn('firejail', [FIREJAIL_OPTIONS].concat(command));
    repl.shell.stdout.on('data', (data) => {
        if(`${data}` === prompt)
            return;
        if('message' in repl)
            repl.message.channel.send(`\`\`\`${data}\`\`\``.replace(/[\n]${prompt}/, ''));
        else
            console.log(command[0] + ': message is undefined.');
    });
    repl.shell.on('close', () => {
        if('message' in repl)
            repl.message.channel.send(command[0] + ' is restarting.');
        spawnREPL(name, command, prompt);
    });
}

const repls = [];
const aliases = [];

spawnREPL('sc', ['scala', '-i'], '\nscala> ');
spawnREPL('js', ['node', '-i'], '> ');
spawnREPL('py', ['python', '-i'], '');
spawnREPL('sql', ['sqlite3', '-interactive'], 'sqlite> ');
spawnREPL('hs', ['ghc', '--interactive'], 'Prelude> ');
spawnREPL('go', ['gore'], 'gore> ');

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
                    aliases['!' + params[2]] = {
                        repl: params[3],
                        macro: params.slice(4).join(' ')
                    };
                }
                else
                    message.reply('invalid command \'' + params[3] + '\'');
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
        inputCommand(repls[alias.repl], alias.macro + ' ' + params.slice(1).join(' '), message);
    }
});

client.login(filesystem.readFileSync('token', 'utf8'));
