-- Create WordPress database and user
CREATE DATABASE IF NOT EXISTS bjt_product;
CREATE USER IF NOT EXISTS 'wordpress'@'%' IDENTIFIED BY 'wordpress';
GRANT ALL PRIVILEGES ON bjt_product.* TO 'wordpress'@'%';
FLUSH PRIVILEGES; 