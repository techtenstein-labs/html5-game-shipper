#!/bin/bash
# submit_helpers.sh — Playgama + itch.io submission API wrappers.
# Sourced by daily-html5-game-shipper. Both require tokens in env.
#
# Required:
#   PLAYGAMA_TOKEN  (Bearer token from developer.playgama.com)
#   BUTLER_API_KEY  (from itch.io/user/settings/api-keys — used by butler CLI)
#   ITCH_USERNAME   (your itch.io username, e.g. "techtenstein-labs")

# ---------- PLAYGAMA ----------

# playgama_submit ZIP_PATH NAME SLUG COVER_PATH ORIENTATION
# Uploads game zip + cover, creates listing, submits for review.
# Returns JSON with game_id + review status. Non-blocking (async review).
playgama_submit() {
  local zip="$1" name="$2" slug="$3" cover="$4" orientation="${5:-portrait}"
  [ -z "$PLAYGAMA_TOKEN" ] && { echo '{"error":"PLAYGAMA_TOKEN missing"}'; return 1; }
  [ -s "$zip" ] || { echo '{"error":"zip missing or empty"}'; return 1; }

  curl -sS -X POST "https://api.playgama.com/v1/games" \
    -H "Authorization: Bearer $PLAYGAMA_TOKEN" \
    -F "name=$name" \
    -F "slug=$slug" \
    -F "orientation=$orientation" \
    -F "package=@$zip" \
    -F "cover=@$cover" \
    -F 'platforms=["playgama","crazygames","game_distribution","yandex","youtube_playables","poki","xiaomi"]'
}

# playgama_status GAME_ID
playgama_status() {
  local id="$1"
  curl -sS -X GET "https://api.playgama.com/v1/games/$id" \
    -H "Authorization: Bearer $PLAYGAMA_TOKEN"
}

# ---------- ITCH.IO (via butler) ----------

# itch_install_butler — one-time; caches butler binary in /tmp/butler.
itch_install_butler() {
  if [ -x /tmp/butler/butler ]; then return 0; fi
  mkdir -p /tmp/butler && cd /tmp/butler
  # Linux amd64 (Cowork sandbox)
  curl -sSL "https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default" -o butler.zip
  unzip -q butler.zip && chmod +x butler
  ./butler -V >&2
}

# itch_submit ZIP_PATH SLUG (uploads to $ITCH_USERNAME/$SLUG:html on itch.io)
# butler auto-creates the game if it doesn't exist; instantly publishes web builds.
itch_submit() {
  local zip="$1" slug="$2"
  [ -z "$BUTLER_API_KEY" ] && { echo '{"error":"BUTLER_API_KEY missing"}'; return 1; }
  [ -z "$ITCH_USERNAME" ] && { echo '{"error":"ITCH_USERNAME missing"}'; return 1; }
  [ -s "$zip" ] || { echo '{"error":"zip missing or empty"}'; return 1; }
  itch_install_butler
  export BUTLER_API_KEY
  /tmp/butler/butler push "$zip" "$ITCH_USERNAME/$slug:html" --userversion "$(date +%Y.%m.%d)"
  echo "{\"itch_url\":\"https://$ITCH_USERNAME.itch.io/$slug\"}"
}

# itch_smoke_test — verify butler auth works.
itch_smoke_test() {
  itch_install_butler
  export BUTLER_API_KEY
  /tmp/butler/butler login --assume-yes 2>&1 | head -3
}

# ---------- METADATA GENERATOR (for CrazyGames + GamePix email checklist) ----------

# generate_submit_metadata NAME MECHANIC_ID THEME > metadata.json
# Produces per-portal metadata (title, description, tags, category, controls).
generate_submit_metadata() {
  local name="$1" mechanic="$2" theme="$3"
  jq -n \
    --arg n "$name" --arg m "$mechanic" --arg t "$theme" \
    '{
      title: $n,
      short_description: "\($n) — a \($t) \($m | gsub("_"; " ")) game. One-button, quick to learn, hard to master.",
      long_description: "Fast-paced \($t) themed \($m | gsub("_"; " ")) game. Play instantly, no download. Beat your best score. Mobile + desktop optimized. Built by Techtenstein.",
      tags: (
        (["casual","hyper-casual","arcade","one-button","mobile-friendly","html5"] +
         ($m | split("_")) +
         ($t | split(" ")))
        | map(select(length > 2)) | unique | .[0:10]
      ),
      category: (
        if ($m | test("puzzle|match3|merge")) then "Puzzle"
        elif ($m | test("shooter|physics")) then "Action"
        elif ($m | test("runner|flapper|stacker")) then "Arcade"
        elif ($m | test("snake|reaction|bubble|brick")) then "Arcade"
        else "Casual" end
      ),
      controls: (
        if ($m | test("flapper|stacker|reaction|runner")) then "Tap / Click"
        elif ($m | test("snake|match3|merge|bubble|physics")) then "Swipe / Drag"
        elif ($m | test("brick")) then "Drag paddle, tap to launch"
        else "Tap / Click" end
      ),
      orientation: "portrait"
    }'
}
