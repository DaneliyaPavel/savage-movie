#!/bin/bash
# Compatibility wrapper for docker-dev.sh.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/docker-dev.sh" restart
