import angular from 'angular'

import { veUtils } from '@ve-utils'

import { VeConfig } from '@ve-types/config'

export interface SchemaMapping {
    [key: string]: unknown
}

export interface Schema {
    jsonName: string
    schema: SchemaMapping
    map?: SchemaMapping
}

export class SchemaService {
    static $inject = ['$q', '$injector', 'growl']

    public veConfig: VeConfig = window.__env
    public defaultSchema: 'cameo'
    public schemaList: { [key: string]: string } = {
        cameo: 'CameoSchema(',
        jupyter: 'JupyterSchema(',
    }

    public schemas: { [key: string]: Schema } = {}

    constructor(
        private $q,
        private $injector: angular.auto.IInjectorService,
        private growl: angular.growl.IGrowlService
    ) {
        for (const [key, value] of Object.entries(this.schemaList)) {
            this.schemas[key] = this.$injector.get(value)
        }
    }

    getSchema(name: string, schemaName?: string, sourceId?: string): unknown {
        const schema: Schema = this._getSchema(schemaName, sourceId)
        if (schema.schema[name]) {
            return schema.schema[name]
        } else {
            this._schemaError(name, schemaName)
        }
    }

    getValue(
        name: string,
        key: string,
        schemaName?: string,
        sourceId?: string
    ): unknown {
        const lookup = this.getSchema(name, schemaName, sourceId)
        if (lookup && typeof lookup === 'object') {
            return lookup[key]
        }
    }

    getValues(
        name: string,
        keys: string[],
        schemaName?: string,
        sourceId?: string
    ): unknown[] | null {
        const lookup = this.getSchema(name, schemaName, sourceId)
        if (lookup && typeof lookup === 'object') {
            const response = []
            keys.forEach((key) => {
                if (lookup.hasOwnProperty(key)) {
                    response.push(lookup[key])
                }
            })
            return response
        }
    }

    getMap(name: string, schemaName?: string, sourceId?: string): unknown {
        const schema: Schema = this._getSchema(schemaName, sourceId)
        if (schema.map && schema.map[name]) {
            return schema.schema[name]
        } else {
            this._schemaError(name, schemaName)
        }
    }

    getMappedValue(
        name: string,
        key: string,
        schemaName?: string,
        sourceId?: string
    ): unknown {
        const lookup = this.getMap(name, schemaName, sourceId)
        if (lookup && typeof lookup === 'object') {
            return lookup[key]
        }
    }

    getKeyByValue(
        name: string,
        value: unknown,
        schemaName?: string,
        sourceId?: string
    ): string {
        const lookup = this.getSchema(name, schemaName, sourceId)
        if (lookup && typeof lookup === 'object') {
            let response = ''
            Object.keys(lookup).some((key) => {
                if (lookup[key] === value) {
                    response = key
                    return true
                }
                return false
            })
            return response
        }
    }

    private _schemaError(name: string, schemaName?: string) {
        schemaName = schemaName ? schemaName : this.defaultSchema
        this.growl.error('Schema Lookup Error')
        if (this.veConfig.enableDebug) {
            console.log(
                schemaName +
                    ' does not have table' +
                    name +
                    'or it is not properly configured'
            )
        }
    }

    private _getSchema(schemaName?: string, id?: string): Schema | null {
        schemaName = schemaName ? schemaName : this.defaultSchema
        id = id ? id : 'error: unknown'
        if (this.schemas.hasOwnProperty(schemaName)) {
            return this.schemas[schemaName]
        } else {
            this.growl.error(
                `Object ${id} uses an unknown schema ${schemaName}`
            )
        }
    }
}

veUtils.service('SchemaService', SchemaService)
