#!/usr/bin/env python3
"""Run the simulation with a local HTTP server and open the browser automatically.

Double-click or execute this script from the project root. It will start a
ThreadingHTTPServer that serves the repository directory, open the default
browser to the correct URL, and keep running until you close the window or stop
it with Ctrl+C.
"""
from __future__ import annotations

import argparse
import http.server
import os
import sys
import threading
import webbrowser
from functools import partial
from typing import Iterable, Optional

DEFAULT_PORT = 8000
MAX_PORT_PROBES = 20


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help=(
            "Port to bind. If omitted, the script will try %d and the next %d"
            " ports until one is free."
        )
        % (DEFAULT_PORT, MAX_PORT_PROBES - 1),
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically open the default browser.",
    )
    return parser.parse_args()


def iter_candidate_ports(start: int) -> Iterable[int]:
    for port in range(start, start + MAX_PORT_PROBES):
        yield port


def create_server(
    port: Optional[int], handler_factory
) -> http.server.ThreadingHTTPServer:
    """Create a server, probing ports if needed."""
    last_error: Optional[OSError] = None
    if port is not None:
        return http.server.ThreadingHTTPServer(("0.0.0.0", port), handler_factory)

    for candidate in iter_candidate_ports(DEFAULT_PORT):
        try:
            return http.server.ThreadingHTTPServer(("0.0.0.0", candidate), handler_factory)
        except OSError as exc:  # port in use
            last_error = exc
            continue

    if last_error is not None:
        raise last_error
    raise RuntimeError("Failed to create HTTP server")


def main() -> int:
    args = parse_args()
    root = os.path.abspath(os.path.dirname(__file__))
    handler_factory = partial(http.server.SimpleHTTPRequestHandler, directory=root)

    try:
        httpd = create_server(args.port, handler_factory)
    except OSError as exc:
        print(f"Could not start server on port {args.port or DEFAULT_PORT}: {exc}")
        return 1

    url = f"http://localhost:{httpd.server_port}/"
    print("Serving project files from:", root)
    print("Open the simulator at:", url)
    print("Press Ctrl+C to stop the server. The window can stay open while you use the app.")

    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        httpd.server_close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
