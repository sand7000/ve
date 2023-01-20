import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentImageComponent: IPresentationComponentOptions = {
    selector: 'presentImage',
    template: `
    <figure>
    <cross-reference mms-cf-type="img" mms-element-id="{{$ctrl.peObject.id}}"></cross-reference>
    <figcaption>
        <span ng-if="!$ctrl.peObject.excludeFromList">Figure {{$ctrl.peNumber}}. 
        </span>{{$ctrl.peObject.title || $ctrl.element.name}}
    </figcaption>
</figure>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentImageComponent.selector, PresentImageComponent)
