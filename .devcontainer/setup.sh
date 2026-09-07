#!/usr/bin/env bash
set -euo pipefail

npm ci

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example. Add the deployed contract address before running the app."
fi

npm run typecheck
