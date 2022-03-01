import * as angular from 'angular'
import * as _ from 'lodash';

var mms = angular.module('mms');

export class CacheService {
    public cache = {};
    constructor() {}

    get(key) {
        var realkey = key;
        if (angular.isArray(key)) {
            realkey = this.makeKey(key);
        }
        if (this.cache.hasOwnProperty(realkey)) {
            var realval = this.cache[realkey];
            if (angular.isString(realval)) {
                return this.get(realval);
            }
            return realval;
        }
        return null;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#getElements
     * @methodOf mms.CacheService
     *
     * @description
     * Get the latest elements in the cache with the parameter workspace ID
     *
     * @param {string} projectId The mms project id
     * @param {string} refId The branch/tag id
     * @returns {Object} Value if found, null if not found
     */
    getLatestElements(projectId, refId) {
        var latestElements = [];
        for (var key in this.cache) {
            if (!this.cache.hasOwnProperty(key)) {
                continue;
            }
            if (key.indexOf('|latest') >= 0 && key.indexOf('element|') >= 0 && key.indexOf('|edit') < 0 &&
                key.indexOf('deleted') < 0 && key.indexOf(refId) >= 0 && key.indexOf(projectId) >= 0) {
                var val = this.get(key);
                if (val) {
                    latestElements.push(val);
                }
            }
        }
        return latestElements;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#put
     * @methodOf mms.CacheService
     *
     * @description
     * Put value into cache
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @param {Object} value The value to save
     * @param {boolean} [merge=false] Whether to replace the value or do a merge if value already exists
     * @returns {Object} the original value
     */
    put(key, value, merge?) {
        var m = !merge ? false : merge;
        var realkey = key;
        if (angular.isArray(key)) {
            realkey = this.makeKey(key);
        }
        var val = this.get(realkey);
        if (val && m && angular.isObject(value)) {
            _.merge(val, value, function(a,b,id) {
                if ((id === '_contents' || id === 'specification') && b && b.type === 'Expression') {
                    return b;
                }
                if (angular.isArray(a) && angular.isArray(b) && b.length < a.length) {
                    a.length = 0;
                    Array.prototype.push.apply(a, b);
                    return a;
                }
                if (id === '_displayedElementIds' && b) {
                    return b;
                }
                return undefined;
            });
        } else {
            if (!angular.isString(val) || angular.isString(value)) {
                this.cache[realkey] = value;
            } else {
                realkey = val;
                while (angular.isString(this.cache[realkey])) {
                    realkey = this.cache[realkey];
                }
                this.cache[realkey] = value;
            }
            val = value;
        }
        return val;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#remove
     * @methodOf mms.CacheService
     *
     * @description
     * Remove value from cache and return it
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {Object} value that was removed or undefined
     */
    remove(key) {
        var realkey = key;
        if (angular.isArray(key)) {
            realkey = this.makeKey(key);
        }
        if (!this.cache.hasOwnProperty(realkey)) {
            return null;
        }
        var result = this.cache[realkey];
        delete this.cache[realkey];
        if (angular.isString(result)) {
            return this.remove(result);
        }
        return result;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#exists
     * @methodOf mms.CacheService
     *
     * @description
     * Check if value exists with a specific key
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {boolean} whether value exists for key
     */
    exists(key) {
        var realkey = key;
        if (angular.isArray(key)) {
            realkey = this.makeKey(key);
        }
        if (!this.cache.hasOwnProperty(realkey)) {
            return false;
        }
        var val = this.cache[realkey];
        if (angular.isObject(val)) {
            return true;
        }
        if (angular.isString(val)) {
            return this.exists(val);
        }
        return false;
    };

    makeKey(keys) {
        return keys.join('|');
    };

    reset() {
        var keys = Object.keys(this.cache);
        for (var i = 0; i < keys.length; i++) {
            delete this.cache[keys[i]];
        }
    };

}

CacheService.$inject = [];

mms.service('CacheService', CacheService);