document.addEventListener("DOMContentLoaded", function () {
    const userLang = navigator.language || navigator.languages[0]; // Detectar idioma del navegador
    setLanguage(userLang);
});

function setLanguage(lang) {
    const translations = {
        en: {
            alertEmpty: "Please enter a valid STX wallet address.",
            button: "Check Balance",
            balanceLabel: "Balance:",
            noBalance: "Could not retrieve balance.",
            transactionsLabel: "Recent Transactions",
            noTransactions: "No recent transactions found in the last 72 hours.",
            txDetails: "Tx ID: {tx_id}, Block: {block}, Date: {date}"
        },
        es: {
            alertEmpty: "Por favor, ingresa una dirección de billetera STX válida.",
            button: "Consultar Saldo",
            balanceLabel: "Saldo:",
            noBalance: "No se pudo obtener el balance.",
            transactionsLabel: "Transacciones Recientes",
            noTransactions: "No se encontraron transacciones recientes en las últimas 72 horas.",
            txDetails: "Tx ID: {tx_id}, Bloque: {block}, Fecha: {date}"
        }
    };

    const language = lang.startsWith("es") ? "es" : "en"; // Si el idioma empieza con "es", usa español; si no, usa inglés

    document.getElementById("check-balance").innerText = translations[language].button;
    document.getElementById("balance-label").innerText = translations[language].balanceLabel;
    document.getElementById("transactions-label").innerText = translations[language].transactionsLabel;

    // Guardar las traducciones seleccionadas para su uso posterior
    window.currentTranslations = translations[language];
}

document.getElementById("check-balance").addEventListener("click", async function () {
    const address = document.getElementById("stx-address").value.trim();
    
    if (!address) {
        alert(window.currentTranslations.alertEmpty);
        return;
    }

    // Limpiar resultados previos
    document.getElementById("balance").innerText = "";
    document.getElementById("transactions-list").innerHTML = "";

    // Consultar el balance
    const balance = await getBalance(address);
    if (balance !== null) {
        document.getElementById("balance").innerText = `${balance} STX`;
    } else {
        document.getElementById("balance").innerText = window.currentTranslations.noBalance;
    }

    // Consultar las transacciones recientes
    const transactions = await getTransactions(address);
    const recentTransactions = filterRecentTransactions(transactions);

    const transactionsList = document.getElementById("transactions-list");
    if (recentTransactions.length > 0) {
        recentTransactions.forEach(tx => {
            const listItem = document.createElement("li");
            listItem.textContent = window.currentTranslations.txDetails
                .replace("{tx_id}", tx.tx_id)
                .replace("{block}", tx.block_height)
                .replace("{date}", new Date(tx.block_time * 1000).toLocaleString());
            transactionsList.appendChild(listItem);
        });
    } else {
        transactionsList.innerHTML = `<li>${window.currentTranslations.noTransactions}</li>`;
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
        console.error("Error al obtener el balance:", error);
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
        console.error("Error al obtener las transacciones:", error);
        return [];
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
