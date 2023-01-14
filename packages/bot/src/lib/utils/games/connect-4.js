"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connect4Game = void 0;
const canvas_1 = require("@napi-rs/canvas");
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const games_1 = require("../../../commands/other/games");
const logger_1 = __importDefault(require("../logger"));
class Connect4Game {
    async connect4(interaction, playerMap) {
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
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0] // row 1
                // column ->
            ];
            const row = {
                0: [1, 2, 3, 4, 5, 6],
                1: [1, 2, 3, 4, 5, 6],
                2: [1, 2, 3, 4, 5, 6],
                3: [1, 2, 3, 4, 5, 6],
                4: [1, 2, 3, 4, 5, 6],
                5: [1, 2, 3, 4, 5, 6],
                6: [1, 2, 3, 4, 5, 6] // column 7
                // row ->
            };
            let currentPlayer = player1.id;
            let boardImageURL = null;
            let currentTurn = 0;
            await createBoard();
            ++currentTurn;
            const Embed = new discord_js_1.MessageEmbed()
                .setThumbnail(player1Avatar)
                .setColor('RED')
                .setTitle(`Connect 4 - Player 1's Turn`)
                .setDescription(`Incase of invisible board click 🔄.
         Use 1️⃣, 2️⃣, 3️⃣, etc... to place your colored disc in that column.
         Thumbnail and Title indicate current players turn.
         You have 1 minute per turn or it's an automatic forfeit.`)
                .setImage(boardImageURL)
                .setFooter({ text: 'Incase of invisible board click 🔄' })
                .setTimestamp();
            await ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.send({ embeds: [Embed] }).then(async (message) => {
                try {
                    await message.react('1️⃣');
                    await message.react('2️⃣');
                    await message.react('3️⃣');
                    await message.react('4️⃣');
                    await message.react('5️⃣');
                    await message.react('6️⃣');
                    await message.react('7️⃣');
                    await message.react('🔄');
                }
                catch (error) {
                    logger_1.default.error('Connect 4 - ' + error);
                }
                const filter = (reaction) => {
                    return (reaction.emoji.name === '1️⃣' ||
                        reaction.emoji.name === '2️⃣' ||
                        reaction.emoji.name === '3️⃣' ||
                        reaction.emoji.name === '4️⃣' ||
                        reaction.emoji.name === '5️⃣' ||
                        reaction.emoji.name === '6️⃣' ||
                        reaction.emoji.name === '7️⃣' ||
                        reaction.emoji.name === '🔄');
                };
                const gameCollector = message.createReactionCollector({
                    filter: filter,
                    idle: 60 * 1000
                });
                gameCollector.on('collect', async function (reaction, user) {
                    if (user.id !== interaction.applicationId)
                        await reaction.users.remove(user).catch(error => {
                            logger_1.default.error(`Connect 4 - ` + error);
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
                    if (reaction.emoji.name === '1️⃣')
                        await playerMove(0, user, message.embeds[0]);
                    // Column 2
                    if (reaction.emoji.name === '2️⃣')
                        await playerMove(1, user, message.embeds[0]);
                    // Column 3
                    if (reaction.emoji.name === '3️⃣')
                        await playerMove(2, user, message.embeds[0]);
                    // Column 4
                    if (reaction.emoji.name === '4️⃣')
                        await playerMove(3, user, message.embeds[0]);
                    // Column 5
                    if (reaction.emoji.name === '5️⃣')
                        await playerMove(4, user, message.embeds[0]);
                    // Column 6
                    if (reaction.emoji.name === '6️⃣')
                        await playerMove(5, user, message.embeds[0]);
                    // Column 7
                    if (reaction.emoji.name === '7️⃣')
                        await playerMove(6, user, message.embeds[0]);
                    await message.edit({ embeds: [message.embeds[0]] });
                });
                gameCollector.on('end', async () => {
                    playerMap.forEach(player => games_1.playersInGame.delete(player.id));
                    return await message.reactions
                        .removeAll()
                        .catch((error) => logger_1.default.error('Connect 4 - ' + error));
                });
            }));
            async function createBoard() {
                var _a;
                // Set asset sizes
                const boardHeight = 600;
                const boardWidth = 700;
                const pieceSize = 75 / 2;
                const offset = 25 / 2;
                // Set Image size
                const canvas = (0, canvas_1.createCanvas)(boardWidth, boardHeight);
                const ctx = canvas.getContext('2d');
                // Get Center to Center measurements for grid spacing
                const positionX = boardWidth / 7;
                const positionY = boardHeight / 6;
                // Connect 4 Board
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, boardWidth, boardHeight);
                // Build the Game Board
                for (let columnIndex = 0; columnIndex < 7; ++columnIndex) {
                    for (let rowIndex = 0; rowIndex < 6; ++rowIndex) {
                        // Empty Spaces
                        if (gameBoard[rowIndex][columnIndex] === 0) {
                            ctx.beginPath();
                            ctx.shadowColor = 'white';
                            ctx.shadowBlur = 7;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            ctx.arc(offset + (pieceSize + positionX * columnIndex), offset + (pieceSize + positionY * rowIndex), pieceSize, 0, Math.PI * 2, true);
                            ctx.fillStyle = 'grey';
                            ctx.fill();
                        }
                        // Player 1 Pieces
                        if (gameBoard[rowIndex][columnIndex] === 1) {
                            ctx.beginPath();
                            ctx.shadowColor = 'grey';
                            ctx.shadowBlur = 7;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            if (player1Piece) {
                                ctx.save();
                                ctx.arc(offset + (pieceSize + positionX * columnIndex), offset + (pieceSize + positionY * rowIndex), pieceSize, 0, Math.PI * 2, true);
                                ctx.fillStyle = 'grey';
                                ctx.fill();
                                ctx.clip();
                                ctx.drawImage(player1Piece, offset + positionX * columnIndex, offset + positionY * rowIndex, pieceSize * 2, pieceSize * 2);
                                ctx.restore();
                            }
                            else {
                                ctx.arc(offset + (pieceSize + positionX * columnIndex), offset + (pieceSize + positionY * rowIndex), pieceSize, 0, Math.PI * 2, true);
                                ctx.fillStyle = 'red';
                                ctx.fill();
                            }
                        }
                        // Player 2 Pieces
                        if (gameBoard[rowIndex][columnIndex] === 2) {
                            ctx.beginPath();
                            ctx.shadowColor = 'grey';
                            ctx.shadowBlur = 7;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            if (player2Piece) {
                                ctx.save();
                                ctx.arc(offset + (pieceSize + positionX * columnIndex), offset + (pieceSize + positionY * rowIndex), pieceSize, 0, Math.PI * 2, true);
                                ctx.fillStyle = 'grey';
                                ctx.fill();
                                ctx.clip();
                                ctx.drawImage(player2Piece, offset + positionX * columnIndex, offset + positionY * rowIndex, pieceSize * 2, pieceSize * 2);
                                ctx.restore();
                            }
                            else {
                                ctx.arc(offset + (pieceSize + positionX * columnIndex), offset + (pieceSize + positionY * rowIndex), pieceSize, 0, Math.PI * 2, true);
                                ctx.fillStyle = 'blue';
                                ctx.fill();
                            }
                        }
                    }
                }
                return await ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.send({
                    files: [
                        new discord_js_1.MessageAttachment(canvas.toBuffer('image/png'), `connect4Game${player1.id}-${player2.id}${currentTurn}.png`)
                    ]
                }).then(async (result) => {
                    boardImageURL = await result.attachments.entries().next().value[1]
                        .url;
                    result.delete();
                }).catch((error) => {
                    logger_1.default.error('Connect 4 - Failed to Delete previous Image\n', error);
                }));
            }
            async function playerMove(index, user, instance) {
                if (currentPlayer === 'Game Over' || row[index].length === 0) {
                    return;
                }
                if (currentPlayer === user.id) {
                    row[index].pop();
                    if (currentPlayer === player1.id) {
                        currentPlayer = player2.id;
                        gameBoard[row[index].length][index] = 1;
                        instance
                            .setThumbnail(player2Avatar)
                            .setTitle(`Connect 4 - Player 2's Turn`)
                            .setColor('BLUE')
                            .setTimestamp();
                    }
                    else {
                        gameBoard[row[index].length][index] = 2;
                        currentPlayer = player1.id;
                        instance
                            .setThumbnail(player1Avatar)
                            .setTitle(`Connect 4 - Player 1's Turn`)
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
                            .setTitle(`Connect 4 - Game Over`)
                            .setColor('GREY')
                            .setThumbnail('');
                        currentPlayer = 'Game Over';
                        playerMap.forEach(player => games_1.playersInGame.delete(player.id));
                    }
                    return instance.setImage(boardImageURL).setTimestamp();
                }
                else {
                    instance
                        .setImage(boardImageURL)
                        .setTitle(`Connect 4 - 👑 Player ${checkWinner(gameBoard)} Wins! 👑`)
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
                for (let columnIndex = 0; columnIndex < 7; ++columnIndex) {
                    for (let rowIndex = 0; rowIndex < 6; ++rowIndex) {
                        if (board[rowIndex][columnIndex] === 0) {
                            result = true;
                        }
                    }
                }
                return result;
            }
            // Reference https://stackoverflow.com/questions/15457796/four-in-a-row-logic/15457826#15457826
            // Check for Win Conditions
            function checkLine(a, b, c, d) {
                // Check first cell non-zero and all cells match
                return a != 0 && a == b && a == c && a == d;
            }
            function checkWinner(board) {
                // Check down
                for (let r = 0; r < 3; r++)
                    for (let c = 0; c < 7; c++)
                        if (checkLine(board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]))
                            return board[r][c];
                // Check right
                for (let r = 0; r < 6; r++)
                    for (let c = 0; c < 4; c++)
                        if (checkLine(board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]))
                            return board[r][c];
                // Check down-right
                for (let r = 0; r < 3; r++)
                    for (let c = 0; c < 4; c++)
                        if (checkLine(board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]))
                            return board[r][c];
                // Check down-left
                for (let r = 3; r < 6; r++)
                    for (let c = 0; c < 4; c++)
                        if (checkLine(board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]))
                            return board[r][c];
                return 0;
            }
        }
    }
}
exports.Connect4Game = Connect4Game;
//# sourceMappingURL=connect-4.js.map