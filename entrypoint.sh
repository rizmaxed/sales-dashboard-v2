#!/bin/bash
set -e

# Inject API endpoint into index.html at runtime
sed -i "s|{{API_ENDPOINT}}|${API_ENDPOINT}|g" /usr/share/nginx/html/index.html

# Start Nginx in foreground mode with proper signal handling
exec nginx -g "daemon off;"