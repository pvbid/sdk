import EventEmitter from "eventemitter3";

export default class AdvanceEventEmitter extends EventEmitter {
    constructor() {
        super();
        this._eventTree = {};
        this.maxEvents = 25;

        this._waitForFinalEvent = (function() {
            var timers = {};
            return function(callback, ms, uniqueId) {
                if (!uniqueId) {
                    uniqueId = "unique.id";
                }
                if (timers[uniqueId]) {
                    clearTimeout(timers[uniqueId]);
                }
                timers[uniqueId] = setTimeout(callback, ms);
            };
        })();
    }

    onDelay(eventName, ms, requesterId, callback) {
        super.on(eventName, () => {
            this._waitForFinalEvent(
                () => {
                    if (this._shouldTrigger(requesterId)) {
                        callback(requesterId);
                    }
                },
                ms,
                "on.delay." + eventName
            );
        });
    }

    on(eventName, requesterId, callback) {
        super.on(eventName, () => {
            if (this._shouldTrigger(requesterId)) {
                callback(requesterId);
            }
        });
    }

    _shouldTrigger(requesterId) {
        if (this._eventTree[requesterId]) {
            if (this._eventTree[requesterId] <= this.maxEvents) {
                this._eventTree[requesterId]++;
                return true;
            } else {
                // console.log("Stopping loop. Max event threshold reached.  ", this.type);
                return false;
            }
        } else this._eventTree[requesterId] = 1;

        return true;
    }
}
