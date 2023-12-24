import { Controller } from '../controller';

declare global {
    interface Window {
        myAPI: IMyAPI;
    }
}

export interface IMyAPI {
    mainArgv: () => string[];
    bimport: (arg: string) => string;
    bexport: (arg: string) => string;
    bexport_save: (path: string, yaml: string) => void;
    controller_init: () => Controller;
}