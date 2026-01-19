<?php
/**
 * Plugin Name: WP Manager Connector
 * Plugin URI: https://github.com/your-repo/wp-manager
 * Description: Companion plugin for the WP Manager desktop application. Enables remote management of plugins, themes, and site settings.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-manager-connector
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WP_MANAGER_VERSION', '1.0.0');
define('WP_MANAGER_PLUGIN_DIR', plugin_dir_path(__FILE__));

class WP_Manager_Connector {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Generate API keys on activation if not exists
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        if (!get_option('wp_manager_api_key')) {
            update_option('wp_manager_api_key', $this->generate_key());
        }
        if (!get_option('wp_manager_api_secret')) {
            update_option('wp_manager_api_secret', $this->generate_key(64));
        }
    }
    
    /**
     * Generate random API key
     */
    private function generate_key($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('WP Manager', 'wp-manager-connector'),
            __('WP Manager', 'wp-manager-connector'),
            'manage_options',
            'wp-manager',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('wp_manager_settings', 'wp_manager_api_key');
        register_setting('wp_manager_settings', 'wp_manager_api_secret');
        register_setting('wp_manager_settings', 'wp_manager_allowed_ips');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $api_key = get_option('wp_manager_api_key');
        $api_secret = get_option('wp_manager_api_secret');
        ?>
        <div class="wrap">
            <h1><?php _e('WP Manager Settings', 'wp-manager-connector'); ?></h1>
            
            <div class="card" style="max-width: 600px; padding: 20px;">
                <h2><?php _e('API Credentials', 'wp-manager-connector'); ?></h2>
                <p><?php _e('Use these credentials to connect this site to the WP Manager desktop application.', 'wp-manager-connector'); ?></p>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Site URL', 'wp-manager-connector'); ?></th>
                        <td>
                            <input type="text" value="<?php echo esc_url(home_url()); ?>" class="regular-text" readonly onclick="this.select()">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('API Key', 'wp-manager-connector'); ?></th>
                        <td>
                            <input type="text" value="<?php echo esc_attr($api_key); ?>" class="regular-text code" readonly onclick="this.select()">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('API Secret', 'wp-manager-connector'); ?></th>
                        <td>
                            <input type="password" id="api-secret" value="<?php echo esc_attr($api_secret); ?>" class="regular-text code" readonly onclick="this.select(); this.type='text';">
                            <button type="button" class="button" onclick="document.getElementById('api-secret').type = document.getElementById('api-secret').type === 'password' ? 'text' : 'password';">
                                <?php _e('Show/Hide', 'wp-manager-connector'); ?>
                            </button>
                        </td>
                    </tr>
                </table>
                
                <form method="post" action="options.php">
                    <?php settings_fields('wp_manager_settings'); ?>
                    <p>
                        <button type="button" class="button" onclick="if(confirm('<?php _e('Are you sure you want to regenerate the API credentials? You will need to update them in the WP Manager app.', 'wp-manager-connector'); ?>')) { document.getElementById('regenerate-keys').submit(); }">
                            <?php _e('Regenerate Credentials', 'wp-manager-connector'); ?>
                        </button>
                    </p>
                </form>
                
                <form id="regenerate-keys" method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                    <input type="hidden" name="action" value="wp_manager_regenerate_keys">
                    <?php wp_nonce_field('wp_manager_regenerate', 'wp_manager_nonce'); ?>
                </form>
            </div>
            
            <div class="card" style="max-width: 600px; padding: 20px; margin-top: 20px;">
                <h2><?php _e('Connection Status', 'wp-manager-connector'); ?></h2>
                <p>
                    <span style="color: green;">●</span>
                    <?php _e('REST API is active and ready', 'wp-manager-connector'); ?>
                </p>
                <p>
                    <strong><?php _e('Endpoint:', 'wp-manager-connector'); ?></strong><br>
                    <code><?php echo esc_url(rest_url('wp-manager/v1/')); ?></code>
                </p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        $namespace = 'wp-manager/v1';
        
        // Site status
        register_rest_route($namespace, '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Plugins
        register_rest_route($namespace, '/plugins', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_plugins'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/plugins/(?P<slug>[a-zA-Z0-9-_]+)/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_plugin'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/plugins/(?P<slug>[a-zA-Z0-9-_]+)/activate', array(
            'methods' => 'POST',
            'callback' => array($this, 'activate_plugin'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/plugins/(?P<slug>[a-zA-Z0-9-_]+)/deactivate', array(
            'methods' => 'POST',
            'callback' => array($this, 'deactivate_plugin'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/plugins/update-all', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_all_plugins'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Themes
        register_rest_route($namespace, '/themes', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_themes'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/themes/(?P<slug>[a-zA-Z0-9-_]+)/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_theme'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/themes/(?P<slug>[a-zA-Z0-9-_]+)/activate', array(
            'methods' => 'POST',
            'callback' => array($this, 'activate_theme'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/themes/update-all', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_all_themes'),
            'permission_callback' => array($this, 'check_permission'),
        ));
    }
    
    /**
     * Check API permission
     */
    public function check_permission($request) {
        $api_key = $request->get_header('X-WP-Manager-Key');
        $api_secret = $request->get_header('X-WP-Manager-Secret');
        
        $stored_key = get_option('wp_manager_api_key');
        $stored_secret = get_option('wp_manager_api_secret');
        
        if ($api_key !== $stored_key || $api_secret !== $stored_secret) {
            return new WP_Error(
                'rest_forbidden',
                __('Invalid API credentials', 'wp-manager-connector'),
                array('status' => 403)
            );
        }
        
        return true;
    }
    
    /**
     * Get site status
     */
    public function get_status($request) {
        global $wp_version;
        
        $plugins = get_plugins();
        $themes = wp_get_themes();
        $active_theme = wp_get_theme();
        
        // Get update counts
        $plugin_updates = get_site_transient('update_plugins');
        $theme_updates = get_site_transient('update_themes');
        $core_updates = get_site_transient('update_core');
        
        return rest_ensure_response(array(
            'wp_version' => $wp_version,
            'php_version' => phpversion(),
            'plugin_count' => count($plugins),
            'theme_count' => count($themes),
            'active_theme' => $active_theme->get('Name'),
            'updates_available' => array(
                'plugins' => $plugin_updates ? count($plugin_updates->response) : 0,
                'themes' => $theme_updates ? count($theme_updates->response) : 0,
                'core' => !empty($core_updates->updates),
            ),
            'site_url' => home_url(),
            'admin_email' => get_option('admin_email'),
            'timezone' => wp_timezone_string(),
        ));
    }
    
    /**
     * Get all plugins
     */
    public function get_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $plugin_updates = get_site_transient('update_plugins');
        
        $result = array();
        
        foreach ($plugins as $plugin_file => $plugin_data) {
            $slug = dirname($plugin_file);
            if ($slug === '.') {
                $slug = basename($plugin_file, '.php');
            }
            
            $has_update = isset($plugin_updates->response[$plugin_file]);
            
            $result[] = array(
                'name' => $plugin_data['Name'],
                'slug' => $slug,
                'file' => $plugin_file,
                'version' => $plugin_data['Version'],
                'status' => in_array($plugin_file, $active_plugins) ? 'active' : 'inactive',
                'updateAvailable' => $has_update,
                'latestVersion' => $has_update ? $plugin_updates->response[$plugin_file]->new_version : $plugin_data['Version'],
                'author' => $plugin_data['Author'],
                'description' => $plugin_data['Description'],
            );
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a plugin
     */
    public function update_plugin($request) {
        $slug = $request['slug'];
        
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        
        // Find plugin file from slug
        $plugins = get_plugins();
        $plugin_file = null;
        
        foreach ($plugins as $file => $data) {
            if (strpos($file, $slug) !== false) {
                $plugin_file = $file;
                break;
            }
        }
        
        if (!$plugin_file) {
            return new WP_Error('plugin_not_found', __('Plugin not found', 'wp-manager-connector'), array('status' => 404));
        }
        
        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->upgrade($plugin_file);
        
        return rest_ensure_response(array(
            'success' => $result !== false,
            'plugin' => $slug,
        ));
    }
    
    /**
     * Activate a plugin
     */
    public function activate_plugin($request) {
        $slug = $request['slug'];
        
        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $plugins = get_plugins();
        $plugin_file = null;
        
        foreach ($plugins as $file => $data) {
            if (strpos($file, $slug) !== false) {
                $plugin_file = $file;
                break;
            }
        }
        
        if (!$plugin_file) {
            return new WP_Error('plugin_not_found', __('Plugin not found', 'wp-manager-connector'), array('status' => 404));
        }
        
        $result = activate_plugin($plugin_file);
        
        return rest_ensure_response(array(
            'success' => is_null($result),
            'plugin' => $slug,
        ));
    }
    
    /**
     * Deactivate a plugin
     */
    public function deactivate_plugin($request) {
        $slug = $request['slug'];
        
        if (!function_exists('deactivate_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $plugins = get_plugins();
        $plugin_file = null;
        
        foreach ($plugins as $file => $data) {
            if (strpos($file, $slug) !== false) {
                $plugin_file = $file;
                break;
            }
        }
        
        if (!$plugin_file) {
            return new WP_Error('plugin_not_found', __('Plugin not found', 'wp-manager-connector'), array('status' => 404));
        }
        
        deactivate_plugins($plugin_file);
        
        return rest_ensure_response(array(
            'success' => true,
            'plugin' => $slug,
        ));
    }
    
    /**
     * Update all plugins
     */
    public function update_all_plugins($request) {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        
        $plugin_updates = get_site_transient('update_plugins');
        
        if (empty($plugin_updates->response)) {
            return rest_ensure_response(array(
                'updated' => array(),
                'failed' => array(),
                'message' => 'No updates available',
            ));
        }
        
        $updated = array();
        $failed = array();
        
        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        
        foreach ($plugin_updates->response as $plugin_file => $plugin_data) {
            $result = $upgrader->upgrade($plugin_file);
            
            if ($result !== false) {
                $updated[] = $plugin_file;
            } else {
                $failed[] = $plugin_file;
            }
        }
        
        return rest_ensure_response(array(
            'updated' => $updated,
            'failed' => $failed,
        ));
    }
    
    /**
     * Get all themes
     */
    public function get_themes($request) {
        $themes = wp_get_themes();
        $active_theme = get_stylesheet();
        $theme_updates = get_site_transient('update_themes');
        
        $result = array();
        
        foreach ($themes as $slug => $theme) {
            $has_update = isset($theme_updates->response[$slug]);
            
            $result[] = array(
                'name' => $theme->get('Name'),
                'slug' => $slug,
                'version' => $theme->get('Version'),
                'status' => $slug === $active_theme ? 'active' : 'inactive',
                'updateAvailable' => $has_update,
                'latestVersion' => $has_update ? $theme_updates->response[$slug]['new_version'] : $theme->get('Version'),
                'author' => $theme->get('Author'),
                'screenshot' => $theme->get_screenshot(),
            );
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a theme
     */
    public function update_theme($request) {
        $slug = $request['slug'];
        
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        
        $upgrader = new Theme_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->upgrade($slug);
        
        return rest_ensure_response(array(
            'success' => $result !== false,
            'theme' => $slug,
        ));
    }
    
    /**
     * Activate a theme
     */
    public function activate_theme($request) {
        $slug = $request['slug'];
        
        $theme = wp_get_theme($slug);
        
        if (!$theme->exists()) {
            return new WP_Error('theme_not_found', __('Theme not found', 'wp-manager-connector'), array('status' => 404));
        }
        
        switch_theme($slug);
        
        return rest_ensure_response(array(
            'success' => true,
            'theme' => $slug,
        ));
    }
    
    /**
     * Update all themes
     */
    public function update_all_themes($request) {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        
        $theme_updates = get_site_transient('update_themes');
        
        if (empty($theme_updates->response)) {
            return rest_ensure_response(array(
                'updated' => array(),
                'failed' => array(),
                'message' => 'No updates available',
            ));
        }
        
        $updated = array();
        $failed = array();
        
        $upgrader = new Theme_Upgrader(new Automatic_Upgrader_Skin());
        
        foreach ($theme_updates->response as $slug => $theme_data) {
            $result = $upgrader->upgrade($slug);
            
            if ($result !== false) {
                $updated[] = $slug;
            } else {
                $failed[] = $slug;
            }
        }
        
        return rest_ensure_response(array(
            'updated' => $updated,
            'failed' => $failed,
        ));
    }
}

// Handle key regeneration
add_action('admin_post_wp_manager_regenerate_keys', function() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    check_admin_referer('wp_manager_regenerate', 'wp_manager_nonce');
    
    update_option('wp_manager_api_key', bin2hex(random_bytes(16)));
    update_option('wp_manager_api_secret', bin2hex(random_bytes(32)));
    
    wp_redirect(admin_url('options-general.php?page=wp-manager&regenerated=1'));
    exit;
});

// Initialize the plugin
WP_Manager_Connector::get_instance();

