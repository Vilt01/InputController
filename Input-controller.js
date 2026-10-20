// Оборачиваем в функцию, чтобы переменные не выходили в глобальную область 
(function (global) 
{ 'use strict';
const ACTION_ACTIVATED = 'input-controller:action-activated';
const ACTION_DEACTIVATED = 'input-controller:action-deactivated';

// STRATEGY: базовый класс плагина 
class InputPlugin {
    constructor() {
        this.controller = null;
        this.target = null;
    }

    init(controller, target) {
        this.controller = controller;
        this.target = target;
    }
    
    destroy() {}

    // Базовый метод. Контроллер будет спрашивать это у всех плагинов.
    isKeyPressed(keyCode) {
        return false;
    }
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
        if (!code || this._pressedKeys.has(code)) return;
        
        this._pressedKeys.add(code);
        this._updateActions();
    }

    _handleKeyUp(e) {
        const code = e.keyCode || e.which;
        if (!this._pressedKeys.has(code)) return;

        this._pressedKeys.delete(code);
        this._updateActions();
    }

    _updateActions() {
        for (const [name, action] of this.controller._actions) {
            if (!action.config || !action.config.keys) continue;
            const isActive = action.config.keys.some(k => this._pressedKeys.has(k));
            this.controller.setActionState(name, this, isActive);
        }
    }

    isKeyPressed(keyCode) {
        return this._pressedKeys.has(keyCode);
    }
}

// CONCRETE STRATEGY: плагин мыши
class MousePlugin extends InputPlugin {
    constructor() {
        super();
        this._pressedButtons = new Set(); // Исправлено на множественное число
        this._onMouseDown = this._handleMouseDown.bind(this);
        this._onMouseUp = this._handleMouseUp.bind(this); // Название функции
    }

    init(controller, target) {
        super.init(controller, target);
        this.target.addEventListener('mousedown', this._onMouseDown);
        this.target.addEventListener('mouseup', this._onMouseUp);
    }

    destroy() {
        if (this.target) {
            this.target.removeEventListener('mousedown', this._onMouseDown);
            this.target.removeEventListener('mouseup', this._onMouseUp); // Исправлено tihs на this
        }
        this._pressedButtons.clear();
    }

    _handleMouseDown(e) {
        const buttonCode = e.button; // 0 - левая, 1 - средняя, 2 - правая
        if (this._pressedButtons.has(buttonCode)) return;

        this._pressedButtons.add(buttonCode);
        this._updateActions();
    }

    _handleMouseUp(e) { // Переименовано из _handleKeyUp
        const buttonCode = e.button;
        if (!this._pressedButtons.has(buttonCode)) return;

        this._pressedButtons.delete(buttonCode);
        this._updateActions();
    }

    _updateActions() {
        for (const [name, action] of this.controller._actions) {
            if (!action.config || !action.config.mouseButtons) continue;
            const isActive = action.config.mouseButtons.some(b => this._pressedButtons.has(b));
            this.controller.setActionState(name, this, isActive);
        }
    }

    isKeyPressed(keyCode) {
        // Вернул в одну строку, чтобы избежать ловушки автоматической точки с запятой
        return this._pressedButtons.has(keyCode); 
    }
}

// Context, сам контроллер
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

        this._onWinFocus = () => { this.focused = true; };
        this._onWinBlur = () => {
            this.focused = false;
            this._actions.forEach((action, name) => {
                action.activePlugins.clear();
                this.setActionState(name, null, false);
            });
     
            // Сбрасываем состояния у всех плагинов
            this._plugins.forEach(p => { 
                if (p._pressedKeys) p._pressedKeys.clear(); 
                if (p._pressedButtons) p._pressedButtons.clear(); // Добавили очистку для мыши
            });
        };

        if (actionsToBind) this.bindActions(actionsToBind);
        if (target) this.attach(target);
    }

    bindActions(actionsToBind) {
        if (!actionsToBind || typeof actionsToBind !== 'object') return;

        Object.keys(actionsToBind).forEach((actionName) => {
            const config = actionsToBind[actionName] || {};

            if (!this._actions.has(actionName)) {
                this._actions.set(actionName, { 
                    config: {}, 
                    enabled: true,
                    active: false,
                    activePlugins: new Set() 
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
    setActionState(actionName, plugin, isActive) {
        const action = this._actions.get(actionName);
        if (!action) return;

        const wasActive = action.active;

        if (isActive) {
            action.activePlugins.add(plugin);
        } else {
            action.activePlugins.delete(plugin);
        }

        action.active = action.activePlugins.size > 0;

        if (wasActive !== action.active) {
            if (this.enabled && this.focused && action.enabled) {
                this._dispatch(action.active ? ACTION_ACTIVATED : ACTION_DEACTIVATED, actionName);
            }
        }

        //if (action.active !== isActive) {
          //  action.active = isActive;
            //if (this.enabled && this.focused && action.enabled) {
              //  this._dispatch(isActive ? ACTION_ACTIVATED : ACTION_DEACTIVATED, actionName);
            //}
        //}
    }

    attach(target, dontEnable) {
        if (!target || typeof target.addEventListener !== 'function') return;
        if (this._target) this.detach();

        this._target = target;
        this._plugins.forEach(p => p.init(this, target));

        global.addEventListener('focus', this._onWinFocus);
        global.addEventListener('blur', this._onWinBlur);

        if (!dontEnable) this.enabled = true;
    }

    detach() {
        if (!this._target) return;

        this._plugins.forEach(p => p.destroy());
        global.removeEventListener('focus', this._onWinFocus);
        global.removeEventListener('blur', this._onWinBlur);

        this._target = null;
        this.enabled = false; 
        this._actions.forEach(a => {
            if (a.activePlugins)
                a.activePlugins.clear();
            a.active = false;
        });
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
        
        for (const plugin of this._plugins) {
            if (plugin.isKeyPressed(keyCode)) {
                return true;
            }
        }
        return false;
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
global.MousePlugin = MousePlugin;
})(typeof window !== 'undefined' ? window : this);