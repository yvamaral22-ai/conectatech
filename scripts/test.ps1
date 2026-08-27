$ErrorActionPreference = 'Stop'
$baseUrl = if ($args.Count) { $args[0].TrimEnd('/') } else { 'http://127.0.0.1:4173' }

$checks = @(
    @{ Path = '/'; Contains = '<main id="conteudo">' },
    @{ Path = '/styles.css'; Contains = '.skip-link' },
    @{ Path = '/app.js'; Contains = 'serviceWorker' },
    @{ Path = '/manifest.webmanifest'; Contains = 'ConectaTech' },
    @{ Path = '/service-worker.js'; Contains = 'conectatech-v2' },
    @{ Path = '/api/health'; Contains = '"status": "ok"' }
)

foreach ($check in $checks) {
    $response = Invoke-WebRequest -Uri "$baseUrl$($check.Path)" -UseBasicParsing
    $content = if ($response.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($response.Content) } else { [string]$response.Content }
    if ($response.StatusCode -ne 200 -or -not $content.Contains($check.Contains)) {
        throw "Falha em $($check.Path)"
    }
    Write-Host "OK  $($check.Path)  $($response.RawContentLength) bytes"
}

$clientId = "test-$([guid]::NewGuid().ToString('N'))"
$headers = @{ 'X-Client-Id' = $clientId }
$body = @{ courseId = 'basica' } | ConvertTo-Json
$saved = Invoke-RestMethod -Uri "$baseUrl/api/progress" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$progress = Invoke-RestMethod -Uri "$baseUrl/api/progress" -Headers $headers
if (-not $saved.saved -or $progress.completed -notcontains 'basica') { throw 'Falha na persistência de progresso.' }
Write-Host 'OK  API de progresso'
Write-Host 'Todos os testes passaram.' -ForegroundColor Green
