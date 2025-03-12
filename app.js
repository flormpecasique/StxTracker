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

    address = address.toLowerCase();
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    let finalAddress = address;
    if (address.includes('.btc')) {
        finalAddress = await resolveBnsAddress(address);
        if (!finalAddress) {
            document.getElementById('balance').innerText = 'Invalid BNS name.';
            return;
        }
    }

    const balance = await getBalance(finalAddress);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
        
        const priceUSD = await getSTXPriceUSD();
        if (priceUSD !== null) {
            const balanceUSD = (balance * priceUSD).toFixed(2);
            document.getElementById('balance-usd').innerText = `≈ ${balanceUSD} USD`;
        } else {
            document.getElementById('balance-usd').innerText = 'Could not retrieve STX price in USD.';
        }
    } else {
        document.getElementById('balance').innerText = 'Unable to retrieve the balance.';
    }
}

async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch balance');
        const data = await response.json();
        return data.stx_balance ? data.stx_balance / 1000000 : 0;
    } catch (error) {
        console.error('Error getting balance:', error);
        return null;
    }
}

async function resolveBnsAddress(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch BNS address');
        const data = await response.json();
        return data.address || null;
    } catch (error) {
        console.error('Error resolving BNS:', error);
        return null;
    }
}

async function getSTXPriceUSD() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch STX price');
        const data = await response.json();
        return data.blockstack?.usd || null;
    } catch (error) {
        console.error('Error getting STX price:', error);
        return null;
    }
}
