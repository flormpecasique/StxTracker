// API Key de Hiro para esta funcion de consulta de saldo
const API_KEY = '98674ed974b087184671ad5e8862345a';

// Función que consulta el saldo y las transacciones de una dirección STX
async function fetchBalanceAndTransactions(address) {
    try {
        // Primero resuelve la dirección BNS a STX si es necesario
        const resolvedAddress = await resolveBnsAddress(address);

        if (!resolvedAddress) {
            console.error('No se pudo resolver la dirección BNS');
            return;
        }

        // Consultar los detalles de la cuenta con la API de Hiro
        const accountData = await fetchAccountDetails(resolvedAddress);
        if (!accountData) {
            console.error('No se pudo obtener la información de la cuenta');
            return;
        }

        // Mostrar balance
        const balance = accountData.balance / 1000000;  // Convertir de satoshis a STX
        console.log(`Saldo para ${resolvedAddress}: ${balance} STX`);

        // Mostrar transacciones
        if (accountData.transactions && accountData.transactions.length > 0) {
            console.log('Transacciones recientes:');
            accountData.transactions.forEach(tx => {
                console.log(`Tx ID: ${tx.tx_id}, Block: ${tx.block_height}, Fecha: ${new Date(tx.block_time * 1000).toLocaleString()}`);
            });
        } else {
            console.log('No se encontraron transacciones recientes.');
        }

    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
}

// Función que resuelve una dirección BNS a su dirección STX
async function resolveBnsAddress(bnsAddress) {
    const url = `https://api.hiro.so/v1/bns/${bnsAddress}`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();
        return data.address || null;  // Devuelve la dirección STX resuelta
    } catch (error) {
        console.error('Error al resolver dirección BNS:', error);
        return null;
    }
}

// Función que obtiene los detalles de la cuenta usando la API de Hiro
async function fetchAccountDetails(address) {
    const url = `https://api.hiro.so/v1/accounts/${address}`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();
        return data || null;  // Devolver los datos de la cuenta
    } catch (error) {
        console.error('Error al obtener los detalles de la cuenta:', error);
        return null;
    }
}

// Llamar a la función con una dirección BNS o STX para probar
document.getElementById('check-balance').addEventListener('click', async function() {
    const address = document.getElementById('stx-address').value.trim();
    
    if (!address) {
        alert('Por favor, ingresa una dirección o nombre BNS válido.');
        return;
    }

    await fetchBalanceAndTransactions(address);
});
