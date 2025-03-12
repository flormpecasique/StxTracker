document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Please enter a valid STX wallet address or BNS name.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = '';
    document.getElementById('transactions-list').innerHTML = '';

    let balance = null;
    let transactions = null;

    // Verificamos si es una dirección STX o un nombre BNS
    if (address.includes('.btc')) {
        // Si es un nombre BNS, obtenemos la dirección STX asociada
        balance = await getBnsBalance(address);
        transactions = await getBnsTransactions(address);
    } else {
        // Si es una dirección STX, obtenemos el balance directamente
        balance = await getBalance(address);
        transactions = await getTransactions(address);
    }

    // Mostrar balance
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
    } else {
        document.getElementById('balance').innerText = 'Could not retrieve balance.';
    }

    // Mostrar las transacciones
    const recentTransactions = filterRecentTransactions(transactions);

    if (recentTransactions.length > 0) {
        const transactionsList = document.getElementById('transactions-list');
        recentTransactions.forEach(tx => {
            const listItem = document.createElement('li');
            listItem.textContent = `Tx ID: ${tx.tx_id}, Block: ${tx.block_height}, Date: ${new Date(tx.block_time * 1000).toLocaleString()}`;
            transactionsList.appendChild(listItem);
        });
    } else {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '<li>No recent transactions found in the last 72 hours.</li>';
    }
});

// Obtener balance de una dirección STX
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convertir de satoshis a STX
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

// Obtener balance de una dirección BNS
async function getBnsBalance(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.address) {
            return await getBalance(data.address); // Usamos la dirección STX para obtener el balance
        } else {
            console.error("BNS data does not contain address:", data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching BNS balance:', error);
        return null;
    }
}

// Obtener transacciones de una dirección STX
async function getTransactions(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || []; // Devolver transacciones o un array vacío
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Obtener transacciones de una dirección BNS
async function getBnsTransactions(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || []; // Devolver transacciones o un array vacío
    } catch (error) {
        console.error('Error fetching BNS transactions:', error);
        return [];
    }
}

// Filtrar transacciones recientes (últimas 72 horas)
function filterRecentTransactions(transactions) {
    const now = Date.now(); // Tiempo actual en milisegundos
    const seventyTwoHoursInMs = 72 * 60 * 60 * 1000; // 72 horas en milisegundos
    
    return transactions.filter(tx => {
        const txTime = tx.block_time * 1000; // Convertir el tiempo del bloque a milisegundos
        return now - txTime <= seventyTwoHoursInMs; // Filtrar transacciones dentro de las últimas 72 horas
    });
}
