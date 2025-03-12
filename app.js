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
        // If input is a BNS name, convert to lowercase and resolve to Stacks address
        address = await getStacksAddressFromBNS(input.toLowerCase()); // Convert BNS name to lowercase
    } else {
        // Assume input is a direct Stacks address (do not modify case)
        address = input;
    }
    
    if (!address) {
        document.getElementById('balance').innerText = 'Invalid BNS name or address';
        return;
    }

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

// Allow the search to be triggered when pressing Enter
document.getElementById('stx-address').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        document.getElementById('check-balance').click();
    }
});

// Get the balance of the STX address
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.balance) {
            return parseInt(data.balance, 16) / 1000000; // Convert hex balance to decimal STX
        }
    } catch (error) {
        console.error('Error getting balance:', error);
    }
    return null;
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

// Get Stacks address from BNS name
async function getStacksAddressFromBNS(bnsName) {
    const url = `https://api.hiro.so/v1/names/${bnsName}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.address || null;
    } catch (error) {
        console.error('Error resolving BNS name:', error);
        return null;
    }
}
