class BidEventService extends EventEmitter {
    constructor() {
        super();
        this._eventTree = {};
        this._waitForFinalEvent = (function() {
            var timers = {};
            return function(callback, ms, uniqueId) {
                if (timers["eventer.engine.finished"]) {
                    clearTimeout(timers["eventer.engine.finished"]);
                }
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

    shouldTriggerEvent(entityEvent, originatingEvent) {
        var eventId = originatingEvent ? originatingEvent + "=>" + entityEvent : entityEvent;
        var isBidEvent = eventId.indexOf("bid.bid") >= 0 ? true : false;
        var threshold = isBidEvent ? 10 : 25;

        if (this._eventTree[eventId]) {
            if (this._eventTree[eventId] <= threshold) {
                this._eventTree[eventId]++;
                return true;
            } else {
                if (!isBidEvent) {
                    toastr.warning("Circular dependency source: " + eventId);
                    console.warn("Circular dependency source: " + eventId);
                }
                console.log("Stopping loop. Threshold: " + threshold);
                return false;
            }
        } else this._eventTree[eventId] = 1;

        return true;
    }

    trigger(entityEvent, previousEvent) {
        if (this.shouldTriggerEvent(entityEvent, previousEvent)) {
            this.emit(entityEvent);
        }

        this._waitForFinalEvent(
            () => {
                if (this.shouldTriggerEvent(entityEvent, previousEvent)) {
                    this.emit("calculations.finished");
                }

                this._waitForFinalEvent(
                    () => {
                        var individual = 0,
                            total = 0;
                        each(this._eventTree, function(value, key) {
                            individual += 1;
                            total += value;
                        });
                        console.log("Individual: " + individual, "Total: " + total);
                        this._eventTree = {}; //clear event tree.

                        this.emit("engine.finished");
                    },
                    300,
                    "eventer.engine.finished"
                );
            },
            100,
            "eventer.events.finished"
        );
    }

    on(eventName, callback, entityId) {
        callback(entityId, eventName);
    }

    onDelay(eventName, callback, entityId, delayId) {
        var that = this;
        this.on(eventName, function() {
            that._waitForFinalEvent(
                function() {
                    //console.log('delay:',eventName, delayId);
                    callback(entityId, eventName);
                },
                5,
                "on.delay." + delayId
            );
        });
    }

    /**
 * Resets Event Listeners
 */
    reset() {
        this.removeAllListeners();
        this._eventTree = {};
    }
}
