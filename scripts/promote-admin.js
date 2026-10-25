const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'parthaobroy@gmail.com';
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log(`ERROR: User with email ${email} not found in database. Please sign up on the website first.`);
            process.exit(1);
        }

        await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                isVerified: true
            }
        });

        console.log(`SUCCESS: User ${email} has been promoted to ADMIN.`);
    } catch (error) {
        console.error('Database error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
