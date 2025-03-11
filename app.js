document.getElementById('check-balance').addEventListener('click', fetchBalance);
document.getElementById('stx-address').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        fetchBalance();
    }
});

async function fetchBalance() {
    const address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert('Please enter a valid STX wallet address or BNS name.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';
    document.getElementById('bns-details').innerText = '';  // Clear previous BNS details

    // First, check if the address is a BNS name or an STX address
    if (address.endsWith('.btc')) {
        // Query the Hiro API through the proxy for BNS information
        const bnsData = await getBnsDetails(address);
        if (bnsData) {
            document.getElementById('bns-details').innerText = JSON.stringify(bnsData, null, 2);
        } else {
            document.getElementById('bns-details').innerText = 'Could not retrieve BNS details.';
        }
    } else {
        // Fetch STX balance if it's a valid address
        const balance = await getBalance(address);
        if (balance !== null) {
            document.getElementById('balance').innerText = `${balance} STX`;

            // Fetch STX price in USD
            const stxPrice = await getStxPrice();
            if (stxPrice !== null) {
                const balanceInUsd = (balance * stxPrice).toFixed(2);
                document.getElementById('balance-usd').innerText = `≈ $${balanceInUsd} USD`;
            } else {
                document.getElementById('balance-usd').innerText = 'Could not retrieve STX price in USD.';
            }
        } else {
            document.getElementById('balance').innerText = 'Could not retrieve balance.';
        }
    }
}

// Fetch BNS details from proxy API
async function getBnsDetails(name) {
    const url = `/api/hiro-proxy?name=${name}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;  // Returns the BNS details
    } catch (error) {
        console.error('Error fetching BNS details:', error);
        return null;
    }
}

// Fetch wallet balance
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convert from microSTX to STX
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

// Fetch STX price in USD
async function getStxPrice() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.blockstack.usd;
    } catch (error) {
        console.error('Error fetching STX price:', error);
        return null;
    }
}
