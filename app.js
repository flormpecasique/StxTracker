document.getElementById('check-balance').addEventListener('click', async function () {
    let input = document.getElementById('stx-address').value.trim();

    if (!input) {
        alert('Please enter a valid STX address or BNS name.');
        return;
    }

    // Limpiar resultados anteriores
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';
    
    let address;

    if (input.endsWith('.btc')) {
        address = await getStacksAddressFromBNS(input.toLowerCase());
    } else {
        address = input;
    }
    
    if (!address) {
        document.getElementById('balance').innerText = 'Invalid BNS name or address';
        return;
    }

    const balance = await getBalance(address);
    
    if (balance !== null) {
        const priceUSD = await getSTXPriceUSD();
        const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';
        
        document.getElementById('balance').innerText = `${balance} STX`;
        document.getElementById('balance-usd').innerText = `≈ ${balanceUSD} USD`;
    } else {
        document.getElementById('balance').innerText = 'Unable to retrieve the balance.';
    }
});

document.getElementById('stx-address').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        document.getElementById('check-balance').click();
    }
});

// Balance STX desde Hiro
async function getBalance(address) {
    const url = `https://api.hiro.so/extended/v1/address/${address}/balances`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Address not found');
        const data = await response.json();

        if (data.stx && data.stx.balance !== undefined) {
            return Number(data.stx.balance) / 1_000_000;
        }
    } catch (error) {
        console.error('Error getting balance:', error);
    }
    return null;
}

// NUEVO — Precio STX USD desde CoinGecko (100% funcional)
async function getSTXPriceUSD() {
    const url = "https://api.coingecko.com/api/v3/coins/stacks";

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.market_data?.current_price?.usd || null;
    } catch (error) {
        console.error("Error getting STX price:", error);
        return null;
    }
}

async function getStacksAddressFromBNS(bnsName) {
    const url = `/api/hiro-proxy?name=${bnsName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data.address || null;
    } catch (error) {
        console.error('Error resolving BNS name:', error);
        return null;
    }
}
