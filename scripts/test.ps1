$ErrorActionPreference = 'Stop'
$baseUrl = if ($args.Count) { $args[0].TrimEnd('/') } else { 'http://127.0.0.1:4173' }

$checks = @(
    @{ Path = '/'; Contains = '<main id="conteudo">' },
    @{ Path = '/trilhas.html'; Contains = 'Trilhas de aprendizagem' },
    @{ Path = '/carreira.html'; Contains = 'Desenvolva sua carreira' },
    @{ Path = '/oportunidades.html'; Contains = 'Central de oportunidades' },
    @{ Path = '/perfil.html'; Contains = 'Meu perfil' },
    @{ Path = '/impacto.html'; Contains = 'Impacto da comunidade' },
    @{ Path = '/aula.html?id=basica-1'; Contains = 'lesson-page' },
    @{ Path = '/admin.html'; Contains = 'Administração' },
    @{ Path = '/styles.css'; Contains = '.skip-link' },
    @{ Path = '/app.js'; Contains = 'serviceWorker' },
    @{ Path = '/manifest.webmanifest'; Contains = 'ConectaTech' },
    @{ Path = '/features.css'; Contains = '.lesson-view' },
    @{ Path = '/service-worker.js'; Contains = 'conectatech-v6' },
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
$headers = @{ 'X-Client-Id' = $clientId; 'X-ConectaTech-Request' = '1' }
$body = @{ courseId = 'basica' } | ConvertTo-Json
$saved = Invoke-RestMethod -Uri "$baseUrl/api/progress" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$progress = Invoke-RestMethod -Uri "$baseUrl/api/progress" -Headers $headers
if (-not $saved.saved -or $progress.completed -notcontains 'basica') { throw 'Falha na persistência de progresso.' }
Write-Host 'OK  API de progresso'

$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = "teste-$([guid]::NewGuid().ToString('N'))@conectatech.local"
$registration = @{ name = 'Pessoa Teste'; email = $email; password = 'senha-segura-123'; termsAccepted = $true; analyticsConsent = $true } | ConvertTo-Json
$user = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -WebSession $webSession -Headers $headers -ContentType 'application/json' -Body $registration
$me = Invoke-RestMethod -Uri "$baseUrl/api/me" -WebSession $webSession -Headers $headers
if ($user.user.email -ne $email -or $me.user.email -ne $email) { throw 'Falha no cadastro ou na sessão.' }
Write-Host 'OK  Cadastro e sessão'

$personalData = Invoke-RestMethod -Uri "$baseUrl/api/privacy/export" -WebSession $webSession -Headers $headers
if ($personalData.account.email -ne $email -or $personalData.consents.purpose -notcontains 'terms') { throw 'Falha na exportação de dados pessoais.' }
$consentBody = @{ purpose = 'analytics'; granted = $false } | ConvertTo-Json
$consent = Invoke-RestMethod -Uri "$baseUrl/api/privacy/consent" -Method Post -WebSession $webSession -Headers $headers -ContentType 'application/json' -Body $consentBody
if (-not $consent.saved -or $consent.granted) { throw 'Falha na revogação de consentimento.' }
Write-Host 'OK  Exportação e consentimento'

$catalog = Invoke-RestMethod -Uri "$baseUrl/api/courses" -Headers $headers
$lesson = Invoke-RestMethod -Uri "$baseUrl/api/lessons/basica-1" -Headers $headers
if ($catalog.courses.Count -ne 6 -or $lesson.lesson.courseId -ne 'basica') { throw 'Falha no catálogo ou na aula.' }
Write-Host 'OK  Catálogo e aula'

$deleteBody = @{ password = 'senha-segura-123'; confirmation = 'EXCLUIR' } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/privacy/delete" -Method Post -WebSession $webSession -Headers $headers -ContentType 'application/json' -Body $deleteBody
$afterDeletion = Invoke-RestMethod -Uri "$baseUrl/api/me" -WebSession $webSession -Headers $headers
if ($null -ne $afterDeletion.user) { throw 'Falha na eliminação da conta.' }
Write-Host 'OK  Eliminação da conta'
Write-Host 'Todos os testes passaram.' -ForegroundColor Green
