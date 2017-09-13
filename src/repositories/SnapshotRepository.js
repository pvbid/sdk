import CacheRepository from "./CacheRepository";

/**
 * 
 */
export default class SnapshotRepository extends CacheRepository {
    constructor(config) {
        super(`${config.base_uri}`, "snapshot", "snapshots", config);
    }

    async findById(bidId, snapshotId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/snapshots/`;
        return super.findById(snapshotId);
    }

    async get(bidId, params, forceReload) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/snapshots/`;

        return super.get(params, forceReload);
    }

    async create(bidId, snapshotObject) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/snapshots/`;
        return super.create(snapshotObject);
    }

    async delete(bidId, snapshotId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/snapshots/`;
        return super.delete(snapshotId);
    }

    async recover(bidId, snapshotId) {
        this.endpoint = `${this.config.base_uri}/bids/${bidId}/snapshots/${snapshotId}/recover`;

        try {
            return this.http.post(this.endpoint);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

/*
REPOServices.factory("SnapshotRepository", function(API_URL, $q, $http) {
    var _keyedSnapshots = {},
        _isLoaded = false,
        _bidId;

    function load(bidId, forceReload) {
        var deferred = $q.defer();

        if (!_isLoaded || bidId !== _bidId || forceReload) {
            $http
                .get(API_URL + "bids/" + bidId + "/snapshots")
                .then(function(response) {
                    _keyedSnapshots = keyBy(response.data.data.snapshots, "id");
                    _bidId = bidId;
                    _isLoaded = true;

                    deferred.resolve(_keyedSnapshots);
                })
                .catch(function(errorResponse) {
                    console.log("snapshots failed to load.", errorResponse);
                    deferred.reject(errorResponse);
                });
        } else deferred.resolve(_keyedSnapshots);

        return deferred.promise;
    }

    function list() {
        return _keyedSnapshots;
    }

    function get(id) {
        if (!isUndefined(_keyedSnapshots[id])) {
            return _keyedSnapshots[id];
        } else return null;
    }

    function save(snapshot, forceSave) {
        var deferred = $q.defer();
        if (snapshot.isDirty() || forceSave) {
            snapshot.id = isUndefined(snapshot.id) ? null : snapshot.id;

            $http
                .put(API_URL + "bids/" + snapshot.bid_id + "/snapshots/" + snapshot.id, snapshot)
                .then(deferred.resolve, deferred.reject);
        } else
            deferred.resolve({
                status: "success",
                data: {
                    snapshot: snapshot
                }
            });

        return deferred.promise;
    }

    function createSnapshot(bidId, title, description) {
        var deferred = $q.defer();

        var snapshot = {
            bid_id: bidId,
            title: title,
            description: description
        };

        $http.post(API_URL + "bids/" + snapshot.bid_id + "/snapshots", snapshot).then(function(response) {
            _keyedSnapshots[response.data.data.snapshot.id] = response.data.data.snapshot;
            deferred.resolve(response.data.data.snapshot);
        }, deferred.reject);

        return deferred.promise;
    }

    function recover(snapshot) {
        var deferred = $q.defer();

        $http
            .post(API_URL + "bids/" + snapshot.bid_id + "/snapshots/" + snapshot.id + "/recover", {})
            .then(function(response) {
                load(snapshot.bid_id, true).then(deferred.resolve, deferred.reject);
            }, deferred.reject);

        return deferred.promise;
    }

    function deleteSnapshot(snapshot) {
        var deferred = $q.defer();

        $http.delete(API_URL + "bids/" + snapshot.bid_id + "/snapshots/" + snapshot.id, {}).then(function(response) {
            delete _keyedSnapshots[snapshot.id];
            deferred.resolve();
        }, deferred.reject);

        return deferred.promise;
    }

    return {
        load: load,
        list: list,
        get: get,
        save: save,
        create: createSnapshot,
        delete: deleteSnapshot,
        recover: recover
    };
});

*/
