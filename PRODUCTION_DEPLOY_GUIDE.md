# JPYC Survey 本番環境デプロイガイド

## 🚀 本格的なJPYC連携サービスの構築

このガイドでは、実際にJPYCと連携して動作するアンケートプラットフォームを構築する手順を説明します。

## 📋 必要な準備

### 1. 開発環境
```bash
# Node.js環境のセットアップ
node --version  # v16以上推奨
npm install -g hardhat
npm install -g @openzeppelin/contracts
```

### 2. ウォレットとガス代
- MetaMaskウォレット
- Polygon MATICトークン（ガス代用）
- テスト用JPYC（Mumbai Testnetの場合）

### 3. 外部サービスアカウント
- [Alchemy](https://www.alchemy.com/) または [Infura](https://infura.io/) - RPC Provider
- [Pinata](https://www.pinata.cloud/) または [IPFS](https://ipfs.io/) - データストレージ
- [Polygonscan](https://polygonscan.com/) API Key - コントラクト検証用

## 🏗️ アーキテクチャ

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│ Smart       │
│  (React)    │     │   (Node.js) │     │ Contract    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MetaMask   │     │    IPFS     │     │   Polygon   │
│             │     │             │     │   Network   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 📝 スマートコントラクトのデプロイ

### 1. Hardhatプロジェクトの初期化
```bash
mkdir jpyc-survey-contracts
cd jpyc-survey-contracts
npx hardhat init
```

### 2. 依存関係のインストール
```bash
npm install @openzeppelin/contracts
npm install @nomiclabs/hardhat-etherscan
npm install @nomiclabs/hardhat-waffle
npm install dotenv
```

### 3. hardhat.config.js の設定
```javascript
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
```

### 4. 環境変数の設定（.env）
```env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 5. デプロイスクリプト（scripts/deploy.js）
```javascript
const hre = require("hardhat");

async function main() {
  // JPYCのコントラクトアドレス
  const JPYC_ADDRESS = "0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c"; // Polygon Mainnet
  
  const JPYCSurveyPlatform = await hre.ethers.getContractFactory("JPYCSurveyPlatform");
  const platform = await JPYCSurveyPlatform.deploy(JPYC_ADDRESS);
  await platform.deployed();
  
  console.log("JPYCSurveyPlatform deployed to:", platform.address);
  
  // Verify on Polygonscan
  await hre.run("verify:verify", {
    address: platform.address,
    constructorArguments: [JPYC_ADDRESS],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 6. デプロイ実行
```bash
# テストネット（Mumbai）へのデプロイ
npx hardhat run scripts/deploy.js --network mumbai

# 本番（Polygon Mainnet）へのデプロイ
npx hardhat run scripts/deploy.js --network polygon
```

## 🔧 バックエンドの実装

### 1. Express.jsサーバーのセットアップ
```bash
mkdir jpyc-survey-backend
cd jpyc-survey-backend
npm init -y
npm install express cors ethers dotenv
npm install ipfs-http-client multer
```

### 2. サーバーコード（server.js）
```javascript
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { create } = require('ipfs-http-client');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer();

// IPFS client
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

// Middleware
app.use(cors());
app.use(express.json());

// Contract setup
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contractABI = require('./abi/JPYCSurveyPlatform.json');
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// API Endpoints

// アンケートデータをIPFSに保存
app.post('/api/survey/create', upload.single('survey'), async (req, res) => {
  try {
    const surveyData = JSON.parse(req.body.data);
    const ipfsResult = await ipfs.add(JSON.stringify(surveyData));
    res.json({ ipfsHash: ipfsResult.path });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// アンケート一覧を取得
app.get('/api/surveys', async (req, res) => {
  try {
    const activeSurveys = await contract.getActiveSurveys();
    const surveys = await Promise.all(
      activeSurveys.map(async (id) => {
        const survey = await contract.getSurvey(id);
        return survey;
      })
    );
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 回答を検証
app.post('/api/survey/verify', async (req, res) => {
  try {
    const { surveyId, answers, signature } = req.body;
    
    // 署名を検証
    const message = ethers.utils.solidityKeccak256(
      ['uint256', 'string'],
      [surveyId, JSON.stringify(answers)]
    );
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    
    // 回答ハッシュを生成
    const answerHash = ethers.utils.id(JSON.stringify(answers));
    
    res.json({ 
      valid: true, 
      answerHash,
      signer: signerAddress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🎨 フロントエンドの本番対応

### 1. React プロジェクトのセットアップ
```bash
npx create-react-app jpyc-survey-frontend
cd jpyc-survey-frontend
npm install ethers axios ipfs-http-client
npm install @walletconnect/web3-provider
```

### 2. Web3接続の実装（src/hooks/useWeb3.js）
```javascript
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";

const JPYC_ABI = [...]; // ABI
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export const useWeb3 = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [contract, setContract] = useState(null);
  
  const connectWallet = async (walletType = 'metamask') => {
    try {
      let web3Provider;
      
      if (walletType === 'metamask') {
        if (!window.ethereum) throw new Error('MetaMask not installed');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      } else if (walletType === 'walletconnect') {
        const wcProvider = new WalletConnectProvider({
          infuraId: process.env.REACT_APP_INFURA_ID,
        });
        await wcProvider.enable();
        web3Provider = new ethers.providers.Web3Provider(wcProvider);
      }
      
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, JPYC_ABI, signer);
      
      setProvider(web3Provider);
      setSigner(signer);
      setAddress(address);
      setContract(contract);
      
      return { success: true, address };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return { success: false, error: error.message };
    }
  };
  
  return {
    provider,
    signer,
    address,
    contract,
    connectWallet
  };
};
```

## 🔐 セキュリティ対策

### 1. スマートコントラクトのセキュリティ
- OpenZeppelin の ReentrancyGuard を使用
- Pausable パターンの実装
- 適切なアクセス制御（Ownable）
- Slither でのコード監査

### 2. フロントエンドのセキュリティ
```javascript
// CSP ヘッダーの設定
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.ethers.io; 
               connect-src 'self' https://*.infura.io https://*.alchemy.com;">

// XSS 対策
const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};

// 署名の検証
const verifySignature = async (message, signature) => {
  try {
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
};
```

### 3. バックエンドのセキュリティ
- Rate limiting の実装
- JWT認証
- 入力検証
- CORS設定

## 📊 モニタリングとアナリティクス

### 1. The Graph を使ったイベント監視
```graphql
type Survey @entity {
  id: ID!
  sponsor: Bytes!
  title: String!
  rewardPerResponse: BigInt!
  totalBudget: BigInt!
  responses: [Response!] @derivedFrom(field: "survey")
  createdAt: BigInt!
}

type Response @entity {
  id: ID!
  survey: Survey!
  respondent: Bytes!
  answerHash: Bytes!
  rewardClaimed: Boolean!
  timestamp: BigInt!
}
```

### 2. Dune Analytics でのダッシュボード作成
- 総回答数の推移
- 人気アンケートランキング
- ユーザー収益ランキング
- プラットフォーム手数料の推移

## 🚢 本番デプロイチェックリスト

- [ ] スマートコントラクトの監査完了
- [ ] Multisig ウォレットの設定
- [ ] バックアップとリカバリー計画
- [ ] 負荷テストの実施
- [ ] セキュリティテストの完了
- [ ] 利用規約とプライバシーポリシーの準備
- [ ] KYC/AML 対応（必要に応じて）
- [ ] サポート体制の構築
- [ ] モニタリングツールの設定
- [ ] インシデント対応計画

## 📞 サポート

技術的な質問や実装支援が必要な場合：

- Discord: [JPYC Community](https://discord.gg/jpyc)
- GitHub Issues: [jpyc-survey/issues](https://github.com/jpyc-survey/issues)
- Email: support@jpyc-survey.io

---

**注意**: 本番環境でのデプロイ前に、必ずテストネットで十分なテストを行ってください。
スマートコントラクトのバグは資金の損失につながる可能性があります。