import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

export const getSystemConfig = unstable_cache(
  async () => {
    return prisma.systemConfig.findUnique({ where: { key: 'main_config' } });
  },
  ['system-config'],
  {
    revalidate: 60,
    tags: ['system-config']
  }
);
