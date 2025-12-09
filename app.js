const DEBUG = true;

const addressInput = document.getElementById('stx-address');
const checkBtn = document.getElementById('check-balance');
const balanceEl = document.getElementById('balance');
const balanceUsdEl = document.getElementById('balance-usd');
const spinnerEl = document.getElementById('spinner');

function log(...args) {
    if (DEBUG) console.log('[DEBUG]', ...args);
}

// ------------------------------
// Función principal
// ------------------------------
async function checkBalance() {
    const input = addressInput.value.trim();
    if (!input) {
        alert('Please enter a valid STX address or BNS name.');
        return;
    }

    const cacheKey = `balance_${input}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        const { balance, usd } = JSON.parse(cached);
        displayBalance(balance, usd);
        log('Loaded from cache:', input);
        return;
    }

    displayLoading(true);
    disableButton(true);

    let address;
    if (input.endsWith('.btc')) {
        address = await getStacksAddressFromBNS(input.toLowerCase());
    } else {
        address = input;
    }

    if (!address) {
        displayBalance('Invalid BNS name or address', '');
        displayLoading(false);
        disableButton(false);
        return;
    }

    const balance = await getBalance(address);
    if (balance === null) {
        displayBalance('Unable to retrieve the balance.', '');
        displayLoading(false);
        disableButton(false);
        return;
    }

    const priceUSD = await getSTXPriceUSD();
    const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';

    sessionStorage.setItem(cacheKey, JSON.stringify({ balance, usd: balanceUSD }));

    displayBalance(balance, balanceUSD);
    displayLoading(false);
    disableButton(false);
}

// ------------------------------
// Helpers de UI
// ------------------------------
function displayBalance(balance, usd) {
    balanceEl.innerText = typeof balance === 'number' ? `${balance} STX` : balance;
    balanceUsdEl.innerText = usd ? `≈ ${usd} USD` : '';
    balanceEl.classList.remove('loading');
}

function displayLoading(isLoading) {
    if (isLoading) {
        balanceEl.innerText = 'Loading...';
        balanceUsdEl.innerText = '';
        spinnerEl.classList.remove('hidden');
        balanceEl.classList.add('loading');
    } else {
        spinnerEl.classList.add('hidden');
        balanceEl.classList.remove('loading');
    }
}

function disableButton(disable) {
    if (disable) {
        checkBtn.disabled = true;
        checkBtn.classList.add('after-query');
    } else {
        checkBtn.disabled = false;
        checkBtn.classList.remove('after-query');
    }
}

// ------------------------------
// Event listeners
// ------------------------------
checkBtn.addEventListener('click', checkBalance);
addressInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') checkBalance();
});

// ------------------------------
// API calls
// ------------------------------
async function getBalance(address) {
    const url = `https://api.stacks.co/extended/v1/address/${address}/balances`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Address not found');
        const data = await response.json();
        log('Balance API data:', data);

        // Mostrar balance incluso si es 0
        if (data.stx && data.stx.balance !== undefined) {
            return Number(data.stx.balance) / 1_000_000;
        }
    } catch (error) {
        console.error('Error getting balance:', error);
    }
    return null;
}

async function getSTXPriceUSD() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd';
    try {
        const response = await fetch(url);
        const data = await response.json();
        log('Price API data:', data);
        return data.stacks?.usd || null;
    } catch (error) {
        console.error('Error getting STX price:', error);
        return null;
    }
}

async function getStacksAddressFromBNS(bnsName) {
    const url = `/api/hiro-proxy?name=${bnsName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Hiro proxy error:", await response.text());
            return null;
        }
        const data = await response.json();
        log('BNS resolver data:', data);
        return data.address || null;
    } catch (error) {
        console.error('Error resolving BNS name:', error);
        return null;
    }
}
