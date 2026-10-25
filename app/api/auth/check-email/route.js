import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const { email } = await req.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, isVerified: true }
        });
        
        return NextResponse.json({ 
            exists: !!user, 
            user: user ? { email: user.email, name: user.name, isVerified: user.isVerified } : null 
        });
    } catch (error) {
        console.error('Check email error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}