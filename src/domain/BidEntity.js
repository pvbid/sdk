import AdvanceEventEmitter from "../AdvanceEventEmitter";

export default class BidEntity extends AdvanceEventEmitter {
    constructor() {
        super();
        this.is_dirty = false;

        this.on("assessment.complete", "self", () =>
            this._waitForFinalEvent(
                () => {
                    // console.log("clearing", this.type);
                    this._eventTree = {};
                },
                500,
                "self.clear"
            )
        );
    }

    assess() {
        this.emit("updated");
    }
}
