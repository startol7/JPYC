// JPYC Wallet Application
// Network configurations and JPYC contract addresses

const NETWORKS = {
    polygon: {
        chainId: '0x89', // 137
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
        jpycAddress: '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c'
    },
    ethereum: {
        chainId: '0x1', // 1
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        blockExplorerUrls: ['https://etherscan.io'],
        jpycAddress: '0x2370f9d504c7a6E775bf6E14B3F12846b594cD53'
    },
    avalanche: {
        chainId: '0xa86a', // 43114
        chainName: 'Avalanche C-Chain',
        nativeCurrency: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
        },
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
        blockExplorerUrls: ['https://snowtrace.io'],
        jpycAddress: '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB'
    }
};

// ERC20 ABI (minimal for balance and transfer)
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    }
];

// Global state
let web3;
let currentAccount;
let currentNetwork = null;
let jpycContract;
let transactionHistory = [];

// DOM Elements
const connectWalletBtn = document.getElementById('connectWallet');
const networkSelector = document.getElementById('networkSelector');
const walletInfo = document.getElementById('walletInfo');
const transferSection = document.getElementById('transferSection');
const transactionHistory_ = document.getElementById('transactionHistory');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        showToast('MetaMaskがインストールされていません', 'error');
        connectWalletBtn.disabled = true;
        connectWalletBtn.textContent = 'MetaMaskが必要です';
        return;
    }

    // Event listeners
    connectWalletBtn.addEventListener('click', connectWallet);
    
    document.querySelectorAll('.network-btn').forEach(btn => {
        btn.addEventListener('click', () => switchNetwork(btn.dataset.network));
    });

    document.getElementById('refreshBalance').addEventListener('click', updateBalance);
    document.getElementById('copyAddress').addEventListener('click', copyAddress);
    document.getElementById('transferForm').addEventListener('submit', handleTransfer);

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Load transaction history from localStorage
    loadTransactionHistory();
});

// Connect Wallet
async function connectWallet() {
    try {
        showLoading('ウォレットに接続中...');
        
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        currentAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        
        // Get current chain ID
        const chainId = await web3.eth.getChainId();
        
        // Find matching network
        const networkKey = Object.keys(NETWORKS).find(key => 
            parseInt(NETWORKS[key].chainId, 16) === chainId
        );
        
        if (networkKey) {
            currentNetwork = networkKey;
            await initializeNetwork(networkKey);
        } else {
            // Default to Polygon if unknown network
            showToast('サポートされていないネットワークです。Polygonに切り替えます。', 'warning');
            await switchNetwork('polygon');
        }
        
        connectWalletBtn.textContent = '✅ 接続済み';
        connectWalletBtn.disabled = true;
        
        networkSelector.style.display = 'block';
        walletInfo.style.display = 'grid';
        transferSection.style.display = 'block';
        transactionHistory_.style.display = 'block';
        
        hideLoading();
        showToast('ウォレットに接続しました', 'success');
    } catch (error) {
        hideLoading();
        console.error('Connection error:', error);
        showToast('接続に失敗しました: ' + error.message, 'error');
    }
}

// Initialize Network
async function initializeNetwork(networkKey) {
    const network = NETWORKS[networkKey];
    currentNetwork = networkKey;
    
    // Initialize JPYC contract
    jpycContract = new web3.eth.Contract(ERC20_ABI, network.jpycAddress);
    
    // Update UI
    document.getElementById('currentNetwork').textContent = network.chainName;
    document.getElementById('nativeSymbol').textContent = network.nativeCurrency.symbol;
    document.getElementById('walletAddress').textContent = formatAddress(currentAccount);
    
    // Update active network button
    document.querySelectorAll('.network-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.network === networkKey) {
            btn.classList.add('active');
        }
    });
    
    // Update balances
    await updateBalance();
}

// Switch Network
async function switchNetwork(networkKey) {
    try {
        showLoading('ネットワークを切り替え中...');
        
        const network = NETWORKS[networkKey];
        
        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: network.chainId,
                        chainName: network.chainName,
                        nativeCurrency: network.nativeCurrency,
                        rpcUrls: network.rpcUrls,
                        blockExplorerUrls: network.blockExplorerUrls
                    }]
                });
            } else {
                throw switchError;
            }
        }
        
        await initializeNetwork(networkKey);
        hideLoading();
        showToast(`${network.chainName}に切り替えました`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Network switch error:', error);
        showToast('ネットワークの切り替えに失敗しました: ' + error.message, 'error');
    }
}

// Update Balance
async function updateBalance() {
    try {
        showLoading('残高を更新中...');
        
        // Get JPYC balance
        const jpycBalance = await jpycContract.methods.balanceOf(currentAccount).call();
        const jpycFormatted = web3.utils.fromWei(jpycBalance, 'ether');
        document.getElementById('jpycBalance').textContent = parseFloat(jpycFormatted).toFixed(2);
        document.getElementById('availableBalance').textContent = parseFloat(jpycFormatted).toFixed(2);
        
        // Get native balance
        const nativeBalance = await web3.eth.getBalance(currentAccount);
        const nativeFormatted = web3.utils.fromWei(nativeBalance, 'ether');
        document.getElementById('nativeBalance').textContent = parseFloat(nativeFormatted).toFixed(4);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Balance update error:', error);
        showToast('残高の取得に失敗しました', 'error');
    }
}

