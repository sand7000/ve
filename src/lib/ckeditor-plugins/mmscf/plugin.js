/**
 * Plugin for inserting cross reference elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmscf', {
    requires: 'widget',
    // Register the icons.
    icons: 'mmscf',

    init: (editor) => {
        // Register mmscf widget to opens CF search window and insert mmscf tag as widget.
        editor.widgets.add('mmscf', {
            button: 'Insert Cross Reference',

            allowedContent:
                'mms-cf[*];mms-transclude-doc[*];mms-transclude-val[*];mms-transclude-name[*];' +
                'view-cf[*];transclude[*];',
            inline: true,
            insert: () => {
                var defaultConfig = {
                    callbackModalFnc: () => {
                        console.log('There is no callback function defined')
                    },
                }
                var config = CKEDITOR.tools.extend(
                    defaultConfig,
                    editor.config.mmscf || {},
                    true
                )
                var tag = config.callbackModalFnc(editor, false)
            },
            // Check the elements that need to be converted to widgets.
            upcast: (element) => {
                // Return "true" (that element needs to converted to a mmscf widget)
                // for all <mms-transclude-doc> elements.
                return (
                    new RegExp(`(mms-)?transclude-[a-z]*`).test(element.name) ||
                    element.name === 'mms-cf' ||
                    element.name === 'transclusion' ||
                    element.name === 'view-cf'
                )
            },
        })
    },
})
