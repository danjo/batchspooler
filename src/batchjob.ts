import { exec } from "child_process";
import { Controller } from "./controller";

export interface JobStat {
    exitCode?: number
}

export class BatchJob {
    readonly presentName: string;
    parameter: string;

    constructor(param: string) {
        this.parameter = param;
    }

    validate(): boolean {
        throw new Error("BatchJobBase validate()");
    }

    async run(prevEc: number): Promise<JobStat> {
        throw new Error("BatchJobBase run()");
    }
}

// empty for new row
export class EmptyJob extends BatchJob {
    presentName = "empty";

    validate(): boolean {
        return true;
    }

    async run(prevEc: number): Promise<JobStat> {
        return null;
    }
}

// exec
export class ExecJob extends BatchJob {
    presentName = "exec";

    async run(prevEc: number): Promise<JobStat> {
        let options = {
            cwd: Controller.lastObj.batchtable.workingDir
        };
        let stat: JobStat = {};

        let cp = exec(this.parameter, options);
        cp.on('close', (code) => {
            stat.exitCode = code;
            console.log(this.parameter + "," + code);
        });

        return stat;
    }
}

// notification
export class EchoJob extends BatchJob {
    presentName = "echo";

    async run(prevEc: number): Promise<JobStat> {
        Controller.lastObj.appLog(this.parameter);
        return null;
    }
}

export class SoundJob extends BatchJob {
    presentName = "sound";

    async run(prevEc: number): Promise<JobStat> {
        Controller.lastObj.appLog(this.parameter);

        let au = new Audio();
        au.src = process.cwd() + "/" + this.parameter;
        await au.play();
        return null;
    }
}

// sleep
export class SleepJob extends BatchJob {
    presentName = "sleep";

    async run(prevEc: number): Promise<JobStat> {
        let m1 = this.parameter.match("until.(\\d\\d)(\\d\\d)");
        let m2 = this.parameter.match("for.(\\d+)");

        if (m1 != null) {
            let hour = Number(m1[1]);
            let min = Number(m1[2]);
            let unt = new Date();
            unt.setHours(hour, min, 0, 0);

            while (true) {
                let now = new Date();
                if (now >= unt) {
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else if (m2 != null) {
            let count = Number(m2[1]);
            await new Promise(resolve => setTimeout(resolve, count * 1000));
            return null;
        }

        let count = Number(this.parameter);
        if (isNaN(count) === true) {
            throw new Error("run() parameter=" + this.parameter);
        }
        await new Promise(resolve => setTimeout(resolve, count * 1000));
        return null;
    }
}

// parallel
export class OpenGroup extends BatchJob {
    presentName = "open";

    async run(prevEc: number): Promise<JobStat> {
        let groups = this.parameter.split(" ");
        for (let group of groups) {
            Controller.lastObj.openGroup(group);
        }
        return null;
    }
}


export let BatchJobClasses: { [key: string]: typeof BatchJob } = {}

let classes: { [key: string]: typeof BatchJob } = {
    EmptyJob,
    EchoJob,
    SoundJob,
    ExecJob,
    OpenGroup,
    SleepJob,
}

let keys = Object.keys(classes)
for (let key of keys) {
    let pname = (new classes[key](null)).presentName
    BatchJobClasses[pname] = classes[key]
    // console.log("pname:" + pname)
}
