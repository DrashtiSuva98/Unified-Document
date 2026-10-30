param([Parameter(Mandatory = $true)][string]$ExecutablePath)
$ErrorActionPreference = 'Stop'
$expectedPath = [System.IO.Path]::GetFullPath($ExecutablePath)
$processName = [System.IO.Path]::GetFileNameWithoutExtension($expectedPath)
foreach ($portalProcess in @(Get-CimInstance Win32_Process -Filter "Name = '$processName.exe'")) {
    # Match the complete output path, not just a shared application name.
    $actualPath = $portalProcess.ExecutablePath
    if ($actualPath -and [string]::Equals($actualPath, $expectedPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $portalProcessId = [int]$portalProcess.ProcessId
        Write-Output "Stopping running portal PID $portalProcessId before rebuilding $expectedPath"
        try {
            $runningProcess = Get-Process -Id $portalProcessId -ErrorAction SilentlyContinue
            if ($null -eq $runningProcess) { continue }
            Stop-Process -Id $portalProcessId -Force -ErrorAction Stop
            if (-not $runningProcess.WaitForExit(10000)) {
                throw "Portal PID $portalProcessId did not exit within 10 seconds."
            }
        } catch {
            if (Get-Process -Id $portalProcessId -ErrorAction SilentlyContinue) {
                throw "Unable to stop this project's running portal. Stop debugging or close its terminal, then rebuild. $($_.Exception.Message)"
            }
        }
    }
}
