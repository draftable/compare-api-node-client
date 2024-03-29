import * as crypto from 'crypto';

function tryGetBytes(length: number): number[] {
    let bytes;
    for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
            bytes = crypto.randomBytes(length);
            break;
        } catch (error) {
            // pass
        }
    }
    if (!bytes) {
        throw new Error('Unable to generate random bytes (attempted 100 times...)');
    }
    const byteArray = [];
    for (let i = 0; i < length; i += 1) {
        byteArray.push(bytes.readUInt8(i));
    }
    return byteArray;
}

export default function randomString(length: number, charset: string): string {
    const chars = charset.length;
    if (chars > 256) {
        throw new Error('randomString only accepts charsets at most 256 characters.');
    }

    const byteRejectionThreshold = 256 - (256 % chars);
    let result = '';
    while (length > 0) {
        const probablyEnoughBytes = Math.ceil((length * 256) / byteRejectionThreshold + 1 + length / 6);
        const bytes = tryGetBytes(probablyEnoughBytes);
        // eslint-disable-next-line no-restricted-syntax
        for (const byte of bytes) {
            if (byte < byteRejectionThreshold) {
                result += charset.charAt(byte % chars);
                length -= 1;
                if (length === 0) {
                    break;
                }
            }
        }
    }

    return result;
}
