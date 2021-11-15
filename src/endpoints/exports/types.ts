export type ExportKind = 'single_page' | 'left' | 'right' | 'combined';

export type ExportResult = {
    ready: boolean;
    identifier: string;
    comparison: string;
    url: string;
    kind: ExportKind;
    failed: boolean;
};

export type ExportRequest = {
    comparison: string;
    kind: ExportKind;
    include_cover_page?: boolean;
};
