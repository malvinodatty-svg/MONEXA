# Membuat file .env dengan secret acak (Windows PowerShell). Tidak menimpa .env yang ada.
Set-Location (Join-Path $PSScriptRoot "..")
if (Test-Path .env) { Write-Host ".env sudah ada, tidak ditimpa."; exit 0 }
function New-Secret($len) {
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count $len | ForEach-Object { [char]$_ })
}
$c = Get-Content .env.example -Raw
$c = $c.Replace("ganti_password_db", (New-Secret 24)).Replace("ganti_password_root", (New-Secret 24))
$c = $c.Replace("ganti_dengan_string_acak_panjang", (New-Secret 48)).Replace("ganti_secret_storage", (New-Secret 24))
Set-Content .env $c -NoNewline
Write-Host ".env dibuat dengan secret acak."
