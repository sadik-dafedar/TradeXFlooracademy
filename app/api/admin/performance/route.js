import { GET as getHandler, POST as postHandler } from '@/lib/performance-monitor';
import { requireAdminAuth } from '@/lib/admin-auth';
import { rateLimitPresets } from '@/lib/rate-limit-middleware';

export const dynamic = 'force-dynamic';

// Wrap handlers with admin auth and rate limiting
export const GET = rateLimitPresets.adminRead(requireAdminAuth(getHandler));
export const POST = rateLimitPresets.adminWrite(requireAdminAuth(postHandler));
