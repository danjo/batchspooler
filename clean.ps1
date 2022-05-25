$name = "batchspooler"

rm "$name.zip" -ErrorAction Ignore
rm -Recurse -Force ./dist -ErrorAction Ignore
rm -Recurse -Force ./out -ErrorAction Ignore
rm -Recurse -Force ./src/_ext -ErrorAction Ignore
rm -Recurse -Force ./tabulator-master -ErrorAction Ignore
