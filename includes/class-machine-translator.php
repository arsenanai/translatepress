<?php

/**
 * Class TRP_Machine_Translator
 *
 * Facilitates Machine Translation calls
 */
abstract class TRP_Machine_Translator {
    protected $settings;
	protected $referer;
	protected $url_converter;
	protected $machine_translator_logger;
    /**
     * TRP_Machine_Translator constructor.
     *
     * @param array $settings         Settings option.
     */
    public function __construct( $settings ){
        $this->settings = $settings;

        if ( ! $this->machine_translator_logger ) {
            $trp                             = TRP_Translate_Press::get_trp_instance();
            $this->machine_translator_logger = $trp->get_component('machine_translator_logger');
        }
    }

    /**
     * Whether automatic translation is available.
     *
     * @return bool
     */
    public function is_available(){
        if( !empty( $this->settings['machine-translation'] ) && $this->settings['machine-translation'] == 'yes' )
            return true;
        else
            return false;
    }

	/**
	 * Return site referer
	 *
	 * @return string
	 */
	public function get_referer(){
		if( ! $this->referer ) {
			if( ! $this->url_converter ) {
				$trp = TRP_Translate_Press::get_trp_instance();
				$this->url_converter = $trp->get_component( 'url_converter' );
			}

			$this->referer = $this->url_converter->get_abs_home();
		}

		return $this->referer;
	}

    /**
     * Verifies that the machine translation request is valid
     *
     * @param  string $to_language language we're looking to translate to
     * @return bool
     */
    public function verify_request( $to_language ){

        if( empty( $this->get_api_key() ) ||
            empty( $to_language ) || $to_language == $this->settings['default-language'] ||
            empty( $this->settings['machine-translate-codes'][$this->settings['default-language']] )
          )
            return false;

        // Method that can be extended in the child class to add extra validation
        if( !$this->extra_request_validations( $to_language ) )
            return false;

        // Check if crawlers are blocked
        if( !empty( $this->settings['block-crawlers'] ) && $this->settings['block-crawlers'] == 'yes' && $this->is_crawler() )
            return false;

        // Check if daily quota is met
        if( $this->machine_translator_logger->quota_exceeded() )
            return false;

        return true;

    }

    public function verify_request_parameters($target_language_code, $source_language_code){
        if( empty( $this->get_api_key() ) ||
            empty( $target_language_code ) || empty( $source_language_code ) ||
            empty( $this->settings['machine-translate-codes'][$target_language_code] ) ||
            empty( $this->settings['machine-translate-codes'][$source_language_code] ) ||
            $this->settings['machine-translate-codes'][$target_language_code] == $this->settings['machine-translate-codes'][$source_language_code]
        )
            return false;

        // Method that can be extended in the child class to add extra validation
        if( !$this->extra_request_validations( $target_language_code ) )
            return false;

        // Check if crawlers are blocked
        if( !empty( $this->settings['block-crawlers'] ) && $this->settings['block-crawlers'] == 'yes' && $this->is_crawler() )
            return false;

        // Check if daily quota is met
        if( $this->machine_translator_logger->quota_exceeded() )
            return false;

        return true;
    }

    /**
     * Verifies user agent to check if the request is being made by a crawler
     *
     * @return boolean
     */
    private function is_crawler(){
        if( !isset( $_SERVER['HTTP_USER_AGENT'] ) )
            return false;

        $crawlers = apply_filters( 'trp_machine_translator_crawlers', 'rambler|abacho|acoi|accona|aspseek|altavista|estyle|scrubby|lycos|geona|ia_archiver|alexa|sogou|skype|facebook|twitter|pinterest|linkedin|naver|bing|google|yahoo|duckduckgo|yandex|baidu|teoma|xing|java\/1.7.0_45|bot|crawl|slurp|spider|mediapartners|\sask\s|\saol\s' );

        return preg_match( '/'. $crawlers .'/i', $_SERVER['HTTP_USER_AGENT'] );
    }

    private function get_placeholders( $count ){
	    $placeholders = array();
	    for( $i = 1 ; $i <= $count; $i++ ){
            $placeholders[] = '1TP' . $i;
        }
	    return $placeholders;
    }

    /**
     * Function to be used externally
     *
     * @param $strings
     * @param $target_language_code
     * @param $source_language_code
     * @return array
     */
    public function translate($strings, $target_language_code, $source_language_code = null ){
        if ( !empty($strings) && is_array($strings) ) {

            /* google has a problem translating this characters ( '%', '$', '#' )...for some reasons it puts spaces after them so we need to 'encode' them and decode them back. hopefully it won't break anything important */
            $trp_exclude_words_from_automatic_translation = apply_filters('trp_exclude_words_from_automatic_translation', array('%', '$', '#'));
            $placeholders = $this->get_placeholders(count($trp_exclude_words_from_automatic_translation));

            foreach ($strings as $key => $string) {
                $strings[$key] = str_replace($trp_exclude_words_from_automatic_translation, $placeholders, $string);
            }

            $machine_translation_settings = get_option( 'trp_machine_translation_settings', false );
            if ( $machine_translation_settings !== false && $machine_translation_settings['translation-engine'] === 'deepl' && defined( 'TRP_DL_PLUGIN_VERSION' ) && TRP_DL_PLUGIN_VERSION === '1.0.0' ) {
                // backwards compatibility with deepl version 1.0.0 which doesn't have the third function parameter $source_language_code
                $machine_strings = $this->translate_array($strings, $target_language_code);
            }else {
                $machine_strings = $this->translate_array($strings, $target_language_code, $source_language_code);
            }


            if (!empty($machine_strings)) {
                foreach ($machine_strings as $key => $machine_string) {
                    $machine_strings[$key] = str_ireplace( $placeholders, $trp_exclude_words_from_automatic_translation, $machine_string );
                }
            }
            return $machine_strings;
        }else {
            return array();
        }
    }

    /**
     * Function to implement in specific machine translators APIs
     *
     * This is not meant for calling externally except for when short-circuiting translate()
     *
     *
     * @param $strings
     * @param $language_code
     * @return array
     */
    abstract public function translate_array( $strings, $destination_language_code, $source_language_code );

    public function test_request(){}

    public function get_api_key(){
        return false;
    }

    public function extra_request_validations( $to_language ){
        return true;
    }
}
