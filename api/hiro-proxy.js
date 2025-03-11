export default async function handler(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Missing 'name' parameter" });
    }

    const apiKey = process.env.HIRO_API_KEY; // Tomamos la API Key de las variables de entorno en Vercel

    const url = `https://api.hiro.so/v1/names/${name}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Hiro API responded with status: ${response.status}`);
        }

        const data = await response.json();
        // Aquí retornamos la respuesta de Hiro directamente
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching data from Hiro API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
