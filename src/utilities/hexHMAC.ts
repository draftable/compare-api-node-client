import * as crypto from 'crypto';

export default function hexHMAC(key: string, policy: Object): string {
    const hmacAlgorithm: any = crypto.createHmac('sha256', key);
    const jsonPolicy = JSON.stringify(policy);
    return hmacAlgorithm.update(jsonPolicy, 'utf8').digest('hex');
}
