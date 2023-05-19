import axios, { AxiosRequestConfig } from 'axios';
import { Md5 } from 'ts-md5';
const querystring = require('querystring');

import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';
import { TextDecoder, TextEncoder } from 'util';

const PREFIXCONFIG = 'baiduTranslate';

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    return configuration.get<T>(key);
}

interface BaiduTranslateOption {
    appId?: string;
    appSecret?: string;
    targetLang?: string;
}
interface Response {
    'from': string;
    'to': string;
    'trans_result': {
        'src': string;
        'dst': string;
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
        console.log("<-->", content);
        const url = `https://fanyi-api.baidu.com/api/trans/vip/translate`;

        if (!this._defaultOption.appId) {
            throw new Error('Please check the configuration of appId!');
        }

        if (!this._defaultOption.appSecret) {
            throw new Error('Please check the configuration of appSecret!');
        }

        const utf8Content = new TextDecoder().decode(new TextEncoder().encode(content));

        const to = this._defaultOption.targetLang;
        const appId = this._defaultOption.appId;
        const appSecret = this._defaultOption.appSecret;
        const salt = Math.random().toString(16).slice(2);

        let md5 = new Md5();

        md5.appendStr(appId)
            .appendStr(utf8Content)
            .appendStr(salt)
            .appendStr(appSecret);

        const sign = md5.end(false);

        const data = {
            'q': utf8Content,
            'from': from,
            'to': to,
            'appid': appId,
            'appSecret': appSecret,
            'sign': sign,
            'salt': salt,
        };

        const config: AxiosRequestConfig = {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        };

        let req = querystring.stringify(data);
        let req2 = req.replace("%20%40", "%0A%40");
        let res = await axios.post<Response>(url, req2, config);
        
        return res.data.trans_result.map(e => e.dst).join("\n");
    }


    link(content: string, { }: ITranslateOptions) {
        // Useless, baidu is not compatible
        let str = `https://fanyi-api.baidu.com/api/trans/vip/translate`;
        return `[Baidu](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}





