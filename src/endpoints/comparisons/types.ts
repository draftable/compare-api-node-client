import ALLOWED_FILE_TYPES from './constants';

export type ComparisonsResult = {
    count: number;
    limit?: number | null;
    offset?: number | null;
    results: ComparisonData[];
    creation_time: string;
    expiry_time: string;
    public: boolean;
    ready: boolean;
};

export type SideData = {
    file_type: FileType;
    source_url?: string | null;
    display_name?: string | null;
    page_count?: number | null;
    original_document_size_bytes?: number | null;
    highlighted_document_size_bytes?: number | null;
    file?: string | null;
};

export type ComparisonData = {
    identifier: string;
    url: string;
    viewer_url: string;
    left: SideData;
    right: SideData;
    creation_time: string;
    // noinspection ReservedWordAsName
    public?: boolean | null;
    expiry_time?: string;
    ready: boolean;
    ready_time?: string;
    failed?: boolean | null;
    error_message?: string | null;
};

export type ComparisonSide = {
    fileType: FileType;
    sourceURL?: string | null;
    displayName?: string | null;
    pageCount?: number | null;
    originalDocumentSizeBytes?: number | null;
    highlightedDocumentSizeBytes?: number | null;
    file?: string | null;
};

export type FileType = keyof typeof ALLOWED_FILE_TYPES;

export type Stream = { pipe: unknown };

export type Side = {
    source: Stream | string;
    fileType: FileType;
    displayName?: string;
};
