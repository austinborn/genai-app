# Shinzo HA Proxy Instance
HA Proxy is necessary to route and load balance requests to the shinzo.app domain between the web app and backend services. For other users please modify the domains as needed for your own endpoints.

## Prerequisites
- [certbot](https://certbot.eff.org/instructions?ws=haproxy&os=ubuntufocal)
- Domain routing to local network for all subdomains (either static IP or Dynamic DNS)
- Port forwarding on local network router for 80 and 443 to this HA Proxy
- Make `renew-certs.sh` executable

## Renewing certificates
To start, for now you need to kill any haproxy instances listening to port `80` since we are running `certbot --standalone`. This kills the entire app though, so this should be fixed to be `--webroot` after the web app is set to support hosting the certificate files correctly (TODO).

Finding processes listening to port `80`:
```
sudo netstat -tulpn
```
Terminate processes:
```
sudo kill -15 <pid>
```
Run `certbot` to renew certificates:
```
sudo ./renew-certs.sh
```
Test new config:
```
sudo haproxy -c -f haproxy.cfg
```
Run new config in background:
```
sudo haproxy -D -f haproxy.cfg
```
After updating new certs, be sure to update the expiration date in `haproxy.cfg`.

## Frontends
| External Port | Behavior                                     |
| :-----------: | :------------------------------------------: |
| 80            | Forward to HTTPS (on port 443)               |
| 443           | Route request based on subdomain (see below) |

## Backends
| URL                        | Env        | Service     | Internal Port |
| :------------------------: | :---------:| :---------: | :-----------: |
| dashboard.shinzo.app       | Production | Web App     | 3000          |
| api.shinzo.app             | Production | API Backend | 8000          |
| dashboard.stage.shinzo.app | Stage      | Web App     | 3001          |
| api.stage.shinzo.app       | Stage      | API Backend | 8001          |
