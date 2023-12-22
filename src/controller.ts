import * as electron from 'electron';
import { BatchFactory } from "./batchfactory";
import { BatchTable } from "./batchtable";
import { BatchEntry, EStat } from "./batchentry";
import { BatchJobClasses } from "./batchjob";

// console
// document

export enum CStat {
    Stop = "-",
    Start = "*",
}

interface RowInfo {
    row: Tabulator.RowComponent,
    pos: number,
    id: number
}

export class Controller {
    // static vLen = 1;
    static lastObj: Controller;

    static init(): Controller {
        // console.log(process.argv);
        let margv = electron.ipcRenderer.sendSync('mainArgv', null) as string[];
        console.log(margv);

        let hlen: number;
        if (margv[0].indexOf("electron.exe") !== -1) {
            hlen = 4;
        } else if (margv[0].indexOf("batchspooler.exe") !== -1) {
            hlen = 1;
        }

        if (margv.length === hlen) {
            return this.load(null);

        } else if (margv.length === hlen + 1) {
            let p = margv[hlen];
            return this.load(p);

        } else {
            throw new Error("init(): margv=" + margv);
        }
    }

    static load(path: string): Controller {
        let c = new Controller(path);
        Controller.lastObj = c;
        return c;
    }

    batchtable: BatchTable;
    tabulator: Tabulator;

    stat: CStat = CStat.Stop;
    idBag: { [key: string]: Tabulator.RowComponent } = {};
    openedGroups: string[] = [""];
    count: number = 0;

    constructor(path: string) {
        // batchtable
        this.batchtable = BatchFactory.buildYaml(path);

        // tabulator
        let statusParams = {
            values: [EStat.entry, /* EStat.inExec */, EStat.finished]
        };
        let jobParams = {
            values: Object.keys(BatchJobClasses).sort()
        };

        this.tabulator = new Tabulator("#table", {
            headerSort: false,
            cellHozAlign: "center",
            columns: [
                { title: "row", field: "row", headerHozAlign: "center", formatter: "rownum" },
                { title: "id", field: "id", headerHozAlign: "center", width: 140 },
                { title: "stat", field: "status", headerHozAlign: "center", editor: "select", editorParams: statusParams, cellEdited: (cell) => { this.updateStat(cell) } },
                { title: "grp", field: "group", headerHozAlign: "center", editor: "input", cellEdited: (cell) => { this.updateGroup(cell) } },
                { title: "job", field: "job", headerHozAlign: "center", width: 60, editor: "select", editorParams: jobParams, cellEdited: (cell) => { this.updateJob(cell) } },
                { title: "param", field: "parameter", hozAlign: "left", width: 200, editor: "input", cellEdited: (cell) => { this.updateParam(cell) } },
                { title: "ec", field: "exitCode", headerHozAlign: "center" },
                { title: "add", field: "add", headerHozAlign: "center", formatter: "buttonTick", cellClick: (e, cell) => { this.addEntry(e, cell) } },
                { title: "del", field: "del", headerHozAlign: "center", formatter: "buttonCross", cellClick: (e, cell) => { this.deleteEntry(e, cell) } },
            ],
        });

        // no await
        this.doAsyncProcs();

        // logging
        console.log("process.cwd(): " + process.cwd());
        this.appLog("dulationMilSec: " + this.batchtable.dulationMilSec);
        this.appLog("workingDir: " + this.batchtable.workingDir);
    }

    async doAsyncProcs() {
        for (let entry of this.batchtable.getEntries()) {
            let id = entry.id;
            console.log(id);
            let data = entry.getTabulatorData();
            let newRow = await this.tabulator.addRow(data, false);
            this.idBag[id] = newRow;
        }
    }

    appLog(message: string) {
        console.log(message);

        let now = new Date(Date.now()).toLocaleString();
        let line = now + " " + message;
        let log = document.getElementById("log");
        log.innerHTML += line + "\r\n";
        log.scrollTop = log.scrollHeight;
    }

