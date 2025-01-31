/**
 * Plugin for inserting Comment elements into the CKEditor editing area.
 */

// Register the plugin within the editor.
CKEDITOR.plugins.add('mmscomment', {
    requires: 'widget',
    // Register the icons.
    icons: 'mmscomment',

    init: (editor) => {
        // Register mmscomment widget to opens CF search window and insert mmscomment tag as widget.
        editor.widgets.add('mmscomment', {
            button: 'Insert Comment',
            inline: true,
            allowedContent: 'mms-transclude-com[*];transclude-com[*]',
            insert: () => {
                var defaultConfig = {
                    callbackModalFnc: () => {
                        console.log('There is no callback function defined')
                    },
                }
                var config = CKEDITOR.tools.extend(
                    defaultConfig,
                    editor.config.mmscomment || {},
                    true
                )
                var tag = config.callbackModalFnc(editor)
            },
            // Check the elements that need to be converted to widgets.
            upcast: (element) => {
                // Return "true" (that element needs to converted to a mmscomment widget)
                // for all <mms-transclude-com> elements.
                return (
                    element.name === 'transclude-com' ||
                    element.name === 'mms-transclude-com'
                )
            },
        })
    },
})
