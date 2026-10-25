require('dotenv').config();

async function checkKey() {
    const secretKey = process.env.VDOCIPHER_API_SECRET;

    if (!secretKey) {
        console.error("❌ VDOCIPHER_API_SECRET is not set in environment");
        process.exit(1);
    }

    console.log(`Checking VdoCipher Key: ${secretKey.substring(0, 5)}...`);

    try {
        // Try to get OTP for a fake video ID.
        // If Key is good -> API will say "Video not found" (400/404)
        // If Key is bad -> API will say "Unauthorized" (401)
        const response = await fetch(`https://dev.vdocipher.com/api/videos/1234567890/otp`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Apisecret ${secretKey}`
            },
            body: JSON.stringify({
                annotate: JSON.stringify([{ type: 'text', text: 'test' }])
            })
        });

        const text = await response.text();
        console.log(`Response Status: ${response.status}`);

        if (response.status === 401) {
            console.error("❌ Key is INVALID (Unauthorized)");
        } else if (response.status === 200) {
            console.log("✅ Key is VALID (and oddly, the dummy video exists!)");
        } else {
            // Any other error (like Video ID invalid) likely means Auth passed
            console.log(`✅ Key seems VALID (Server accepted request but rejected video ID). Response: ${text}`);
        }

    } catch (error) {
        console.error("Network Error:", error.message);
    }
}

checkKey();
