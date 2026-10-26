"""Local preview of docs/ (python3 tools/serve.py [port])."""
import functools, http.server, os, pathlib, sys
DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"
os.chdir(DOCS)
port = int(os.environ.get("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 9113))
h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DOCS))
http.server.ThreadingHTTPServer(("127.0.0.1", port), h).serve_forever()
