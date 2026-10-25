
// scripts/benchmark-maintenance.js

// Mock Prisma
const dbDelay = 50; // ms
const mockPrisma = {
  systemConfig: {
    findUnique: async () => {
      await new Promise(resolve => setTimeout(resolve, dbDelay));
      return { maintenanceMode: false };
    }
  }
};

// Original implementation
async function checkMaintenanceOriginal() {
  const start = performance.now();
  await mockPrisma.systemConfig.findUnique({ where: { key: 'main_config' } });
  return performance.now() - start;
}

// Cached implementation (simulation of unstable_cache behavior)
// unstable_cache memorizes the result for a given duration (revalidate time)
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 60 seconds

async function checkMaintenanceCached() {
    const start = performance.now();
    const now = Date.now();

    // Check if cache is valid
    if (cache && (now - cacheTime < CACHE_TTL)) {
        return performance.now() - start;
    }

    // Cache miss - fetch from DB
    await mockPrisma.systemConfig.findUnique({ where: { key: 'main_config' } });

    // Update cache
    cache = { maintenanceMode: false };
    cacheTime = now;

    return performance.now() - start;
}

async function runBenchmark() {
  console.log('Starting Maintenance Check Benchmark...');
  const iterations = 20;

  // Baseline
  let totalTimeOriginal = 0;
  for (let i = 0; i < iterations; i++) {
    totalTimeOriginal += await checkMaintenanceOriginal();
  }
  const avgOriginal = totalTimeOriginal / iterations;
  console.log(`Original Average Latency: ${avgOriginal.toFixed(2)}ms`);

  // Optimized
  let totalTimeCached = 0;

  // Warm up cache (first request pays the penalty)
  const firstCallTime = await checkMaintenanceCached();
  console.log(`First Call (Cold Cache): ${firstCallTime.toFixed(2)}ms`);

  // Subsequent calls
  for (let i = 0; i < iterations; i++) {
    totalTimeCached += await checkMaintenanceCached();
  }
  const avgCached = totalTimeCached / iterations;
  console.log(`Cached Average Latency (Warm): ${avgCached.toFixed(2)}ms`);

  // Improvement calculation
  const improvement = avgOriginal / avgCached;
  console.log(`Performance Improvement: ~${improvement.toFixed(1)}x faster`);
}

runBenchmark();
