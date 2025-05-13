# BJT Product System API Documentation

Base URL: http://localhost:8080/wp-json/bjt/v1

## Authentication

All API requests require authentication using WordPress REST API authentication methods. The recommended method is to use the Application Password feature.

## Product Lines

### Get All Product Lines

```
GET http://localhost:8080/wp-json/bjt/v1/product-lines
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| order | string | Order direction (asc, desc) |
| orderby | string | Order by field (id, title_zh, title_en, code, sort_order) |
| status | string | Filter by status (publish, draft, trash) |
| lang | string | Language for titles and descriptions (zh, en) |

Example Response:

```json
[
  {
    "id": 1,
    "title": "Bubble Wrap",
    "description": "Bubble wrap products line",
    "subitems": [
      "Standard Bubble",
      "Anti-static Bubble",
      "Kraft Bubble"
    ],
    "image_url": "https://example.com/images/bubble-wrap.jpg",
    "code": "BW",
    "status": "publish",
    "sort_order": 1,
    "created_at": "2023-01-01 00:00:00",
    "updated_at": "2023-01-01 00:00:00"
  }
]
```

### Get Product Line

```
GET http://localhost:8080/wp-json/bjt/v1/product-lines/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Product Line ID |

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| lang | string | Language for titles and descriptions (zh, en) |

### Create Product Line

```
POST http://localhost:8080/wp-json/bjt/v1/product-lines
```

Request Body:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title_zh | string | Yes | Chinese title |
| title_en | string | Yes | English title |
| description_zh | string | No | Chinese description |
| description_en | string | No | English description |
| subitem1_zh | string | No | Chinese subitem 1 |
| subitem1_en | string | No | English subitem 1 |
| subitem2_zh | string | No | Chinese subitem 2 |
| subitem2_en | string | No | English subitem 2 |
| subitem3_zh | string | No | Chinese subitem 3 |
| subitem3_en | string | No | English subitem 3 |
| image_url | string | No | Image URL |
| code | string | Yes | Product line code |
| status | string | No | Status (publish, draft, trash) |
| sort_order | integer | No | Sort order |

### Update Product Line

```
PUT http://localhost:8080/wp-json/bjt/v1/product-lines/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Product Line ID |

Request Body: Same as Create Product Line

### Delete Product Line

```
DELETE http://localhost:8080/wp-json/bjt/v1/product-lines/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Product Line ID |

### Get Host Models for Product Line

```
GET http://localhost:8080/wp-json/bjt/v1/product-lines/{id}/host-models
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Product Line ID |

Query Parameters: Same as Get All Host Models

## Host Models

### Get All Host Models

```
GET http://localhost:8080/wp-json/bjt/v1/host-models
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| order | string | Order direction (asc, desc) |
| orderby | string | Order by field (id, model_number, model_name, name_en, sort_order) |
| status | string | Filter by status (publish, draft, trash) |
| product_line_id | integer | Filter by product line ID |
| lang | string | Language for titles and descriptions (zh, en) |

### Get Host Model

```
GET http://localhost:8080/wp-json/bjt/v1/host-models/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Host Model ID |

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| lang | string | Language for titles and descriptions (zh, en) |

### Create Host Model

```
POST http://localhost:8080/wp-json/bjt/v1/host-models
```

Request Body:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_line_id | integer | Yes | Product Line ID |
| model_number | string | Yes | Model number |
| model_name | string | Yes | Chinese name |
| name_en | string | Yes | English name |
| description_zh | string | No | Chinese description |
| description_en | string | No | English description |
| type | string | No | Host model type |
| image1_url | string | No | Main image URL |
| image2_url | string | No | Secondary image URL |
| explosion_diagram_pdf | string | No | Explosion diagram PDF URL |
| status | string | No | Status (publish, draft, trash) |
| sort_order | integer | No | Sort order |

### Update Host Model

```
PUT http://localhost:8080/wp-json/bjt/v1/host-models/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Host Model ID |

Request Body: Same as Create Host Model

### Delete Host Model

```
DELETE http://localhost:8080/wp-json/bjt/v1/host-models/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Host Model ID |

## Accessories

### Get All Accessories

```
GET http://localhost:8080/wp-json/bjt/v1/accessories
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| order | string | Order direction (asc, desc) |
| orderby | string | Order by field (id, model, part_number) |
| status | string | Filter by status (publish, draft, trash) |
| product_line_id | integer | Filter by product line ID |
| model | string | Filter by model |
| lang | string | Language for titles and descriptions (zh, en) |

### Get Accessory

```
GET http://localhost:8080/wp-json/bjt/v1/accessories/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Accessory ID |

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| lang | string | Language for titles and descriptions (zh, en) |

### Create Accessory

```
POST http://localhost:8080/wp-json/bjt/v1/accessories
```

Request Body: Contains all fields corresponding to the accessory database table

### Update Accessory

```
PUT http://localhost:8080/wp-json/bjt/v1/accessories/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Accessory ID |

Request Body: Same as Create Accessory

### Delete Accessory

```
DELETE http://localhost:8080/wp-json/bjt/v1/accessories/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Accessory ID |

## Consumables

### Get All Consumables

```
GET http://localhost:8080/wp-json/bjt/v1/consumables
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| order | string | Order direction (asc, desc) |
| orderby | string | Order by field (id, model, part_number) |
| status | string | Filter by status (publish, draft, trash) |
| product_line_id | integer | Filter by product line ID |
| model | string | Filter by model |
| material | string | Filter by material |
| bag_type | string | Filter by bag type |

### Get Consumable

```
GET http://localhost:8080/wp-json/bjt/v1/consumables/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Consumable ID |

### Create Consumable

```
POST http://localhost:8080/wp-json/bjt/v1/consumables
```

Request Body: Contains all fields corresponding to the consumable database table

### Update Consumable

```
PUT http://localhost:8080/wp-json/bjt/v1/consumables/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Consumable ID |

Request Body: Same as Create Consumable

### Delete Consumable

```
DELETE http://localhost:8080/wp-json/bjt/v1/consumables/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Consumable ID |

## Spare Parts

### Get All Spare Parts

```
GET http://localhost:8080/wp-json/bjt/v1/spare-parts
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| order | string | Order direction (asc, desc) |
| orderby | string | Order by field (id, part_number, name_zh, name_en) |
| status | string | Filter by status (publish, draft, trash) |
| product_line_id | integer | Filter by product line ID |
| app_model | string | Filter by applicable model |
| is_consumable | boolean | Filter by consumable status |
| lang | string | Language for titles and descriptions (zh, en) |

### Get Spare Part

```
GET http://localhost:8080/wp-json/bjt/v1/spare-parts/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Spare Part ID |

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| lang | string | Language for titles and descriptions (zh, en) |

### Create Spare Part

```
POST http://localhost:8080/wp-json/bjt/v1/spare-parts
```

Request Body: Contains all fields corresponding to the spare parts database table

### Update Spare Part

```
PUT http://localhost:8080/wp-json/bjt/v1/spare-parts/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Spare Part ID |

Request Body: Same as Create Spare Part

### Delete Spare Part

```
DELETE http://localhost:8080/wp-json/bjt/v1/spare-parts/{id}
```

Path Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Spare Part ID |

