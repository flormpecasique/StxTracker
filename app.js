document.getElementById('check-balance').addEventListener('click', fetchBalance);
document.getElementById('stx-address').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        fetchBalance();
    }
});

async function fetchBalance() {
    const address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert('Por favor, ingresa una dirección de billetera STX válida.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = 'Cargando...';
    document.getElementById('balance-usd').innerText = '';

    // Consultar el balance
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;

        // Obtener precio de STX en USD
        const stxPrice = await getStxPrice();
        if (stxPrice !== null) {
            const balanceInUsd = (balance * stxPrice).toFixed(2);
            document.getElementById('balance-usd').innerText = `≈ $${balanceInUsd} USD`;
        } else {
            document.getElementById('balance-usd').innerText = 'No se pudo obtener el precio en USD.';
        }
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }
}

// Obtener el balance de la dirección
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convertir de microSTX a STX
    } catch (error) {
        console.error('Error al obtener el balance:', error);
        return null;
    }
}

// Obtener el precio de STX en USD
async function getStxPrice() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.blockstack.usd;
    } catch (error) {
        console.error('Error al obtener el precio de STX:', error);
        return null;
    }
}
