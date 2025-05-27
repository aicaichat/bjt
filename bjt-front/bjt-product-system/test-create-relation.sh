#!/bin/bash

echo "Creating test relation..."

# Create a host machine relation (no parent_part_number)
curl -X POST "http://localhost:8080/wp-json/bjt/v1/relations" \
  -H "Content-Type: application/json" \
  -d '{
    "product_line_id": 1,
    "part_number": "HOST002",
    "child_part_number": "ACC003",
    "child_type": "accessory",
    "level": 1,
    "quantity": 2,
    "status": "publish"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n\nCreating child accessory relation..."

# Create a child accessory relation
curl -X POST "http://localhost:8080/wp-json/bjt/v1/relations" \
  -H "Content-Type: application/json" \
  -d '{
    "product_line_id": 1,
    "part_number": "ACC003",
    "parent_part_number": "HOST002",
    "child_part_number": "ACC004",
    "child_type": "accessory",
    "level": 2,
    "quantity": 1,
    "status": "publish"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n\nDone." 