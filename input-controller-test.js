(function() {
    'use strict';

const controller = new InputController({
    left:  { keys: [37, 65] }, // Стрелка влево и клавиша A
    right: { keys: [39, 68] }, // Стрелка вправо и клавиша D
    up:    { keys: [38, 87] }, // Стрелка вверх и клавиша W
    down:  { keys: [40, 83] }  // Стрелка вниз и клавиша S
});

controller.attach(document);

const player = document.getElementById('player');
const logEl = document.getElementById('log');

let posX = 280; // Начальная позиция квадратика по X
let posY = 130; // Начальная позиция квадратика по Y
const speed = 4; // Скорость движения (4 пикселя за кадр)

// Выводит сообщения на страницу в блок #log
function log(msg) {
    const div = document.createElement('div');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight; // Авто-прокрутка вниз
}


document.addEventListener(controller.ACTION_ACTIVATED, (e) => {
    log(`АКТИВАЦИЯ: ${e.detail}`);
    if (e.detail === 'jump') {
        player.classList.add('jumping'); // Красим квадратик
    }
});


document.addEventListener(controller.ACTION_DEACTIVATED, (e) => {
    log(`ДЕАКТИВАЦИЯ: ${e.detail}`);
    if (e.detail === 'jump') {
        player.classList.remove('jumping'); // Возвращаем цвет
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

    requestAnimationFrame(gameLoop); // Запускаем следующий кадр
}
requestAnimationFrame(gameLoop); // Старт цикла


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
    controller.bindActions({ jump: { keys: [32] } }); // 32 - это Пробел
    log('Добавлена активность "jump" на Пробел');
};

document.getElementById('btn-disable-jump').onclick = () => {
    controller.disableAction('jump');
    log('Вызван метод: disableAction("jump")');
};


document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
});
})();
