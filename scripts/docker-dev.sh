#!/bin/bash
# Fast Docker Compose helper for local dev.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed."
    exit 1
fi

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "Docker Compose is not installed."
        exit 1
    fi
fi

ensure_upload_dirs() {
    mkdir -p "$ROOT_DIR/backend/uploads/images" "$ROOT_DIR/backend/uploads/videos"
}

restart_containers() {
    ensure_upload_dirs
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build --remove-orphans
}

rebuild_containers() {
    ensure_upload_dirs
    $COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --force-recreate --remove-orphans
}

show_menu() {
    echo "Select action:"
    echo "1) Fast restart (build if code changed)"
    echo "2) Full rebuild (no cache)"
    echo "3) Exit"
    read -r -p "Choice [1-3]: " choice

    case "$choice" in
        1) restart_containers ;;
        2) rebuild_containers ;;
        3) exit 0 ;;
        *) echo "Invalid choice."; exit 1 ;;
    esac
}

case "${1:-}" in
    restart) restart_containers ;;
    rebuild) rebuild_containers ;;
    ""|menu) show_menu ;;
    *)
        echo "Usage: $0 [restart|rebuild|menu]"
        exit 1
        ;;
esac

echo "Done. Logs: $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
