const socket = io(); // 初始化 Socket.io 客戶端

let symbol; // 存儲玩家的符號 ('X' 或 'O')
let countdownTimer; // 用於存儲倒計時器
let countdown = 3; // 設置倒計時秒數

// 當接收到初始化訊息時觸發
socket.on('init', (data) => {
    symbol = data.symbol; // 設置玩家符號
    document.querySelector('h2').innerText = `你是 ${symbol}`; // 顯示玩家符號
});

// 當接收到房間已滿訊息時觸發
socket.on('full', () => {
    alert('你太晚了，房間已滿，請稍後再嘗試。'); // 顯示房間已滿提示
});

// 當接收到遊戲更新訊息時觸發
socket.on('update', (data) => {
    updateBoard(data.board); // 更新遊戲板
    document.querySelector('h2').innerText = `當前玩家: ${data.currentPlayer}`; // 更新當前玩家顯示
});

// 當接收到重置訊息時觸發
socket.on('reset', (data) => {
    resetBoard(); // 重置遊戲板
    symbol = data.symbol; // 更新玩家符號
    document.querySelector('h2').innerText = `你是 ${symbol}`; // 顯示玩家符號
    clearInterval(countdownTimer); // 清除倒計時器
    document.querySelector('#countdown').innerText = ''; // 清空倒計時顯示
});

// 當接收到遊戲結束訊息時觸發
socket.on('gameOver', (data) => {
    if (data.winner === 'Draw') {
        document.querySelector('h2').innerText = '平手!!!'; // 顯示平局訊息
    } else if (data.winner === symbol) {
        document.querySelector('h2').innerText = 'You Win!'; // 顯示玩家獲勝訊息
    } else {
        document.querySelector('h2').innerText = 'You Lose!'; // 顯示玩家失敗訊息
    }
    startCountdown(); // 開始倒計時
});

// 當接收到聊天訊息時觸發
socket.on('chatMessage', (data) => {
    displayMessage(data); // 顯示聊天訊息
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

// 開始倒計時
function startCountdown() {
    countdown = 3; // 初始化倒計時秒數
    document.querySelector('#countdown').innerText = `${countdown}秒後重新開始...`;
    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            document.querySelector('#countdown').innerText = `${countdown}秒後重新開始...`;
        } else {
            clearInterval(countdownTimer); // 清除倒計時器
            socket.emit('requestReset'); // 向伺服器請求重置遊戲
        }
    }, 1000);
}

// 發送聊天訊息
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('chatMessage', { message, symbol }); // 發送聊天訊息
        messageInput.value = ''; // 清空輸入框
    }
}

// 顯示聊天訊息
function displayMessage(data) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.innerText = `${data.symbol}: ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // 滾動到最新訊息
}

// 監聽發送按鈕
document.getElementById('send-button').addEventListener('click', sendMessage);

// 監聽輸入框按鍵事件，當按下 Enter 鍵時發送訊息
document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
