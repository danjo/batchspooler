import * as elec from 'electron';
import * as fs from 'fs';

function createWindow() {
    let devtool = false;
    let width = 100;

    console.log(process.argv);
    if (process.argv[0].indexOf("electron.exe") !== -1 ) {
        devtool = true;
        width = 1240;
    } else {
        devtool = false;
        width = 640;
    }

    let win = new elec.BrowserWindow({
        width: width, height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    })

    console.log(elec.app.getAppPath());

    elec.ipcMain.on('mainArgv', (event) => {
        // console.log("mainArgv");
        event.returnValue = process.argv;
    });

    win.setTitle("batchspooler");
    win.setMenu(null);
    win.loadURL("file://" + __dirname + "/index.html");

    if (devtool == true) {
        win.webContents.openDevTools();
    }

    win.on("closed", () => {
        // win = null
        elec.app.quit();
    });

    elec.ipcMain.on("bimport", (event, arg) => {
        let filenames = elec.dialog.showOpenDialogSync({
            defaultPath: arg[0],
            properties: ['openFile']
        });

        let filename = filenames[0];
        event.returnValue = filename;
    });

    elec.ipcMain.on("bexport", (event, arg) => {
        let filename = elec.dialog.showSaveDialogSync({
            defaultPath: arg[0],
            properties: ['showOverwriteConfirmation']
        });

        event.returnValue = filename;
    });
    elec.ipcMain.on("bexport_save", (event, path, yaml) => {
        console.log(path);
        fs.writeFileSync(path, yaml);
    });
}

elec.app.on("ready", createWindow);
