import {EventService, RootScopeService} from "@ve-utils/services";
import {veApp} from "@ve-app";

export class ContentWindowService {

    static $inject = ['RootScopeService', 'EventService']

    constructor(private rootScopeSvc: RootScopeService, private eventSvc: EventService) {
    }
    public toggleLeftPane(closed) {
        if ( closed && !this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane.toggle', true);
        }

        if ( !closed && this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane.toggle', false);
        }
    };
}

veApp.service('ContentWindowService', ContentWindowService)
