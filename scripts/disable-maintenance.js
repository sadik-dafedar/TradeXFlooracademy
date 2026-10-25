/**
 * Script to disable maintenance mode
 */
const { PrismaClient } = require('@prisma/client');

async function disableMaintenance() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Disabling maintenance mode...');
        
        // Create or update system config
        const config = await prisma.systemConfig.upsert({
            where: { key: 'main_config' },
            update: { 
                maintenanceMode: false,
                updatedAt: new Date()
            },
            create: {
                key: 'main_config',
                siteName: 'TradeXFloor Academy',
                maintenanceMode: false,
                razorpayMode: 'test',
                enableEmailNotifications: true,
                enableNewUserWelcome: true,
                updatedAt: new Date()
            }
        });
        
        console.log('✅ Maintenance mode disabled successfully');
        console.log('Config:', config);
        
    } catch (error) {
        console.error('❌ Error disabling maintenance mode:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

disableMaintenance();