import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [jq, setJq] = useState(null)
  const [jsonInput, setJsonInput] = useState('{\n  "name": "John",\n  "age": 30,\n  "cities": ["Tokyo", "Osaka"]\n}')
  const [query, setQuery] = useState('.')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [options, setOptions] = useState({
    compact: false,
    raw: false,
    slurp: false
  })

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

  const executeQuery = async () => {
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
        result = await jq.raw(JSON.stringify(inputData), query)
      } else {
        // JSON出力の場合
        result = await jq.json(inputData, query)

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
        <p>jqと同じことができるWebツール</p>
      </header>

      <div className="container">
        <div className="input-section">
          <div className="section-header">
            <h2>JSON入力</h2>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-button">
              ファイルをアップロード
            </label>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="JSONを入力するか、ファイルをアップロードしてください"
            rows={15}
          />
        </div>

        <div className="query-section">
          <h2>jqクエリ</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="jqクエリを入力 (例: .name, .cities[])"
          />

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

          <button onClick={executeQuery} disabled={!jq}>
            {jq ? '実行' : '読み込み中...'}
          </button>
        </div>

        <div className="output-section">
          <h2>出力</h2>
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
        <h3>使用例</h3>
        <div className="examples">
          <div className="example">
            <strong>基本抽出:</strong> <code>.</code> (全体), <code>.name</code> (フィールド)
          </div>
          <div className="example">
            <strong>配列操作:</strong> <code>.cities[]</code> (展開), <code>.cities[0]</code> (インデックス)
          </div>
          <div className="example">
            <strong>フィルタ:</strong> <code>.[] | select(.age &gt; 20)</code>
          </div>
          <div className="example">
            <strong>変換:</strong> <code>map(.name)</code>, <code>sort_by(.age)</code>
          </div>
          <div className="example">
            <strong>集計:</strong> <code>length</code>, <code>.[] | add</code>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
