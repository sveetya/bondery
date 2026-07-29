#!/bin/sh
# Render SeaweedFS S3 credentials from BONDERY_PRIVATE_S3_* (single source: compose env).
set -eu

if [ -z "${BONDERY_PRIVATE_S3_ACCESS_KEY_ID:-}" ] || [ -z "${BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY:-}" ]; then
  echo "seaweedfs-s3: set BONDERY_PRIVATE_S3_ACCESS_KEY_ID and BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY" >&2
  exit 1
fi

escape_json() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

ACCESS_KEY=$(escape_json "$BONDERY_PRIVATE_S3_ACCESS_KEY_ID")
SECRET_KEY=$(escape_json "$BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY")

cat > /tmp/s3.json <<EOF
{
  "identities": [
    {
      "name": "bondery",
      "credentials": [
        {
          "accessKey": "${ACCESS_KEY}",
          "secretKey": "${SECRET_KEY}"
        }
      ],
      "actions": ["Admin", "Read", "Write", "List", "Tagging"]
    }
  ],
  "anonymous_actions": ["Read"]
}
EOF

exec weed s3 -filer=seaweedfs-filer:8888 -ip.bind=0.0.0.0 -port=8333 -config=/tmp/s3.json
