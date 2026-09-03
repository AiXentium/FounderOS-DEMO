#!/bin/bash
# Test WordPress Connection
# Usage: ./scripts/test-wordpress-connection.sh

set -e

WORDPRESS_URL="${WORDPRESS_URL:-https://letstalkmilesandtravel.com}"
WORDPRESS_USERNAME="${WORDPRESS_USERNAME:-letstalkmilesandtravel@gmail.com}"
WORDPRESS_APP_PASSWORD="${WORDPRESS_APP_PASSWORD:-}"

if [ -z "$WORDPRESS_APP_PASSWORD" ]; then
  echo "❌ ERROR: WORDPRESS_APP_PASSWORD is not set"
  echo ""
  echo "Set it in .env.local or export it:"
  echo "  export WORDPRESS_APP_PASSWORD='your-app-password'"
  exit 1
fi

echo "🔍 Testing WordPress Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL:      $WORDPRESS_URL"
echo "Username: $WORDPRESS_USERNAME"
echo ""

# Test 1: REST API Available
echo "✓ Test 1: REST API Availability"
REST_RESPONSE=$(curl -s "$WORDPRESS_URL/wp-json/" | jq '.namespaces' 2>/dev/null)
if [ -n "$REST_RESPONSE" ]; then
  echo "  ✅ WordPress REST API is available"
else
  echo "  ❌ WordPress REST API not accessible"
  exit 1
fi

# Test 2: Authentication
echo ""
echo "✓ Test 2: Authentication"
AUTH_HEADER=$(printf "%s:%s" "$WORDPRESS_USERNAME" "$WORDPRESS_APP_PASSWORD" | base64)

RESPONSE=$(curl -s -X GET "$WORDPRESS_URL/wp-json/wp/v2/users/me" \
  -H "Authorization: Basic $AUTH_HEADER")

if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  USER_ID=$(echo "$RESPONSE" | jq -r '.id')
  USER_NAME=$(echo "$RESPONSE" | jq -r '.name')
  USER_ROLES=$(echo "$RESPONSE" | jq -r '.roles[]' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
  echo "  ✅ Authentication successful"
  echo "     User ID: $USER_ID"
  echo "     Name: $USER_NAME"
  echo "     Roles: $USER_ROLES"
else
  if echo "$RESPONSE" | grep -q "rest_not_logged_in"; then
    echo "  ❌ Authentication failed: Invalid credentials"
  else
    echo "  ❌ Authentication error: $(echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE")"
  fi
  exit 1
fi

# Test 3: Abilities API
echo ""
echo "✓ Test 3: Abilities API (WordPress 6.9+)"
ABILITIES_RESPONSE=$(curl -s -X GET "$WORDPRESS_URL/wp-json/wp-abilities/v1/abilities" \
  -H "Authorization: Basic $AUTH_HEADER")

if echo "$ABILITIES_RESPONSE" | jq -e '.' > /dev/null 2>&1; then
  ABILITY_COUNT=$(echo "$ABILITIES_RESPONSE" | jq 'keys | length')
  echo "  ✅ Abilities API available"
  echo "     Found $ABILITY_COUNT abilities"
else
  echo "  ⚠️  Abilities API not available (WordPress < 6.9 or not enabled)"
fi

# Test 4: Posts
echo ""
echo "✓ Test 4: Posts API"
POSTS_RESPONSE=$(curl -s -X GET "$WORDPRESS_URL/wp-json/wp/v2/posts?per_page=1" \
  -H "Authorization: Basic $AUTH_HEADER")

if echo "$POSTS_RESPONSE" | jq -e '.[0].id' > /dev/null 2>&1; then
  POST_COUNT=$(curl -s -I "$WORDPRESS_URL/wp-json/wp/v2/posts" \
    -H "Authorization: Basic $AUTH_HEADER" | grep -i "X-WP-Total:" | awk '{print $2}')
  echo "  ✅ Posts API working"
  echo "     Total posts: ${POST_COUNT:-unknown}"
else
  echo "  ⚠️  Posts API error: $(echo "$POSTS_RESPONSE" | jq -r '.message' 2>/dev/null || echo "Unknown")"
fi

# Test 5: Pages
echo ""
echo "✓ Test 5: Pages API"
PAGES_RESPONSE=$(curl -s -X GET "$WORDPRESS_URL/wp-json/wp/v2/pages?per_page=1" \
  -H "Authorization: Basic $AUTH_HEADER")

if echo "$PAGES_RESPONSE" | jq -e '.[0].id' > /dev/null 2>&1; then
  echo "  ✅ Pages API working"
else
  echo "  ⚠️  Pages API error: $(echo "$PAGES_RESPONSE" | jq -r '.message' 2>/dev/null || echo "Unknown")"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ WordPress connection verified!"
echo ""
echo "Next steps:"
echo "1. Restart Business OS dev server"
echo "2. Navigate to Connections page"
echo "3. Verify WordPress shows as CONNECTED"
