import EventEmitter from "eventemitter3";

/**
 * The AdvanceEventEmitter extends event emitter 3's functionality
 * to check for max executions (due to circular loops) and adds an ability to 
 * fire a delayed event.
 */
export default class AdvanceEventEmitter extends EventEmitter {
    /**
     * Creates an instance of AdvanceEventEmitter.
     */
    constructor() {
        super();
        this._eventTree = {};

        /**
         * Maximum number of events fired for the requester before events stop.
         * @type {number}
         */
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

    /**
     * 
     * 
     * @param {string} eventName 
     * @param {number} ms 
     * @param {string} requesterId 
     * @param {function} callback 
     */
    onDelay(eventName, ms, requesterId, callback) {
        super.on(
            eventName,
            () => {
                this._waitForFinalEvent(
                    () => {
                        if (this._shouldTrigger(requesterId)) {
                            callback(requesterId, this);
                        }
                    },
                    ms,
                    "on.delay." + eventName
                );
            },
            requesterId
        );
    }

    /**
     * 
     * 
     * @param {string} eventName 
     * @param {string} requesterId 
     * @param {function} callback 
     */
    on(eventName, requesterId, callback) {
        super.on(
            eventName,
            () => {
                if (this._shouldTrigger(requesterId)) {
                    callback(requesterId, this);
                }
            },
            requesterId
        );
    }

    /**
     * 
     * 
     * @param {string} requesterId 
     * @returns {boolean}
     */
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
