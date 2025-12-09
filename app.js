document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("stx-address");
    const button = document.getElementById("check-balance");
    const balanceText = document.getElementById("balance");
    const balanceUSD = document.getElementById("balance-usd");
    const spinner = document.getElementById("spinner");

    // --- Resolver nombre .btc a dirección ---
    async function resolveBNS(name) {
        try {
            const res = await fetch(`https://stacks-node-api.mainnet.stacks.co/v1/names/${name}`);
            const data = await res.json();
            return data.address || null;
        } catch (e) {
            console.error("Error resolving BNS:", e);
            return null;
        }
    }

    // --- Obtener precio del STX en USD ---
    async function getSTXPrice() {
        try {
            const res = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd"
            );
            const data = await res.json();

            if (data?.stacks?.usd) return data.stacks.usd;

            return null;
        } catch (e) {
            console.error("Error fetching price:", e);
            return null;
        }
    }

    // --- Obtener balance STX de dirección ---
    async function getSTXBalance(address) {
        try {
            const res = await fetch(
                `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/${address}/balances`
            );
            const data = await res.json();

            if (!data?.stx?.balance) return null;

            return data.stx.balance / 1_000_000; // microstacks → STX
        } catch (e) {
            console.error("Balance fetch error:", e);
            return null;
        }
    }

    // --- Acción al pulsar el botón ---
    button.addEventListener("click", async () => {
        let address = input.value.trim();

        if (!address) {
            alert("Please enter a Stacks address or .btc name.");
            return;
        }

        // Mostrar cargando
        balanceText.textContent = "---";
        balanceUSD.textContent = "---";
        spinner.classList.remove("hidden");

        // Resolver BNS si termina en .btc
        if (address.endsWith(".btc")) {
            const resolved = await resolveBNS(address.toLowerCase());
            if (!resolved) {
                spinner.classList.add("hidden");
                balanceText.textContent = "Invalid .btc name";
                return;
            }
            address = resolved;
        }

        // Obtener balance STX
        const stxBalance = await getSTXBalance(address);
        if (stxBalance === null) {
            spinner.classList.add("hidden");
            balanceText.textContent = "Error fetching balance";
            return;
        }

        balanceText.textContent = `${stxBalance.toFixed(6)} STX`;

        // Obtener precio STX → USD
        const price = await getSTXPrice();
        if (price === null) {
            spinner.classList.add("hidden");
            balanceUSD.textContent = "≈ N/A USD";
            return;
        }

        const totalUSD = stxBalance * price;
        balanceUSD.textContent = `≈ ${totalUSD.toFixed(2)} USD`;

        spinner.classList.add("hidden");
    });
});
