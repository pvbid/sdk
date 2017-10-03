import _ from "lodash";

export default class User {
    constructor(userData) {
        this._data = userData;
        this._is_impersonating = false;
    }

    get id() {
        return this._data.id;
    }

    get accountId() {
        return this._data.account_id;
    }

    get name() {
        return this._data.name;
    }

    get email() {
        return this._data.email;
    }

    get timezone() {
        return this._data.timezone;
    }

    roles() {
        return this._data.roles;
    }

    permissions() {
        return this._data.permissions;
    }

    can(permission) {
        var userPermissions = this.permissions();
        return userPermissions.indexOf(permission) >= 0;
    }

    hasRole(roles) {
        roles = roles.split(",");
        var hasRole = false;

        var userRoles = this.roles();
        for (var i = 0; i < roles.length; i++) {
            if (_.includes(userRoles, roles[i].trim())) {
                hasRole = true;
                break;
            }
        }

        return hasRole;
    }

    isImpersonating() {
        return this._is_impersonating;
    }
}
