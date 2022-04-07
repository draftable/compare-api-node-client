import Comparison from './endpoints/comparisons/Comparison';
import ComparisonsEndpoint from './endpoints/comparisons/ComparisonsEndpoint';
import { ComparisonSide, FileType } from './endpoints/comparisons/types';
import ExportsEndpoint from './endpoints/exports/ExportsEndpoint';
import { ExportKind, ExportResult } from './endpoints/exports/types';
import Urls from './endpoints/urls';

class Client {
    private accountId: string;

    private authToken: string;

    private urls: Urls;

    comparisons: ComparisonsEndpoint;

    exports: ExportsEndpoint;

    constructor({ accountId, authToken, baseUrl }: { accountId: string; authToken: string; baseUrl?: string }) {
        this.accountId = accountId;
        this.authToken = authToken;
        this.urls = new Urls(typeof baseUrl === 'string' ? baseUrl : 'https://api.draftable.com/v1');

        this.exports = new ExportsEndpoint({
            accountId: this.accountId,
            authToken: this.authToken,
            urls: this.urls,
        });

        this.comparisons = new ComparisonsEndpoint({
            accountId: this.accountId,
            authToken: this.authToken,
            urls: this.urls,
        });
    }

    get baseUrl(): string {
        return this.urls.baseUrl;
    }
}

export function client(accountId: string, authToken: string, baseUrl?: string): Client {
    return new Client({ accountId, authToken, baseUrl });
}

export type { ComparisonsEndpoint, Comparison, ComparisonSide, FileType };
export type { ExportsEndpoint, ExportResult, ExportKind };
