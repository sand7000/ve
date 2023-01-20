// <div ng-if="$ctrl.element.type === 'Generalization' || $ctrl.element.type === 'Dependency'">
// <h2 class="prop-title">Source</h2>
//     <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._sourceIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
// <h2 class="prop-title">Target</h2>
//     <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._targetIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
// </div>

import angular from 'angular'

import { ExtensionService, ComponentService } from '@ve-components/services'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { ElementService, AuthService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    MathJaxService,
    UtilsService,
    EventService,
    ImageService,
} from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'

export class TranscludeAttrController
    extends Transclusion
    implements ITransclusion
{
    protected template: string = `

`
    //Custom Binding
    mmsAttr: string

    //Locals
    attrValues: string[] = []

    static $inject = [...Transclusion.$inject, 'SpecService']

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            authSvc,
            eventSvc,
            mathJaxSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'name'
        this.cfTitle = ''
        this.cfKind = 'Text'
        this.checkCircular = false
    }

    $onInit(): void {
        super.$onInit()

        this.$element.on('click', (e) => {
            e.stopPropagation()
            if (this.noClick) return
            const data = {
                elementOb: this.element,
                commitId: this.mmsCommitId ? this.mmsCommitId : 'latest',
            }
            this.eventSvc.$broadcast('element.selected', data)
        })
    }

    public getContent = (
        preview?
    ): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string>()
        let contentTemplate: string
        const ids: string[] = []
        if (
            this.element[this.mmsAttr] ||
            (Array.isArray(this.element[this.mmsAttr]) &&
                (this.element[this.mmsAttr] as Array<unknown>).length > 0)
        ) {
            //Grab id reference to an array for CF
            if (this.mmsAttr.endsWith('Id')) {
                ids.push(this.element[this.mmsAttr] as string)
            }
            // Grab id array for a CF list
            else if (this.mmsAttr.endsWith('Ids')) {
                ids.push(...(this.element[this.mmsAttr] as Array<string>))
            }
            // Convert List of elements to strings
            else if (Array.isArray(this.element[this.mmsAttr])) {
                ;(this.element[this.mmsAttr] as Array<unknown>).forEach(
                    (value) => {
                        this.attrValues.push(
                            `<span class="panel-body">${value.toString()}</span>`
                        )
                    }
                )
            }
            // Convert referenced ids array to CF list
            if (ids.length > 0) {
                ids.forEach((id) => {
                    this.attrValues.push(
                        `<transclude-name mms-element-id="${id}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" mms-commit-id="{{$ctrl.commitId}}" ${
                            this.noClick ? 'no-click="true"' : ''
                        }}></transclude-name></br>`
                    )
                })
            }
        } else {
            this.attrValues.push(
                `<span class="no-print placeholder">(empty)</span>`
            )
        }

        let defaultTemplate = `
        <div ng-hide="$ctrl.hideName" class="panel-heading">
        {{$ctrl.mmsAttr}}: 
        </div>
`
        this.attrValues.forEach((value) => {
            defaultTemplate += value
        })
        deferred.resolve(defaultTemplate)

        return deferred.promise
    }
}

export const TranscludeNameComponent: VeComponentOptions = {
    selector: 'transcludeAttr',
    template: `<div></div>`,
    bindings: {
        mmsAttr: '@',
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        mmsCfLabel: '@',
        hideName: '@',
        noClick: '<',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^^view',
        mmsSpecEditor: '?^^specEditor',
    },
    controller: TranscludeAttrController,
}

veComponents.component(
    TranscludeNameComponent.selector,
    TranscludeNameComponent
)
