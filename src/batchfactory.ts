import * as fs from "fs"
import * as js_yaml from "js-yaml"
import { BatchTable, TableConf } from "./batchtable"
import { BatchJobClasses } from "./batchjob"
import { BatchEntry } from "./batchentry"

interface YConf {
    dulationMilSec: number,
    workingDir: string
    width?: number
    height?: number,
    devtool?: boolean,
    loglevel: string
};
type YJobInfo = [string, string, string];

export interface YDoc {
    conf: YConf,
    jobs: YJobInfo[]
};

export class BatchFactory {
    static defaultConf: YConf = {
        dulationMilSec: 1000,
        workingDir: ".",
        // width: 1100,
        // height: 600,
        // devtool: true,
        loglevel: "DEBUG"
    };
    static defaultJobInfo: YJobInfo[] = [
        ["", "empty", ""]
    ];

    static buildYaml(path: string): BatchTable {
        let ydoc: YDoc;
        if (path == null) {
            ydoc = { conf: this.defaultConf, jobs: this.defaultJobInfo } as YDoc;
        } else {
            let ystr = fs.readFileSync(path, "utf8");
            // ToDo: treat yamlexception
            ydoc = js_yaml.load(ystr) as YDoc;
        }
        let yconf: YConf = { ...this.defaultConf, ...ydoc.conf };
        let yji: YJobInfo[];
        if (ydoc.jobs == null) {
            yji = this.defaultJobInfo;
        } else {
            yji = ydoc.jobs;
        }

        let conf = this.buildConf(yconf);
        let entries = this.buildEntries(yji);
        let bt = new BatchTable(conf, entries);

        return bt;
    }

    static buildConf(conf: YConf): TableConf {
        let tc: TableConf = {
            dulationMilSec: conf.dulationMilSec,
            workindDir: conf.workingDir
        };
        return tc;
    }

    static buildEntries(infos: YJobInfo[]): BatchEntry[] {
        let entries: BatchEntry[] = [];

        let ids = BatchEntry.createIdMany(infos.length);

        for (let info of infos) {
            let id = ids.shift();
            let grp = info[0];
            let jobClass = BatchJobClasses[info[1]];
            if (jobClass == null) {
                throw new Error("buildJobs(): jobinfo[1]=" + info[1]);
            }
            let param = info[2];
            let job = new jobClass(param);
            let entry = new BatchEntry(id, grp, job);
            entries.push(entry);
        }

        return entries;
    }
}
