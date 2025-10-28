# 💴 JPYC Wallet - 残高チェック & 送金ツール

JPYCトークンの残高確認と送金ができるWebアプリケーションです。Polygon、Ethereum、Avalancheの各ネットワークに対応しています。

## 🌟 機能

- ✅ **MetaMask連携**: ワンクリックでウォレット接続
- 💰 **リアルタイム残高表示**: JPYC残高とガス代用の残高を表示
- 💸 **送金機能**: 簡単にJPYCを送金
- 🔄 **マルチチェーン対応**: Polygon/Ethereum/Avalanche間での切り替え
- 📜 **トランザクション履歴**: 送金履歴を保存・表示
- 📱 **レスポンシブデザイン**: スマートフォンでも快適に利用可能

## 🚀 デプロイ方法

### 1. GitHubにプッシュ

```bash
cd jpyc-wallet
git init
git add .
git commit -m "Initial commit: JPYC Wallet"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jpyc-wallet.git
git push -u origin main
```

### 2. Renderでデプロイ

1. [Render](https://render.com/)にログイン
2. 「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 設定:
   - **Name**: `jpyc-wallet` (任意)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. 「Create Web Service」をクリック

### 3. ローカルで実行

```bash
npm install
npm start
```

ブラウザで `http://localhost:3000` にアクセス

## 📋 使い方

### 1. ウォレット接続
- 「🦊 MetaMask接続」ボタンをクリック
- MetaMaskで接続を承認

### 2. ネットワーク選択
- Polygon、Ethereum、Avalancheから選択
- 自動的に残高が表示されます

### 3. 送金
- 送金先アドレスを入力
- 送金額を入力
- 「送金する」ボタンをクリック
- MetaMaskでトランザクションを承認

### 4. トランザクション履歴
- 過去の送金履歴が自動的に表示されます
- トランザクションハッシュからブロックエクスプローラーで確認可能

## 🔧 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **Web3ライブラリ**: Web3.js
- **ウォレット**: MetaMask
- **バックエンド**: Node.js + Express
- **デプロイ**: Render

## 🌐 対応ネットワーク

| ネットワーク | Chain ID | JPYCアドレス |
|------------|----------|-------------|
| Polygon    | 137      | `0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c` |
| Ethereum   | 1        | `0x2370f9d504c7a6E775bf6E14B3F12846b594cD53` |
| Avalanche  | 43114    | `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB` |

## ⚠️ 注意事項

- このツールは教育目的で作成されています
- 実際の送金には十分注意してください
- 必ずテストネットで動作を確認してから利用してください
- 秘密鍵やシードフレーズは絶対に共有しないでください
- 自己責任でご利用ください

## 🔐 セキュリティ

- 秘密鍵はブラウザ側で保持されません
- すべてのトランザクションはMetaMaskで署名されます
- トランザクション履歴はローカルストレージに保存されます

## 🐛 トラブルシューティング

### MetaMaskが接続できない
- MetaMaskがインストールされているか確認
- ブラウザの拡張機能が有効か確認
- ページをリロードしてみる

### 残高が表示されない
- 正しいネットワークに接続しているか確認
- MetaMaskのアカウントが正しいか確認
- 「🔄 残高更新」ボタンをクリック

### トランザクションが失敗する
- ガス代用の残高が十分か確認
- 送金額が残高を超えていないか確認
- ネットワークの混雑状況を確認

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

---

**⚡ Powered by Web3.js & JPYC**