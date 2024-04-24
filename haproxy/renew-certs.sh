#!/bin/bash

# Switch to super user for `letsencrypt` directory access
su

# Update certificates
certbot certonly --noninteractive --agree-tos --cert-name shinzo.app --standalone \
-d api.shinzo.app \
-d api.stage.shinzo.app \
-d dashboard.shinzo.app \
-d dashboard.stage.shinzo.app

# Create bundled.pem file
touch /etc/letsencrypt/live/shinzo.app/bundled.pem

# Bundle fullchain.pem and privKey.pem into single bundled.pem for haproxy
cat /etc/letsencrypt/live/shinzo.app/fullchain.pem /etc/letsencrypt/live/shinzo.app/privkey.pem > /etc/letsencrypt/live/shinzo.app/bundled.pem
