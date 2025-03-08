// Función para obtener el saldo de STX
const getBalance = async (address) => {
    try {
        const response = await fetch(`https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}`);
        const data = await response.json();
        return data.balance / 1000000; // Convertir de micro STX a STX
    } catch (error) {
        console.error("Error al obtener el saldo:", error);
        return null;
    }
};

// Función para obtener las transacciones del usuario
const getTransactions = async (address) => {
    try {
        const response = await fetch(`https://stacks-node-api.mainnet.stacks.co/v2/accounts/${address}/transactions`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error al obtener las transacciones:", error);
        return [];
    }
};

// Manejo del evento de consulta
document.getElementById('check-balance').addEventListener('click', async () => {
    const address = document.getElementById('stx-address').value.trim();

    if (!address) {
        alert("Por favor, ingresa una dirección válida de Stacks.");
        return;
    }

    // Limpiar resultados anteriores
    document.getElementById('balance').textContent = 'Cargando...';
    document.getElementById('transactions-list').innerHTML = '';

    // Obtener y mostrar el saldo
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById('balance').textContent = `${balance} STX`;
    } else {
        document.getElementById('balance').textContent = 'No se pudo obtener el saldo.';
    }

    // Obtener y mostrar las transacciones
    const transactions = await getTransactions(address);
    const transactionsList = document.getElementById('transactions-list');
    transactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.textContent = `Tx Hash: ${transaction.tx_id} - ${transaction.status}`;
        transactionsList.appendChild(listItem);
    });
});
