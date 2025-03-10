document.getElementById('check-balance').addEventListener('click', async function () {
    let input = document.getElementById('stx-address').value.trim();

    if (!input) {
        alert('Please enter a valid STX address or BNS name.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    // Si el input es un BNS name (termina en .btc), intentamos resolverlo
    if (input.endsWith('.btc')) {
        const resolvedAddress = await resolveBNS(input);
        if (!resolvedAddress) {
            document.getElementById('balance').innerText = 'BNS name not found.';
            return;
        }
        input = resolvedAddress; // Reemplazamos input con la dirección STX
    }

    // Obtener balance en STX
    const balance = await getBalance(input);
    if (balance !== null) {
        const priceUSD = await getSTXPriceUSD();
        const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';

        document.getElementById('balance').innerText = `${balance} STX`;
        document.getElementById('balance-usd').innerText = `≈ ${balanceUSD} USD`;
    } else {
        document.getElementById('balance').innerText = 'Unable to retrieve the balance.';
    }
});

// Función para resolver un BNS name a una dirección STX (Probamos varias APIs)
async function resolveBNS(bnsName) {
    let address = null;

    // 1. Intentamos con Hiro API (oficial de Stacks)
    try {
        const response = await fetch(`https://api.hiro.so/v1/bns/names/${bnsName}`);
        if (response.ok) {
            const data = await response.json();
            if (data.address) return data.address;
        }
    } catch (error) {
        console.error('Hiro API error:', error);
    }

    // 2. Intentamos con otra API alternativa
    try {
        const response = await fetch(`https://api.bns.xyz/v1/names/${bnsName}`);
        if (response.ok) {
            const data = await response.json();
            if (data.address) return data.address;
        }
    } catch (error) {
        console.error('BNS.xyz API error:', error);
    }

    // 3. Intentamos con Stacks Node API (funciona solo para BNS v1, pero por si acaso)
    try {
        const response = await fetch(`https://stacks-node-api.mainnet.stacks.co/v2/names/${bnsName}/address`);
        if (response.ok) {
            const data = await response.json();
            return data.address || null;
        }
    } catch (error) {
        console.error('Stacks Node API error:', error);
    }

    return address;
}

// Obtener el balance de una dirección STX
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convertir satoshis a STX
    } catch (error) {
        console.error('Error getting balance:', error);
        return null;
    }
}

// Obtener el precio del STX en USD
async function getSTXPriceUSD() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.stacks.usd;
    } catch (error) {
        console.error('Error getting STX price:', error);
        return null;
    }
}
