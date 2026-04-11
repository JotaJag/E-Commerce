# Script PowerShell para ejecutar tests en Docker Compose
# Uso: .\run_tests.ps1 [-App <app_name>] [-Verbose] [-Coverage] [-KeepDb]

param(
    [string]$App = "",
    [switch]$Verbose = $false,
    [switch]$Coverage = $false,
    [switch]$KeepDb = $false
)

Write-Host "==========================================="  -ForegroundColor Cyan
Write-Host "  Ejecutando Tests - E-Commerce Project"  -ForegroundColor Cyan
Write-Host "==========================================="  -ForegroundColor Cyan
Write-Host ""

# Verificar que los contenedores estén corriendo
Write-Host "Verificando contenedores Docker..." -ForegroundColor Yellow
$containers = docker-compose ps
if ($containers -notmatch "Up") {
    Write-Host "Iniciando contenedores..." -ForegroundColor Yellow
    docker-compose up -d db web
    Write-Host "Esperando a que la base de datos esté lista..." -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Ejecutar migraciones
Write-Host "Ejecutando migraciones..." -ForegroundColor Yellow
docker-compose exec -T web python manage.py migrate --noinput

# Construir comando de tests
$testArgs = @()

if ($App) {
    $testArgs += $App
}

if ($Verbose) {
    $testArgs += "--verbosity=2"
}

if ($KeepDb) {
    $testArgs += "--keepdb"
}

# Ejecutar tests
Write-Host ""
Write-Host "Ejecutando tests..." -ForegroundColor Yellow
Write-Host "Comando: python manage.py test $($testArgs -join ' ')" -ForegroundColor Yellow
Write-Host ""

if ($Coverage) {
    Write-Host "Ejecutando con cobertura de codigo..." -ForegroundColor Yellow
    
    $coverageArgs = @("run", "--source=.", "manage.py", "test") + $testArgs
    docker-compose exec -T web coverage @coverageArgs
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "Generando reporte de cobertura..." -ForegroundColor Green
        docker-compose exec -T web coverage report
        docker-compose exec -T web coverage html
        Write-Host "Reporte HTML generado en: htmlcov/index.html" -ForegroundColor Green
    }
} else {
    $testArgs2 = @("manage.py", "test") + $testArgs
    docker-compose exec -T web python @testArgs2
    $exitCode = $LASTEXITCODE
}

# Resultado final
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "OK - Tests completados exitosamente" -ForegroundColor Green
} else {
    Write-Host "ERROR - Algunos tests fallaron" -ForegroundColor Red
}

exit $exitCode
