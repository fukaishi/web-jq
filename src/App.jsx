import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [jq, setJq] = useState(null)
  const [jsonInput, setJsonInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loadingJq, setLoadingJq] = useState(true)

  // クイックアクション用
  const [fieldPath, setFieldPath] = useState('.')
  const [operation, setOperation] = useState('show')
  const [outputFormat, setOutputFormat] = useState('pretty')

  // カスタムコマンド用
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

  const analyzeStructure = async () => {
    if (!jq) return
    setError('')
    setOutput('')

    try {
      const inputData = JSON.parse(jsonInput)

      // 構造解析用のjqコマンド
      const structureQuery = `
        with_entries(
          .value |=
            (if type=="array" then
               (if (length>0) and ((.[0]|type)=="object") then (.[0]|keys) else [] end)
             elif type=="object" then
               keys
             else
               null
             end)
        )
      `

      const result = await jq.json(inputData, structureQuery)
      setOutput(JSON.stringify(result, null, 2))
    } catch (err) {
      setError(`エラー: ${err.message}`)
    }
  }

  const executeQuickAction = async () => {
    if (!jq) return
    setError('')
    setOutput('')

    try {
      const inputData = JSON.parse(jsonInput)

      let query = fieldPath

      // 操作の適用
      switch (operation) {
        case 'show':
          // そのまま表示
          break
        case 'keys':
          query += ' | keys'
          break
        case 'length':
          query += ' | length'
          break
        case 'first':
          query += ' | .[0]'
          break
        case 'map_values':
          query += ' | map(.)'
          break
        case 'unique':
          query += ' | unique'
          break
        case 'sort':
          query += ' | sort'
          break
        case 'group':
          query += ' | group_by(.)'
          break
        case 'flatten':
          query += ' | flatten'
          break
        default:
          break
      }

      const result = await jq.json(inputData, query)

      // 出力形式の適用
      let outputStr
      if (outputFormat === 'pretty') {
        outputStr = JSON.stringify(result, null, 2)
      } else if (outputFormat === 'compact') {
        outputStr = JSON.stringify(result)
      } else if (outputFormat === 'raw') {
        outputStr = await jq.raw(JSON.stringify(inputData), query)
      }

      setOutput(outputStr)
    } catch (err) {
      setError(`エラー: ${err.message}`)
    }
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

        {/* 解析ボタン */}
        <section className="analyze-section">
          <button
            onClick={analyzeStructure}
            disabled={!jq || !jsonInput}
            className="analyze-btn"
          >
            🔍 構造を解析
          </button>
          <span className="help-text">JSONの構造（キー項目）を表示します</span>
        </section>

        {/* クイックアクション */}
        <section className="quick-action-section">
          <h2>クイックアクション</h2>
          <div className="quick-action-form">
            <div className="form-group">
              <label>要素を指定:</label>
              <input
                type="text"
                value={fieldPath}
                onChange={(e) => setFieldPath(e.target.value)}
                placeholder="例: . または .users または .items[0]"
                className="field-input"
              />
            </div>

            <div className="form-group">
              <label>操作を選択:</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="operation-select"
              >
                <option value="show">そのまま表示</option>
                <option value="keys">キー一覧を表示</option>
                <option value="length">要素数を表示</option>
                <option value="first">最初の要素</option>
                <option value="map_values">各要素を変換</option>
                <option value="unique">重複を削除</option>
                <option value="sort">並べ替え</option>
                <option value="group">グループ化</option>
                <option value="flatten">配列を平坦化</option>
              </select>
            </div>

            <div className="form-group">
              <label>出力形式:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="format-select"
              >
                <option value="pretty">整形表示</option>
                <option value="compact">圧縮表示</option>
                <option value="raw">生文字列</option>
              </select>
            </div>

            <button
              onClick={executeQuickAction}
              disabled={!jq || !jsonInput}
              className="execute-btn"
            >
              ▶ 実行
            </button>
          </div>
        </section>

        {/* カスタムコマンド */}
        <section className="custom-command-section">
          <h2>カスタムコマンド</h2>
          <div className="custom-command-form">
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="jqコマンドを入力 例: .[] | select(.age > 20)"
              className="custom-input"
            />
            <button
              onClick={executeCustomCommand}
              disabled={!jq || !jsonInput || !customCommand}
              className="execute-btn"
            >
              ▶ 実行
            </button>
          </div>
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
