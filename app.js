document.getElementById('check-balance').addEventListener('click', fetchBalance);
document.getElementById('stx-address').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        fetchBalance();
    }
});

async function fetchBalance() {
    let address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert('Please enter a valid STX wallet address or BNS name.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    let finalAddress = address;
    if (address.includes('.btc')) {
        finalAddress = await getBnsAddress(address);
        if (!finalAddress) {
            document.getElementById('balance').innerText = 'BNS name not found.';
            return;
        }
    }

    const balance = await getStxBalance(finalAddress);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;

        const stxPrice = await getStxPrice();
        if (stxPrice !== null) {
            const balanceInUsd = (balance * stxPrice).toFixed(2);
            document.getElementById('balance-usd').innerText = `≈ $${balanceInUsd} USD`;
        } else {
            document.getElementById('balance-usd').innerText = 'Could not retrieve STX price.';
        }
    } else {
        document.getElementById('balance').innerText = 'Could not retrieve balance.';
    }
}

// Fetch BNS address
async function getBnsAddress(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('BNS not found');
        const data = await response.json();
        return data.address || null;
    } catch (error) {
        console.error('Error fetching BNS address:', error);
        return null;
    }
}

// Fetch STX balance
async function getStxBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Address not found');
        const data = await response.json();
        return data.stx_balance ? data.stx_balance / 1000000 : 0;
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
        return data.blockstack?.usd || null;
    } catch (error) {
        console.error('Error fetching STX price:', error);
        return null;
    }
}
