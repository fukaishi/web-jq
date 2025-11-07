import { useState, useEffect } from 'react'
import './App.css'

// クエリテンプレート
const queryTemplates = [
  { name: '全体表示', query: '.', description: 'JSON全体をそのまま表示' },
  { name: 'すべてのキー', query: 'keys', description: 'オブジェクトのキー一覧を表示' },
  { name: 'すべての値', query: 'values', description: 'オブジェクトの値一覧を表示' },
  { name: '配列の長さ', query: 'length', description: '配列またはオブジェクトの要素数' },
  { name: '配列を展開', query: '.[]', description: '配列の各要素を個別に出力' },
  { name: '最初の要素', query: '.[0]', description: '配列の最初の要素を取得' },
  { name: 'キーと値のペア', query: 'to_entries', description: 'オブジェクトをキーと値のペアに変換' },
  { name: '重複を削除', query: 'unique', description: '配列から重複を削除' },
  { name: '並べ替え', query: 'sort', description: '配列を昇順に並べ替え' },
  { name: '逆順', query: 'reverse', description: '配列を逆順にする' },
]

// サンプルデータ
const sampleData = {
  simple: {
    name: 'サンプル：シンプル',
    data: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    }
  },
  array: {
    name: 'サンプル：配列',
    data: [
      { id: 1, name: 'Tokyo', population: 13960000 },
      { id: 2, name: 'Osaka', population: 8840000 },
      { id: 3, name: 'Nagoya', population: 2296000 }
    ]
  },
  nested: {
    name: 'サンプル：ネスト',
    data: {
      user: {
        id: 123,
        profile: {
          name: 'Alice',
          age: 25,
          hobbies: ['reading', 'music', 'travel']
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    }
  },
  ecommerce: {
    name: 'サンプル：ECサイト',
    data: {
      orders: [
        {
          orderId: 'ORD001',
          customer: 'Taro Yamada',
          items: [
            { product: 'Laptop', price: 120000, quantity: 1 },
            { product: 'Mouse', price: 2500, quantity: 2 }
          ],
          total: 125000,
          status: 'shipped'
        },
        {
          orderId: 'ORD002',
          customer: 'Hanako Suzuki',
          items: [
            { product: 'Keyboard', price: 8000, quantity: 1 }
          ],
          total: 8000,
          status: 'pending'
        }
      ]
    }
  }
}

// よく使う操作
const quickActions = [
  { name: '名前フィールド抽出', query: '.name', icon: '📝' },
  { name: '配列の各名前', query: '.[].name', icon: '📋' },
  { name: 'IDでソート', query: 'sort_by(.id)', icon: '🔢' },
  { name: '年齢でフィルタ(>25)', query: 'map(select(.age > 25))', icon: '🔍' },
  { name: '合計を計算', query: 'map(.price) | add', icon: '➕' },
  { name: 'ユニークな値', query: 'unique_by(.name)', icon: '✨' },
]

function App() {
  const [jq, setJq] = useState(null)
  const [jsonInput, setJsonInput] = useState(JSON.stringify(sampleData.simple.data, null, 2))
  const [query, setQuery] = useState('.')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [options, setOptions] = useState({
    compact: false,
    raw: false,
    slurp: false
  })
  const [showTemplates, setShowTemplates] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(true)

  // jq-webの初期化
  useEffect(() => {
    import('jq-web').then(jqModule => {
      jqModule.default().then(jqInstance => {
        setJq(jqInstance)
      })
    })
  }, [])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setJsonInput(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const loadSampleData = (key) => {
    setJsonInput(JSON.stringify(sampleData[key].data, null, 2))
  }

  const applyTemplate = (template) => {
    setQuery(template.query)
  }

  const applyQuickAction = (action) => {
    setQuery(action.query)
    executeQueryWithQuery(action.query)
  }

  const executeQuery = async () => {
    executeQueryWithQuery(query)
  }

  const executeQueryWithQuery = async (queryStr) => {
    if (!jq) {
      setError('jqライブラリがまだ読み込まれていません')
      return
    }

    setError('')
    setOutput('')

    try {
      // JSON入力のパース
      let inputData
      try {
        inputData = JSON.parse(jsonInput)
      } catch (e) {
        setError('入力JSONが無効です: ' + e.message)
        return
      }

      // slurpオプション処理
      if (options.slurp && Array.isArray(inputData)) {
        inputData = [inputData]
      }

      // jqクエリの実行
      let result
      if (options.raw) {
        // raw出力の場合
        result = await jq.raw(JSON.stringify(inputData), queryStr)
      } else {
        // JSON出力の場合
        result = await jq.json(inputData, queryStr)

        // compact オプション
        if (options.compact) {
          result = JSON.stringify(result)
        } else {
          result = JSON.stringify(result, null, 2)
        }
      }

      setOutput(result)
    } catch (err) {
      setError('エラー: ' + err.message)
    }
  }

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }

  return (
    <div className="app">
      <header>
        <h1>jq Web Tool</h1>
        <p>jqコマンド不要！ブラウザでJSONを簡単に操作</p>
      </header>

      <div className="container">
        {/* 左側: 入力エリア */}
        <div className="input-section">
          <div className="section-header">
            <h2>JSON入力</h2>
            <div className="button-group">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                id="file-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="upload-button">
                📁 ファイル
              </label>
            </div>
          </div>

          {/* サンプルデータ選択 */}
          <div className="sample-data-section">
            <label>サンプルデータ:</label>
            <div className="sample-buttons">
              {Object.entries(sampleData).map(([key, sample]) => (
                <button
                  key={key}
                  onClick={() => loadSampleData(key)}
                  className="sample-button"
                  title={`${sample.name}を読み込む`}
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="JSONを入力するか、ファイルをアップロードしてください"
            rows={15}
          />
        </div>

        {/* 中央: クエリと操作 */}
        <div className="query-section">
          <h2>操作を選択</h2>

          {/* クイックアクション */}
          <div className="quick-actions-wrapper">
            <div
              className="section-toggle"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <h3>⚡ クイックアクション {showQuickActions ? '▼' : '▶'}</h3>
            </div>
            {showQuickActions && (
              <div className="quick-actions">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickAction(action)}
                    className="quick-action-button"
                    title={action.query}
                  >
                    <span className="icon">{action.icon}</span>
                    <span className="label">{action.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* クエリテンプレート */}
          <div className="templates-wrapper">
            <div
              className="section-toggle"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <h3>📚 クエリテンプレート {showTemplates ? '▼' : '▶'}</h3>
            </div>
            {showTemplates && (
              <div className="templates">
                {queryTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className="template-button"
                    title={template.description}
                  >
                    <span className="template-name">{template.name}</span>
                    <code className="template-query">{template.query}</code>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* カスタムクエリ入力 */}
          <div className="custom-query">
            <label htmlFor="query-input">カスタムクエリ:</label>
            <input
              id="query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="jqクエリを入力 (例: .name, .cities[])"
            />
          </div>

          {/* オプション */}
          <div className="options">
            <label>
              <input
                type="checkbox"
                checked={options.compact}
                onChange={() => handleOptionChange('compact')}
              />
              Compact (-c)
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.raw}
                onChange={() => handleOptionChange('raw')}
              />
              Raw (-r)
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.slurp}
                onChange={() => handleOptionChange('slurp')}
              />
              Slurp (-s)
            </label>
          </div>

          <button onClick={executeQuery} disabled={!jq} className="execute-button">
            {jq ? '▶ 実行' : '読み込み中...'}
          </button>
        </div>

        {/* 右側: 出力エリア */}
        <div className="output-section">
          <h2>出力結果</h2>
          {error && <div className="error">{error}</div>}
          <textarea
            value={output}
            readOnly
            placeholder="結果がここに表示されます"
            rows={15}
          />
        </div>
      </div>

      <footer>
        <h3>💡 ヒント</h3>
        <div className="tips">
          <div className="tip">
            <strong>1. サンプルを選ぶ:</strong> 上部のサンプルデータボタンから始めましょう
          </div>
          <div className="tip">
            <strong>2. クイックアクションを試す:</strong> よく使う操作をワンクリックで実行
          </div>
          <div className="tip">
            <strong>3. テンプレートを使う:</strong> 基本的なクエリパターンを選んで応用
          </div>
          <div className="tip">
            <strong>4. カスタムクエリ:</strong> 慣れたら自分でクエリを書いてみましょう
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
