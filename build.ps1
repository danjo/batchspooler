# clean
./clean.ps1

# build
$ver = "4.9.3"
Expand-Archive -Force -Path assets/tabulator-${ver}.zip -DestinationPath .
cp -Recurse ./tabulator-${ver}/dist/css src/_ext/css
cp -Recurse ./tabulator-${ver}/dist/js src/_ext/js

npm run-script build
if ( $? -eq $false ){
	Write-Error "npm"
	exit 1
}

electron-builder.cmd --dir
if ( $? -eq $false ){
	Write-Error "electron-builder"
	exit 2
}

# create distribution
cp README.md dist
cp LICENSE.txt dist
cp sample.bat dist
cp sample.yaml dist
cp -Recurse assets dist -Force

# archive
$name = "batchspooler"

rm "$name.zip" -ErrorAction Ignore
mv dist $name
compress-archive $name "$name.zip"
mv $name dist
