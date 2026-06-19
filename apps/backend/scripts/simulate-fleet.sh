#!/bin/bash

BIKES=("BIKE_001" "BIKE_002" "BIKE_003" "BIKE_004" "BIKE_005")

echo "Iniciando frota de ${#BIKES[@]} bikes em Maceió..."

for BIKE in "${BIKES[@]}"; do
  node ~/git/bikeshare/apps/backend/scripts/simulate-bike.js $BIKE &
  echo "Iniciada: $BIKE (PID: $!)"
  sleep 0.5
done

echo ""
echo "Todas as bikes rodando. Pressione Ctrl+C para parar."
wait
