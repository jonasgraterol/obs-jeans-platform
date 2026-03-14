#!/bin/bash
# Post-build script: copies admin public files and applies branding
set -e

PROJECT_DIR="${1:-.}"
INDEX="$PROJECT_DIR/public/admin/index.html"

# Remove old public/ and copy fresh from build
rm -rf "$PROJECT_DIR/public"
cp -r "$PROJECT_DIR/.medusa/server/public" "$PROJECT_DIR/public"

# Copy favicon
cp "$PROJECT_DIR/src/admin/assets/favicon.png" "$PROJECT_DIR/public/admin/favicon.png"

# Patch index.html: add title and replace favicon placeholder
sed -i.bak \
  -e 's|</head>|<title>OBS Jeans Admin</title></head>|' \
  -e 's|<link rel="icon" href="data:," data-placeholder-favicon />|<link rel="icon" type="image/png" href="/app/favicon.png" />|' \
  "$INDEX"

# Cleanup backup files
rm -f "$INDEX.bak"

echo "Post-build branding applied successfully"
