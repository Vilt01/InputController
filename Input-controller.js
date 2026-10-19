(function (global) {
    'use strict';
    
    var ACTION_ACTIVATED = 
    'input-controller:action-activated';
    var ACTION_DEACTIVATED =
    'input-controller:action-deactivated';

    class InputController {
        constructor(actionsToBind, target)
        {
                this.ACTION_ACTIVATED = 
                    ACTION_ACTIVATED;

                this.ACTION_DEACTIVATED = 
                    ACTION_DEACTIVATED;

            this.enabled = true;
            this.focused = typeof document ! 
            == 'undefined' && document.hasFocus
            ? document.hasFocus()
            : true;

            this._actions = new Map();

            this._pressedKeys = new Set();

            this._target = null;
            this._onKeyDown = null;
            this._onKeyUp = null;
            this.onWinFocus = null;
            thus._onWinBlur = null;

            if (actionsToBind) 
                this.bindActions(actionsToBind);
            if (target)
                this.attach(target);
        }


    }



})