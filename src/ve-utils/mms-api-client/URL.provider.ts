import * as angular from 'angular'

import { PermissionCache } from '@ve-utils/mms-api-client/Permissions.service'

import { veUtils } from '@ve-utils'

import { VeConfig } from '@ve-types/config'
import {
    ArtifactsRequest,
    AuthResponse,
    BasicResponse,
    ElementsRequest,
    QueryParams,
    RequestObject,
    ViewsRequest,
} from '@ve-types/mms'
import { VePromiseReason } from '@ve-types/view-editor'

export class URLServiceProvider implements angular.IServiceProvider {
    readonly basePath: string = '/api'
    readonly apiUrl: string = 'localhost:8080'
    private veConfig: VeConfig = window.__env

    constructor() {
        if (this.veConfig.apiUrl) {
            this.apiUrl = this.veConfig.apiUrl
        }
        if (this.veConfig.basePath) {
            this.basePath = this.veConfig.basePath
        }
    }

    $get() {
        return new URLService(this.basePath, this.apiUrl)
    }
}

veUtils.provider('URLService', URLServiceProvider)
/**
 * @ngdoc service
 * @name veUtils/URLService
 *
 * @description
 * This utility service gives back url paths for use in other services in communicating
 * with the server, arguments like projectId, refId, commitId are expected to be strings and
 * not null or undefined. This service is usually called by higher level services and
 * should rarely be used directly by applications.
 *
 * To configure the base url of the mms server, you can use the URLServiceProvider
 * in your application module's config. By default, the basePath is '/api', but is
 * effectively '/' relative to the service layer due to the rewrite rule.
 *  <pre>
        angular.module('myApp', ['ve-components'])
        .config(function(URLServiceProvider) {
            URLServiceProvider.setBasePath('https://url/context/path');
        });
 </pre>
 * (You may run into problems like cross origin security policy that prevents it from
 *  actually getting the resources from a different server, solution TBD)
 */
export class URLService {
    readonly root: string
    readonly url: URL
    private token: string

    constructor(private basePath: string, private apiUrl: string) {
        this.root = this.apiUrl + this.basePath
        this.token = window.localStorage.getItem('token')
        this.url = new window.URL(this.apiUrl, this.basePath)
    }

    getRoot(): string {
        return this.root
    }

    getUrl(): URL {
        return Object.assign({}, this.url)
    }

    setToken(t: string) {
        this.token = t
    }

    getAuthorizationHeaderValue(): string {
        return 'Bearer ' + this.token
    }

    getAuthorizationHeader(headers: { [name: string]: string }): {
        [name: string]: string
    } {
        if (!this.token) {
            return headers
        }
        if (!headers) {
            headers = this.getHeaders()
        }
        headers.Authorization = this.getAuthorizationHeaderValue()
        return headers
    }

