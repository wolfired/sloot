import * as fs from 'fs';
import { log } from 'util';

/**
 * 迭代指定目录下的子目录，把子目录下一级的ts文件所包含的全部export项导出
 */
((): void => {
    log("export ts file")
    searchDir(process.argv[2]);
})();

function searchDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        return;
    }

    let files: string[] = fs.readdirSync(dir);

    files.forEach(element => {
        element = dir + "/" + element;

        let stats: fs.Stats = fs.statSync(element);

        if (null === stats) {
            return;
        }

        if (stats.isDirectory()) {
            searchDir(element);
            handleDir(element);
        }
    });
}

function handleDir(dir: string): void {
    let exports_public: string[] = [];
    let exports_internal: string[] = [];
    const internal_ts: string = "internal.ts";

    let files: string[] = fs.readdirSync(dir);

    files.forEach(element => {
        if (internal_ts === element) {
            return;
        }

        let stats: fs.Stats = fs.statSync(dir + "/" + element);

        if (null === stats || stats.isDirectory()) {
            return;
        }

        if (-1 === files.indexOf(element.match(/\w+(?=\.)/)![0])) {
            let codes = genCode(dir + "/" + element, /^export\s+(interface|class|function|type|var|let|const)\s+[A-Z]\w*(?=\s*({|\()|<|:|)/gm);

            if (null !== codes) {
                exports_public.push(`export { ${codes.join(",")} } from "${"./" + dir.match(/\w+$/g)![0] + "/" + element.replace(".ts", "")}";`);
                exports_internal.push(`export { ${codes.join(",")} } from "${"./" + element.replace(".ts", "")}";`);
            }
        }
    });
    if (0 < exports_public.length) {
        fs.writeFileSync(dir + ".ts", exports_public.join("\n") + "\n");
    }

    files.forEach(element => {
        if (internal_ts === element) {
            return;
        }

        let stats: fs.Stats = fs.statSync(dir + "/" + element);

        if (null === stats || stats.isDirectory()) {
            return;
        }

        if (-1 === files.indexOf(element.match(/\w+(?=\.)/)![0])) {
            let codes = genCode(dir + "/" + element, /^export\s+(interface|class|function|type|var|let|const)\s+[a-z]\w*(?=\s*({|\()|<|:|)/gm);

            if (null !== codes) {
                exports_internal.push(`export { ${codes.join(",")} } from "${"./" + element.replace(".ts", "")}";`);
            }
        }
    });
    if (0 < exports_internal.length) {
        fs.writeFileSync(dir + "/internal.ts", exports_internal.join("\n") + "\n");
    }
}

function genCode(ts: string, reg: RegExp): string[] | null {
    let content: string = fs.readFileSync(ts, "utf8");
    let exports = content.match(reg);

    if (null === exports || 0 === exports.length) {
        return null;
    }

    return exports.map((value: string, index: number, array: string[]): string => {
        return value.match(/[a-z_A-Z]\w*$/g)![0];
    });
}
