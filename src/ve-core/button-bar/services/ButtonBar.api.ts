import { BarButton } from '@ve-core/button-bar'

export interface ButtonWrapEvent {
    oldSize: number
    newSize: number
}

export class ButtonBarApi {
    public buttons: BarButton[] = []
    public WRAP_EVENT: string

    constructor(public id: string) {
        if (this.id === '') {
            this.id = 'unknown'
        }
        this.WRAP_EVENT = `${id}-wrap`
    }

    public getId = (): string => {
        return this.id
    }

    public select = (parentButton: BarButton, childButton: BarButton): void => {
        if (parentButton && childButton && childButton.config.selectable) {
            parentButton.dropdown_buttons.forEach((dropdownButton) => {
                if (parentButton.config.dropdown) {
                    if (dropdownButton.id === childButton.id) {
                        dropdownButton.selected = dropdownButton.selected
                            ? !dropdownButton.selected
                            : true
                    }
                } else {
                    dropdownButton.selected =
                        dropdownButton.id === childButton.id
                }
            })
        }
    }

    public deselect = (
        parentButton: BarButton,
        childButton: BarButton
    ): void => {
        if (parentButton && childButton) {
            parentButton.dropdown_buttons.forEach((dropdownButton) => {
                if (parentButton.config.dropdown) {
                    if (dropdownButton.id === childButton.id) {
                        dropdownButton.selected = false
                    }
                }
            })
        }
    }

    public setPermission = (id: string, permission: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.permission = permission
        })
    }

    public setActive = (id: string, state: boolean, parent?: string): void => {
        this.buttons.forEach((button) => {
            if (parent && button.id === parent && button.dropdown_buttons) {
                button.dropdown_buttons.forEach((child) => {
                    if (child.id === id) child.active = state
                })
            }
            if (button.id === id) button.active = state
        })
    }

    public addButton = (button: BarButton): void => {
        if (this.buttons.length === 0) {
            button.placement = 'bottom-left'
        } else if (!button.placement) {
            // else {
            button.placement = 'bottom'
        }
        this.buttons.push(button)
    }

    public toggleButtonSpinner = (id: string): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.toggleSpin()
        })
    }

    public toggleButton = (id: string, state?: boolean): void => {
        this.buttons.forEach((button) => {
            if (button.id === id) button.toggle(state)
        })
    }
}
