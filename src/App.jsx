import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [jq, setJq] = useState(null)
  const [jsonInput, setJsonInput] = useState('')
  const [rawResult, setRawResult] = useState(null) // 元の結果を保持
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loadingJq, setLoadingJq] = useState(true)
  const [customCommand, setCustomCommand] = useState('')
  const [outputFormat, setOutputFormat] = useState('json-pretty') // 出力形式

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
        query = '.items | map(select(.id == 2))'
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

  // 出力形式の変換
  const formatOutput = async (result, format) => {
    if (!jq) return ''

    try {
      switch (format) {
        case 'json-pretty':
          return JSON.stringify(result, null, 2)

        case 'json-compact':
          return JSON.stringify(result)

        case 'csv':
          // jqの@csvを使用してCSV変換
          if (Array.isArray(result)) {
            if (result.length === 0) {
              return ''
            }

            const firstElement = result[0]

            if (Array.isArray(firstElement)) {
              // 配列の配列の場合: [[1, "Alice"], [2, "Bob"]]
              const csvQuery = '.[] | @csv'
              return await jq.raw(JSON.stringify(result), csvQuery)
            } else if (typeof firstElement === 'object' && firstElement !== null) {
              // オブジェクトの配列の場合: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]
              const csvQuery = 'map(to_entries | map(.value)) | .[] | @csv'
              return await jq.raw(JSON.stringify(result), csvQuery)
            } else {
              // 単一レベルの配列の場合: [2, "Bob", 18, "B"]
              const csvQuery = '@csv'
              return await jq.raw(JSON.stringify(result), csvQuery)
            }
          } else {
            return `CSV形式に変換するには配列が必要です。

配列にする必要があります。
例：
| map([ .id, .name, .score, .team ])
| map([ .id, .name, .score, (.tags|join("|")), .team ])`
          }

        case 'tsv':
          // jqの@tsvを使用してTSV変換
          if (Array.isArray(result)) {
            if (result.length === 0) {
              return ''
            }

            const firstElement = result[0]

            if (Array.isArray(firstElement)) {
              // 配列の配列の場合: [[1, "Alice"], [2, "Bob"]]
              const tsvQuery = '.[] | @tsv'
              return await jq.raw(JSON.stringify(result), tsvQuery)
            } else if (typeof firstElement === 'object' && firstElement !== null) {
              // オブジェクトの配列の場合: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]
              const tsvQuery = 'map(to_entries | map(.value)) | .[] | @tsv'
              return await jq.raw(JSON.stringify(result), tsvQuery)
            } else {
              // 単一レベルの配列の場合: [2, "Bob", 18, "B"]
              const tsvQuery = '@tsv'
              return await jq.raw(JSON.stringify(result), tsvQuery)
            }
          } else {
            return `TSV形式に変換するには配列が必要です。

配列にする必要があります。
例：
| map([ .id, .name, .score, .team ])
| map([ .id, .name, .score, (.tags|join("|")), .team ])`
          }

        default:
          return JSON.stringify(result, null, 2)
      }
    } catch (err) {
      // CSV/TSVエラーの場合は、ヒントを追加
      if (format === 'csv' || format === 'tsv') {
        return `フォーマット変換エラー: ${err.message}

配列にする必要があります。
例：
| map([ .id, .name, .score, .team ])
| map([ .id, .name, .score, (.tags|join("|")), .team ])`
      }
      return `フォーマット変換エラー: ${err.message}`
    }
  }

  const executeCustomCommand = async () => {
    if (!jq || !customCommand) return
    setError('')
    setOutput('')

    try {
      // jq.raw()を使用してJSON文字列を取得
      const rawOutput = await jq.raw(jsonInput, customCommand)

      // デバッグ用: rawOutputの内容を確認
      console.log('Raw output from jq:', rawOutput)
      console.log('Output length:', rawOutput.length)

      let result

      // まず、全体を1つのJSONとしてパースしてみる
      try {
        result = JSON.parse(rawOutput)
      } catch (e) {
        // 失敗した場合は、改行区切りの複数のJSON値として扱う
        const lines = rawOutput.trim().split('\n')

        // 空行を除外して、各行をパース
        const validLines = []
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed) {
            validLines.push(trimmed)
          }
        }

        if (validLines.length === 0) {
          result = null
        } else if (validLines.length === 1) {
          try {
            result = JSON.parse(validLines[0])
          } catch (parseErr) {
            throw new Error(`JSON解析エラー: ${parseErr.message}`)
          }
        } else {
          // 複数の結果の場合は配列として扱う
          result = validLines.map((line, index) => {
            try {
              return JSON.parse(line)
            } catch (parseErr) {
              throw new Error(`行${index + 1}のJSON解析エラー: ${parseErr.message}`)
            }
          })
        }
      }

      setRawResult(result)

      // 選択された形式で出力
      const formatted = await formatOutput(result, outputFormat)
      setOutput(formatted)
    } catch (err) {
      setError(`エラー: ${err.message}`)
    }
  }

  // 出力形式が変更されたときに再フォーマット
  useEffect(() => {
    if (rawResult !== null) {
      formatOutput(rawResult, outputFormat).then(setOutput)
    }
  }, [outputFormat, rawResult])

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
          <div className="output-header">
            <h2>結果</h2>
            <div className="output-tabs">
              <button
                className={`tab-btn ${outputFormat === 'json-pretty' ? 'active' : ''}`}
                onClick={() => setOutputFormat('json-pretty')}
              >
                JSON（整形）
              </button>
              <button
                className={`tab-btn ${outputFormat === 'json-compact' ? 'active' : ''}`}
                onClick={() => setOutputFormat('json-compact')}
              >
                JSON（圧縮）
              </button>
              <button
                className={`tab-btn ${outputFormat === 'csv' ? 'active' : ''}`}
                onClick={() => setOutputFormat('csv')}
              >
                CSV
              </button>
              <button
                className={`tab-btn ${outputFormat === 'tsv' ? 'active' : ''}`}
                onClick={() => setOutputFormat('tsv')}
              >
                TSV
              </button>
            </div>
          </div>
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
