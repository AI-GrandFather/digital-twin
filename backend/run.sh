#!/bin/sh
set -eu

# Lambda Web Adapter launches this HTTP server and forwards Lambda Function URL
# requests to it. It also preserves StreamingResponse chunk boundaries.
exec uvicorn server:app --host 0.0.0.0 --port "${AWS_LWA_PORT:-8000}"
