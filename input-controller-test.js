(function() {
    'use strict';

    const controller = new InputController({
        left:  { keys: [37, 65] }, 
        right: { keys: [39, 68] }, 
        up:    { keys: [38, 87] }, 
        down:  { keys: [40, 83] },  
        jump:  { keys: [32], mouseButtons: [0]}
    });

    const keyboard = new KeyboardPlugin();
    const mouse = new MousePlugin();
    controller.addPlugin(keyboard);
    controller.addPlugin(mouse);
    controller.attach(document);

    const player = document.getElementById('player');
    const logEl = document.getElementById('log');
    const ball = document.getElementById('ball');

    let posX = 280;
    let posY = 130;
    const speed = 4;
    let isJumping = false; 

    function log(msg) {
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
    }

    // ИСПРАВЛЕННАЯ АНИМАЦИЯ БЕЗ РЫВКОВ
    function animateJump() {
        if (isJumping) return;
        isJumping = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                isJumping = false;
            }
        });

        timeline
        .to(ball, { scaleX: 0.8, scaleY: 1.2, duration: 0.15, ease: "power1.inOut" })
        // 2. Прыжок вверх - плавное замедление
        .to(ball, { y: -100, scaleX: 1, scaleY: 1, duration: 0.4, ease: "power1.out" })
        // 3. Падение - плавное ускорение
        .to(ball, { y: 0, scaleX: 1, scaleY: 1, duration: 0.4, ease: "power1.in" })
        // 4. Удар о платформу - сплющивание
        .to(ball, { scaleX: 1.3, scaleY: 0.7, duration: 0.1, ease: "power1.out" });

        // 5. Цикл затухающих отскоков
        for (let i = 0; i < 3; i++) { 
            const height = 40 / (i + 1); 
            const duration = 0.25 / (i + 1);

            timeline
            .to(ball, { y: -height, scaleX: 0.95, scaleY: 1.05, duration: duration, ease: "power1.out" })
            // Падение вниз
            .to(ball, { y: 0, scaleX: 1, scaleY: 1, duration: duration, ease: "power1.in" })
            // Микро-удар о землю
            .to(ball, { scaleX: 1.15, scaleY: 0.85, duration: 0.08, ease: "power1.out" })
            // Восстановление формы перед следующим прыжком
            .to(ball, { scaleX: 1, scaleY: 1, duration: 0.08, ease: "power1.inOut" });
        }
    }

    document.addEventListener(controller.ACTION_ACTIVATED, (e) => {
        log(`АКТИВАЦИЯ: ${e.detail}`);
        
        if (e.detail === 'jump') {
            player.classList.add('jumping'); // Подсветка квадрата
            animateJump(); // Запуск анимации мяча
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

    document.getElementById('btn-attach').onclick = () => { controller.attach(document); log('Вызван метод: attach'); };
    document.getElementById('btn-detach').onclick = () => { controller.detach(); log('Вызван метод: detach'); };
    document.getElementById('btn-enable').onclick = () => { controller.enabled = true; log('Свойство enabled = true'); };
    document.getElementById('btn-disable').onclick = () => { controller.enabled = false; log('Свойство enabled = false'); };
    document.getElementById('btn-bind-jump').onclick = () => {
        controller.bindActions({ jump: { keys: [32], mouseButtons: [0] } }); 
        log('Добавлена активность "jump"');
    };
    document.getElementById('btn-disable-jump').onclick = () => { controller.disableAction('jump'); log('disableAction("jump")'); };
    document.getElementById('btn-check-mouse').onclick = () => { log(`Проверка isKeyPressed(0): ${controller.isKeyPressed(0)}`); };

    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', e => e.preventDefault());
    });
})();