"""Prevent browsers from reusing stale pages from ``mkdocs serve``.

Production hosts should manage their own cache policy. This hook runs only for
the local development server, where every response should reflect the latest
documentation build.
"""

import logging


log = logging.getLogger("mkdocs.bline_preview")


def on_serve(server, **_kwargs):
    """Add no-cache headers to the local preview server's WSGI responses."""
    original_app = server.get_app()

    def no_cache_app(environ, start_response):
        def no_cache_start_response(status, headers, exc_info=None):
            blocked = {"cache-control", "expires", "pragma"}
            headers = [(name, value) for name, value in headers if name.lower() not in blocked]
            headers.extend(
                [
                    ("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"),
                    ("Pragma", "no-cache"),
                    ("Expires", "0"),
                ]
            )
            return start_response(status, headers, exc_info)

        return original_app(environ, no_cache_start_response)

    server.set_app(no_cache_app)
    log.info("Local preview caching disabled")
    return server
