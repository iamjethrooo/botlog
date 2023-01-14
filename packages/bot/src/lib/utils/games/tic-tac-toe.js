"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicTacToeGame = void 0;
const canvas_1 = require("@napi-rs/canvas");
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const games_1 = require("../../../commands/other/games");
const logger_1 = __importDefault(require("../logger"));
class TicTacToeGame {
    async ticTacToe(interaction, playerMap) {
        const player1 = interaction.user;
        let player2;
        playerMap.forEach(player => {
            if (player.id !== player1.id)
                player2 = player;
        });
        const player1Avatar = player1.displayAvatarURL({
            format: 'jpg'
        });
        const player1Image = await axios_1.default.request({
            responseType: 'arraybuffer',
            url: player1Avatar
        });
        const player1Piece = new canvas_1.Image();
        player1Piece.src = Buffer.from(await player1Image.data);
        const player2Avatar = player2.displayAvatarURL({
            format: 'jpg'
        });
        const player2Image = await axios_1.default.request({
            responseType: 'arraybuffer',
            url: player2Avatar
        });
        const player2Piece = new canvas_1.Image();
        player2Piece.src = Buffer.from(await player2Image.data);
        await game(player1, player2);
        async function game(player1, player2) {
            var _a;
            let gameBoard = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
                // column ->
            ];
            let rowChoice = null;
            let columnChoice = null;
            let currentPlayer = player1.id;
            let boardImageURL = null;
            let currentTurn = 0;
            await createBoard();
            ++currentTurn;
            const Embed = new discord_js_1.MessageEmbed()
                .setThumbnail(player1Avatar)
                .setColor('RED')
                .setTitle(`Tic Tac Toe - Player 1's Turn`)
                .setDescription(`Use the emojis 1️⃣, 2️⃣, 3️⃣ for columns and 🇦, 🇧, 🇨 for rows.\n
        You must click both a **Number** and a **Letter** to place your colored square in that space.\n
        You have 1 minute per turn or it's an automatic forfeit.
        Incase of invisible board click 🔄.`)
                .addFields({ name: 'Column', value: 'None', inline: true }, { name: 'Row', value: 'None', inline: true })
                .setImage(boardImageURL)
                .setFooter({ text: 'Incase of invisible board click 🔄' })
                .setTimestamp();
            await ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.send({ embeds: [Embed] }).then(async (message) => {
                try {
                    await message.react('1️⃣');
                    await message.react('2️⃣');
                    await message.react('3️⃣');
                    await message.react('🇦');
                    await message.react('🇧');
                    await message.react('🇨');
                    await message.react('🔄');
                }
                catch (error) {
                    logger_1.default.error(`Tic-Tac-Toe - ` + error);
                }
                const filter = (reaction) => {
                    return (reaction.emoji.name === '1️⃣' ||
                        reaction.emoji.name === '2️⃣' ||
                        reaction.emoji.name === '3️⃣' ||
                        reaction.emoji.name === '🇦' ||
                        reaction.emoji.name === '🇧' ||
                        reaction.emoji.name === '🇨' ||
                        reaction.emoji.name === '🔄');
                };
                const gameCollector = message.createReactionCollector({
                    filter: filter,
                    idle: 60 * 1000
                });
                gameCollector.on('collect', async function (reaction, user) {
                    // Reset the Reactions
                    if (user.id !== interaction.applicationId)
                        await reaction.users.remove(user).catch(error => {
                            logger_1.default.error(`Tic-Tac-Toe - ` + error);
                        });
                    // Refresh Image
                    if (reaction.emoji.name === '🔄' &&
                        (user.id === player1.id || user.id === player2.id)) {
                        message.embeds[0].setImage(boardImageURL);
                        await message.edit({
                            embeds: [message.embeds[0]]
                        });
                    }
                    if (user.id !== currentPlayer) {
                        return;
                    }
                    // Column 1
                    if (reaction.emoji.name === '1️⃣') {
                        columnChoice = 0;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    // Column 2
                    if (reaction.emoji.name === '2️⃣') {
                        columnChoice = 1;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    // Column 3
                    if (reaction.emoji.name === '3️⃣') {
                        columnChoice = 2;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    // Row A
                    if (reaction.emoji.name === '🇦') {
                        rowChoice = 0;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    // Row B
                    if (reaction.emoji.name === '🇧') {
                        rowChoice = 1;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    // Row C
                    if (reaction.emoji.name === '🇨') {
                        rowChoice = 2;
                        await playerMove(rowChoice, columnChoice, user, message.embeds[0]);
                    }
                    await message.edit({
                        embeds: [message.embeds[0]]
                    });
                });
                gameCollector.on('end', async () => {
                    playerMap.forEach(player => games_1.playersInGame.delete(player.id));
                    return await message.reactions
                        .removeAll()
                        .catch((error) => logger_1.default.error(`Tic-Tac-Toe - ` + error));
                });
            }));
            async function createBoard() {
                var _a;
                // Set asset sizes
                const boardHeight = 700;
                const boardWidth = 700;
                const pieceSize = 150;
                // Set Image size
                const canvas = (0, canvas_1.createCanvas)(boardWidth, boardHeight);
                const ctx = canvas.getContext('2d');
                // Get Center to Center measurements for grid spacing
                const positionX = 200;
                const positionY = 200;
                // Tic-Tac-Toe Board
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, boardWidth, boardHeight);
                ctx.font = '100px Open Sans Light';
                ctx.fillStyle = 'grey';
                // Add Shadows to indicators and empty spaces
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 2;
                // Column Numbers
                ctx.fillText('1', 40, 650);
                ctx.fillText('2', 250, 650);
                ctx.fillText('3', 450, 650);
                // Row Letters
                ctx.fillText('A', 575, 110);
                ctx.fillText('B', 575, 310);
                ctx.fillText('C', 575, 510);
                // Build the Game Board
                for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
                    for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
                        ctx.beginPath();
                        // Empty Spaces
                        if (gameBoard[rowIndex][columnIndex] === 0) {
                            ctx.fillStyle = 'grey';
                            ctx.fillRect(positionX * columnIndex, positionY * rowIndex, pieceSize, pieceSize);
                        }
                        // Player 1 Pieces
                        if (gameBoard[rowIndex][columnIndex] === 1) {
                            if (player1Piece) {
                                ctx.drawImage(player1Piece, positionX * columnIndex, positionY * rowIndex, pieceSize, pieceSize);
                            }
                            else {
                                ctx.fillStyle = 'red';
                                ctx.shadowColor = 'grey';
                                ctx.shadowBlur = 5;
                                ctx.shadowOffsetX = 4;
                                ctx.shadowOffsetY = 2;
                                ctx.fillRect(positionX * columnIndex, positionY * rowIndex, pieceSize, pieceSize);
                            }
                        }
                        // Player 2 Pieces
                        if (gameBoard[rowIndex][columnIndex] === 2) {
                            if (player2Piece) {
                                ctx.drawImage(player2Piece, positionX * columnIndex, positionY * rowIndex, pieceSize, pieceSize);
                            }
                            else {
                                ctx.fillStyle = 'blue';
                                ctx.shadowColor = 'grey';
                                ctx.shadowBlur = 5;
                                ctx.shadowOffsetX = 4;
                                ctx.shadowOffsetY = 2;
                                ctx.fillRect(positionX * columnIndex, positionY * rowIndex, pieceSize, pieceSize);
                            }
                        }
                    }
                }
                return await ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.send({
                    files: [
                        new discord_js_1.MessageAttachment(canvas.toBuffer('image/png'), `TicTacToe-${player1.id}-${player2.id}${currentTurn}.png`)
                    ]
                }).then(async (result) => {
                    boardImageURL = await result.attachments.entries().next().value[1]
                        .url;
                    await result.delete();
                }).catch((error) => {
                    logger_1.default.error(`Tic-Tac-Toe - ` + error);
                }));
            }
            async function playerMove(row, column, user, instance) {
                const rowsLetters = ['A', 'B', 'C'];
                if (currentPlayer === user.id) {
                    instance.fields[0].value = column !== null ? `${column + 1}` : 'None';
                    instance.fields[1].value = row !== null ? rowsLetters[row] : 'None';
                }
                // Wait for both
                if (row === null || column === null) {
                    return;
                }
                // Reset 'Column' & 'Row' for next turn
                instance.fields[0].value = 'None';
                instance.fields[1].value = 'None';
                columnChoice = null;
                rowChoice = null;
                if (currentPlayer === 'Game Over' || gameBoard[row][column] !== 0)
                    return;
                if (currentPlayer === user.id) {
                    if (currentPlayer === player1.id) {
                        gameBoard[row][column] = 1;
                        currentPlayer = player2.id;
                        instance
                            .setThumbnail(player2Avatar)
                            .setTitle(`Tic Tac Toe - Player 2's Turn`)
                            .setColor('BLUE')
                            .setTimestamp();
                    }
                    else {
                        gameBoard[row][column] = 2;
                        currentPlayer = player1.id;
                        instance
                            .setThumbnail(player1Avatar)
                            .setTitle(`Tic Tac Toe - Player 1's Turn`)
                            .setColor('RED')
                            .setTimestamp();
                    }
                    await createBoard();
                    ++currentTurn;
                }
                if (checkWinner(gameBoard) === 0) {
                    // No More Possible Moves
                    if (!emptySpaces(gameBoard)) {
                        instance
                            .setTitle(`Tic Tac Toe - Game Over`)
                            .setColor('GREY')
                            .setThumbnail('');
                        currentPlayer = 'Game Over';
                        playerMap.forEach(player => games_1.playersInGame.delete(player.id));
                    }
                    instance.setImage(boardImageURL).setTimestamp();
                    return;
                }
                else {
                    instance
                        .setImage(boardImageURL)
                        .setTitle(`Tic Tac Toe - 👑 Player ${checkWinner(gameBoard)} Wins! 👑`)
                        .setTimestamp();
                    if (currentPlayer === player1.id) {
                        instance.setThumbnail(player2Avatar).setColor('BLUE');
                    }
                    else {
                        instance.setThumbnail(player1Avatar).setColor('RED');
                    }
                    currentPlayer = 'Game Over';
                    playerMap.forEach(player => games_1.playersInGame.delete(player.id));
                    return;
                }
            }
            // Check for available spaces
            function emptySpaces(board) {
                let result = false;
                for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
                    for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
                        if (board[columnIndex][rowIndex] === 0) {
                            result = true;
                        }
                    }
                }
                return result;
            }
            // Check for Win Conditions
            function checkLine(a, b, c) {
                // Check first cell non-zero and all cells match
                return a != 0 && a == b && a == c;
            }
            function checkWinner(board) {
                // Check down
                for (let c = 0; c < 3; c++)
                    if (checkLine(board[0][c], board[1][c], board[2][c]))
                        return board[0][c];
                // Check right
                for (let r = 0; r < 3; r++)
                    if (checkLine(board[r][0], board[r][1], board[r][2]))
                        return board[r][0];
                // Check down-right
                if (checkLine(board[0][0], board[1][1], board[2][2]))
                    return board[0][0];
                // Check down-left
                if (checkLine(board[0][2], board[1][1], board[2][0]))
                    return board[0][2];
                return 0;
            }
        }
        //   });
    }
}
exports.TicTacToeGame = TicTacToeGame;
//# sourceMappingURL=tic-tac-toe.js.map