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

    function animateJump() {
        if (isJumping) return;
        isJumping = true;

        const tl = gsap.timeline({
            onComplete: () => { isJumping = false; }
        });

        // 1. Подготовка (Сплющивание перед прыжком)
        tl.to(ball, { scaleX: 1.4, scaleY: 0.6, duration: 0.15, ease: "power2.inOut" })

        // 2. Прыжок вверх (Растяжение)
        .to(ball, { y: -120, scaleX: 0.8, scaleY: 1.2, duration: 0.35, ease: "power1.out" })

        // 3. Падение вниз (Растяжение)
        .to(ball, { y: 0, scaleX: 0.8, scaleY: 1.2, duration: 0.35, ease: "power1.in" })

        // 4. Первый удар об пол (сильное сплющивание)
        .to(ball, { scaleX: 1.7, scaleY: 0.4, duration: 0.08, ease: "power1.out" })

        // 5. Отскок №1 (средний)
        .to(ball, { y: -50, scaleX: 0.85, scaleY: 1.15, duration: 0.25, ease: "power1.out" })
        .to(ball, { y: 0, scaleX: 0.85, scaleY: 1.15, duration: 0.25, ease: "power1.in" })
        .to(ball, { scaleX: 1.4, scaleY: 0.6, duration: 0.08, ease: "power1.out" })

        // 6. Отскок №2 (маленький)
        .to(ball, { y: -20, scaleX: 0.9, scaleY: 1.1, duration: 0.15, ease: "power1.out" })
        .to(ball, { y: 0, scaleX: 0.9, scaleY: 1.1, duration: 0.15, ease: "power1.in" })
        .to(ball, { scaleX: 1.15, scaleY: 0.85, duration: 0.08, ease: "power1.out" })

        // 7. Отскок №3 (микро-отскок)
        .to(ball, { y: -5, scaleX: 0.95, scaleY: 1.05, duration: 0.1, ease: "power1.out" })
        .to(ball, { y: 0, scaleX: 0.95, scaleY: 1.05, duration: 0.1, ease: "power1.in" })
        .to(ball, { scaleX: 1.05, scaleY: 0.95, duration: 0.08, ease: "power1.out" })

        // 8. возвразщение в естественную форму
        .to(ball, { scaleX: 1, scaleY: 1, duration: 0.4, ease: "power2.out" });
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