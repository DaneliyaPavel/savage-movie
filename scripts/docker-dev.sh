#!/bin/bash
# Unified helper for dev Docker Compose actions.

set -e

COMPOSE_FILE="docker-compose.dev.yml"

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

restart_containers() {
    $COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --force-recreate
}

rebuild_containers() {
    $COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans
    $COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --force-recreate
}

show_menu() {
    echo "Select action:"
    echo "1) Restart containers (no build)"
    echo "2) Rebuild images (no cache)"
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
