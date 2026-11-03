const $ = (id) => document.getElementById(id);

const els = {
    input:   $('stx-address'),
    button:  $('check-balance'),
    balance: $('balance'),
    usd:     $('balance-usd'),
    spinner: $('spinner'),
    year:    $('year'),
};

const BTN_DEFAULT_LABEL = els.button.textContent;

if (els.year) els.year.textContent = new Date().getFullYear();

function setLoading(isLoading) {
    els.spinner.classList.toggle('hidden', !isLoading);
    els.balance.classList.toggle('loading', isLoading);
    els.button.disabled = isLoading;
    els.button.textContent = isLoading ? 'Checking…' : BTN_DEFAULT_LABEL;
}

async function handleCheck() {
    const input = els.input.value.trim();

    if (!input) {
        els.balance.textContent = 'Please enter a valid STX address or BNS name.';
        els.usd.textContent = '';
        els.input.focus();
        return;
    }

    setLoading(true);
    els.balance.textContent = 'Loading…';
    els.usd.textContent = '';

    try {
        const address = input.toLowerCase().endsWith('.btc')
            ? await getStacksAddressFromBNS(input.toLowerCase())
            : input;

        if (!address) {
            els.balance.textContent = 'Invalid BNS name or address';
            return;
        }

        const balance = await getBalance(address);

        if (balance !== null) {
            const priceUSD = await getSTXPriceUSD();
            const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';
            els.balance.textContent = `${balance} STX`;
            els.usd.textContent = `≈ ${balanceUSD} USD`;
        } else {
            els.balance.textContent = 'Unable to retrieve the balance.';
        }
    } finally {
        setLoading(false);
    }
}

els.button.addEventListener('click', handleCheck);
els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCheck();
});

// Balance STX — through our serverless proxy so the Hiro API key stays hidden
async function getBalance(address) {
    const url = `/api/hiro-proxy?balance=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Address not found');
        const data = await response.json();
        if (data.stx && data.stx.balance !== undefined) {
            return Number(data.stx.balance) / 1_000_000;
        }
    } catch (error) {
        console.error('Error getting balance:', error);
    }
    return null;
}

// STX price in USD from Binance (public, no key needed)
async function getSTXPriceUSD() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=STXUSDT');
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error('Error getting STX price:', error);
        return null;
    }
}

// Resolve .btc name through our serverless proxy
async function getStacksAddressFromBNS(bnsName) {
    try {
        const response = await fetch(`/api/hiro-proxy?name=${encodeURIComponent(bnsName)}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.address || null;
    } catch (error) {
        console.error('Error resolving BNS name:', error);
        return null;
    }
}
