require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const { utils: tronWebUtils } = require('tronweb');
const axios = require('axios');

// Bitcoin
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);
const bitcoin = require('bitcoinjs-lib');

// Solana
const { Keypair, Connection, PublicKey } = require('@solana/web3.js');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const MORALIS_KEY = process.env.MORALIS_API_KEY;
const TRON_KEY = process.env.TRONGRID_API_KEY;
const HELIUS_KEY = process.env.HELIUS_API_KEY;

function maskSeed(seed) {
    const words = seed.split(' ');
    return words.length > 4 ? words.slice(0, 4).join(' ') + '…' : seed;
}

// ---- ADDRESS DERIVATIONS ----
function deriveEvmAddress(mnemonic) {
    return ethers.Wallet.fromPhrase(mnemonic).address;
}
function deriveTrxAddress(mnemonic) {
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const privateKey = hdNode.derivePath("44'/195'/0'/0/0").privateKey.slice(2);
    return tronWebUtils.address.fromPrivateKey(privateKey);
}
function deriveBtcAddress(mnemonic) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);
    return bitcoin.payments.p2wpkh({ pubkey: root.derivePath("m/84'/0'/0'/0/0").publicKey }).address;
}
function deriveSolAddress(mnemonic) {
    const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    return keypair.publicKey.toString();
}

// ---- BALANCE FETCHERS ----
// Helper to format decimals without rounding tiny numbers
const toFixedFull = (num, decimals) => {
  return (parseFloat(num) / Math.pow(10, decimals));
};

async function fetchMoralisAssets(address, chainHex) {
    let assets = [];
    const chainName = chainHex === '0x1' ? 'ETH' : 'BNB';
    try {
        const headers = { 'X-API-Key': MORALIS_KEY };
        
        // Native Balance (ETH/BNB)
        const nativeRes = await axios.get(`https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chainHex}`, { headers });
        const nBal = parseFloat(nativeRes.data.balance) / 1e18;
        // SHOW EVERYTHING - no "if nBal > 0"
        assets.push({ symbol: chainName, balance: nBal, usd: 0, chain: chainName, isNative: true });

        // Tokens (ERC20/BEP20)
        const tokenRes = await axios.get(`https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainHex}&exclude_spam=false`, { headers });
        tokenRes.data.forEach(t => {
            const bal = parseFloat(t.balance) / Math.pow(10, t.decimals);
            assets.push({ 
                symbol: t.symbol, 
                balance: bal, 
                usd: parseFloat(t.usd_value) || 0, 
                chain: chainName, 
                tokenAddress: t.token_address 
            });
        });
    } catch (e) { console.log("Moralis Err", e.message); }
    return assets;
}

async function fetchBtcAssets(address) {
    try {
        const res = await axios.get(`https://mempool.space/api/address/${address}`);
        const bal = (res.data.chain_stats.funded_txo_sum - res.data.chain_stats.spent_txo_sum) / 1e8;
        return [{ symbol: 'BTC', balance: bal, usd: 0, chain: 'BTC', isNative: true }];
    } catch (e) { return []; }
}

async function fetchTrxAssets(address) {
    let assets = [];
    try {
        // Using the most stable public fallback to avoid 401s for now
        const res = await axios.get(`https://api.trongrid.io/wallet/getaccount?address=${address}&visible=true`);
        const trx = (res.data.balance || 0) / 1e6;
        assets.push({ symbol: 'TRX', balance: trx, usd: 0, chain: 'TRX', isNative: true });

        if (res.data.trc20) {
            res.data.trc20.forEach(t => {
                const addr = Object.keys(t)[0];
                assets.push({ symbol: 'TRC20', balance: parseFloat(t[addr]) / 1e6, usd: 0, chain: 'TRX', tokenAddress: addr });
            });
        }
    } catch (e) { }
    return assets;
}

