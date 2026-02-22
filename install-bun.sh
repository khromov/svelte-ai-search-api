#!/bin/bash
BUN_VERSION=$(cat "$(dirname "$0")/.bunversion" | tr -d '[:space:]')
curl -fsSL https://bun.com/install | bash -s "bun-${BUN_VERSION}"
