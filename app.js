async function fetchBalance() {
    let input = document.getElementById('stx-address').value.trim();

    if (!input) {
        alert('Please enter a valid STX wallet address or BNS name.');
        return;
    }

    // Clear previous results
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';

    let address = input;

    // Si el input parece un nombre BNS, obtenemos la dirección STX asociada
    if (!input.startsWith("SP") && !input.startsWith("ST")) {
        const bnsData = await getBnsAddress(input);
        if (bnsData && bnsData.address) {
            address = bnsData.address;
        } else {
            document.getElementById('balance').innerText = 'Invalid BNS name.';
            return;
        }
    }

    // Fetch balance
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

// Fetch BNS address
async function getBnsAddress(name) {
    const url = `/api/hiro-proxy?name=${name}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching BNS address:', error);
        return null;
    }
}
