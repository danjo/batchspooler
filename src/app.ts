import * as elec from 'electron';
import * as fs from 'fs';

function createWindow() {
    let devtool = true;
    let width = 100;

    console.log(process.argv);
    if (process.argv[0].indexOf("electron.exe") !== -1) {
        devtool = true;
        width = 1280;
    } else {
        devtool = false;
        width = 680;
    }

    let win = new elec.BrowserWindow({
        width: width, height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    })

    console.log(elec.app.getAppPath());

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

    let imgFilePath = __dirname + '/assets/tray.ico';
    console.log(imgFilePath);

    tray = new elec.Tray(imgFilePath);
    const contextMenu = elec.Menu.buildFromTemplate([
        { label: 'show', click: async () => { win.show(); } },
        { label: 'hide', click: async () => { win.hide(); } },
        { label: 'quit', role: 'quit' }
    ]);
    tray.setToolTip("batchspooler");
    tray.setContextMenu(contextMenu);
}


elec.ipcMain.on('mainArgv', (event) => {
    // console.log("mainArgv");
    event.returnValue = process.argv;
});

elec.ipcMain.on("bimport", (event, arg) => {
    let filenames = elec.dialog.showOpenDialogSync({
        defaultPath: arg[0],
        properties: ['openFile']
    });

    if (filenames != null) {
        let filename = filenames[0];
        event.returnValue = filename;
    } else {
        event.returnValue = null;
    }
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


let tray: elec.Tray;

elec.app.on("ready", createWindow);
// elec.app.whenReady().then(() => {
//     createWindow();
// });
