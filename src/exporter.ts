import * as fs from 'fs';

(():void => {
     searchDir(process.argv[2]);
})();

function searchDir(dir: string): void {
    let files: string[] = fs.readdirSync(dir);

    files.forEach(element => {
        element = dir + "/" + element;

        let stats: fs.Stats = fs.statSync(element);

        if (null == stats) {
            return;
        }

        if (stats.isDirectory()) {
            searchDir(element);
            handleDir(element);
        }
    });
}

function handleDir(dir: string): void {
    let exports: string[] = [];

    let files: string[] = fs.readdirSync(dir);

    files.forEach(element => {

        let stats: fs.Stats = fs.statSync(dir + "/" + element);

        if (null == stats || stats.isDirectory()) {
            return;
        }

        if (-1 === files.indexOf(element.match(/\w+(?=\.)/)[0])) {
            let codes: string[] = genCode(dir + "/" + element);

            if (null !== codes) {
                exports.push(`export { ${codes.join(",")} } from "${"./" + dir.match(/\w+$/g)[0] + "/" + element}";`);
            }
        }
    });
    if (0 < exports.length) {
        fs.writeFileSync(dir + ".ts", exports.join("\n") + "\n");
    }
}

function genCode(ts: string): string[] {
    let content: string = fs.readFileSync(ts, "utf8");
    let exports = content.match(/^export\s+(interface|class|function)\s+[A-Z]\w*(?=\s*({|\())/gm);

    if (null === exports || 0 === exports.length) {
        return null;
    }

    return exports.map((value: string, index: number, array: string[]): string => {
        return value.match(/[A-Z]\w*$/g)[0];
    });
}