// Handle Transfer
async function handleTransfer(e) {
    e.preventDefault();
    
    const recipientAddress = document.getElementById('recipientAddress').value.trim();
    const amount = document.getElementById('transferAmount').value;
    
    // Validation
    if (!web3.utils.isAddress(recipientAddress)) {
        showToast('無効なアドレスです', 'error');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        showToast('送金額は0より大きい必要があります', 'error');
        return;
    }
    
    try {
        showLoading('トランザクションを送信中...');
        
        // Convert amount to wei (JPYC has 18 decimals)
        const amountWei = web3.utils.toWei(amount, 'ether');
        
        // Check balance
        const balance = await jpycContract.methods.balanceOf(currentAccount).call();
        if (BigInt(balance) < BigInt(amountWei)) {
            hideLoading();
            showToast('残高が不足しています', 'error');
            return;
        }
        
        // Estimate gas
        const gasEstimate = await jpycContract.methods
            .transfer(recipientAddress, amountWei)
            .estimateGas({ from: currentAccount });
        
        // Send transaction
        const receipt = await jpycContract.methods
            .transfer(recipientAddress, amountWei)
            .send({ 
                from: currentAccount,
                gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
            });
        
        hideLoading();
        
        // Add to transaction history
        const transaction = {
            hash: receipt.transactionHash,
            type: '送金',
            to: recipientAddress,
            amount: amount,
            status: receipt.status ? 'success' : 'failed',
            timestamp: Date.now(),
            network: currentNetwork
        };
        
        addTransaction(transaction);
        
        // Reset form
        document.getElementById('transferForm').reset();
        
        // Update balance
        await updateBalance();
        
        showToast('送金が完了しました!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Transfer error:', error);
        
        if (error.code === 4001) {
            showToast('トランザクションがキャンセルされました', 'warning');
        } else {
            showToast('送金に失敗しました: ' + error.message, 'error');
        }
    }
}

// Copy Address
function copyAddress() {
    navigator.clipboard.writeText(currentAccount).then(() => {
        showToast('アドレスをコピーしました', 'success');
    }).catch(err => {
        showToast('コピーに失敗しました', 'error');
    });
}

// Transaction History Management
function addTransaction(transaction) {
    transactionHistory.unshift(transaction);
    saveTransactionHistory();
    renderTransactionHistory();
}

function loadTransactionHistory() {
    const saved = localStorage.getItem('jpyc_transactions');
    if (saved) {
        transactionHistory = JSON.parse(saved);
        renderTransactionHistory();
    }
}

function saveTransactionHistory() {
    localStorage.setItem('jpyc_transactions', JSON.stringify(transactionHistory));
}

function renderTransactionHistory() {
    const historyList = document.getElementById('historyList');
    
    if (transactionHistory.length === 0) {
        historyList.innerHTML = '<p class="no-transactions">トランザクション履歴がありません</p>';
        return;
    }
    
    historyList.innerHTML = transactionHistory.map(tx => {
        const network = NETWORKS[tx.network];
        const explorerUrl = `${network.blockExplorerUrls[0]}/tx/${tx.hash}`;
        const date = new Date(tx.timestamp).toLocaleString('ja-JP');
        
        return `
            <div class="transaction-item ${tx.status === 'failed' ? 'failed' : ''}">
                <div class="transaction-header">
                    <span class="transaction-type">${tx.type}</span>
                    <span class="transaction-status ${tx.status === 'failed' ? 'failed' : ''}">
                        ${tx.status === 'success' ? '✅ 成功' : '❌ 失敗'}
                    </span>
                </div>
                <div class="transaction-details">
                    <div><strong>送金額:</strong> ${tx.amount} JPYC</div>
                    <div><strong>宛先:</strong> ${formatAddress(tx.to)}</div>
                    <div><strong>ネットワーク:</strong> ${network.chainName}</div>
                    <div><strong>日時:</strong> ${date}</div>
                    <div class="transaction-hash">
                        <strong>トランザクション:</strong> 
                        <a href="${explorerUrl}" target="_blank">${formatAddress(tx.hash)}</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Event Handlers
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        location.reload();
    } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        document.getElementById('walletAddress').textContent = formatAddress(currentAccount);
        updateBalance();
    }
}

function handleChainChanged() {
    // Reload the page on chain change
    location.reload();
}

// Utility Functions
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function showLoading(message = '処理中...') {
    document.getElementById('loadingMessage').textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Export for debugging
window.jpycWallet = {
    web3,
    currentAccount,
    currentNetwork,
    jpycContract,
    NETWORKS,
    updateBalance,
    transactionHistory
};