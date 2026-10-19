// Оборачиваем в функцию, чтобы переменные не выходили в глобальную область 
// Строковые значения событий вынесены в константы 
(function (global) { 'use strict';
const ACTION_ACTIVATED = 'input-controller:action-activated';
const ACTION_DEACTIVATED = 'input-controller:action-deactivated';

class InputController {
    constructor(actionsToBind, target) {
        // Публичные константы
        this.ACTION_ACTIVATED = ACTION_ACTIVATED;
        this.ACTION_DEACTIVATED = ACTION_DEACTIVATED;

        // Публичное свойство
        this.enabled = true;
        
        // Проверка фокуса у окна
        this.focused = typeof document !== 'undefined' && typeof document.hasFocus === 'function'
            ? document.hasFocus()
            : true;

        // Приватные хранилища
        this._actions = new Map(); // Хранятся действия (Map: имя -> объект)
        this._pressedKeys = new Set(); // Хранятся физически нажатые кнопки (Set: уникальные коды)

        // Сохраняем ссылки на функции-обработчики (для метода detach)
        this._target = null;
        this._onKeyDown = null;
        this._onKeyUp = null;
        this._onWinFocus = null;
        this._onWinBlur = null;

        // Если при создании класса передали действия и элемент — сразу инициализируем
        if (actionsToBind) {
            this.bindActions(actionsToBind);
        }
        if (target) {
            this.attach(target);
        }
    }

    // Добавление действий в контроллер
    bindActions(actionsToBind) {
        if (!actionsToBind || typeof actionsToBind !== 'object') return;

        Object.keys(actionsToBind).forEach((actionName) => {
            const config = actionsToBind[actionName] || {};

            // Если действия нет в Map - создаем для него запись
            if (!this._actions.has(actionName)) {
                this._actions.set(actionName, {
                    keys: new Set(), // Set автоматически уберет дубликаты клавиш
                    enabled: true,   // Включено ли действие
                    active: false    // Нажато ли действие прямо сейчас
                });
            }
            const action = this._actions.get(actionName);

            // Добавляем клавиши
            if (Array.isArray(config.keys)) {
                config.keys.forEach(keyCode => action.keys.add(keyCode));
            }

            // Если в конфиге указано enabled: false — выключаем действие
            if (config.enabled !== undefined) {
                action.enabled = Boolean(config.enabled);
            }
        });
    }

    // Включает генерацию событий для конкретной активности
    enableAction(actionName) {
        const action = this._actions.get(actionName);
        if (action) {
            action.enabled = true;
        }
    }

    // Деактивирует активность (события перестают генерироваться)
    disableAction(actionName) {
        const action = this._actions.get(actionName);
        if (!action) return;

        action.enabled = false;
        action.active = false; // Принудительно сбрасываем нажатие
    }

    // Нацеливает контроллер на DOM-элемент (вешает слушатели)
    attach(target, dontEnable) {
        if (!target || typeof target.addEventListener !== 'function') return;

        // Если контроллер уже привязан к чему-то, сначала отвязываем
        if (this._target) this.detach();

        // Создаем функции-обработчики
        this._onKeyDown = (e) => this._handleKeyDown(e);
        this._onKeyUp = (e) => this._handleKeyUp(e);
        
        this._onWinFocus = () => { this.focused = true; };
        this._onWinBlur = () => {
            this.focused = false;
            // Тихо чистим состояние при потере фокуса
            this._pressedKeys.clear(); 
            this._actions.forEach(action => action.active = false);
        };

        // Вешаем слушатели на переданный DOM-элемент и на окно (для фокуса)
        target.addEventListener('keydown', this._onKeyDown);
        target.addEventListener('keyup', this._onKeyUp);
        global.addEventListener('focus', this._onWinFocus);
        global.addEventListener('blur', this._onWinBlur);

        this._target = target;

        // Если dontEnable не передан — включаем контроллер
        if (!dontEnable) this.enabled = true;
    }

    // Отцепляет контроллер от активного DOM-элемента
    detach() {
        if (!this._target) return;

        // Снимаем все слушатели
        this._target.removeEventListener('keydown', this._onKeyDown);
        this._target.removeEventListener('keyup', this._onKeyUp);
        global.removeEventListener('focus', this._onWinFocus);
        global.removeEventListener('blur', this._onWinBlur);

        this._target = null;
        this._onKeyDown = this._onKeyUp = this._onWinFocus = this._onWinBlur = null;
        
        this.enabled = false;
        this._pressedKeys.clear();
        this._actions.forEach(a => a.active = false);
    }

    // Проверяет, активирована ли переданная активность
    isActionActive(actionName) {
        // Если контроллер или окно выключены — всегда false
        if (!this.enabled || !this.focused) return false;

        const action = this._actions.get(actionName);
        // Если действия нет или оно выключено — тоже false
        if (!action || !action.enabled) return false;

        return action.active;
    }

    // Проверяет, нажата ли конкретная физическая кнопка (по коду)
    isKeyPressed(keyCode) {
        if (!this.enabled || !this.focused) return false;
        return this._pressedKeys.has(keyCode);
    }

    // Нажатие клавиши
    _handleKeyDown(e) {
        const code = e.keyCode || e.which;
        if (!code) return;
        
        // Игнорируем автоповтор браузера (когда клавишу зажали)
        if (this._pressedKeys.has(code)) return; 

        this._pressedKeys.add(code);
        this._syncActionsForCode(code);
    }

    // Отпускание клавиши
    _handleKeyUp(e) {
        const code = e.keyCode || e.which;
        if (!code) return;
        if (!this._pressedKeys.has(code)) return;

        this._pressedKeys.delete(code);
        this._syncActionsForCode(code);
    }

    // Синхронизация состояний действий
    _syncActionsForCode(code) {
        for (const [name, action] of this._actions) {
            // Если нажатая клавиша не относится к этому действию — пропускаем
            if (!action.keys.has(code)) continue;

            // Проверяем, нажата ли ХОТЯ БЫ ОДНА клавиша для этого действия
            let isPhysicallyActive = false;
            for (const k of action.keys) {
                if (this._pressedKeys.has(k)) {
                    isPhysicallyActive = true;
                    break;
                }
            }

            // Если состояние изменилось
            if (action.active !== isPhysicallyActive) {
                action.active = isPhysicallyActive;
                
                // Отправляем события только если всё включено
                if (this.enabled && this.focused && action.enabled) {
                    this._dispatch(isPhysicallyActive ? ACTION_ACTIVATED : ACTION_DEACTIVATED, name);
                }
            }
        }
    }

    // Отправка кастомного события
    _dispatch(eventType, actionName) {
        if (!this._target) return;
        
        const event = new CustomEvent(eventType, {
            detail: actionName, // Передаем название активности
            bubbles: true
        });
        this._target.dispatchEvent(event);
    }
}

// Экспортируем класс наружу
global.InputController = 
InputController;
})(typeof window !== 'undefined' ? 
    window : this);