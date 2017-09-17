import Helpers from "../../utils/Helpers";

export default class IndicativePricingHelper {
    constructor(bid) {
        this.bid = bid;
    }

    /**
     * Gets the margin of error for indicative pricing.
     * @return {int}
     */
    getMarginOfError() {
        if (_.isUndefined(this._marginOfErrorMetric) || _.isNull(this._marginOfErrorMetric)) {
            this._marginOfErrorMetric = _.find(this.bid.entities.metrics(), function(el) {
                return el.title.toLowerCase() === "margin of error";
            });
            this._marginOfErrorMetric = _.isUndefined(this._marginOfErrorMetric)
                ? {
                      value: 0
                  }
                : this._marginOfErrorMetric;

            return this._marginOfErrorMetric ? 0 : parseFloat(this._marginOfErrorMetric.value);
        } else return parseFloat(this._marginOfErrorMetric.value);
    }

    /**
     * Gets indicative price
     * @param {number} value The value to assess.
     * @param {boolean} isLow The lower or upper bounds (low | high)
     * @return {number}
     */
    getIndicativePrice(value, isLow) {
        var marginOfError = this.getMarginOfError();
        if (marginOfError > 0) {
            marginOfError = marginOfError / 100;
            return isLow ? value * (1 - marginOfError) : value * (1 + marginOfError);
        } else return value;
    }

    /**
     * Determines if indicative pricing is enabled.
     * @return {boolean}
     */
    isIndicativePricing() {
        if (_.isUndefined(this._indicativePricingField) || _.isNull(this._indicativePricingField)) {
            this._indicativePricingField = _.find(this.bid.entities.fields(), function(el) {
                return el.title.toLowerCase() === "indicative pricing";
            });
            this._indicativePricingField = _.isUndefined(this._indicativePricingField)
                ? {
                      value: false
                  }
                : this._indicativePricingField;

            return Helpers.confirmNumber(this._indicativePricingField.value, false, true);
        } else return Helpers.confirmNumber(this._indicativePricingField.value, false, true);
    }
}
