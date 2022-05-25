import * as elec from 'electron';


function createWindow() {
    let win = new elec.BrowserWindow({
        width: 1100, height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    })

    console.log(elec.app.getAppPath());

    elec.ipcMain.on('mainArgv', (event, arg) => {
        // console.log("mainArgv");
        event.returnValue = process.argv;
    });

    win.setTitle("batchspooler");
    win.setMenu(null);
    win.loadURL("file://" + __dirname + "/index.html");

    let devtool = true;
    if (devtool) {
        win.webContents.openDevTools();
    }

    win.on("closed", () => {
        // win = null
        elec.app.quit();
    });
}

elec.app.on("ready", createWindow);
