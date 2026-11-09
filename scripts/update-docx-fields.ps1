# Memperbarui Daftar Isi, Daftar Tabel, Daftar Gambar, dan nomor caption pada
# berkas .docx melalui Microsoft Word, menyimpannya kembali, lalu mengekspor
# salinan PDF dengan nama yang sama.
# Dipanggil oleh scripts/generate-capstone-docs.mjs.
param([Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)][string[]]$Paths)

$ErrorActionPreference = "Stop"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  foreach ($path in $Paths) {
    $doc = $word.Documents.Open((Resolve-Path $path).Path)
    # Dua kali: nomor halaman pada daftar baru stabil setelah daftar itu sendiri terisi.
    for ($pass = 0; $pass -lt 2; $pass++) {
      $doc.Fields.Update() | Out-Null
      foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
      # Daftar Tabel/Gambar (field TOC c) adalah TablesOfFigures pada model objek Word.
      foreach ($tof in $doc.TablesOfFigures) { $tof.Update() }
    }
    $doc.Save()
    $pdf = [System.IO.Path]::ChangeExtension($doc.FullName, ".pdf")
    $doc.ExportAsFixedFormat($pdf, 17)  # 17 = wdExportFormatPDF
    $doc.Close()
    Write-Host "Diperbarui: $path (+ PDF)"
  }
} finally {
  $word.Quit()
}
