#!/bin/bash
set -e

COMPOSE="docker compose -p e-commerce"

echo "=== Tests Frontend ==="
$COMPOSE run --rm frontend-test

echo ""
echo "=== Tests Backend ==="
$COMPOSE run --rm backend-test

echo ""
echo "Todos los tests han pasado."
