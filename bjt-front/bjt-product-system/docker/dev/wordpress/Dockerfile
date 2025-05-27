FROM wordpress:php8.0

# Install dependencies (closer to your potential original list)
RUN apt-get update && apt-get install -y \
    curl \
    less \
    mariadb-client \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Copy WP-CLI binary directly
# IMPORTANT: This requires you to have a file named "wp-cli.phar"
# in the same directory as this Dockerfile (docker/dev/wordpress/)
# or adjust the source path in the COPY command if it's elsewhere
# relative to the Dockerfile.
COPY wp-cli.phar /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp

# Set working directory
WORKDIR /var/www/html 