
/**
 * Script to replace dynamically added strings with their translation.
 */
function TRP_Translator(){

    var _this = this;
    var observer = null;
    var active = true;
    var ajax_url = trp_data.trp_ajax_url;
    var wp_ajax_url = trp_data.trp_wp_ajax_url;
    var trp_translation_editor = trp_data.trp_translation_editor;
    var language_to_query;

    /**
     * Ajax request to get translations for strings
     */
    this.ajax_get_translation = function( strings_to_query, url ) {
        jQuery.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: {
                action: 'trp_get_translations',
                async: false,
                language: language_to_query,
                original_language: original_language,
                strings: JSON.stringify( strings_to_query )
            },
            success: function( response ) {
                if ( response === 'error' ) {
                    _this.ajax_get_translation( strings_to_query, wp_ajax_url );
                }else{
                    _this.update_strings( response, strings_to_query );
                }
            },
            error: function( errorThrown ){
                if ( url == ajax_url ){
                    _this.ajax_get_translation( strings_to_query, wp_ajax_url );
                }else{
                    _this.update_strings( null, strings_to_query );
                    console.log( 'TranslatePress AJAX Request Error' );
                }
            }
        });
    };

    /**
     * Replace original strings with translations if found.
     */
    this.update_strings = function( response, strings_to_query ) {
        if ( response != null && response[language_to_query] != null ){
            for ( var j in strings_to_query ) {
                var queried_string = strings_to_query[j];
                var translation_found = false;
                var initial_value = queried_string.original;
                for( var i in response[language_to_query] ) {
                    var response_string = response[language_to_query][i];
                    if (response_string.original.trim() == queried_string.original.trim()) {
                        response[language_to_query][i].jquery_object = jQuery( queried_string.node ).parent( 'translate-press' );
                        if (response_string.translated != '' && language_to_query == current_language ) {
                            var text_to_set = initial_value.replace(initial_value.trim(), response_string.translated);
                            _this.pause_observer();
                            queried_string.node.textContent = text_to_set;
                            _this.unpause_observer();
                            translation_found = true;
                            break;
                        }
                    }
                }

                if ( ! translation_found ){
                    queried_string.node.textContent = initial_value;
                }
                if ( typeof parent.trpEditor !== 'undefined' ) {
                    parent.trpEditor.populate_strings( response );
                }
            }
        }else{
            for ( var j in strings_to_query ) {
                strings_to_query[j].node.textContent = strings_to_query[j].original;
            }
        }
    };


    this.detect_strings_in_translation_editor = function( mutations ){
        //console.log(window.parent.jQuery('#trp-preview-iframe'));

        if ( active ) {
            var nodes = [];
            var nodes_content = [];
            mutations.forEach( function (mutation) {
                if( JSON.stringify( mutation.addedNodes ) != JSON.stringify( mutation.removedNodes ) ) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        if (mutation.addedNodes[i].innerText && mutation.addedNodes[i].innerText.trim() != '') {
                            nodes.push(mutation.addedNodes[i]);
                            nodes_content.push(mutation.addedNodes[i].outerHTML);
                        }
                    }
                }
            });

            if ( nodes.length > 0 ) {
                _this.pause_observer();
                window.parent.jQuery('#trp-preview-iframe').trigger('load');
                /*jQuery.ajax({
                    url: wp_ajax_url,
                    type: 'post',
                    dataType: 'json',
                    data: {
                        action: 'trp_process_js_strings_in_translation_editor',
                        current_language: current_language,
                        original_language: original_language,
                        nodes_content: nodes_content
                    },
                    success: function (processed_nodes) {
                        nodes.forEach( function (node, index ) {
                            jQuery(node).replaceWith(processed_nodes[index]);                            
                        });

                        _this.unpause_observer();
                    }
                });*/
                _this.unpause_observer();
            }

        }
    };

    /**
     * Detect and remember added strings.
     */
    this.detect_new_strings = function( mutations ){
        if ( active ) {
            var strings = [];
            mutations.forEach( function (mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    if ( mutation.addedNodes[i].innerText && mutation.addedNodes[i].innerText.trim() != '' ) {
                        var node = jQuery( mutation.addedNodes[i] );
                        var attribute = node.attr( 'data-no-translation' );
                        if ( (typeof attribute !== typeof undefined && attribute !== false) || node.parents( '[data-no-translation]').length > 0 ){
                            continue;
                        }

                        /* if it is an anchor add the trp-edit-translation=preview parameter to it */
                        if ( typeof parent.trpEditor !== 'undefined' ) {
                            jQuery(mutation.addedNodes[i]).find('a').context.href = parent.trpEditor.set_url_param( jQuery(mutation.addedNodes[i]).find('a').context.href, 'trp-edit-translation', 'preview' );
                        }

                        var all_nodes = jQuery( mutation.addedNodes[i]).find( '*').addBack();
                        var all_strings = all_nodes.contents().filter(function(){
                            if( this.nodeType === 3 && /\S/.test(this.nodeValue) ){
                                return this
                            }
                        });
                        if ( typeof parent.trpEditor !== 'undefined' ) {
                            all_strings.wrap('<translate-press></translate-press>');
                        }
                        var all_strings_length = all_strings.length;
                        for (var j = 0; j < all_strings_length; j++ ) {
                            strings.push({node: all_strings[j], original: all_strings[j].textContent});
                            all_strings[j].textContent = '';
                        }
                    }
                }
            });
            if ( strings.length > 0 ) {
                _this.ajax_get_translation( strings, ajax_url );
            }
        }
    };

    //function that cleans the gettext wrappers 
    this.cleanup_gettext_wrapper = function(){
        jQuery('trp-gettext').contents().unwrap();
    };

    /**
     * Initialize and configure observer.
     */
    this.initialize = function() {

        current_language = trp_data.trp_current_language;
        original_language = trp_data.trp_original_language;
        language_to_query = trp_data.trp_language_to_query;

        // create an observer instance
        if( trp_translation_editor ){
            observer = new MutationObserver( _this.detect_strings_in_translation_editor );
            // configuration of the observer:
            var config = {
                attributes: false,
                childList: true,
                characterData: false,
                subtree: true
            };
        }
        else{
            observer = new MutationObserver( _this.detect_new_strings );
            // configuration of the observer:
            var config = {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            };
        }

        observer.observe( document.body , config );

        //try a final attempt at cleaning the gettext wrappers
        _this.cleanup_gettext_wrapper();
    };

    /**
     * Stop observing new strings.
     */
    this.disconnect = function(){
        observer.disconnect();
    };

    /**
     * Resume observing new strings added.
     */
    this.unpause_observer = function(){
        active = true;
    };

    /**
     * Pause observing new string added.
     */
    this.pause_observer = function(){
        active = false;
    };

    _this.initialize();
}

var trpTranslator;
var current_language;
var original_language;

// Initialize the Translate Press Editor after jQuery is ready
jQuery( function() {
    trpTranslator = new TRP_Translator();
});

