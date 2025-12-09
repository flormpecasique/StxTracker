const addressInput = document.getElementById('stx-address');
const checkBtn = document.getElementById('check-balance');
const balanceEl = document.getElementById('balance');
const balanceUsdEl = document.getElementById('balance-usd');

checkBtn.addEventListener('click', checkBalance);
addressInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkBalance();
});

async function checkBalance() {
    const input = addressInput.value.trim();
    if (!input) return alert('Ingresa una dirección o nombre BNS válido.');

    balanceEl.innerText = 'Loading...';
    balanceUsdEl.innerText = '';

    let address = input;
    if (input.endsWith('.btc')) {
        address = await getStacksAddressFromBNS(input.toLowerCase());
        if (!address) return balanceEl.innerText = 'Dirección BNS inválida';
    }

    const balance = await getBalance(address);
    if (balance === null) return balanceEl.innerText = 'Unable to retrieve the balance.';

    const priceUSD = await getSTXPriceUSD();
    const balanceUSD = priceUSD ? (balance * priceUSD).toFixed(2) : 'N/A';

    balanceEl.innerText = `${balance} STX`;
    balanceUsdEl.innerText = `≈ ${balanceUSD} USD`;
}

// Balance vía endpoint público sencillo
async function getBalance(address) {
    try {
        const url = `https://stacks.co/api/v1/account/${address}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.balance ? Number(data.balance) / 1_000_000 : 0;
    } catch {
        return null;
    }
}

// Precio STX en USD
async function getSTXPriceUSD() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd');
        const data = await res.json();
        return data.stacks?.usd || null;
    } catch {
        return null;
    }
}

// Resolver BNS usando tu proxy
async function getStacksAddressFromBNS(bnsName) {
    try {
        const res = await fetch(`/api/hiro-proxy?name=${bnsName}`);
        const data = await res.json();
        return data.address || null;
    } catch {
        return null;
    }
}
