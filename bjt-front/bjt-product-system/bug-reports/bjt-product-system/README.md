# BJT Product Management System

A comprehensive WordPress plugin for managing product data, including product lines, host models, accessories, consumables, and spare parts. The plugin also provides a REST API for integrating with external applications.

## Features

- Manage product lines with multilingual support (Chinese and English)
- Manage host models, accessories, consumables, and spare parts
- Track inventory and pricing information
- Automatic API documentation generation in both Markdown and INI formats
- REST API endpoints for all product data
- Admin interface for easy data management
- Database initialization using SQL scripts

## Installation

1. Upload the `bjt-product-system` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. The plugin will automatically set up the database tables and generate API documentation

## Usage

### Admin Interface

The plugin adds several menu items to the WordPress admin interface:

- **BJT 产品系统**: Main dashboard with statistics and quick links
- **产品线管理**: Manage product lines
- **主机型号**: Manage host models
- **配件管理**: Manage accessories and parts
- **耗材管理**: Manage consumables
- **备件管理**: Manage spare parts
- **API 文档**: View and regenerate API documentation

### REST API

The plugin provides REST API endpoints for all product data. The base URL for the API is:

```
https://your-site.com/wp-json/bjt/v1/
```

For detailed API documentation, see the **API 文档** section in the admin interface or check the `docs/API-DOCUMENTATION.md` file.

### Database Structure

The plugin creates the following tables in the WordPress database:

- `wp_bjt_product_lines`: Product lines information
- `wp_bjt_host_models`: Host models information
- `wp_bjt_accessory_models`: Accessory models information
- `wp_bjt_parts`: Parts information
- `wp_bjt_accessories`: Accessories information
- `wp_bjt_consumables`: Consumables information
- `wp_bjt_spare_parts`: Spare parts information
- `wp_bjt_relations`: Relations between different items
- `wp_bjt_prices`: Pricing information
- `wp_bjt_inventory`: Inventory information
- Additional supporting tables for shapes, materials, specifications, etc.

## Developer Documentation

### Extending the API

To add new API endpoints, create a new endpoint class in the `api/endpoints` directory and register it in the `load_endpoints()` method of the `BJT_Product_System_API` class.

### Adding Custom Fields

To add custom fields to existing tables, you can:

1. Modify the SQL files in the `sql` directory
2. Update the corresponding endpoint classes to handle the new fields
3. Update the admin interface to display and manage the new fields

### Generating API Documentation

The plugin automatically generates API documentation in both Markdown and INI formats. To regenerate the documentation, visit the **API 文档** section in the admin interface and click the "Regenerate Documentation" button.

## Localization

The plugin supports both Chinese and English languages. All data can be stored in both languages, and the API provides a `lang` parameter to retrieve data in the specified language.

## Docker Deployment

To deploy this plugin in a Docker environment, follow these steps:

1. Ensure the plugin is copied to the plugins directory that's mounted in the WordPress container
2. Run the initialization script to activate the plugin:

```bash
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress /var/www/html/wp-content/plugins/bjt-product-system/docker/init.sh
```

The initialization script will:
- Check if the database is ready
- Handle potential plugin conflicts
- Activate the BJT Product System plugin
- Verify database tables are correctly set up

## Database Conflict Resolution

If you have multiple plugins using the same database tables (e.g., `bjt-product-admin` and `bjt-product-system`), you may encounter conflicts. This plugin includes a conflict management system to handle these situations.

### Conflict Detection

The plugin checks for existing tables that might have been created by other plugins and provides notifications when conflicts are detected.

### Resolution Strategies

1. **Plugin Deactivation**: Automatically deactivate conflicting plugins to prevent data corruption
2. **Table Ownership Tracking**: Mark tables as "owned" by this plugin to prevent conflicts
3. **Manual Resolution Options**: Admin notifications with instructions for resolving conflicts

### Using the Conflict Manager

The conflict manager is automatically run during plugin activation. If you need to run it manually:

```php
// In your WordPress code
if (class_exists('BJT_Table_Conflict_Manager')) {
    $conflicts = BJT_Table_Conflict_Manager::check_conflicts();
    if (!empty($conflicts)) {
        BJT_Table_Conflict_Manager::handle_conflicts($conflicts);
    }
}
```

## Support

For support or questions, please contact support@example.com.

## License

This plugin is licensed under the GPL v2 or later. 