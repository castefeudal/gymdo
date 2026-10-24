param(
  [string]$BaseUrl = 'https://castefeudal.github.io/gymdo/',
  [string[]]$Routes = @('home', 'library'),
  [int]$Runs = 3,
  [string]$OutputDirectory = 'artifacts/lighthouse-production'
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($mode in @('mobile', 'desktop')) {
  foreach ($route in $Routes) {
    foreach ($run in 1..$Runs) {
      $reportPath = Join-Path $OutputDirectory "$mode-$route-$run"
      $arguments = @('--yes', 'lighthouse@13.5.0', ($BaseUrl + '#' + $route), '--quiet', '--chrome-flags=--headless --no-sandbox', '--only-categories=performance,accessibility,best-practices,seo', '--output=json', '--output=html', "--output-path=$reportPath")
      if ($mode -eq 'desktop') { $arguments += '--preset=desktop' }
      & npx @arguments
      if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed: $mode $route $run" }
      Write-Output "Measured $mode $route $run"
    }
  }
}
$summary = @()
foreach ($mode in @('mobile', 'desktop')) {
  foreach ($route in $Routes) {
    $reports = @(Get-ChildItem -LiteralPath $OutputDirectory -Filter "$mode-$route-*.report.json" | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json })
    $medians = @{}
    foreach ($category in @('performance', 'accessibility', 'best-practices', 'seo')) {
      $scores = @($reports | ForEach-Object { $_.categories.$category.score * 100 } | Sort-Object)
      $medians[$category] = $scores[[math]::Floor($scores.Count / 2)]
    }
    $summary += @{ mode = $mode; route = $route; runs = $reports.Count; median = $medians; requestedUrl = $BaseUrl + '#' + $route; lighthouseVersion = $reports[0].lighthouseVersion }
  }
}
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'medians.json') -Encoding utf8
$summary | ConvertTo-Json -Depth 8
