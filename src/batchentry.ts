import { BatchJob, BatchJobClasses } from "./batchjob"

export enum EStat {
    entry = "",
    inExec = "*",
    finished = "-"
}

export interface TabulatorData {
    id: string
    status: string
    group: string
    exitCode: string
    job: string
    parameter: string
    add: string
    del: string
}

export class BatchEntry {
    static pollingMilSec = 1000;

    // called asyncly from GUI
    // called from createIdMany()
    static createId(num: number): number {
        if (num < 0 || num >= 100) {
            throw new Error("greateId(): num=" + num);
        }
        let now: number = Date.now();
        let id: number = now - (now % 100) + num;
        return id;
    }

    // called from BatchFactory.buildEntries()
    static createIdMany(num: number): number[] {
        if (num < 0 || num >= 100) {
            throw new Error("createIdMany(): num=" + num);
        }
        let ids: number[] = [];
        for (let i = 0; i < num; i++) {
            let id = this.createId(i);
            ids.push(id);
        }
        return ids;
    }

    id: number;
    status: EStat;
    group: string;
    job: BatchJob;
    exitCode: number;

    constructor(id: number, group: string, job: BatchJob) {
        this.id = id;
        this.status = EStat.entry;
        this.group = group;
        this.job = job;
    }

    async run(prev: BatchEntry): Promise<void> {
        this.status = EStat.inExec;

        let prevEc;
        if (prev != null) {
            prevEc = prev.exitCode;
        } else {
            prevEc = 0;
        }
        let stat = await this.job.run(prevEc);

        let ec = null;
        if (stat != null) {
            while (true) {
                await new Promise(resolve => setTimeout(resolve, BatchEntry.pollingMilSec));
                if (stat.exitCode != null) {
                    ec = stat.exitCode;
                    this.exitCode = ec;
                    break;
                }
            }
        }

        this.status = EStat.finished;
    }

    updateJob(presentName: string) {
        let param = this.job.parameter;
        let jobClass = BatchJobClasses[presentName];
        if (jobClass == null) {
            throw new Error("updateJob(): name=" + presentName);
        }
        let job = new jobClass(param);
        this.job = job;
    }

    getTabulatorData(): TabulatorData {
        let data: TabulatorData = {
            id: String(this.id),
            status: this.status,
            group: this.group,
            exitCode: null,
            job: this.job.presentName,
            parameter: this.job.parameter,
            add: "+",
            del: "-",
        };

        return data;
    }
}
