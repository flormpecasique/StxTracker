document.getElementById('check-balance').addEventListener('click', checkBalance);
document.getElementById('stx-address').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        checkBalance();
    }
});

async function checkBalance() { 
    let input = document.getElementById('stx-address').value.trim();

    if (!input) {
        alert('Please enter a valid STX address.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

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
