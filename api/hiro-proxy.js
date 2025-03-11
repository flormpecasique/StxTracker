export default async function handler(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "BNS name is required" });
    }

    try {
        const response = await fetch(`https://api.hiro.so/v1/names/${name}.btc`, {
            headers: {
                "Authorization": `Bearer ${process.env.HIRO_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching BNS data: ${response.statusText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching BNS data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