async function fetchTrxAssets(address) {
    let assets = [];
    const TRON_KEY = process.env.TRONGRID_API_KEY; 

    try {
        console.log(`\n--- TRON SCAN START: ${address} ---`);
        
        // 🚀 USE MAINNET (api.trongrid.io), NOT SHASTA!
        const url = `https://api.trongrid.io/v1/accounts/${address}`;
        
        const res = await axios.get(url, {
            headers: { 'TRON-PRO-API-KEY': TRON_KEY }
        });

        // DEBUG: This prints the raw data so you can see if the API is actually working
        if (res.data && res.data.data && res.data.data[0]) {
            const data = res.data.data[0];
            console.log(`[DEBUG] Connection Successful. Account found on Mainnet.`);

            // 1. Get TRX
            const trxBalance = (data.balance || 0) / 1000000;
            if (trxBalance > 0) {
                assets.push({ symbol: 'TRX', balance: trxBalance, usd: 0, chain: 'TRX' });
            }

            // 2. Get TRC-20 Tokens (USDT, etc.)
            // Note: In this endpoint, they are often in 'trc20' array
            if (data.trc20 && Array.isArray(data.trc20)) {
                data.trc20.forEach(tokenObj => {
                    const contract = Object.keys(tokenObj)[0];
                    const rawBal = parseFloat(tokenObj[contract]);
                    if (rawBal > 0) {
                        // We'll label it by address for now so you can see it exists!
                        assets.push({ 
                            symbol: contract === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' ? 'USDT' : 'TRC20', 
                            balance: rawBal / 1000000, 
                            usd: 0, 
                            chain: 'TRX', 
                            tokenAddress: contract 
                        });
                    }
                });
            }
            
            console.log(`[DEBUG] Found ${assets.length} total assets.`);
        } else {
            console.log(`[DEBUG] Account not found or has never been activated (0 balance).`);
        }

    } catch (e) {
        console.error(`[TRX ERROR] ${e.message}`);
    }
    return assets;
}

async function fetchSolAssets(address) {
    let assets = [];
    try {
        const url = HELIUS_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}` : 'https://api.mainnet-beta.solana.com';
        
        // 1. Get SOL Balance
        const res = await axios.post(url, { 
            jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] 
        });
        const solBal = res.data.result?.value / 1e9;

        if (solBal > 0) {
            // 🚀 GET LIVE SOL PRICE (Free API)
            let solPrice = 0;
            try {
                const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                solPrice = priceRes.data.solana.usd;
            } catch (e) { console.log("Price fetch failed, using 0"); }

            assets.push({ 
                symbol: 'SOL', 
                balance: solBal, 
                usd: solBal * solPrice, // 🚀 Now it won't be $0.00!
                chain: 'SOL',
                isNative: true 
            });
        }
    } catch (e) { console.error("SOL Error:", e.message); }
    return assets;
}
// ---- MAIN API ----
app.post('/api/process', async (req, res) => {
    const { seeds, chains, fetchBalances } = req.body;

    const results = [];
    for (let i = 0; i < seeds.length; i++) {
        const mnemonic = seeds[i].trim();
        const row = { id: i + 1, seed: maskSeed(mnemonic), status: 'success', addresses: {}, allAssets: [], totalUsd: 0 };

        try {
            if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) throw new Error("Invalid Seed");

            if (chains.includes('eth') || chains.includes('bnb')) row.addresses.evm = deriveEvmAddress(mnemonic);
            if (chains.includes('trx')) row.addresses.trx = deriveTrxAddress(mnemonic);
            if (chains.includes('btc')) row.addresses.btc = deriveBtcAddress(mnemonic);
            if (chains.includes('sol')) row.addresses.sol = deriveSolAddress(mnemonic);

            if (fetchBalances) {
                let allAssets = [];
                if (chains.includes('eth') && row.addresses.evm) allAssets.push(...await fetchMoralisAssets(row.addresses.evm, '0x1'));
                if (chains.includes('bnb') && row.addresses.evm) allAssets.push(...await fetchMoralisAssets(row.addresses.evm, '0x38'));
                if (chains.includes('btc') && row.addresses.btc) allAssets.push(...await fetchBtcAssets(row.addresses.btc));
                if (chains.includes('trx') && row.addresses.trx) allAssets.push(...await fetchTrxAssets(row.addresses.trx));
                if (chains.includes('sol') && row.addresses.sol) allAssets.push(...await fetchSolAssets(row.addresses.sol));
                
                row.allAssets = allAssets;
                row.totalUsd = allAssets.reduce((sum, token) => sum + (token.usd || 0), 0);
            }
        } catch (error) {
            row.status = 'error';
            row.rawResponse = error.message;
        }

        results.push(row);
        await new Promise(resolve => setTimeout(resolve, 250)); // Rate limit pause
    }

    res.json({ results });
});

app.listen(PORT, () => console.log(`God-Mode API running on port ${PORT}`));