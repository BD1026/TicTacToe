const socket = io(); // 初始化 Socket.io 客戶端

let symbol; // 存儲玩家的符號 ('X' 或 'O')

// 當接收到初始化訊息時觸發
socket.on('init', (data) => {
    symbol = data.symbol; // 設置玩家符號
    document.querySelector('h2').innerText = `You are ${symbol}`; // 顯示玩家符號
});

// 當接收到房間已滿訊息時觸發
socket.on('full', () => {
    alert('The game room is full. Please try again later.'); // 顯示房間已滿提示
});

// 當接收到遊戲更新訊息時觸發
socket.on('update', (data) => {
    updateBoard(data.board); // 更新遊戲板
    document.querySelector('h2').innerText = `Current player: ${data.currentPlayer}`; // 更新當前玩家顯示
});

// 當接收到重置訊息時觸發
socket.on('reset', () => {
    resetBoard(); // 重置遊戲板
    document.querySelector('h2').innerText = 'Waiting for players...'; // 顯示等待玩家訊息
});

// 當接收到遊戲結束訊息時觸發
socket.on('gameOver', (data) => {
    if (data.winner === 'Draw') {
        document.querySelector('h2').innerText = 'It\'s a draw!'; // 顯示平局訊息
    } else if (data.winner === symbol) {
        document.querySelector('h2').innerText = 'You win!'; // 顯示玩家獲勝訊息
    } else {
        document.querySelector('h2').innerText = 'You lose!'; // 顯示玩家失敗訊息
    }
    setTimeout(() => {
        resetBoard(); // 遊戲結束後重置遊戲板
        document.querySelector('h2').innerText = 'Waiting for players...'; // 顯示等待玩家訊息
    }, 3000); // 延遲 3 秒後重置遊戲
});

const boardElement = document.getElementById('board'); // 獲取遊戲板元素

// 更新遊戲板
function updateBoard(board) {
    board.forEach((cell, index) => {
        const cellElement = document.getElementById(`cell-${index}`);
        if (cellElement) {
            cellElement.innerText = cell; // 更新每個格子的內容
        }
    });
}

// 重置遊戲板
function resetBoard() {
    for (let i = 0; i < 9; i++) {
        document.getElementById(`cell-${i}`).innerText = ''; // 清空每個格子的內容
    }
}

// 創建遊戲板
function createBoard() {
    for (let i = 0; i < 9; i++) {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell'); // 添加 CSS 類
        cellElement.id = `cell-${i}`; // 設置格子的 ID
        cellElement.addEventListener('click', () => {
            socket.emit('move', { index: i }); // 當點擊格子時，發送移動訊息
        });
        boardElement.appendChild(cellElement); // 將格子添加到遊戲板
    }
}

createBoard(); // 呼叫函數創建遊戲板
