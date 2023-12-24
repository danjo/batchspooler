import * as elec from 'electron';
import * as fs from 'fs';
import { Controller } from './controller';

window.myAPI = {
    mainArgv() {
        return process.argv;
    },

    bimport(arg) {
        let filenames = elec.dialog.showOpenDialogSync({
            defaultPath: arg[0],
            properties: ['openFile']
        });

        let filename = filenames[0];
        return filename;
    },

    bexport(arg) {
        let filename = elec.dialog.showSaveDialogSync({
            defaultPath: arg[0],
            properties: ['showOverwriteConfirmation']
        });

        return filename;
    },

    bexport_save(path, yaml) {
        fs.writeFileSync(path, yaml);
    },

    controller_init() {
        return Controller.init();
    },
}