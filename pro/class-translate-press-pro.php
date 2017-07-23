<?php


class TRP_Translate_Press_Pro extends TRP_Translate_Press{
    protected $plugin_updater;

    protected function load_dependencies(){
        require_once(  TRP_PLUGIN_DIR . 'pro/includes/class-plugin-updater.php' );
        if ( is_multisite() ) {
            require_once(TRP_PLUGIN_DIR . 'pro/includes/class-plugin-updater-multisite.php');
        }
        parent::load_dependencies();
        require_once( TRP_PLUGIN_DIR . 'pro/includes/class-translation-render-pro.php' );
        require_once( TRP_PLUGIN_DIR . 'pro/includes/class-settings-pro.php' );
    }

    protected function initialize_components() {
        if ( is_multisite() ) {
            $this->plugin_updater = new TRP_Plugin_Updater_Multisite();
            $this->loader->add_action( 'network_admin_menu', $this->plugin_updater, 'license_menu' );
            $this->loader->add_action( 'network_admin_edit_trp_license_key', $this->plugin_updater, 'license_page' );
            $this->loader->add_filter( 'trp_settings_tabs', $this->plugin_updater, 'license_page_url' );
        }else{
            $this->plugin_updater = new TRP_Plugin_Updater();
            $this->loader->add_action( 'admin_menu', $this->plugin_updater, 'license_menu' );
        }
        $this->settings = new TRP_Settings_Pro();
        $this->translation_render = new TRP_Translation_Render_Pro($this->settings->get_settings());

        $this->loader->add_action( 'admin_menu', $this->plugin_updater, 'license_menu' );
        $this->loader->add_action( 'admin_init', $this->plugin_updater, 'register_option' );
        $this->loader->add_action( 'admin_notices', $this->plugin_updater, 'admin_notices' );
        $this->loader->add_action( 'admin_init', $this->plugin_updater, 'activate_license' );

        $this->loader->add_action( 'admin_enqueue_scripts', $this->settings, 'enqueue_sortable_language_script' );
        $this->loader->add_action( 'trp_settings_navigation_tabs', $this->settings, 'add_navigation_tabs' );
    }

}