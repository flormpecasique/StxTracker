// --- Resolver nombres .btc a dirección STX ---
async function resolveBNS(name) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v1/names/${name}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        return data.address || null;

    } catch (err) {
        console.error("Error resolving BNS:", err);
        return null;
    }
}

// --- Obtener precio STX → USD ---
async function getSTXPriceUSD() {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd";

    try {
        const response = await fetch(url, {
            headers: { "accept": "application/json" }
        });

        const data = await response.json();

        if (data.stacks && data.stacks.usd) {
            return data.stacks.usd;
        } else {
            console.error("Precio no disponible:", data);
            return null;
        }

    } catch (error) {
        console.error("Error getting STX price:", error);
        return null;
    }
}

// --- Obtener balance STX de una dirección ---
async function getSTXBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/${address}/balances`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        return data.stx.balance / 1_000_000; // microSTX → STX

    } catch (err) {
        console.error("Error fetching STX balance:", err);
        return null;
    }
}

// --- Lógica del botón ---
document.getElementById("checkBalanceBtn").addEventListener("click", async () => {
    const input = document.getElementById("addressInput").value.trim();
    const resultSTX = document.getElementById("stxBalance");
    const resultUSD = document.getElementById("usdBalance");

    resultSTX.textContent = "Loading...";
    resultUSD.textContent = "";

    let address = input;

    // Si termina en .btc → resolverlo
    if (input.endsWith(".btc")) {
        resultSTX.textContent = "Resolving .btc name...";
        address = await resolveBNS(input);
        if (!address) {
            resultSTX.textContent = "Error: Name not found.";
            return;
        }
    }

    // Obtener saldo STX
    const balanceSTX = await getSTXBalance(address);
    if (balanceSTX === null) {
        resultSTX.textContent = "Unable to retrieve balance.";
        return;
    }

    // Mostrar balance STX
    resultSTX.textContent = `${balanceSTX.toFixed(6)} STX`;

    // Obtener precio STX → USD
    const priceUSD = await getSTXPriceUSD();

    if (priceUSD === null) {
        resultUSD.textContent = "≈ N/A USD";
        return;
    }

    // Calcular valor en USD
    const totalUSD = balanceSTX * priceUSD;
    resultUSD.textContent = `≈ ${totalUSD.toFixed(2)} USD`;
});
