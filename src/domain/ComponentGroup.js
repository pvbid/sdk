import BidEntity from "./BidEntity";

/**
 * Component Group Class
 * 
 * @class ComponentGroup
 */
export default class ComponentGroup extends BidEntity {
    /**
     * Creates an instance of ComponentGroup.
     * @param {object} componentGroupData 
     * @param {Bid} bid 
     */
    constructor(componentGroupData, bid) {
        super();
        /**
         * Reference to the bid that the component group belongs to.
         * @type {Bid}
         */
        this.bid = bid;

        /**
         * Internal data for bid entity.
         * @type {object}
         */
        this._data = componentGroupData;
    }

    /**
     * Config Getter.
     * @type {object}
     */
    get config() {
        return this._data.config;
    }

    /**
     * Retrieves the bid components that belong to the component group
     *
     * @param {boolean} topLevelOnly get only the top level components in the group
     * @return {object} components keyed by their reference
     */
    getComponents(topLevelOnly = false) {
        const components = {};
        Object.keys(this.bid.entities.components()).forEach(key => {
            const component = this.bid.entities.components(key);
            if (component.componentGroupId !== this.id) return;
            if (topLevelOnly && !component.isParent()) return;
            components[key] = component;
        });
        return components;
    }

    /**
     * Flags the component group and corresponding bid as dirty and to be saved.
     */
    dirty() {
        this.bid.dirty();
        super.dirty();
    }
}
