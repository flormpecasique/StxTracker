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

    // Fetch balance and BNS address
    let balance = null;
    if (address.includes('.btc')) {
        // Fetch BNS (flor.btc) address details (con API Key)
        balance = await getBnsBalance(address);
    } else {
        // Fetch STX balance (sin necesidad de API Key)
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

// Fetch wallet balance (sin API Key para direcciones STX)
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

// Fetch BNS address balance (con API Key para nombres BNS)
async function getBnsBalance(bns) {
    const apiKey = process.env.HIRO_API_KEY; // Asegúrate de que la API Key esté configurada en Vercel
    const url = `https://api.hiro.so/v1/names/${bns}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const data = await response.json();
        if (data.address) {
            const stxAddress = data.address;
            return await getBalance(stxAddress); // Usa la dirección STX obtenida para consultar el balance
        } else {
            console.error('No address found for BNS:', bns);
            return null;
        }
    } catch (error) {
        console.error('Error fetching BNS balance:', error);
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