    async spool(): Promise<void> {
        // console.log("spool");

        if (this.stat !== CStat.Start) {
            return;
        }

        // batchtable
        let spooled = await this.batchtable.spool();
        // console.log("sp:" + spooled.length);

        // tabulator 1: update exitCode for spooled
        for (let sEntry of spooled) {
            let id = sEntry.id;
            let row = this.idBag[id];
            row.update({ exitCode: sEntry.exitCode });
        }

        // tabulator 2: update status for all
        let keys = Object.keys(this.idBag).sort();
        for (let idStr of keys) {
            let entry = this.batchtable.getEntry(Number(idStr));
            let row = this.idBag[idStr];
            row.update({
                status: entry.status
            });
        }

        // html
        this.count += 1;
        (document.getElementById("group") as HTMLInputElement).value = String(this.batchtable.getOpenedGroups());
        (document.getElementById("step") as HTMLInputElement).value = String(this.count);
    }

    openGroup(group: string) {
        this.batchtable.addOpenedGroup(group);
    }

    private getRowInfo(cell: Tabulator.CellComponent): RowInfo {
        let row = cell.getRow();
        let pos = row.getPosition();
        let id: number = Number(row.getIndex());
        if (isNaN(id)) {
            throw new Error("getPosId(): id=" + id);
        }

        return { row, pos, id };
    }

    // trriger from tabulator
    async addEntry(e: UIEvent, cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        this.appLog("addEntry:" + ri.pos);

        let newId = BatchEntry.createId(0);
        let entry = this.batchtable.newEntry();
        let data = entry.getTabulatorData();
        this.batchtable.addEntry(ri.id, entry);
        let newRow = await this.tabulator.addRow(data, true, ri.row);
        this.idBag[newId] = newRow;
    }

    deleteEntry(e: UIEvent, cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        this.appLog("deleteEntry:" + ri.pos);

        this.batchtable.deleteEntry(ri.id);
        this.tabulator.deleteRow(ri.row);
        delete this.idBag[ri.id];
    }

    updateStat(cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        let entry = this.batchtable.getEntry(ri.id);
        this.appLog("updateStat:" + ri.pos);

        let stat = cell.getValue();
        entry.status = stat;
    }
    updateGroup(cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        let entry = this.batchtable.getEntry(ri.id);
        this.appLog("updateGroup:" + ri.pos);

        let grp = cell.getValue();
        entry.group = grp;
    }
    updateJob(cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        let entry = this.batchtable.getEntry(ri.id);
        this.appLog("updateJob: pos=" + ri.pos);

        let job = cell.getValue();
        entry.updateJob(job);
    }
    updateParam(cell: Tabulator.CellComponent) {
        let ri = this.getRowInfo(cell);
        let entry = this.batchtable.getEntry(ri.id);
        this.appLog("updateParam: pos=" + ri.pos);

        let param = cell.getValue();
        entry.job.parameter = param;
    }

    // trriger from html
    getDulation(): number {
        return this.batchtable.dulationMilSec;
    }

    buttonStart() {
        this.appLog("start");
        this.stat = CStat.Start;
    }

    buttonStop() {
        this.appLog("stop");
        this.stat = CStat.Stop;
    }

    buttonImport() {
        this.appLog("import");
        // this.appLog("not implemented yet.");

        let path = electron.ipcRenderer.sendSync('bimport', this.batchtable.workingDir) as string;
        this.appLog(path);

        // before buildYaml()
        this.doDeleteExists();

        this.batchtable = BatchFactory.buildYaml(path);

        // no await
        this.doAsyncProcs();
    }

    doDeleteExists() {
        // batchtable
        for (let entry of this.batchtable.getEntries()) {
            let id = entry.id;
            delete this.idBag[id];
        }

        // tabulator
        for (let row of this.tabulator.getRows()) {
            this.tabulator.deleteRow(row);
        }
    }


    buttonExport() {
        this.appLog("export");
        // this.appLog("not implemented yet.");

        let path = electron.ipcRenderer.sendSync('bexport', this.batchtable.workingDir) as string;
        this.appLog(path);

        let jobs: string[] = [];
        // batchtable
        for (let entry of this.batchtable.getEntries()) {
            let job = `["${entry.group}","${entry.job.presentName}","${entry.job.parameter}"]`;
            console.log(job);
            jobs.push("            " + job);
        }

        // tabulator


        //

        let yaml = `{
    "conf":
        {
        },
    "jobs":
        [
${jobs.join(",\r\n")}
        ],
}`;

        electron.ipcRenderer.sendSync('bexport_save', path, yaml);
        console.log(yaml);
    }
}
