#!/bin/bash

# Script para ejecutar tests en Docker Compose
# Uso: ./run_tests.sh [opciones]
# Opciones:
#   --app <app_name>    : Ejecutar tests de una app específica (authentication, ecommerce)
#   --verbose           : Mostrar salida detallada
#   --coverage          : Ejecutar con cobertura de código
#   --keepdb            : Mantener la base de datos de tests entre ejecuciones

echo "===========================================" 
echo "  Ejecutando Tests - E-Commerce Project"
echo "==========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables por defecto
VERBOSE=""
COVERAGE=false
KEEPDB=""
APP=""

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --app)
            APP="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE="--verbosity=2"
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --keepdb)
            KEEPDB="--keepdb"
            shift
            ;;
        *)
            echo -e "${RED}Opción desconocida: $1${NC}"
            exit 1
            ;;
    esac
done

# Verificar que los contenedores estén corriendo
echo -e "${YELLOW}Verificando contenedores Docker...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}Iniciando contenedores...${NC}"
    docker-compose up -d db web
    echo -e "${GREEN}Esperando a que la base de datos esté lista...${NC}"
    sleep 5
fi

# Ejecutar migraciones
echo -e "${YELLOW}Ejecutando migraciones...${NC}"
docker-compose exec -T web python manage.py migrate --noinput

# Construir comando de tests
TEST_CMD="python manage.py test"

if [ ! -z "$APP" ]; then
    TEST_CMD="$TEST_CMD $APP"
fi

if [ ! -z "$VERBOSE" ]; then
    TEST_CMD="$TEST_CMD $VERBOSE"
fi

if [ ! -z "$KEEPDB" ]; then
    TEST_CMD="$TEST_CMD $KEEPDB"
fi

# Ejecutar tests
echo ""
echo -e "${YELLOW}Ejecutando tests...${NC}"
echo -e "${YELLOW}Comando: $TEST_CMD${NC}"
echo ""

if [ "$COVERAGE" = true ]; then
    echo -e "${YELLOW}Ejecutando con cobertura de código...${NC}"
    docker-compose exec -T web coverage run --source='.' manage.py test $APP $VERBOSE $KEEPDB
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}Generando reporte de cobertura...${NC}"
        docker-compose exec -T web coverage report
        docker-compose exec -T web coverage html
        echo -e "${GREEN}Reporte HTML generado en: htmlcov/index.html${NC}"
    fi
else
    docker-compose exec -T web $TEST_CMD
    EXIT_CODE=$?
fi

# Resultado final
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Tests completados exitosamente${NC}"
else
    echo -e "${RED}✗ Algunos tests fallaron${NC}"
fi

exit $EXIT_CODE
