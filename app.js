document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Por favor, ingresa una dirección de billetera STX válida.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = '';
    document.getElementById('transactions-list').innerHTML = '';

    // Consultar el balance
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }

    // Consultar las transacciones recientes
    const transactions = await getTransactions(address);
    if (transactions.length > 0) {
        const transactionsList = document.getElementById('transactions-list');
        transactions.forEach(tx => {
            const listItem = document.createElement('li');
            listItem.textContent = `Tx ID: ${tx.tx_id}, Block: ${tx.block_height}`;
            transactionsList.appendChild(listItem);
        });
    } else {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '<li>No se encontraron transacciones recientes.</li>';
    }
});

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

async function getTransactions(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const transactions = data.results || []; // Obtener transacciones o un array vacío

        // Filtrar transacciones para las últimas 24 horas
        const recentTransactions = transactions.filter(tx => {
            const txTimestamp = new Date(tx.block_time); // Fecha de la transacción
            const currentTimestamp = new Date();
            const timeDifference = currentTimestamp - txTimestamp; // Diferencia de tiempo
            return timeDifference <= 72 * 60 * 60 * 1000; // 72 horas en milisegundos
        });

        return recentTransactions;
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
        return [];
    }
}
