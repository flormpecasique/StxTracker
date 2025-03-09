document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Please enter a valid STX wallet address.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    // Get the balance in STX
    const balance = await getBalance(address);

    if (balance !== null) {
        // Get the price of STX in USD
        const priceUSD = await getSTXPriceUSD();
        
        // Calculate the value in USD
        const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';
        
        // Display results on the page
        document.getElementById('balance').innerText = `${balance} STX`;
        document.getElementById('balance-usd').innerText = `≈ ${balanceUSD} USD`;
    } else {
        document.getElementById('balance').innerText = 'Unable to retrieve the balance.';
    }
});

// Get the balance of the STX address
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convert satoshis to STX
    } catch (error) {
        console.error('Error getting balance:', error);
        return null;
    }
}

// Get the price of STX in USD
async function getSTXPriceUSD() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.blockstack.usd;
    } catch (error) {
        console.error('Error getting STX price:', error);
        return null;
    }
}
