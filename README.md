# jq Web Tool

jqコマンドラインツールと同等の機能を持つWebアプリケーションです。ブラウザでJSONの変換、フィルタリング、集計などが簡単に行えます。

## デモ

GitHub Pagesでデモを公開しています: https://fukaishi.github.io/web-jq/

## 特徴

- **ファイルアップロード**: JSONファイルを直接アップロード
- **テキスト入力**: JSONをテキストエリアに貼り付けて処理
- **jqクエリ実行**: コマンドラインjqと同じクエリ構文をサポート
- **オプション機能**:
  - `-c` (Compact): コンパクトなJSON出力
  - `-r` (Raw): 生文字列出力
  - `-s` (Slurp): 複数の入力を配列化
- **WebAssembly**: jq-webを使用したブラウザ内処理

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 使い方

1. **JSON入力**:
   - テキストエリアにJSONを貼り付ける
   - または「ファイルをアップロード」ボタンでJSONファイルを選択

2. **jqクエリの入力**:
   - クエリ入力欄にjqクエリを入力
   - 例: `.name`, `.cities[]`, `map(.name)`, etc.

3. **オプションの設定**:
   - Compact: 改行なしの圧縮JSON出力
   - Raw: 文字列を引用符なしで出力
   - Slurp: 複数の入力を配列にまとめる

4. **実行**:
   - 「実行」ボタンをクリック
   - 結果が出力エリアに表示される

## サポートされているjq機能

### 抽出・整形
- フィールド抽出: `.name`, `.user.email`
- 配列操作: `.cities[]`, `.cities[0]`, `.cities[1:3]`
- パイプ: `.[] | .name`

### 検索・条件分岐
- `select()`: `.[] | select(.age > 20)`
- `test()`: `select(.name | test("^J"))`
- `has()`: `select(has("email"))`

### 集計
- `length`: 配列やオブジェクトの要素数
- `add`: 数値の合計
- `group_by()`: グループ化
- `reduce`: カスタム集計

### 変換・更新
- `map()`: `.[] | map(.name)`
- `sort_by()`: `sort_by(.age)`
- `unique_by()`: `unique_by(.id)`
- `flatten`: ネストした配列を平坦化

### 配列・文字列操作
- `split()`, `join()`
- `sub()`, `gsub()`: 文字列置換
- `keys`, `values`
- `to_entries`, `from_entries`

### その他
- 算術演算: `+ - * / %`
- 比較演算: `== != < > <= >=`
- 論理演算: `and or not`
- 関数定義: `def increment: . + 1;`

## 技術スタック

- **React**: UIフレームワーク
- **Vite**: ビルドツール
- **jq-web**: WebAssembly版jqライブラリ

## デプロイ

このプロジェクトはGitHub Actionsを使用して自動的にGitHub Pagesにデプロイされます。

### GitHub Pagesの設定

1. GitHubリポジトリの **Settings** → **Pages** に移動
2. **Source** を **GitHub Actions** に設定
3. `main`ブランチにプッシュすると自動的にビルド＆デプロイされます

### 手動デプロイ

ワークフローは手動でもトリガーできます:
- リポジトリの **Actions** タブから **Deploy to GitHub Pages** を選択
- **Run workflow** をクリック

## 制限事項

以下の機能はブラウザ環境の制約により未実装です:

- `--stream`: ストリーミング処理
- `-f`: 外部スクリプトファイルの読み込み
- `--arg/--argjson`: 外部変数の注入（一部機能）
- ファイルI/O関連の機能

## ライセンス

MIT

## 参考

- [jq公式サイト](https://jqlang.github.io/jq/)
- [jq-web GitHub](https://github.com/fiatjaf/jq-web)
