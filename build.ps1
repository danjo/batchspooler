# build
npm run-script build
if ( $? -eq $false ){
	Write-Error "npm"
	exit 1
}

electron-builder.cmd --dir
if ( $? -eq $false ){
	Write-Error "electron-builder"
	exit 3
}

# create distribution
mkdir dist -ErrorAction Ignore

cp assets/sample_launch.bat dist
cp README.md dist
cp LICENSE.txt dist
cp moo.yaml dist
cp moo.txt dist

# archive
mv dist batchspooler
rm batchspooler.zip -ErrorAction Ignore
compress-archive batchspooler batchspooler.zip
mv batchspooler dist
