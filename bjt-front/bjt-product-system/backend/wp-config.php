<?php
/**
 * The base configuration for WordPress
 */

// ** Database settings ** //
define( "DB_NAME", "bjt_product" );
define( "DB_USER", "wordpress" );
define( "DB_PASSWORD", "wordpress" );
define( "DB_HOST", "mysql" );
define( "DB_CHARSET", "utf8mb4" );
define( "DB_COLLATE", "" );

/**#@+
 * Authentication Unique Keys and Salts.
 */
define( "AUTH_KEY",         "put your unique phrase here" );
define( "SECURE_AUTH_KEY",  "put your unique phrase here" );
define( "LOGGED_IN_KEY",    "put your unique phrase here" );
define( "NONCE_KEY",        "put your unique phrase here" );
define( "AUTH_SALT",        "put your unique phrase here" );
define( "SECURE_AUTH_SALT", "put your unique phrase here" );
define( "LOGGED_IN_SALT",   "put your unique phrase here" );
define( "NONCE_SALT",       "put your unique phrase here" );

/**#@-*/

/**
 * WordPress Database Table prefix.
 */
$table_prefix = "wp_";

/**
 * For developers: WordPress debugging mode.
 */
define( "WP_DEBUG", false );

/* That is all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( "ABSPATH" ) ) {
	define( "ABSPATH", __DIR__ . "/" );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . "wp-settings.php";
