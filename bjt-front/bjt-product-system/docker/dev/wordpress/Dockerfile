FROM wordpress:php8.0

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    less \
    mariadb-client \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Copy WP-CLI binary directly
COPY wp-cli.phar /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp

# Set working directory
WORKDIR /var/www/html 