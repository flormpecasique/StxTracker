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

    // Convertir a minúsculas por si hay mayúsculas en BNS
    address = address.toLowerCase();

    // Mostrar mensaje de carga
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    let balance = null;

    if (address.includes('.btc')) {
        // Si es un BNS, obtener la dirección STX
        const stxAddress = await getBnsAddress(address);
        if (stxAddress) {
            balance = await getBalance(stxAddress);
        }
    } else {
        // Si es una dirección STX, obtener balance directamente
        balance = await getBalance(address);
    }

    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;

        // Obtener precio de STX en USD
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

// Obtener la dirección STX desde un nombre BNS
async function getBnsAddress(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (data.address) {
            return data.address; // Retorna la dirección STX
        } else {
            console.error('BNS address not found in API response:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching BNS address:', error);
        return null;
    }
}

// Obtener el balance de STX desde una dirección STX
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (data.stx && data.stx.balance) {
            return data.stx.balance / 1000000; // Convertir de microSTX a STX
        } else {
            console.error('STX balance not found in API response:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

// Obtener el precio de STX en USD
async function getStxPrice() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (data.stacks && data.stacks.usd) {
            return data.stacks.usd;
        } else {
            console.error('STX price not found in API response:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching STX price:', error);
        return null;
    }
}
