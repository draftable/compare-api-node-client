import AuthenticatedNeedleClient from '../../utilities/AuthenticatedNeedleClient';
import Urls from '../urls';
import { ExportRequest, ExportResult } from './types';

export default class ExportsEndpoint {
    private _needleClient: AuthenticatedNeedleClient;

    private _urls: Urls;

    get accountId(): string {
        return this._needleClient.accountId;
    }

    get authToken(): string {
        return this._needleClient.authToken;
    }

    constructor({ accountId, authToken, urls }: { accountId: string; authToken: string; urls: Urls }) {
        this._needleClient = new AuthenticatedNeedleClient({ accountId, authToken });
        this._urls = urls;
    }

    requestExport = (param: ExportRequest): Promise<ExportResult> => {
        return this._needleClient.post<ExportResult>(this._urls.exportsEndpointURL, param).then((data) => {
            if (!data) {
                throw new Error(
                    'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                );
            }
            return data;
        });
    };

    get = (identifier: string): Promise<ExportResult> =>
        this._needleClient.get<ExportResult>(this._urls.getExportEndpointURL({ identifier })).then((data) => {
            if (!data) {
                throw new Error(
                    'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                );
            }
            return data;
        });
}
