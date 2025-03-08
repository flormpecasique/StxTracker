document.getElementById('check-balance').addEventListener('click', async function() {
    const input = document.getElementById('stx-address').value.trim();
    
    if (!input) {
        alert('Por favor, ingresa una dirección de billetera STX válida o un nombre BNS.');
        return;
    }

    // Limpiar resultados previos
    document.getElementById('balance').innerText = '';
    document.getElementById('transactions-list').innerHTML = '';

    let address = input;

    // Si el input es un nombre BNS (tiene el formato 'nombre.btc')
    if (input.includes('.btc')) {
        // Resolver el nombre BNS a una dirección
        address = await resolveBNS(input);
        if (!address) {
            alert('No se pudo resolver el nombre BNS a una dirección válida. Asegúrate de que el nombre esté registrado.');
            return;
        }
    }

    // Consultar el balance
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById('balance').innerText = `${balance} STX`;
    } else {
        document.getElementById('balance').innerText = 'No se pudo obtener el balance.';
    }

    // Consultar las transacciones recientes
    const transactions = await getTransactions(address);
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

// Obtener las transacciones de la dirección
async function getTransactions(address) {
    const url = `https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}/transactions`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || []; // Devolver transacciones o un array vacío
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
        return [];
    }
}

// Resolver un nombre BNS (ej. flor.btc) a una dirección STX
async function resolveBNS(name) {
    if (!name || !name.endsWith('.btc')) {
        return null; // El nombre no es válido si no termina en '.btc'
    }

    const url = `https://stacks-node-api.mainnet.stacks.co/v2/names/${name}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.address) {
            return data.address; // Devolver la dirección STX resuelta
        } else {
            console.error('No se encontró la dirección para el nombre BNS:', name);
            return null;
        }
    } catch (error) {
        console.error('Error al resolver el nombre BNS:', error);
        return null;
    }
}

// Filtrar transacciones que ocurrieron en las últimas 72 horas
function filterRecentTransactions(transactions) {
    const now = Date.now(); // Tiempo actual en milisegundos
    const seventyTwoHoursInMs = 72 * 60 * 60 * 1000; // 72 horas en milisegundos
    
    return transactions.filter(tx => {
        const txTime = tx.block_time * 1000; // Convertir el tiempo del bloque a milisegundos
        return now - txTime <= seventyTwoHoursInMs; // Filtrar transacciones de las últimas 72 horas
    });
}
