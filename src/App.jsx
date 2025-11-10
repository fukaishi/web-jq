import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [jq, setJq] = useState(null)
  const [jsonInput, setJsonInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loadingJq, setLoadingJq] = useState(true)
  const [customCommand, setCustomCommand] = useState('')

  // jq-webの初期化
  useEffect(() => {
    setLoadingJq(true)
    import('jq-web')
      .then(jqModule => jqModule.default)
      .then(jqInstance => {
        setJq(jqInstance)
        setLoadingJq(false)
      })
      .catch(err => {
        console.error('Failed to load jq-web:', err)
        setError(`jqライブラリの読み込みに失敗: ${err.message}`)
        setLoadingJq(false)
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

  // クイックアクションのクエリ展開
  const applyQuickAction = (actionType) => {
    let query = ''

    switch (actionType) {
      case 'analyze':
        query = `with_entries(
  .value |=
    (if type=="array" then
       (if (length>0) and ((.[0]|type)=="object") then (.[0]|keys) else [] end)
     elif type=="object" then
       keys
     else
       null
     end)
)`
        break

      case 'filter':
        query = '.items[] | select(.id == 2)'
        break

      case 'sort':
        query = '.items | sort_by(.id)'
        break

      case 'aggregate':
        query = `.items
| group_by(.team)
| map({
    team: .[0].team,
    count: length,
    sum: (map(.score) | add),
    avg: ((map(.score) | add) / length)
  })`
        break

      default:
        break
    }

    setCustomCommand(query)
  }

  const executeCustomCommand = async () => {
    if (!jq || !customCommand) return
    setError('')
    setOutput('')

    try {
      const inputData = JSON.parse(jsonInput)
      const result = await jq.json(inputData, customCommand)
      setOutput(JSON.stringify(result, null, 2))
    } catch (err) {
      setError(`エラー: ${err.message}`)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>jq Web Tool</h1>
        <p>ブラウザでJSONを簡単に処理</p>
      </header>

      <div className="main-content">
        {/* JSON入力エリア */}
        <section className="input-area">
          <div className="input-header">
            <h2>JSON入力</h2>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-btn">
              📁 ファイルをアップロード
            </label>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='JSONを入力または貼り付けてください。例：{"name": "太郎", "age": 30}'
            rows={12}
            className="json-input"
          />
        </section>

        {/* クイックアクション */}
        <section className="quick-action-section">
          <h2>クイックアクション</h2>
          <div className="quick-actions">
            <button
              onClick={() => applyQuickAction('analyze')}
              disabled={!jq || !jsonInput}
              className="action-btn analyze-btn"
            >
              <span className="action-icon">🔍</span>
              <span className="action-label">構造解析</span>
            </button>

            <button
              onClick={() => applyQuickAction('filter')}
              disabled={!jq || !jsonInput}
              className="action-btn filter-btn"
            >
              <span className="action-icon">🔎</span>
              <span className="action-label">itemsの絞り込み</span>
            </button>

            <button
              onClick={() => applyQuickAction('sort')}
              disabled={!jq || !jsonInput}
              className="action-btn sort-btn"
            >
              <span className="action-icon">🔢</span>
              <span className="action-label">itemsのソート</span>
            </button>

            <button
              onClick={() => applyQuickAction('aggregate')}
              disabled={!jq || !jsonInput}
              className="action-btn aggregate-btn"
            >
              <span className="action-icon">📊</span>
              <span className="action-label">itemsの集計</span>
            </button>
          </div>
        </section>

        {/* カスタムコマンド */}
        <section className="custom-command-section">
          <h2>カスタムコマンド</h2>
          <textarea
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder="jqコマンドを入力 例: .[] | select(.age > 20)"
            className="custom-command-textarea"
            rows={8}
          />
          <button
            onClick={executeCustomCommand}
            disabled={!jq || !jsonInput || !customCommand}
            className="execute-btn"
          >
            ▶ 実行
          </button>
        </section>

        {/* 結果表示エリア */}
        <section className="output-area">
          <h2>結果</h2>
          {error && <div className="error-message">{error}</div>}
          {loadingJq && <div className="loading">jqライブラリ読み込み中...</div>}
          <textarea
            value={output}
            readOnly
            placeholder="結果がここに表示されます"
            rows={15}
            className="json-output"
          />
        </section>
      </div>
    </div>
  )
}

export default App
