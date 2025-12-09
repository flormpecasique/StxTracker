document.getElementById('check-balance').addEventListener('click', async function () {
    let input = document.getElementById('stx-address').value.trim();

    if (!input) {
        alert('Please enter a valid STX address or BNS name.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';
    
    let address;

    if (input.endsWith('.btc')) {
        // Resolver BNS usando Hiro
        address = await getStacksAddressFromBNS(input.toLowerCase());
    } else {
        address = input;
    }
    
    if (!address) {
        document.getElementById('balance').innerText = 'Invalid BNS name or address';
        return;
    }

    // Obtener el balance usando Hiro Extended API
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

// Allow Enter key to trigger search
document.getElementById('stx-address').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        document.getElementById('check-balance').click();
    }
});

// ------------------------------
// Funciones de API
// ------------------------------
async function getBalance(address) {
    const url = `https://api.hiro.so/extended/v1/address/${address}/balances`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Address not found');
        const data = await response.json();

        // balance incluso si es 0
        if (data.stx && data.stx.balance !== undefined) {
            return Number(data.stx.balance) / 1_000_000;
        }
    } catch (error) {
        console.error('Error getting balance:', error);
    }
    return null;
}

async function getSTXPriceUSD() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.stacks?.usd || null;
    } catch (error) {
        console.error('Error getting STX price:', error);
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
