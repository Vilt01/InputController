// оборнули в функцию чтобы переменные не 
// выходили в глобальную область
(function (global) {
    'use strict';
   
    //события    
     const ACTION_ACTIVATED = 
    'input-controller:action-activated';
     const ACTION_DEACTIVATED =
    'input-controller:action-deactivated';

    class InputController {
        constructor(actionsToBind, target)
        {
                //публичные константы            
                this.ACTION_ACTIVATED = 
            ACTION_ACTIVATED;

                this.ACTION_DEACTIVATED = 
            ACTION_DEACTIVATED;

            //публичное свойство
            this.enabled = true;
            
            //проверка фокуса у окна
            this.focused = typeof document !== 
            'undefined' && typeof document.hasFocus 
            === 'function'
            ? document.hasFocus()
            : true;


            this._actions = new Map(); // хранится действие
            this._pressedKeys = new Set(); // хранятися физически нажатые кнопки

            //сохраняем ссылки на функции обработчики
            this._target = null;
            this._onKeyDown = null;
            this._onKeyUp = null;
            this._onWinFocus = null;
            this._onWinBlur = null;

           // если при создании класса передали действия и элемент
           //сразу инициализируем
            if (actionsToBind){

                this.bindActions(actionsToBind);
            }
            
            if (target){
                this.attach(target);
            }
                
        }
        // действие активности в контроллер
        bindActions(actionsToBind) {
        if (!actionsToBind || typeof actionsToBind !== 'object') return;

        Object.keys(actionsToBind).forEach((actionName) => {
            const config =  actionsToBind[actionName] || {};

            // Если действия нет в Map - создаем для него запись
            if (!this._actions.has(actionName)) {
                this._actions.set(actionName, {
                    keys: new Set(), // Клавиши для действия
                    enabled: true,   // Включено ли действие
                    active: false    // Нажато ли действие прямо сейчас
                });
            }
            const action = this._actions.get(actionName);

            // Добавляем клавиши (Set автоматически уберет дубликаты)
            if (Array.isArray(config.keys)) {
                config.keys.forEach(keyCode => action.keys.add(keyCode));
            }

            // Если в конфиге указано enabled: false — выключаем действие
            if (config.enabled !== undefined) {
                action.enabled = Boolean(config.enabled);
            }
        });
    }

        

    }


})