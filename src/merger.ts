import * as fs from 'fs';
import * as os from 'os';
import { log } from 'util';

/**
 * 换行符
 */
const NL: string = "win32" === os.platform() ? "\r\n" : ("darwin" === os.platform() ? "\r" : "\n");

const dir_in = process.argv[2];
const dir_out = process.argv[3];

/**
 * 检查输入/输出目录是否存在
 */
function checkDir(): void {
    if (!fs.existsSync(dir_in)) {
        log("input dir not exists")
        process.exit(0);
    }

    if (!fs.existsSync(dir_out)) {
        log("output dir not exists")
        process.exit(0);
    }
}

function cleanDir(dir_dst: string): void {
    const contents = fs.readdirSync(dir_dst);

    if (0 === contents.length) {
        fs.rmdirSync(dir_dst);
        return;
    }

    contents.forEach(content => {
        const sub_content_dst = dir_dst + "/" + content;

        const stats = fs.statSync(sub_content_dst);

        if (null !== stats && stats.isDirectory()) {
            cleanDir(sub_content_dst);
        }
    });
}

function handleDir(dir_src: string, dir_dst: string): void {
    let contents = fs.readdirSync(dir_src);

    if (0 === contents.length) {
        return;
    }

    const dirs: string[] = [];
    const files: string[] = [];

    contents.forEach(sub_contens => {
        const sub_contens_src = dir_src + "/" + sub_contens;

        const stats = fs.statSync(sub_contens_src);

        if (null === stats) {
            return;
        }

        if (stats.isDirectory()) {
            dirs.push(sub_contens);
        } else {
            files.push(sub_contens);
        }
    });

    dirs.forEach(sub_dir => {
        const sub_dir_src = dir_src + "/" + sub_dir;
        const sub_dir_dst = dir_dst + "/" + sub_dir;
        fs.mkdirSync(sub_dir_dst);
        handleDir(sub_dir_src, sub_dir_dst);
    });

    log("enter " + dir_src);

    if (dir_in !== dir_src && 0 < files.length) {
        const sub_file_dst = dir_dst + ".ts";
        files.forEach(sub_file => {
            const sub_file_src = dir_src + "/" + sub_file;
            appendTs(sub_file_src, sub_file_dst);
        });
    }

    log("exit " + dir_src);
}

/**
 * 把file_src追加到file_dst
 * @param file_src 
 * @param file_dst 
 */
function appendTs(file_src: string, file_dst: string): void {
    log("\t\tappend ts: " + file_src + " to " + file_dst);

    fs.appendFileSync(file_dst, NL);

    const content = fs.readFileSync(file_src);

    // handleImport(content.toString());

    fs.appendFileSync(file_dst, content);
}

function handleImport(content: string): void {
    const import_all = /^import.+['"]{1}.+['"]{1};$/gm;
    // const import_relative = /^import\s+\{?\s*(\w+)*\}?\s+from\s+('|").*('|")/gm;

    const regex_internal_imports = /^import\s+\{?(\s*[a-zA-Z0-9_]+\s*,?\s*)*\}?\s+from\s+('|")(\.|\.\.)?\/.*('|")\s*;/gm;

    const imps = content.match(regex_internal_imports);

    if (null === imps){
        return;
    }

    imps.forEach(imp => {
        log(imp);
    });
}

// log("merge ts file")
// checkDir();
// handleDir(dir_in, dir_out);
// cleanDir(dir_out);

const temp = `
import {A1,A2} from "path/to/moda/a1";
import {B1,B2} from "./path/to/modb/b1";
import {B3,B4} from "./path/to/modb/b2";
import {C1,C2} from "../path/to/modc/c1";
import D1 from "../path/to/modd/d1";
import { E1, E2, E3 } from "../path/to/mode/e1";
import { F1, F2, F3 } from "../f1";
import { G1 } from "./g1";
import * as h1 from "../path/to/modh/h1"
import * as h2 from "../path/to/modh/h2"
`

handleImport(temp);
