const express = require('express'); // 引入 Express 框架
const http = require('http'); // 引入 http 模組
const socketIo = require('socket.io'); // 引入 Socket.io 模組

const app = express(); // 建立 Express 應用程式
const server = http.createServer(app); // 建立 HTTP 伺服器
const io = socketIo(server); // 建立 Socket.io 伺服器

// 使用 Express 提供靜態檔案服務，將 'public' 資料夾設為靜態檔案目錄
app.use(express.static('public'));

// 初始化遊戲狀態
let players = []; // 存放玩家 socket ID 的陣列
let board = Array(9).fill(null); // 初始化遊戲板，9 個格子，初始值為 null
let currentPlayer = 'X'; // 設定初始玩家為 'X'

// 檢查是否有玩家獲勝
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// 當有玩家連線時觸發
io.on('connection', (socket) => {
    // 如果目前玩家數量少於 2，允許加入
    if (players.length < 2) {
        players.push(socket.id); // 將玩家 socket ID 加入陣列
        socket.emit('init', { symbol: players.length === 1 ? 'X' : 'O' }); // 傳送初始化訊息給玩家
    } else {
        socket.emit('full'); // 如果房間已滿，通知玩家
        return; // 結束函數
    }

    // 當玩家進行移動時觸發
    socket.on('move', (data) => {
        // 驗證是否是該玩家的回合
        if ((socket.id === players[0] && currentPlayer === 'X') || (socket.id === players[1] && currentPlayer === 'O')) {
            // 確認該位置尚未被佔用
            if (board[data.index] === null) {
                board[data.index] = currentPlayer; // 更新遊戲板
                const winner = checkWinner(board); // 檢查是否有玩家獲勝
                io.emit('update', { board, currentPlayer }); // 廣播更新的棋盤狀態和當前玩家

                if (winner) {
                    io.emit('gameOver', { winner }); // 廣播遊戲結束訊息
                    // 重置遊戲狀態
                    board = Array(9).fill(null);
                    currentPlayer = 'X';
                } else if (board.every(cell => cell !== null)) {
                    io.emit('gameOver', { winner: 'Draw' }); // 廣播平局訊息
                    // 重置遊戲狀態
                    board = Array(9).fill(null);
                    currentPlayer = 'X';
                } else {
                    currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; // 切換玩家
                }
            }
        }
    });

    // 當玩家發送聊天訊息時觸發
    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data); // 廣播聊天訊息
    });

    // 當玩家請求重置遊戲時觸發
    socket.on('requestReset', () => {
        // 重置遊戲狀態
        board = Array(9).fill(null);
        currentPlayer = 'X';
        // 為每個玩家重新分配符號
        players.forEach((player, index) => {
            io.to(player).emit('reset', { symbol: index === 0 ? 'X' : 'O' });
        });
    });

    // 當玩家斷線時觸發
    socket.on('disconnect', () => {
        // 移除斷線玩家
        players = players.filter(player => player !== socket.id);
        // 重置遊戲狀態
        board = Array(9).fill(null);
        currentPlayer = 'X';
        io.emit('reset', { symbol: null }); // 廣播重置訊息
    });
});

// 啟動伺服器，監聽 3000 埠
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
