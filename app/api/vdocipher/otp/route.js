import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req) {
    try {
        const session = await auth();

        // 1. Strict Authentication Check
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized: Please login to watch' }, { status: 401 });
        }

        const { videoId } = await req.json();

        if (!videoId) {
            return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
        }

        const secretKey = process.env.VDOCIPHER_API_SECRET;

        if (!secretKey) {
            // Dev fallback if they haven't set key yet, to prevent app crash
            console.error("VDOCIPHER_API_SECRET is missing in .env");
            return NextResponse.json({ error: 'Server configuration error: DRM Key missing' }, { status: 500 });
        }

        // 2. Prepare Dynamic Watermark (Annotation)
        // This floats the user's email, name and IP over the video
        // "r:1" means it moves randomly to prevent removing it via crop
        const annotation = JSON.stringify([
            {
                type: 'rtext',
                text: `${session.user.name || 'User'} - ${session.user.email}`,
                alpha: '0.60',
                color: '0xFFFFFF',
                size: '15',
                interval: '5000'
            },
            {
                type: 'rtext',
                text: 'TradeX Floor Academy - Copyright',
                alpha: '0.30',
                color: '0xFF0000',
                size: '12',
                interval: '10000'
            }
        ]);

        // 3. Call VdoCipher API
        const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Apisecret ${secretKey}`
            },
            body: JSON.stringify({
                annotate: annotation,
                // limit restriction: 1 session per user to prevent account sharing?
                // In future we can add 'ip' restriction here if needed
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("VdoCipher Error:", errorText);
            throw new Error("Failed to generate DRM license");
        }

        const data = await response.json();

        // 4. Return OTP and PlaybackInfo to frontend
        return NextResponse.json({
            otp: data.otp,
            playbackInfo: data.playbackInfo
        });

    } catch (error) {
        console.error("DRM API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
