// Оборачиваем в функцию, чтобы переменные не выходили в глобальную область // Строковые значения событий вынесены в константы 
(function (global) { 'use strict';
const ACTION_ACTIVATED = 'input-controller:action-activated';
const ACTION_DEACTIVATED = 'input-controller:action-deactivated';

//STRATEGY: базовый класс плагина 
class InputPlugin {
    constructor() {
        this.controller = null;
        this.target = null;
    }

    // Вызывается при подключении плагина к контроллеру
    init(controller, target) {
        this.controller = controller;
        this.target = target;
    }
    
    // Вызывается при отключении
    destroy() {}
}

// CONCRETE STRATEGY: плагин клавиатуры
class KeyboardPlugin extends InputPlugin {
    constructor() {
        super();
        this._pressedKeys = new Set();
        this._onKeyDown = this._handleKeyDown.bind(this);
        this._onKeyUp = this._handleKeyUp.bind(this);
    }

    init(controller, target) {
        super.init(controller, target);
        this.target.addEventListener('keydown', this._onKeyDown);
        this.target.addEventListener('keyup', this._onKeyUp);
    }

    destroy() {
        if (this.target) {
            this.target.removeEventListener('keydown', this._onKeyDown);
            this.target.removeEventListener('keyup', this._onKeyUp);
        }
        this._pressedKeys.clear();
    }

    _handleKeyDown(e) {
        const code = e.keyCode || e.which;
        if (!code || this._pressedKeys.has(code)) return; // Игнорируем автоповтор
        
        this._pressedKeys.add(code); // Добавляем клавишу в Set
        this._updateActions();
    }

    _handleKeyUp(e) {
        const code = e.keyCode || e.which;
        if (!this._pressedKeys.has(code)) return;

        this._pressedKeys.delete(code);
        this._updateActions();
    }

    // Плагин сам решает, активен ли экшен, читая настройки контроллера
    _updateActions() {
        for (const [name, action] of this.controller._actions) {
            if (!action.config || !action.config.keys) continue;
            
            // Проверяем, нажата ли хотя бы одна клавиша из конфига
            const isActive = action.config.keys.some(k => this._pressedKeys.has(k));
            this.controller.setActionState(name, isActive);
        }
    }

    isKeyPressed(keyCode) {
        return this._pressedKeys.has(keyCode);
    }
}


//Context, сам контроллер
class InputController {
    constructor(actionsToBind, target) {
        this.ACTION_ACTIVATED = ACTION_ACTIVATED;
        this.ACTION_DEACTIVATED = ACTION_DEACTIVATED;
        
        this.enabled = true;
        this.focused = typeof document !== 'undefined' && typeof document.hasFocus === 'function' 
            ? document.hasFocus() 
            : true;

        this._actions = new Map();
        this._plugins = [];
        this._target = null;

        // Сохраняем функции фокуса
        this._onWinFocus = () => { this.focused = true; };
        this._onWinBlur = () => {
            this.focused = false;
            // Все сбрасываем
            this._actions.forEach((action, name) => this.setActionState(name, false));
            this._plugins.forEach(p => { 
                if (p._pressedKeys) p._pressedKeys.clear(); 
            });
        };

        if (actionsToBind) this.bindActions(actionsToBind);
        if (target) this.attach(target);
    }

    bindActions(actionsToBind) {
        if (!actionsToBind || typeof actionsToBind !== 'object') return;

        // Исправлено: Object.keys (с большой буквы)
        Object.keys(actionsToBind).forEach((actionName) => {
            const config = actionsToBind[actionName] || {};

            if (!this._actions.has(actionName)) {
                this._actions.set(actionName, { 
                    config: {}, 
                    enabled: true,
active: false 
                });
            }
            
            const action = this._actions.get(actionName);
            Object.assign(action.config, config); 

            if (config.enabled !== undefined) {
                action.enabled = Boolean(config.enabled);
            }
        });
    }

    // Подключение плагина
    addPlugin(plugin) {
        if (!(plugin instanceof InputPlugin)) return;

        this._plugins.push(plugin);
        if (this._target) plugin.init(this, this._target);
    }

    // Метод, который плагины вызывают, когда состояние изменилось
    setActionState(actionName, isActive) {
        const action = this._actions.get(actionName);
        if (!action) return;

        if (action.active !== isActive) {
            action.active = isActive;
            if (this.enabled && this.focused && action.enabled) {
                this._dispatch(isActive ? ACTION_ACTIVATED : ACTION_DEACTIVATED, actionName);
            }
        }
    }

    attach(target, dontEnable) {
        if (!target || typeof target.addEventListener !== 'function') return;
        if (this._target) this.detach();

        this._target = target;

        // Инициализируем все подключенные плагины
        this._plugins.forEach(p => p.init(this, target));

        global.addEventListener('focus', this._onWinFocus);
        global.addEventListener('blur', this._onWinBlur);

        if (!dontEnable) this.enabled = true;
    }

    detach() {
        if (!this._target) return;

        // Уничтожаем плагины
        this._plugins.forEach(p => p.destroy());
        
        // Исправлено: removeEventListener
        global.removeEventListener('focus', this._onWinFocus);
        global.removeEventListener('blur', this._onWinBlur);

        this._target = null;
        this.enabled = false; // Исправлено: false вместо null
        this._actions.forEach(a => a.active = false);
    }

    enableAction(actionName) {
        const action = this._actions.get(actionName);
        if (action) action.enabled = true;
    }

    disableAction(actionName) {
        const action = this._actions.get(actionName);
        if (action) { 
            action.enabled = false;
            action.active = false;
        }
    }

    isActionActive(actionName) {
        if (!this.enabled || !this.focused) return false;
        const action = this._actions.get(actionName);
        if (!action || !action.enabled) return false;
        return action.active;
    }

    isKeyPressed(keyCode) {
        if (!this.enabled || !this.focused) return false;
        const kPlugin = this._plugins.find(p => p instanceof KeyboardPlugin);
        return kPlugin ? kPlugin.isKeyPressed(keyCode) : false;
    }

    _dispatch(eventType, actionName) {
        if (!this._target) return;
        const event = new CustomEvent(eventType, {
            detail: actionName,
            bubbles: true
        });
        this._target.dispatchEvent(event);
    }
}

// Экспортируем классы наружу
global.InputController = InputController;
global.KeyboardPlugin = KeyboardPlugin;
})(typeof window !== 'undefined' ? window : this);