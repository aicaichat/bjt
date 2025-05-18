#!/bin/bash

# Directory containing controller files
CONTROLLERS_DIR="plugins/bjt-core-entities/controllers"

# Loop through all PHP files in the controllers directory
for file in "$CONTROLLERS_DIR"/*.php; do
  echo "Processing $file..."
  
  # Use sed to replace 'protected $resource_name' with 'public $resource_name'
  sed -i '' 's/protected \$resource_name/public \$resource_name/g' "$file"
  
  echo "Updated $file"
done

echo "All controller files have been updated." 