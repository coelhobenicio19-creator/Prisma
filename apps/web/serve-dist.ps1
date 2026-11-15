# Servidor estático simples para o build do PRISMA (apenas local, prints).
$port = 5173
$root = "C:\Users\charl\nanoMuse\PRISMA\apps\web\dist"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "servindo $root em http://127.0.0.1:$port"
$mime = @{ '.html'='text/html'; '.js'='text/javascript'; '.css'='text/css'; '.svg'='image/svg+xml'; '.png'='image/png'; '.json'='application/json'; '.ico'='image/x-icon'; '.woff2'='font/woff2'; '.map'='application/json' }
while ($true) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
  if (-not (Test-Path $file) -or (Get-Item $file).PSIsContainer) { $file = Join-Path $root 'index.html' } # SPA fallback
  $ext = [System.IO.Path]::GetExtension($file).ToLower()
  $bytes = [System.IO.File]::ReadAllBytes($file)
  $ctx.Response.ContentType = $mime[$ext] ?? 'application/octet-stream'
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.OutputStream.Close()
}
