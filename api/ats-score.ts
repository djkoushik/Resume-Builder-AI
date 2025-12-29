import { calculateATSScore } from '../services/atsService';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { candidate, jobDescription } = req.body;

        if (!candidate || !jobDescription) {
            return res.status(400).json({ success: false, error: 'Missing candidate or jobDescription' });
        }

        const result = calculateATSScore(candidate, jobDescription);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('ATS Error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate ATS score' });
    }
}
