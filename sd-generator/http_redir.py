from sanic import Sanic, exceptions, response

# https://sanic.dev/en/guide/how-to/tls.html#redirect-http-to-https-with-certificate-requests-still-over-http

http_redir = Sanic("http_redir")

# Serve ACME/certbot files without HTTPS, for certificate renewals
http_redir.static("/.well-known", "/var/www/.well-known", resource_type="dir")

@http_redir.exception(exceptions.NotFound, exceptions.MethodNotSupported)
def redirect_everything_else(request, exception):
  return response.text("Bad Request. Please use HTTPS!", status=400)
