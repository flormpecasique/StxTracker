document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert('Por favor, ingresa una dirección de billetera STX o BNS válida.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = '';
    document.getElementById('transactions-list').innerHTML = '';

    let actualAddress = address;
    if (address.endsWith('.btc')) {
        // Resolver la dirección BNS
        console.log(`Resolviendo BNS: ${address}`);
        const resolvedAddress = await resolveBnsAddress(address);
        if (!resolvedAddress) {
            alert('No se pudo resolver la dirección BNS.');
            return;
        }
        console.log(`Dirección resuelta de BNS: ${resolvedAddress}`);
        actualAddress = resolvedAddress;
    }

    // Consultar el balance
    console.log(`Consultando saldo para la dirección STX: ${actualAddress}`);
    const balance = await getBalance(actualAddress);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }

    // Consultar las transacciones recientes
    console.log(`Consultando transacciones para la dirección STX: ${actualAddress}`);
    const transactions = await getTransactions(actualAddress);
    const recentTransactions = filterRecentTransactions(transactions);

    if (recentTransactions.length > 0) {
        const transactionsList = document.getElementById('transactions-list');
        recentTransactions.forEach(tx => {
            const listItem = document.createElement('li');
            listItem.textContent = `Tx ID: ${tx.tx_id}, Block: ${tx.block_height}, Fecha: ${new Date(tx.block_time * 1000).toLocaleString()}`;
            transactionsList.appendChild(listItem);
        });
    } else {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '<li>No se encontraron transacciones recientes en las últimas 72 horas.</li>';
    }
});

// Obtener el balance de la dirección (usando la API de Hiro)
async function getBalance(address) {
    const url = `https://api.hiro.so/v1/accounts/${address}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Datos del balance:', data);
        if (data.balance !== undefined) {
            return data.balance / 1000000; // Convertir satoshis a STX
        } else {
            console.error('Error al obtener el balance:', data);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener el balance:', error);
        return null;
    }
}

// Obtener las transacciones de la dirección (usando la API de Hiro)
async function getTransactions(address) {
    const url = `https://api.hiro.so/v1/accounts/${address}/transactions?limit=100`;
    try {
        const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
        const data = await response.json();
        console.log('Datos de transacciones:', data);
        return data.results || []; // Devolver transacciones o un array vacío
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
        return [];
    }
}

// Filtrar transacciones que ocurrieron en las últimas 72 horas
function filterRecentTransactions(transactions) {
    const now = Date.now(); // Tiempo actual en milisegundos
    const seventyTwoHoursInMs = 72 * 60 * 60 * 1000; // 72 horas en milisegundos
    
    return transactions.filter(tx => {
        if (!tx.block_time) {
            return false; // Si no hay block_time, no considerarla
        }

        const txTime = tx.block_time * 1000; // Convertir el tiempo del bloque a milisegundos
        return now - txTime <= seventyTwoHoursInMs; // Filtrar transacciones de las últimas 72 horas
    });
}

// Resolver la dirección BNS a dirección STX (usando la API de Hiro)
async function resolveBnsAddress(bnsAddress) {
    const url = `https://api.hiro.so/v1/names/${bnsAddress}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Datos de resolución de BNS:', data);
        if (data.address) {
            return data.address; // Devolver la dirección STX correspondiente
        } else {
            console.error('No se resolvió la dirección BNS correctamente:', data);
            return null;
        }
    } catch (error) {
        console.error('Error al resolver la dirección BNS:', error);
        return null;
    }
}
