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

    // Convert the address to lowercase
    address = address.toLowerCase();  // Convierte la dirección a minúsculas

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    let balance = null;
    if (address.includes('.btc')) {
        // Aquí llamamos al endpoint de tu API proxy (hiro-proxy.js) para obtener el balance BNS
        balance = await getBnsBalance(address);
    } else {
        // Fetch STX balance (esto sigue igual)
        balance = await getBalance(address);
    }

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

// Fetch BNS balance (esto ahora usa tu proxy de la API)
async function getBnsBalance(bns) {
    const url = `/api/hiro-proxy?name=${bns}`;  // Aquí llamamos a la ruta de tu API
    try {
        const response = await fetch(url);
        const data = await response.json();
        const stxAddress = data.address;
        return await getBalance(stxAddress); // Usamos la dirección STX para obtener el balance
    } catch (error) {
        console.error('Error fetching BNS balance:', error);
        return null;
    }
}

// Fetch STX balance
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
