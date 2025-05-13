# BJT Product Management System API

This solution leverages WordPress's built-in REST API capabilities to create a comprehensive API for the BJT Product Management System. It provides endpoints for managing product lines, host models, accessory models, parts, accessories, consumables, spare parts, and more.

## Features

- **RESTful API**: Standard REST API using WordPress's API framework
- **JWT Authentication**: Secure API with JWT tokens
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality for all entities
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Relationship Endpoints**: API endpoints to reflect data relationships (e.g., host models for a product line)

## Installation

1. **Copy Plugin Files**: Copy the following files to your WordPress plugin directory:
   - `bjt-product-api.php`
   - `bjt-api-auth.php`
   - `bjt-api-docs.php`

2. **Activate Plugins**: Activate all three plugins from the WordPress admin dashboard.

3. **Configure JWT Secret**: For security in a production environment, define a JWT secret key in your `wp-config.php` file:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your_secure_random_string_here');
   ```

## API Endpoints

The API is available at `/wp-json/bjt/v1/` and includes the following endpoints:

### Authentication
- `POST /bjt/v1/auth/login` - Login and get JWT token
- `POST /bjt/v1/auth/validate` - Validate JWT token

### Product Lines
- `GET /bjt/v1/product-lines` - List all product lines
- `GET /bjt/v1/product-lines/{id}` - Get a specific product line
- `POST /bjt/v1/product-lines` - Create a product line
- `PUT /bjt/v1/product-lines/{id}` - Update a product line
- `DELETE /bjt/v1/product-lines/{id}` - Delete a product line

### Host Models
- `GET /bjt/v1/host-models` - List all host models
- `GET /bjt/v1/host-models/{id}` - Get a specific host model
- `GET /bjt/v1/product-lines/{id}/host-models` - Get host models for a product line
- `POST /bjt/v1/host-models` - Create a host model
- `PUT /bjt/v1/host-models/{id}` - Update a host model
- `DELETE /bjt/v1/host-models/{id}` - Delete a host model

### More endpoints available for:
- Accessory Models
- Parts
- Accessories
- Consumables
- Spare Parts
- Relations
- etc.

## Documentation

The API includes built-in documentation accessible at:

- `GET /bjt/v1/docs/swagger` - OpenAPI specification in JSON format
- `GET /bjt/v1/docs/ui` - Interactive Swagger UI documentation

## Authentication

Most GET endpoints are publicly accessible, while POST, PUT, and DELETE endpoints require authentication:

1. Get a token by sending a POST request to `/bjt/v1/auth/login` with:
   ```json
   {
     "username": "your_wordpress_username",
     "password": "your_wordpress_password"
   }
   ```

2. Use the returned token in all subsequent requests that require authentication:
   ```
   Authorization: Bearer your_token_here
   ```

## Example Usage

### Get all product lines
```bash
curl http://your-wordpress-site.com/wp-json/bjt/v1/product-lines
```

### Login
```bash
curl -X POST http://your-wordpress-site.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Create a product line
```bash
curl -X POST http://your-wordpress-site.com/wp-json/bjt/v1/product-lines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "title_zh": "新产品线",
    "title_en": "New Product Line",
    "code": "new_line",
    "description_zh": "产品线描述",
    "description_en": "Product line description"
  }'
```

## Extending the API

To add more endpoints or customize existing ones:

1. Edit `bjt-product-api.php` to register additional routes
2. Implement controller methods for the new routes
3. Update the documentation in `bjt-api-docs.php`

## Customizing Authentication

The authentication system uses a simple JWT implementation. For a production environment, consider using a well-tested JWT library like `firebase/php-jwt` or a plugin like "JWT Authentication for WP REST API".

## Troubleshooting

- Ensure your WordPress permalink settings are set to "Post name" for proper REST API functionality
- Check that all three plugins are activated
- Verify that JWT authentication is working by testing the login endpoint
- Look for errors in the WordPress debug log if API requests are failing 