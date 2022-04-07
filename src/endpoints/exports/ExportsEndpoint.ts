import AuthenticatedNeedleClient from '../../utilities/AuthenticatedNeedleClient';
import Urls from '../urls';
import { ExportRequest, ExportResult } from './types';

export default class ExportsEndpoint {
    private needleClient: AuthenticatedNeedleClient;

    private urls: Urls;

    get accountId(): string {
        return this.needleClient.accountId;
    }

    get authToken(): string {
        return this.needleClient.authToken;
    }

    constructor({ accountId, authToken, urls }: { accountId: string; authToken: string; urls: Urls }) {
        this.needleClient = new AuthenticatedNeedleClient({ accountId, authToken });
        this.urls = urls;
    }

    requestExport = (param: ExportRequest): Promise<ExportResult> => {
        return this.needleClient.post<ExportResult>(this.urls.exportsEndpointURL, param).then((data) => {
            if (!data) {
                throw new Error(
                    'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                );
            }
            return data;
        });
    };

    get = (identifier: string): Promise<ExportResult> =>
        this.needleClient.get<ExportResult>(this.urls.getExportEndpointURL({ identifier })).then((data) => {
            if (!data) {
                throw new Error(
                    'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                );
            }
            return data;
        });
}
