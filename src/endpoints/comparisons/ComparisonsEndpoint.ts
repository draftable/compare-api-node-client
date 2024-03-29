import { generateIdentifier as _generateIdentifier } from './utilities';
import Urls from '../urls';
import { ComparisonData, ComparisonsResult, Side, Stream } from './types';
import AuthenticatedNeedleClient from '../../utilities/AuthenticatedNeedleClient';
import Comparison from './Comparison';
import { DateParameter } from '../types';
import ALLOWED_FILE_TYPES from './constants';

export default class ComparisonsEndpoint {
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

    getAll = (): Promise<Comparison[]> =>
        this.needleClient.get<ComparisonsResult>(this.urls.comparisonsEndpointURL).then((data) => {
            if (!data || !data.results) {
                throw new Error(
                    `Unexpected response received - expected object with non-null results array, instead got: ${JSON.stringify(
                        data,
                    )}`,
                );
            }
            return data.results.map((result): Comparison => new Comparison(result));
        });

    get = (identifier: string): Promise<Comparison> =>
        this.needleClient
            .get(this.urls.getComparisonEndpointURL({ identifier }))
            .then((comparisonData: ComparisonData) => {
                if (!comparisonData) {
                    throw new Error(
                        'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                    );
                }
                return new Comparison(comparisonData);
            });

    create = ({
        left,
        right,
        identifier,
        publiclyAccessible,
        expires,
    }: {
        left: Side;
        right: Side;
        identifier?: string;
        publiclyAccessible?: boolean;
        expires?: DateParameter;
    }): Promise<Comparison> => {
        // We need to use a multipart request when either either file is specified using a buffer rather than a URL.
        const multipartRequired = !(typeof left.source === 'string' && typeof right.source === 'string');
        function getSideData(side: string, data: Side) {
            if (data.fileType == null || typeof data.fileType !== 'string') {
                throw new Error('Invalid file type given - file type must be a string.');
            }
            if (ALLOWED_FILE_TYPES[data.fileType.toLowerCase()] == null) {
                throw new Error(
                    `Invalid file type "${data.fileType.toLowerCase()}" given. Expected one of ("${Object.keys(
                        ALLOWED_FILE_TYPES,
                    ).join('", "')}").`,
                );
            }
            const sideData: { file_type?: string; display_name?: string; source_url?: string | Stream } = {};
            if (multipartRequired) {
                sideData[`${side}.file_type`] = data.fileType;
                if (data.displayName) {
                    sideData[`${side}.display_name`] = data.displayName;
                }
                if (typeof data.source === 'string') {
                    sideData[`${side}.source_url`] = data.source;
                } else {
                    sideData[`${side}.file`] = {
                        content_type: 'application/octet-stream',
                        filename: `${side}.${data.fileType}`,
                        buffer: data.source,
                    };
                }
                return sideData;
            }
            sideData.file_type = data.fileType;
            if (data.displayName) {
                sideData.display_name = data.displayName;
            }
            sideData.source_url = data.source;
            const result = {};
            result[side] = sideData;
            return result;
        }

        try {
            if (expires) {
                if (typeof expires === 'string') {
                    expires = Date.parse(expires);
                }
                if (typeof expires === 'number') {
                    expires = new Date(expires);
                }
                expires = expires.toISOString();
            }
            const data = {
                identifier,
                ...getSideData('left', left),
                ...getSideData('right', right),
                public: publiclyAccessible,
                expiry_time: expires,
            };
            return this.needleClient
                .post(this.urls.comparisonsEndpointURL, data, multipartRequired)
                .then((comparisonData: ComparisonData) => {
                    if (!comparisonData) {
                        throw new Error(
                            'Unexpected response received - expected non-empty comparison object, instead got nothing.',
                        );
                    }
                    return new Comparison(comparisonData);
                });
        } catch (error) {
            return Promise.reject(error);
        }
    };

    destroy = (identifier: string): Promise<null> =>
        this.needleClient.destroy(this.urls.getComparisonEndpointURL({ identifier }));

    generateIdentifier = (): string => _generateIdentifier();

    publicViewerURL = (identifier: string, wait?: boolean): string =>
        this.urls.getViewerURL(this.accountId, null, identifier, null, wait || false);

    signedViewerURL = (identifier: string, valid_until?: DateParameter, wait?: boolean): string =>
        this.urls.getViewerURL(
            this.accountId,
            this.authToken,
            identifier,
            valid_until || Date.now() + 30 * 60 * 1000,
            wait || false,
        );
}
