function TRP_Sortable_Languages() {
    var _this = this;

    this.remove_language = function( element ){
        var message = jQuery( element.target ).attr( 'data-confirm-message' );
        var confirmed = confirm( message );
        if ( confirmed ) {
            jQuery ( element.target ).parent().parent().remove();
        }
    };

    this.add_language = function(){
        var selected_language = jQuery( '#trp-select-language' );
        var new_language = selected_language.val();
        if ( new_language == "" ){
            return;
        }

        selected_language.val( '' ).trigger( 'change' );

        var new_option = jQuery( '.trp-language' ).first().clone();
        new_option = jQuery( new_option );

        new_option.find( '.trp-hidden-default-language' ).remove();
        new_option.find( '.select2-container' ).remove();
        var select = new_option.find( 'select.trp-translation-language' );
        select.removeAttr( 'disabled' );
        select.val( new_language );
        select.select2();

        var checkbox = new_option.find( 'input.trp-translation-published' );
        checkbox.removeAttr( 'disabled' );
        checkbox.val( new_language );

        var url_slug = new_option.find( 'input.trp-language-slug' );
        url_slug.val( new_language.toLowerCase() );
        url_slug.attr('name', 'trp_settings[url-slugs][' + new_language + ']' );

        var remove = new_option.find( '.trp-remove-language' ).toggle();

        new_option = jQuery( '#trp-sortable-languages' ).append( new_option );
        new_option.find( '.trp-remove-language' ).last().click( _this.remove_language );
    };

    this.update_default_language = function(){
        var selected_language = jQuery( '#trp-default-language').val();
        jQuery( '.trp-hidden-default-language' ).val( selected_language );
        jQuery( '.trp-translation-published[disabled]' ).val( selected_language );
        jQuery( '.trp-translation-language[disabled]').val( selected_language ).trigger( 'change' );

    };

    function has_duplicates(array) {
        var valuesSoFar = Object.create(null);
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (value in valuesSoFar) {
                return true;
            }
            valuesSoFar[value] = true;
        }
        return false;
    }

    this.check_unique_url_slugs = function (event){
        var url_slugs = [];
        jQuery( '.trp-language-slug' ).each( function (){
            url_slugs.push( jQuery( this ).val() );
        } );
        if ( has_duplicates(url_slugs)){
            // todo translate this
            alert( 'Error! Duplicate Url slug values.' );
            event.preventDefault();
        }
    };

    this.initialize = function () {
        jQuery( '#trp-sortable-languages' ).sortable({ handle: '.trp-sortable-handle' });
        jQuery( '#trp-add-language' ).click( _this.add_language );
        jQuery( '.trp-remove-language' ).click( _this.remove_language );
        jQuery( '#trp-default-language' ).on( 'change', _this.update_default_language );
        jQuery( "form[action='options.php']").on ( 'submit', _this.check_unique_url_slugs );

        //todo remove already selected languages from selects
    };

    this.initialize();
}

var trpSortableLanguages;

// Initialize the Translate Press Settings after jQuery is ready
jQuery( function() {
    trpSortableLanguages = new TRP_Sortable_Languages();
});
