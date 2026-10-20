(function() {
    'use strict';

const controller = new InputController({
    left:  { keys: [37, 65] }, // Стрелка влево и клавиша A
    
    right: { keys: [39, 68] }, // Стрелка вправо и клавиша D
    
    up:    { keys: [38, 87] }, // Стрелка вверх и клавиша W
    
    down:  { keys: [40, 83] },  // Стрелка вниз и клавиша S
    
    jump:  { keys: [32], mouseButtons: [0]}
});

// 2. Создаем и подключаем плагины
const keyboard = new KeyboardPlugin();
const mouse = new MousePlugin();

controller.addPlugin(keyboard);
controller.addPlugin(mouse);

controller.attach(document);

const player = document.getElementById('player');
const logEl = document.getElementById('log');

let posX = 280;
let posY = 130;
const speed = 4; 

function log(msg) {
    const div = document.createElement('div');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
}

// Слушаем события
document.addEventListener(controller.ACTION_ACTIVATED, (e) => {
    log(`АКТИВАЦИЯ: ${e.detail}`);
    if (e.detail === 'jump') {
        player.classList.add('jumping'); 
    }
});

document.addEventListener(controller.ACTION_DEACTIVATED, (e) => {
    log(`ДЕАКТИВАЦИЯ: ${e.detail}`);
    if (e.detail === 'jump') {
        player.classList.remove('jumping'); 
    }
});

function gameLoop() {
    if (controller.isActionActive('left'))  posX -= speed;
    if (controller.isActionActive('right')) posX += speed;
    if (controller.isActionActive('up'))    posY -= speed;
    if (controller.isActionActive('down'))  posY += speed;

    const maxX = 600 - 40;
    const maxY = 300 - 40;
    if (posX < 0) posX = 0;
    if (posX > maxX) posX = maxX;
    if (posY < 0) posY = 0;
    if (posY > maxY) posY = maxY;

    player.style.left = posX + 'px';
    player.style.top = posY + 'px';

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
// кнопки управления
document.getElementById('btn-attach').onclick = () => {
    controller.attach(document);
    log('Вызван метод: attach');
};

document.getElementById('btn-detach').onclick = () => {
    controller.detach();
    log('Вызван метод: detach');
};

document.getElementById('btn-enable').onclick = () => {
    controller.enabled = true;
    log('Свойство enabled = true');
};

document.getElementById('btn-disable').onclick = () => {
    controller.enabled = false;
    log('Свойство enabled = false');
};

document.getElementById('btn-bind-jump').onclick = () => {
    // Динамически добавляем jump на Пробел и ЛКМ
    controller.bindActions({ jump: { keys: [32], mouseButtons: [0] } }); 
    log('Добавлена активность "jump" на Пробел и ЛКМ');
};

document.getElementById('btn-disable-jump').onclick = () => {
    controller.disableAction('jump');
    log('Вызван метод: disableAction("jump")');
};

// Новая кнопка для проверки isKeyPressed
document.getElementById('btn-check-mouse').onclick = () => {
    // Проверяем, зажата ли левая кнопка мыши (код 0)
    const isPressed = controller.isKeyPressed(0);
    log(`Проверка isKeyPressed(0): ${isPressed}`);
};

// Защита от перехвата фокуса кнопками
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
});
})();