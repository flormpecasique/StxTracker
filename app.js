// Clave de API de Hiro para stxscan
const API_KEY = '98674ed974b087184671ad5e8862345a';

// Función que consulta el saldo y las transacciones de una dirección o BNS
async function fetchBalanceAndTransactions(address) {
    try {
        // Verificar si la dirección es BNS, en ese caso resolverla
        const resolvedAddress = await resolveBnsAddress(address);
        
        if (!resolvedAddress) {
            console.error('No se pudo resolver la dirección BNS');
            return;
        }

        // Consultar el saldo usando la API de Hiro
        const balance = await fetchBalance(resolvedAddress);
        const transactions = await fetchTransactions(resolvedAddress);

        // Mostrar balance
        console.log(`Saldo para ${resolvedAddress}: ${balance} STX`);

        // Mostrar transacciones
        if (transactions && transactions.length > 0) {
            console.log('Transacciones recientes:');
            transactions.forEach(tx => {
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

// Función que obtiene el balance de una dirección STX
async function fetchBalance(address) {
    const url = `https://api.hiro.so/v1/accounts/${address}/balance`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();
        return data.balance / 1000000;  // Convertir de satoshis a STX
    } catch (error) {
        console.error('Error al obtener el balance:', error);
        return null;
    }
}

// Función que obtiene las transacciones de una dirección STX
async function fetchTransactions(address) {
    const url = `https://api.hiro.so/v1/accounts/${address}/transactions`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();
        return data.transactions || [];  // Devolver transacciones o un array vacío
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
        return [];
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
