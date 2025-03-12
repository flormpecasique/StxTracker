document.getElementById('check-balance').addEventListener('click', fetchBalance);
document.getElementById('stx-address').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        fetchBalance();
    }
});

async function fetchBalance() {
    const address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert('Please enter a valid STX wallet address or BNS name.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = 'Loading...';
    document.getElementById('balance-usd').innerText = '';
    document.getElementById('transactions-list').innerHTML = '';

    // Convertir la dirección a minúsculas
    const addressLowerCase = address.toLowerCase(); // Aseguramos que la dirección esté en minúsculas

    let balance = null;
    let transactions = null;

    // Verificamos si es un nombre BNS o una dirección STX
    if (addressLowerCase.includes('.btc')) {
        // Consultar balance y transacciones para BNS
        balance = await getBnsBalance(addressLowerCase);
        transactions = await getBnsTransactions(addressLowerCase);
    } else {
        // Consultar balance y transacciones para una dirección STX
        balance = await getBalance(addressLowerCase);
        transactions = await getTransactions(addressLowerCase);
    }

    // Mostrar el balance
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;

        // Consultar el precio de STX en USD
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

    // Mostrar las transacciones recientes
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
}

// Obtener el balance de la dirección
async function getBalance(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.balance / 1000000; // Convertir de microSTX a STX
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

// Obtener el balance de una dirección BNS
async function getBnsBalance(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}`;
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

// Obtener las transacciones de la dirección
async function getTransactions(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || []; // Devolver las transacciones o un array vacío
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Obtener las transacciones de una dirección BNS
async function getBnsTransactions(bns) {
    const url = `https://api.hiro.so/v1/names/${bns}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || []; // Devolver las transacciones o un array vacío
    } catch (error) {
        console.error('Error fetching BNS transactions:', error);
        return [];
    }
}

// Filtrar las transacciones que ocurrieron en las últimas 72 horas
function filterRecentTransactions(transactions) {
    const now = Date.now(); // Tiempo actual en milisegundos
    const seventyTwoHoursInMs = 72 * 60 * 60 * 1000; // 72 horas en milisegundos
    
    return transactions.filter(tx => {
        const txTime = tx.block_time * 1000; // Convertir el tiempo del bloque a milisegundos
        return now - txTime <= seventyTwoHoursInMs; // Filtrar las transacciones de las últimas 72 horas
    });
}

// Obtener el precio de STX en USD
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