    getMmsServer() {
        return this.apiUrl
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#setHeader
     * @methodOf veUtils/URLService
     *
     * @description
     * Adds generates Default Headers using this.token
     *
     * @returns {object} The HTTP header format
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token,
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#isTimestamp
     * @methodOf veUtils/URLService
     *
     * @description
     * self explanatory
     *
     * @param {string} version A version string or timestamp
     * @returns {boolean} Returns true if the string has '-' in it
     */
    isTimestamp(version?: string): boolean {
        if (!version) return false
        else if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+]?-\d{4}$/.test(
                version.trim()
            )
        )
            return true
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getMmsVersionURL
     * @methodOf veUtils/URLService
     *
     * @description
     * self explanatory
     *
     * @returns {object} Returns object with mmsversion
     */
    getMmsVersionURL() {
        return `${this.root}/mmsversion`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getSiteDashboardURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the path for a site dashboard.
     *
     * @param {string} site Site name (not title!).
     * @returns {string} The path for site dashboard.
     */
    getSiteDashboardURL(site: string): string {
        return `${this.root}/orgs/${site}/projects/${site}/branches/master/elements`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getExportHtmlUrl
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets url that to convert HTML to PDF or Word
     * @param {string} projectId id of the project
     * @param {string} refId id of the ref
     * @returns {string} The url
     */
    getExportHtmlUrl(projectId: string, refId: string): string {
        return `${this.root}/projects/${projectId}/refs/${refId}/convert`
    }

    getAuthenticationUrl(): string {
        return `${this.root}/authentication`
    }

    getPermissionsLookupURL(): string {
        return `${this.root}/permissions`
    }

    getOrgURL(orgId: string): string {
        return `${this.root}/orgs/${orgId}`
    }

    getOrgsURL(): string {
        return `${this.root}/orgs`
    }

    getProjectsURL(orgId?: string): string {
        if (orgId) return `${this.root}/projects?orgId=${orgId}`
        return `${this.root}/projects`
    }

    getProjectURL(projectId: string): string {
        return `${this.root}/projects/${projectId}`
    }

    getProjectMountsURL(projectId: string, refId: string): string {
        return `${this.root}/projects/${projectId}/refs/${refId}/mounts`
    }

    getRefsURL(projectId: string): string {
        return `${this.root}/projects/${projectId}/refs`
    }

    getRefURL(projectId: string, refId: string): string {
        return `${this.root}/projects/${projectId}/refs/${refId}`
    }

    getRefHistoryURL(projectId: string, refId: string, timestamp?: string) {
        if (timestamp !== '' && this.isTimestamp(timestamp)) {
            return `${this.root}/projects/${projectId}/refs/${refId}/commits&maxTimestamp=${timestamp}&limit=1`
        }
        return `${this.root}/projects/${projectId}/refs/${refId}/commits`
    }

    getGroupsURL(projectId: string, refId: string): string {
        return `${this.root}/projects/${projectId}/refs/${refId}/groups`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getProjectDocumentsURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for all documents in a ref
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url
     */
    getProjectDocumentsURL(reqOb: RequestObject): string {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/documents`
        return this.addExtended(
            this.addVersion(r, reqOb.commitId),
            reqOb.extended
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getImageURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for querying an image url
     * (this is not the actual image path)
     *
     * @returns {string} The path for image url queries.
     */
    getImageURL(reqOb: ElementsRequest): string {
        const id = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${id}`
        return this.addVersion(r, reqOb.commitId)
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getElementURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the path for an element
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementURL(reqOb: ElementsRequest): string {
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}`
        return this.addExtended(
            this.addVersion(r, reqOb.commitId),
            reqOb.extended
        )
    }

    // getViewElementIdsURL (reqOb: RequestObject): string {
    //     const r =
    //         this.root +
    //         '/projects/' +
    //         reqOb.projectId +
    //         '/refs/' +
    //         reqOb.refId +
    //         '/elements/' +
    //         reqOb.elementId +
    //         '/cfids'
    //     return r
    // }
    //
    // getViewsURL (reqOb: RequestObject): string {
    //     const r =
    //         this.root +
    //         '/projects/' +
    //         reqOb.projectId +
    //         '/refs/' +
    //         reqOb.refId +
    //         '/views/' +
    //         reqOb.elementId
    //     return r
    // }

    getOwnedElementURL(reqOb: ElementsRequest): string {
        let recurseString = 'recurse=true'
        if (reqOb.depth) recurseString = `depth=${reqOb.depth}`
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        let r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}`
        r = this.addVersion(r, reqOb.commitId)
        if (r.indexOf('?') > 0) {
            r += '&' + recurseString
        } else {
            r += '?' + recurseString
        }
        return this.addExtended(r, reqOb.extended)
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getElementHistoryURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url to query for element history
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementHistoryURL(reqOb: ElementsRequest): string {
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        return `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}/commits`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getPostElementsURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the path for posting element changes.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPostElementsURL(reqOb: ViewsRequest): string {
        return this.addExtended(
            this.addChildViews(
                `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/views`,
                reqOb.returnChildViews
            ),
            reqOb.extended
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getPutElementsURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the path for getting multiple elements (using put with body).
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPutElementsURL(reqOb: RequestObject): string {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/views`
        return this.addExtended(
            this.addVersion(r, reqOb.commitId),
            reqOb.extended
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#getElementSearchURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for element keyword search.
     *
     * @param {RequestObject} reqOb object with keys as described in ElementService.
     * @param {QueryParams} queryParams provide optional query parameters
     * @returns {string} The post elements url.
     */
    getElementSearchURL(reqOb: RequestObject, queryParams?: QueryParams) {
        let r: string
        let urlParams = ''
        if (queryParams) {
            urlParams = this._createUrlParamString(queryParams)
        }
        if (urlParams !== '') {
            r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/search${urlParams}`
        } else {
            r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/search`
        }
        return this.addExtended(r, true)
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactURL(reqOb: ArtifactsRequest, artifactExtension: string) {
        const ext =
            artifactExtension !== undefined
                ? artifactExtension
                : reqOb.artifactExtension
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}/${ext}`
        return this.addToken(this.addVersion(r, reqOb.commitId))
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactEmbedURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url without added this.token for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactEmbedURL(reqOb: ArtifactsRequest, artifactExtension: string) {
        const ext =
            artifactExtension !== undefined ? artifactExtension : 'undefined'
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}/${ext}`
        return this.addVersion(r, reqOb.commitId)
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getPutArtifactsURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getPutArtifactsURL(reqOb: ElementsRequest): string {
        const elementId = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${elementId}`
        return this.addVersion(r, reqOb.commitId)
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactHistoryURL
     * @methodOf veUtils/URLService
     *
     * @description
     * Gets the url for an artifact commit history
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getArtifactHistoryURL(reqOb: ElementsRequest): string {
        return this.getElementHistoryURL(reqOb)
    }

    getCheckTokenURL() {
        return `${this.root}/checkAuth` //TODO remove when server returns 404
    }

    getPersonURL(username: string): string {
        return `${this.root}/users?user=${username}`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#handleHttpStatus
     * @methodOf veUtils/URLService
     *
     * @description
     * Utility for setting the state of a deferred object based on the status
     * of http error. The arguments are the same as angular's $http error
     * callback
     *
     * @param {Object} data The http response
     * @param {number} status Http return status
     * @param {Object} header Http return header
     * @param {Object} config Http config
     * @param {Object} deferred A deferred object that would be rejected
     *      with this object based on the http status:
     *      ```
     *          {
     *              status: status,
     *              message: http status message,
     *              data: data
     *          }
     *      ```
     */
    handleHttpStatus<T>(
        data: T,
        status: number,
        header: angular.IHttpHeadersGetter,
        config: angular.IRequestConfig
    ): VePromiseReason<T> {
        const result: VePromiseReason<T> = {
            status: status,
            data: data,
            message: '',
        }
        if (status === 404) result.message = 'Not Found'
        else if (status === 500) {
            if (typeof data === 'string' && data.indexOf('ENOTFOUND') >= 0)
                result.message = 'Network Error (Please check network)'
            else result.message = 'Server Error'
        } else if (status === 401 || status === 403)
            result.message = 'Permission Error'
        else if (status === 409) result.message = 'Conflict'
        else if (status === 400) result.message = 'BadRequestObject'
        else if (status === 410) result.message = 'Deleted'
        else if (status === 408) result.message = 'Timed Out'
        else if (status === 501) {
            result.message = 'Caching'
        } else result.message = 'Timed Out (Please check network)'
        return result
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#addServer
     * @methodOf veUtils/URLService
     *
     * @description
     * Adds mmsServer parameter to URL string, mainly used for PMA jobs
     *
     * @param {String} url The url string for which to add mmsServer parameter argument.
     * @param {String} server The mms server url for where elements are stored
     * @returns {string} The url with server parameter added.
     */
    private addServer(url: string, server: string) {
        if (url.indexOf('?') > 0) return `${url}&mmsServer=${server}`
        else return `${url}?mmsServer=${server}`
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#addVersion
     * @methodOf veUtils/URLService
     *
     * @description
     * Adds commitId parameter to URL string
     *
     * @param {String} url The url string for which to add version parameter argument.
     * @param {String} version The commit id
     * @returns {string} The url with commitId parameter added.
     */
    private addVersion(url: string, version: string): string {
        if (version === 'latest') return url
        else if (version) {
            if (url.indexOf('?') > 0) return url + '&commitId=' + version
            else return url + '?commitId=' + version
        }
        return url
    }

    private addExtended(url: string, extended: boolean): string {
        let r = url
        if (!extended) return r
        if (r.indexOf('?') > 0) r += '&extended=true'
        else r += '?extended=true'
        return r
    }

    private addChildViews(url: string, add: boolean): string {
        let r = url
        if (!add) return r
        if (r.indexOf('?') > 0) r += '&childviews=true'
        else r += '?childviews=true'
        return r
    }

    private _createUrlParamString(paramOb: {
        [key: string]: string | boolean | number
    }): string {
        let urlParams = ''
        for (const [key, value] of Object.entries(paramOb)) {
            let v: string
            if (typeof value === 'string') v = value
            else v = value.toString()
            if (urlParams.indexOf('?') > 0) {
                urlParams += `&${key}=${v}`
            } else {
                urlParams += `?${key}=${v}`
            }
        }
        return urlParams
    }

    /**
     * @ngdoc method
     * @name veUtils/URLService#addToken
     * @methodOf veUtils/URLService
     *
     * @description
     * Adds token parameter to URL string
     *
     * @param {String} url The url string for which to add token parameter argument.
     * @returns {string} The url with commitId parameter added.
     */
    private addToken(url: string): string {
        if (url.indexOf('?') > 0) return url + '&token=' + this.token
        else return url + '?token=' + this.token
    }
}
