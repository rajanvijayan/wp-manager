<?php
/**
 * Plugin Name: WP Manager Connector
 * Plugin URI: https://github.com/your-repo/wp-manager
 * Description: Companion plugin for the WP Manager desktop application. Enables remote management of plugins, themes, and site settings.
 * Version: 1.1.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-manager-connector
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WP_MANAGER_VERSION', '1.1.0');
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
        
        // Install plugin from WordPress.org
        register_rest_route($namespace, '/plugins/install', array(
            'methods' => 'POST',
            'callback' => array($this, 'install_plugin'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Install theme from WordPress.org
        register_rest_route($namespace, '/themes/install', array(
            'methods' => 'POST',
            'callback' => array($this, 'install_theme'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Admin auto-login
        register_rest_route($namespace, '/admin-login', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_admin_login'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Get users with roles
        register_rest_route($namespace, '/users', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_users'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        // Get site stats (file count, DB size)
        register_rest_route($namespace, '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_site_stats'),
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
    
    /**
     * Install a plugin from WordPress.org
     */
    public function install_plugin($request) {
        $params = $request->get_json_params();
        $slug = isset($params['slug']) ? sanitize_text_field($params['slug']) : '';
        
        if (empty($slug)) {
            return new WP_Error('missing_slug', __('Plugin slug is required', 'wp-manager-connector'), array('status' => 400));
        }
        
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';
        
        // Get plugin info from WordPress.org
        $api = plugins_api('plugin_information', array(
            'slug' => $slug,
            'fields' => array(
                'short_description' => false,
                'sections' => false,
                'requires' => false,
                'rating' => false,
                'ratings' => false,
                'downloaded' => false,
                'last_updated' => false,
                'added' => false,
                'tags' => false,
                'compatibility' => false,
                'homepage' => false,
                'donate_link' => false,
            ),
        ));
        
        if (is_wp_error($api)) {
            return new WP_Error('plugin_not_found', __('Plugin not found on WordPress.org', 'wp-manager-connector'), array('status' => 404));
        }
        
        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);
        
        if (is_wp_error($result)) {
            return new WP_Error('install_failed', $result->get_error_message(), array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'plugin' => $slug,
            'message' => __('Plugin installed successfully', 'wp-manager-connector'),
        ));
    }
    
    /**
     * Install a theme from WordPress.org
     */
    public function install_theme($request) {
        $params = $request->get_json_params();
        $slug = isset($params['slug']) ? sanitize_text_field($params['slug']) : '';
        
        if (empty($slug)) {
            return new WP_Error('missing_slug', __('Theme slug is required', 'wp-manager-connector'), array('status' => 400));
        }
        
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/theme.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';
        
        // Get theme info from WordPress.org
        $api = themes_api('theme_information', array(
            'slug' => $slug,
            'fields' => array(
                'sections' => false,
                'rating' => false,
                'ratings' => false,
                'downloaded' => false,
                'download_link' => true,
            ),
        ));
        
        if (is_wp_error($api)) {
            return new WP_Error('theme_not_found', __('Theme not found on WordPress.org', 'wp-manager-connector'), array('status' => 404));
        }
        
        $upgrader = new Theme_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);
        
        if (is_wp_error($result)) {
            return new WP_Error('install_failed', $result->get_error_message(), array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'theme' => $slug,
            'message' => __('Theme installed successfully', 'wp-manager-connector'),
        ));
    }
    
    /**
     * Generate admin auto-login URL
     */
    public function generate_admin_login($request) {
        // Get the first admin user
        $admins = get_users(array(
            'role' => 'administrator',
            'number' => 1,
            'orderby' => 'ID',
            'order' => 'ASC',
        ));
        
        if (empty($admins)) {
            return new WP_Error('no_admin', __('No administrator found', 'wp-manager-connector'), array('status' => 404));
        }
        
        $admin = $admins[0];
        
        // Generate a one-time login token
        $token = wp_generate_password(32, false);
        $expiry = time() + 60; // Token expires in 60 seconds
        
        // Store the token in transient
        set_transient('wp_manager_login_token_' . $token, array(
            'user_id' => $admin->ID,
            'expiry' => $expiry,
        ), 60);
        
        // Generate the login URL
        $login_url = add_query_arg(array(
            'wp_manager_auto_login' => $token,
        ), admin_url());
        
        return rest_ensure_response(array(
            'success' => true,
            'login_url' => $login_url,
            'expires_in' => 60,
        ));
    }
    
    /**
     * Get all users with roles
     */
    public function get_users($request) {
        $users = get_users(array(
            'orderby' => 'registered',
            'order' => 'DESC',
        ));
        
        $result = array();
        
        foreach ($users as $user) {
            $result[] = array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'roles' => $user->roles,
                'registered' => $user->user_registered,
            );
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get site stats (file count, DB size)
     */
    public function get_site_stats($request) {
        global $wpdb;
        
        // Get database size
        $db_size = 0;
        $tables = $wpdb->get_results("SHOW TABLE STATUS", ARRAY_A);
        if ($tables) {
            foreach ($tables as $table) {
                $db_size += $table['Data_length'] + $table['Index_length'];
            }
        }
        
        // Get uploads directory size and file count
        $uploads_dir = wp_upload_dir();
        $uploads_path = $uploads_dir['basedir'];
        $uploads_size = 0;
        $file_count = 0;
        
        if (is_dir($uploads_path)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($uploads_path, RecursiveDirectoryIterator::SKIP_DOTS)
            );
            
            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $uploads_size += $file->getSize();
                    $file_count++;
                }
            }
        }
        
        // Get content counts
        $total_posts = wp_count_posts('post');
        $total_pages = wp_count_posts('page');
        $total_comments = wp_count_comments();
        
        return rest_ensure_response(array(
            'file_count' => $file_count,
            'db_size' => $this->format_size($db_size),
            'db_size_bytes' => $db_size,
            'uploads_size' => $this->format_size($uploads_size),
            'uploads_size_bytes' => $uploads_size,
            'total_posts' => $total_posts->publish ?? 0,
            'total_pages' => $total_pages->publish ?? 0,
            'total_comments' => $total_comments->approved ?? 0,
        ));
    }
    
    /**
     * Format bytes to human readable size
     */
    private function format_size($bytes) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
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

// Handle auto-login
add_action('init', function() {
    if (!isset($_GET['wp_manager_auto_login'])) {
        return;
    }
    
    $token = sanitize_text_field($_GET['wp_manager_auto_login']);
    $token_data = get_transient('wp_manager_login_token_' . $token);
    
    if (!$token_data) {
        wp_die(__('Invalid or expired login link. Please request a new one from WP Manager.', 'wp-manager-connector'));
    }
    
    // Delete the token immediately (one-time use)
    delete_transient('wp_manager_login_token_' . $token);
    
    // Check if token is expired
    if (time() > $token_data['expiry']) {
        wp_die(__('Login link has expired. Please request a new one from WP Manager.', 'wp-manager-connector'));
    }
    
    // Log in the user
    $user_id = $token_data['user_id'];
    $user = get_user_by('id', $user_id);
    
    if (!$user) {
        wp_die(__('User not found.', 'wp-manager-connector'));
    }
    
    // Clear any existing auth cookies
    wp_clear_auth_cookie();
    
    // Set auth cookie
    wp_set_auth_cookie($user_id, true);
    wp_set_current_user($user_id);
    
    // Redirect to admin dashboard
    wp_redirect(admin_url());
    exit;
});

// Initialize the plugin
WP_Manager_Connector::get_instance();

