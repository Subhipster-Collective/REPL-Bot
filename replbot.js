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
    console.log(command);
    repl.message = message;
    repl.shell.stdin.write(command + '\n');
}

function spawnPython()
{
    repls.py = [];
    repls.py.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'python', '-i']);
    repls.py.shell.stdout.on('data', (data) => {
        if('message' in repls.py)
            repls.py.message.channel.send(`\`\`\`${data}\`\`\``);
        else
            console.log('python: message is undefined');
    });
    repls.py.shell.on('close', () => {
        if('message' in repls.py)
            repls.py.message.channel.send('restarting py...');
        spawnPython();
    });
}

function spawnNode()
{
    repls.js = [];
    repls.js.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'node', '-i']);
    repls.js.shell.stdout.on('data', (data) => {
        if('message' in repls.js && `${data}` !== '> ')
            repls.js.message.channel.send(`\`\`\`${data}\`\`\``.replace(/\n> /, ''));
        else
            console.log('node: message is undefined');
    });
    repls.js.shell.on('close', () => {
        if('message' in repls.js)
            repls.js.message.channel.send('restarting js...');
        spawnNode();
    });
}

function spawnScala()
{
    repls.sc = [];
    repls.sc.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'scala', '-i']);
    repls.sc.shell.stdout.on('data', (data) => {
        if('message' in repls.sc && `${data}` !== '\nscala> ')
            repls.sc.message.channel.send(`\`\`\`${data}\`\`\``);
        else
            console.log('scala: message is undefined');
    });
    repls.sc.shell.on('close', () => {
        if('message' in repls.sc)
            repls.sc.message.channel.send('restarting sc...');
        spawnScala();
    });
}

function spawnSQLite()
{
    repls.sql = [];
    repls.sql.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'sqlite3', '-interactive']);
    repls.sql.shell.stdout.on('data', (data) => {
        if('message' in repls.sql)
            repls.sql.message.channel.send(`\`\`\`${data}\`\`\``.replace(/[\n]sqlite> /, ''));
        else
            console.log('sqlite3: message is undefined');
    });
    repls.sql.shell.on('close', () => {
        if('message' in repls.sql)
            repls.sql.message.channel.send('restarting sql...');
        spawnSQLite();
    });
}

function spawnGHC()
{
    repls.hs = [];
    repls.hs.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'ghc', '--interactive']);
    repls.hs.shell.stdout.on('data', (data) => {
        if('message' in repls.hs && `${data}` !== 'Prelude> ')
            repls.hs.message.channel.send(`\`\`\`${data}\`\`\``.replace(/\nPrelude> /, ''));
        else
            console.log('ghc: message is undefined');
    });
    repls.hs.shell.on('close', () => {
        if('message' in repls.hs)
            repls.hs.message.channel.send('restarting hs...');
        spawnGHC();
    });
}

function spawnGore()
{
    repls.go = [];
    repls.go.shell = spawn('firejail', [FIREJAIL_OPTIONS, 'gore']);
    repls.go.shell.stdout.on('data', (data) => {
        if('message' in repls.go && `${data}` !== 'gore> ')
            repls.go.message.channel.send(`\`\`\`${data}\`\`\``.replace(/\ngore> /, ''));
        else
            console.log('gore: message is undefined');
    });
    repls.go.shell.on('close', () => {
        if('message' in repls.go)
            repls.go.message.channel.send('restarting go...');
        spawnGore();
    });
}

const client = new Discord.Client();
client.on('ready', () => {
    console.log('I am ready!');
});

const repls = [];
const aliases = [];

spawnPython();
spawnNode();
spawnScala();
spawnSQLite();
spawnGHC();
spawnGore();

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
                        repl: repls[params[3]],
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
                message.channel.send(`restarting ${params[2]}...`);
                delete repls[params[2]].message;
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
        inputCommand(alias.repl, alias.macro + ' ' + params.slice(1).join(' '), message);
    }
});

client.login(filesystem.readFileSync('token', 'utf8'));
