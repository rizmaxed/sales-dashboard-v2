FROM nginx:stable

# Set working directory
WORKDIR /

# Copy static HTML
COPY public/index.html /usr/share/nginx/html/index.html

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use custom entrypoint to inject environment variable
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]