# JPYC Survey デプロイガイド

## 🚀 Renderでのデプロイ手順

### 前提条件
- GitHubアカウント
- Renderアカウント（無料プランでOK）

### ステップ1: GitHubリポジトリの準備

1. GitHubで新しいリポジトリを作成
   - リポジトリ名: `jpyc-survey` （任意）
   - Public/Privateどちらでも可

2. ローカルでGitリポジトリを初期化
```bash
# プロジェクトフォルダで実行
git init
git add index.html
git add jpyc-survey-readme.md
git add package.json
git commit -m "Initial commit: JPYC Survey App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jpyc-survey.git
git push -u origin main
```

### ステップ2: Renderでデプロイ

1. [Render](https://render.com)にログイン

2. ダッシュボードで「New +」をクリック → 「Static Site」を選択

3. GitHubリポジトリを接続
   - 「Connect GitHub」をクリック
   - リポジトリを選択

4. 設定項目
   ```
   Name: jpyc-survey
   Branch: main
   Build Command: （空欄のまま）
   Publish Directory: .
   ```

5. 「Create Static Site」をクリック

### ステップ3: デプロイ完了！

数分でデプロイが完了し、以下のようなURLでアクセス可能になります：
```
https://jpyc-survey.onrender.com
```

## 📱 その他のホスティングオプション

### Vercel
```bash
# Vercel CLIを使う場合
npm i -g vercel
vercel
```

### Netlify
- GitHubリポジトリをドラッグ&ドロップでデプロイ可能
- 自動デプロイ設定も簡単

### GitHub Pages
```bash
# GitHub Pagesで公開する場合
# Settings → Pages → Source: Deploy from a branch
# Branch: main / (root)
```
URL: `https://YOUR_USERNAME.github.io/jpyc-survey/`

## ⚙️ カスタムドメインの設定（オプション）

Renderで独自ドメインを設定する場合：

1. Renderダッシュボードで「Settings」
2. 「Custom Domains」セクション
3. ドメインを追加してDNS設定

## 🔧 トラブルシューティング

### ページが表示されない場合
- ファイル名が`index.html`になっているか確認
- Publish Directoryが正しいか確認
- ビルドログでエラーが出ていないか確認

### 日本語が文字化けする場合
- HTMLの`<meta charset="UTF-8">`が設定されているか確認
- ファイルがUTF-8で保存されているか確認

## 🎯 デプロイ後の確認項目

- [ ] ウォレット接続ボタンが動作する
- [ ] アンケート一覧が表示される
- [ ] アンケート回答フローが動作する
- [ ] JPYCの残高が更新される
- [ ] レスポンシブデザインが機能する

## 📊 パフォーマンス最適化

現在のアプリは以下の特徴があります：
- **軽量**: 外部ライブラリはCDN経由
- **高速**: 静的HTMLなので高速表示
- **スケーラブル**: Renderの無料プランでも十分

## 🔒 本番環境への移行時の注意

実際のJPYC連携を行う場合：
1. 環境変数でAPIキーを管理
2. HTTPSの確認（Renderは自動でHTTPS）
3. CORSの設定
4. ウォレット接続の実装（MetaMask等）

---

**準備完了！** 上記の手順でデプロイすれば、すぐにJPYC Surveyアプリが公開されます。