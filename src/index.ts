import Comparison from './endpoints/comparisons/Comparison';
import { ComparisonSide, FileType } from './endpoints/comparisons/types';
import { ComparisonsEndpoint } from './endpoints/index';
import Urls from './endpoints/urls';

class Client {
    private __accountId: string;

    private __authToken: string;

    private __urls: Urls;

    constructor({ accountId, authToken, baseUrl }: { accountId: string; authToken: string; baseUrl?: string }) {
        this.__accountId = accountId;
        this.__authToken = authToken;
        this.__urls = new Urls(typeof baseUrl === 'string' ? baseUrl : 'https://api.draftable.com/v1');
    }

    private __comparisons: ComparisonsEndpoint | undefined;

    get baseUrl(): string {
        return this.__urls.baseUrl;
    }

    get comparisons(): ComparisonsEndpoint {
        return (
            this.__comparisons ||
            (this.__comparisons = new ComparisonsEndpoint({
                accountId: this.__accountId,
                authToken: this.__authToken,
                urls: this.__urls,
            }))
        );
    }
}

export function client(accountId: string, authToken: string, baseUrl?: string): Client {
    return new Client({ accountId, authToken, baseUrl });
}

export type { ComparisonsEndpoint, Comparison, ComparisonSide, FileType };
