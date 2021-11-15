import Comparison from './endpoints/comparisons/Comparison';
import { ComparisonSide, FileType } from './endpoints/comparisons/types';
import ExportsEndpoint from './endpoints/exports/ExportsEndpoint';
import { ExportKind, ExportResult } from './endpoints/exports/types';
import { ComparisonsEndpoint } from './endpoints/index';
import Urls from './endpoints/urls';

class Client {
    private _accountId: string;

    private _authToken: string;

    private _urls: Urls;

    constructor({ accountId, authToken, baseUrl }: { accountId: string; authToken: string; baseUrl?: string }) {
        this._accountId = accountId;
        this._authToken = authToken;
        this._urls = new Urls(typeof baseUrl === 'string' ? baseUrl : 'https://api.draftable.com/v1');
    }

    private _comparisons: ComparisonsEndpoint | undefined;

    private _exports: ExportsEndpoint | undefined;

    get baseUrl(): string {
        return this._urls.baseUrl;
    }

    get comparisons(): ComparisonsEndpoint {
        if (!this._comparisons) {
            this._comparisons = new ComparisonsEndpoint({
                accountId: this._accountId,
                authToken: this._authToken,
                urls: this._urls,
            });
        }
        return this._comparisons;
    }

    get exports(): ExportsEndpoint {
        if (!this._exports) {
            this._exports = new ExportsEndpoint({
                accountId: this._accountId,
                authToken: this._authToken,
                urls: this._urls,
            });
        }
        return this._exports;
    }
}

export function client(accountId: string, authToken: string, baseUrl?: string): Client {
    return new Client({ accountId, authToken, baseUrl });
}

export type { ComparisonsEndpoint, Comparison, ComparisonSide, FileType };
export type { ExportsEndpoint, ExportResult, ExportKind };
