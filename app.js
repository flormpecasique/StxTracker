document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Por favor, ingresa una dirección de billetera STX válida.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = '';

    // Consultar el balance
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }
});

// Obtener el balance de la dirección
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
