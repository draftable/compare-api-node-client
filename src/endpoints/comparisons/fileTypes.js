// @flow

export const allowedFileTypes = {
    pdf: 'pdf',
    docx: 'docx',
    docm: 'docm',
    doc: 'doc',
    rtf: 'rtf',
    pptx: 'pptx',
    pptm: 'pptm',
    ppt: 'ppt',
};

export type FileType = $Enum<typeof allowedFileTypes>;
