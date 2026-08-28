#!/bin/sh
# Unsigned ListBuckets: HTTP 200 + ListAllMyBucketsResult or HTTP 403 + Error XML.
# Empty GET /status 200 is process liveness, not S3 readiness (no IAM/filer).
set -eu

body=$(mktemp)
trap 'rm -f "$body"' EXIT

http_code=$(curl -sS -o "$body" -w '%{http_code}' --max-time 4 http://127.0.0.1:8333/) || exit 1

if [ "$http_code" != "200" ] && [ "$http_code" != "403" ]; then
  exit 1
fi

# Busybox grep has no `\s`; match the element names, not a full XML schema.
grep -qE 'ListAllMyBucketsResult|<Error' "$body"
