document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Por favor, ingresa una dirección de billetera STX válida.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = 'Cargando...';
    document.getElementById('balance-usd').innerText = '';

    // Obtener el balance en STX
    const balance = await getBalance(address);

    if (balance !== null) {
        // Obtener el precio del STX en USD
        const priceUSD = await getSTXPriceUSD();
        
        // Calcular el valor en dólares
        const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';
        
        // Mostrar resultados en la página
        document.getElementById('balance').innerText = `${balance} STX`;
        document.getElementById('balance-usd').innerText = `≈ ${balanceUSD} USD`;
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }
});

// Obtener el balance de la dirección STX
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convertir satoshis a STX
    } catch (error) {
        console.error('Error al obtener el balance:', error);
        return null;
    }
}

// Obtener el precio de STX en USD
async function getSTXPriceUSD() {
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
