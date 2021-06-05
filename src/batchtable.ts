import { EmptyJob } from "./batchjob"
import { BatchEntry, EStat } from "./batchentry"

export interface TableConf {
    dulationMilSec: number,
    workindDir: string
}

export class BatchTable {
    readonly dulationMilSec: number;
    readonly workingDir: string;
    readonly entries: BatchEntry[] = [];
    readonly openedGroups: string[] = [""];

    constructor(conf: TableConf, entries: BatchEntry[]) {
        this.dulationMilSec = conf.dulationMilSec;
        this.workingDir = conf.workindDir;

        for (let entry of entries) {
            this.entries.push(entry);
        }
    }

    newEntry(): BatchEntry {
        let id = BatchEntry.createId(0);
        let job = new EmptyJob("");
        let entry = new BatchEntry(id, "", job);
        this.entries.push(entry);
        return entry;
    }

    getEntry(id: number): BatchEntry {
        for(let entry of this.entries){
            if (id === entry.id) {
                return entry;
            }
        }

        throw new Error("getEntry(): id=" + id);
    }

    addEntry(prevId: number, entry: BatchEntry) {
        for (let i = 0; i < this.entries.length; i++) {
            let prevEntry = this.entries[i];
            if (prevId == prevEntry.id) {
                this.entries.splice(i, 0, entry);
                return;
            }
        }

        throw new Error("addEntry(): prevId=" + prevId);
    }

    deleteEntry(id: number): void {
        for (let i = 0; i < this.entries.length; i++) {
            let e = this.entries[i];
            if (id === e.id) {
                this.entries.splice(i, 1);
                return;
            }
        }

        throw new Error("deleteEntry(): id=" + id);
    }

    addOpenedGroup(group: string): void {
        this.openedGroups.push(group);
    }

    deleteOpenedGroup(group: string): void {
        for (let i = 0; i < this.openedGroups.length; i++) {
            let g = this.openedGroups[i];
            if (group === g) {
                this.openedGroups.splice(i, 1);
                return;
            }
        }

        throw new Error("deleteOpenedGroup(): group=" + group);
    }

    async spool(): Promise<BatchEntry[]> {
        let spooled: BatchEntry[] = [];

        // grouping opened-group entries
        let eGroups: { [key: string]: BatchEntry[] } = {};
        for (let entry of this.entries) {
            let group = entry.group;
            if (this.openedGroups.indexOf(group) === -1) {
                continue;
            }

            if (Object.keys(eGroups).indexOf(entry.group) === -1) {
                eGroups[group] = [entry];
            } else {
                eGroups[group].push(entry);
            }
        }

        // check entry needs run() with previous entry
        let eLastTwo: [BatchEntry, BatchEntry][] = []
        for (let key of Object.keys(eGroups)) {
            let prev: BatchEntry = null;

            for (let e of eGroups[key]) {
                if (e.status === EStat.entry) {
                    eLastTwo.push([e, prev]);
                    break;
                } else if (e.status === EStat.inExec) {
                    break;
                } else if (e.status === EStat.finished) {
                    prev = e;
                    continue;
                } else {
                    throw new Error("spool()");
                }
            }
        }

        // start new if possible
        for (let elt of eLastTwo) {
            let last = elt[0];
            let prev = elt[1];

            // run
            await last.run(prev);

            spooled.push(last);
        }

        return spooled;
    }
}
