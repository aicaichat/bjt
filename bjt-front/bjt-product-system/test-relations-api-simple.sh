#!/bin/bash

echo "Testing Relations API..."

# Test GET request
echo "1. Testing GET /wp-json/bjt/v1/relations"
curl -X GET "http://localhost:8080/wp-json/bjt/v1/relations?page=1&page_size=10" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n\n2. Testing GET with specific product line"
curl -X GET "http://localhost:8080/wp-json/bjt/v1/relations?page=1&page_size=10&product_line_id=1" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\n\nDone." 