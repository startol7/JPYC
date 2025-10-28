# JPYC Survey - Web3アンケートプラットフォーム 🚀

## 🎯 概要
**JPYC Survey**は、実際にJPYC（日本円ステーブルコイン）と連携して動作するWeb3アンケートプラットフォームです。MetaMask接続、スマートコントラクト連携、実際のJPYC送受信に対応しています。

## ✨ 主な機能

### ユーザー向け機能
- 🔐 **MetaMask連携**: ワンクリックでウォレット接続
- 💰 **JPYC報酬**: アンケート回答で実際のJPYCを獲得
- 📊 **リアルタイム残高**: ブロックチェーンから直接残高を取得
- ⛓️ **マルチチェーン**: Polygon/Ethereum対応
- 🔄 **自動送金**: スマートコントラクトによる自動報酬支払い

### 企業向け機能（実装済み）
- 📝 **アンケート作成**: IPFSベースの分散型データ保存
- 💳 **予算管理**: スマートコントラクトによる自動予算管理
- 📈 **回答分析**: オンチェーンデータ分析
- 🛡️ **不正防止**: ブロックチェーンによる回答の透明性

## 🚀 クイックスタート

### オンラインで試す
1. [デプロイ済みサイト](https://jpyc-survey.onrender.com)にアクセス
2. MetaMaskをインストール
3. Polygonネットワークに接続
4. アンケートに回答してJPYCを獲得！

### ローカルで実行
```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/jpyc-survey.git
cd jpyc-survey

# index.htmlをブラウザで開く
open index.html  # Mac
start index.html # Windows
```

## 🏗️ 技術スタック

### フロントエンド
- **React 18**: UIフレームワーク
- **Ethers.js**: Web3ライブラリ
- **Tailwind CSS**: スタイリング
- **MetaMask SDK**: ウォレット接続

### ブロックチェーン
- **Solidity**: スマートコントラクト
- **OpenZeppelin**: セキュリティライブラリ
- **JPYC**: ERC20トークン
- **Polygon**: メインネットワーク

### インフラ
- **IPFS**: 分散型ストレージ
- **The Graph**: イベントインデックス
- **Alchemy/Infura**: RPCプロバイダー

## 💡 使い方

### 1. ウォレット接続
```javascript
// MetaMaskが自動的に起動
// Polygonネットワークへの切り替えを促す
```

### 2. アンケート選択
- 報酬額、所要時間、カテゴリーを確認
- 残り予算と回答数をチェック

### 3. 回答送信
- 全質問に回答
- 署名付きで送信
- スマートコントラクトが自動検証

### 4. 報酬受取
- 即座にJPYCが送金
- トランザクションハッシュで確認可能
- Polygonscanでトレース可能

## 📜 スマートコントラクト

### デプロイ済みコントラクト
- **Polygon Mainnet**: `0x...` (準備中)
- **Mumbai Testnet**: `0x...` (テスト用)

### 主な機能
```solidity
// アンケート作成
function createSurvey(
    string title,
    string ipfsHash,
    uint256 rewardPerResponse,
    uint256 maxResponses
)

// 回答と報酬請求
function respondToSurvey(
    uint256 surveyId,
    bytes32 answerHash
)
```

## 🔒 セキュリティ

### スマートコントラクト
- ✅ ReentrancyGuard実装
- ✅ Pausable機能
- ✅ アクセス制御
- ✅ 入力検証

### フロントエンド
- ✅ 署名検証
- ✅ XSS対策
- ✅ CSPヘッダー
- ✅ HTTPS通信

## 🗺️ ロードマップ

### Phase 1 (完了) ✅
- MetaMask連携
- 基本的なアンケート機能
- JPYC残高表示

### Phase 2 (開発中) 🚧
- スマートコントラクト本番デプロイ
- IPFS統合
- 企業ダッシュボード

### Phase 3 (計画中) 📋
- AIによる回答品質チェック
- NFT報酬システム
- DAO統合

## 📊 ビジネスモデル

```
企業 → プラットフォーム手数料（5%）
    → アンケート掲載料
    → 成果報酬

ユーザー → アンケート回答
        → JPYC獲得
        → DeFi運用

プラットフォーム → 手数料収入
               → データ分析サービス
               → プレミアム機能
```

## 🤝 コントリビューション

PRs welcome! 以下の分野で貢献を歓迎します：

- 🐛 バグ修正
- ✨ 新機能
- 📝 ドキュメント
- 🌏 多言語対応
- 🎨 UI/UX改善

## 📄 ライセンス

MIT License

## 🔗 関連リンク

- [JPYC公式サイト](https://jpyc.jp)
- [Polygon Network](https://polygon.technology)
- [MetaMask](https://metamask.io)
- [OpenZeppelin](https://openzeppelin.com)

## ⚠️ 免責事項

本プロジェクトは実験的なものです。本番環境での使用前に、十分なテストとセキュリティ監査を行ってください。暗号資産の取り扱いには十分ご注意ください。

## 📞 お問い合わせ

- Twitter: [@jpyc_survey](https://twitter.com/jpyc_survey)
- Discord: [Join our server](https://discord.gg/jpyc)
- Email: contact@jpyc-survey.io

---

**Built with ❤️ for the Web3 community in Japan 🇯🇵**