import axios, { AxiosRequestConfig } from 'axios';
import { Md5 } from 'ts-md5';
const querystring = require('querystring');

import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';
import { TextDecoder, TextEncoder } from 'util';
import { StringDecoder } from 'string_decoder';
import { randomBytes, randomInt, randomUUID, sign } from 'crypto';

const PREFIXCONFIG = 'baiduTranslate';

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'zh'],
    ['zh-TW', 'zh'],
]);

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }
    return src.toLocaleUpperCase();
}

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    return configuration.get<T>(key);
}

export type BaiduPreserveFormatting = '0' | '1';
export type BaiduFormality = "default" | "more" | "less";


interface BaiduTranslateOption {
    appId?: string;
    appSecret?: string;
    targetLang?: string;
}
interface Response {
    translations: {
        'detected_source_language': string;
        text: string;
    }[];
}

export class BaiduTranslate implements ITranslate {
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: BaiduTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption: BaiduTranslateOption = {
            appId: getConfig<string>('appId'),
            appSecret: getConfig<string>('appSecret'),
            targetLang: getConfig<string>('targetLang') ? getConfig<string>('targetLang') : "zh",
        };
        return defaultOption;
    }

    async translate(content: string, { from = 'auto' }: ITranslateOptions) {
        const url = `https://fanyi-api.baidu.com/api/trans/vip/translate`;

        if (!this._defaultOption.appId) {
            throw new Error('Please check the configuration of appId!');
        }

        const encodeContent = new TextDecoder().decode(new TextEncoder().encode(content));

        const to = this._defaultOption.targetLang;
        const appId = this._defaultOption.appId;
        const appSecret = this._defaultOption.appSecret;
        const salt = new TextDecoder().decode(randomBytes(10));

        const data = {
            'q': encodeContent,
            'from': from,
            'to': to,
            'appid': appId,
            'appSecret': appSecret,
            'sign': appSecret,
            'salt': salt,

        };

        
        let md5 = new Md5();

        // Append incrementally your file or other input
        // Methods are chainable
        md5.appendStr(data.appid)
            .appendAsciiStr('a different string')
            .appendByteArray(blob);

        // Generate the MD5 hex string
        md5.end();

        const config: AxiosRequestConfig = {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        };

        let res = await axios.post<Response>(url, querystring.stringify(data), config);

        return res.data.translations[0].text;
    }


    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `https://fanyi-api.baidu.com/api/trans/vip/translate/${convertLang(to)}/${encodeURIComponent(content)}`;
        return `[Baidu](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}





