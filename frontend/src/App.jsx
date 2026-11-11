import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'

const W = 10, H = 20
const SHAPES = [
  { name: 'I', color: '#51d6e8', shape: [[1, 1, 1, 1]] },
  { name: 'O', color: '#f7cc62', shape: [[1, 1], [1, 1]] },
  { name: 'T', color: '#b891fa', shape: [[0, 1, 0], [1, 1, 1]] },
  { name: 'S', color: '#76dfa0', shape: [[0, 1, 1], [1, 1, 0]] },
  { name: 'Z', color: '#ff7c82', shape: [[1, 1, 0], [0, 1, 1]] },
  { name: 'J', color: '#72a8ff', shape: [[1, 0, 0], [1, 1, 1]] },
  { name: 'L', color: '#ffa76c', shape: [[0, 0, 1], [1, 1, 1]] },
]
const emptyBoard = () => Array.from({ length: H }, () => Array(W).fill(null))
const newPiece = () => { const p = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { ...p, x: Math.floor((W - p.shape[0].length) / 2), y: 0 } }
const rotate = matrix => matrix[0].map((_, i) => matrix.map(row => row[i]).reverse())
const sound = (freq = 420) => { try { const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = freq; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .09); osc.start(); osc.stop(ctx.currentTime + .1) } catch {} }

function App() {
  const [board, setBoard] = useState(emptyBoard)
  const [piece, setPiece] = useState(newPiece)
  const [next, setNext] = useState(newPiece)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState(false)
  const [muted, setMuted] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem('tetris-best') || 0))
  const [scores, setScores] = useState([])
  const [player, setPlayer] = useState('')
  const [saved, setSaved] = useState(false)
  const boardRef = useRef(board), pieceRef = useRef(piece), nextRef = useRef(next), pausedRef = useRef(paused), overRef = useRef(over), scoreRef = useRef(score), linesRef = useRef(lines), mutedRef = useRef(muted)
  useEffect(() => { boardRef.current = board }, [board]); useEffect(() => { pieceRef.current = piece }, [piece]); useEffect(() => { nextRef.current = next }, [next]); useEffect(() => { pausedRef.current = paused }, [paused]); useEffect(() => { overRef.current = over }, [over]); useEffect(() => { scoreRef.current = score }, [score]); useEffect(() => { linesRef.current = lines }, [lines]); useEffect(() => { mutedRef.current = muted }, [muted])

  const syncBest = useCallback(value => { const top = Math.max(best, value); setBest(top); localStorage.setItem('tetris-best', String(top)) }, [best])
  const collides = useCallback((p, b = boardRef.current) => p.shape.some((row, y) => row.some((cell, x) => cell && (p.x + x < 0 || p.x + x >= W || p.y + y >= H || (p.y + y >= 0 && b[p.y + y][p.x + x])))), [])
  const finish = useCallback(finalScore => { setOver(true); setPaused(false); syncBest(finalScore); if (!mutedRef.current) sound(190) }, [syncBest])
  const spawn = useCallback((b, incoming = nextRef.current) => {
    const fresh = { ...incoming, x: Math.floor((W - incoming.shape[0].length) / 2), y: 0 }, upcoming = newPiece()
    setPiece(fresh); setNext(upcoming)
    if (collides(fresh, b)) finish(scoreRef.current)
  }, [collides, finish])
  const lockPiece = useCallback((p = pieceRef.current) => {
    const b = boardRef.current.map(row => [...row]); p.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && p.y + y >= 0 && p.y + y < H) b[p.y + y][p.x + x] = p.color }))
    const full = b.filter(row => row.every(Boolean)).length, kept = b.filter(row => !row.every(Boolean))
    while (kept.length < H) kept.unshift(Array(W).fill(null))
    const gained = full ? [0, 100, 300, 500, 800][full] * level : 0, totalLines = linesRef.current + full
    setBoard(kept); boardRef.current = kept
    if (full) { setLines(totalLines); setLevel(Math.floor(totalLines / 10) + 1); setScore(s => { const n = s + gained; syncBest(n); if (!mutedRef.current) sound(600); return n }) }
    spawn(kept)
  }, [level, spawn, syncBest])

  const move = useCallback((dx, dy) => {
    if (pausedRef.current || overRef.current) return
    const p = { ...pieceRef.current, x: pieceRef.current.x + dx, y: pieceRef.current.y + dy }
    if (!collides(p)) { setPiece(p); pieceRef.current = p; return true }
    if (dy > 0) lockPiece()
    return false
  }, [collides, lockPiece])
  const turn = useCallback(() => { if (pausedRef.current || overRef.current) return; const p = { ...pieceRef.current, shape: rotate(pieceRef.current.shape) }; if (!collides(p)) { setPiece(p); pieceRef.current = p; if (!mutedRef.current) sound(480) } }, [collides])
  const drop = useCallback(() => { if (pausedRef.current || overRef.current) return; let p = pieceRef.current, distance = 0; while (!collides({ ...p, y: p.y + 1 })) { p = { ...p, y: p.y + 1 }; distance++ } setPiece(p); pieceRef.current = p; setScore(s => { const n = s + distance * 2; syncBest(n); return n }); lockPiece(p) }, [collides, lockPiece, syncBest])
  const restart = useCallback(() => { const b = emptyBoard(), p = newPiece(), n = newPiece(); setBoard(b); boardRef.current = b; setPiece(p); pieceRef.current = p; setNext(n); nextRef.current = n; setScore(0); scoreRef.current = 0; setLines(0); linesRef.current = 0; setLevel(1); setPaused(false); pausedRef.current = false; setOver(false); overRef.current = false; setSaved(false) }, [])

  useEffect(() => {
    const handler = e => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'x', 'X', 'p', 'P', 'r', 'R']; if (keys.includes(e.key)) e.preventDefault()
      if (e.key === 'ArrowLeft') move(-1, 0); else if (e.key === 'ArrowRight') move(1, 0); else if (e.key === 'ArrowDown') { if (move(0, 1)) setScore(s => { const n = s + 1; syncBest(n); return n }) }
      else if (['ArrowUp', 'x', 'X'].includes(e.key)) turn(); else if (e.key === ' ') drop(); else if (['p', 'P'].includes(e.key) && !overRef.current) setPaused(v => { pausedRef.current = !v; return !v }); else if (['r', 'R'].includes(e.key)) restart()
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [move, turn, drop, restart, syncBest])
  useEffect(() => { const timer = window.setInterval(() => { if (!pausedRef.current && !overRef.current) move(0, 1) }, Math.max(100, 850 - (level - 1) * 65)); return () => clearInterval(timer) }, [move, level])
  useEffect(() => { fetch('http://localhost:8080/api/scores').then(r => r.ok ? r.json() : []).then(setScores).catch(() => {}) }, [])
  const saveScore = async e => { e.preventDefault(); if (!player.trim() || saved) return; try { const res = await fetch('http://localhost:8080/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: player.trim(), score }) }); if (res.ok) { setSaved(true); setScores(await (await fetch('http://localhost:8080/api/scores')).json()) } } catch {} }

  const display = useMemo(() => { const view = board.map(row => [...row]); const ghost = { ...piece }; while (!collides({ ...ghost, y: ghost.y + 1 }, view)) ghost.y++; ghost.shape.forEach((row, y) => row.forEach((v, x) => { if (v && ghost.y + y >= 0 && ghost.y + y < H && !view[ghost.y + y][ghost.x + x]) view[ghost.y + y][ghost.x + x] = 'ghost' })); piece.shape.forEach((row, y) => row.forEach((v, x) => { if (v && piece.y + y >= 0 && piece.y + y < H) view[piece.y + y][piece.x + x] = piece.color })); return view }, [board, piece, collides])
  const nextCells = useMemo(() => { const shape = next.shape, padX = Math.floor((4 - shape[0].length) / 2), padY = Math.floor((4 - shape.length) / 2); return Array.from({ length: 4 }, (_, y) => Array.from({ length: 4 }, (_, x) => shape[y - padY]?.[x - padX] ? next.color : null)) }, [next])
  const Key = ({ children }) => <kbd>{children}</kbd>

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Tetris início"><span className="brand-mark"><i/><i/><i/><i/></span><span>tetris<span className="brand-dot">.</span></span></a><div className="top-note"><span className="live-dot"/> jogo clássico, momento presente</div><button className="icon-button sound-button" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Ativar som' : 'Desativar som'}>{muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button></header>
    <section className="hero" id="top"><div className="eyebrow"><span>01</span><span className="eyebrow-line"/> seu momento de pausa</div><h1>Um bloco<br/>de cada <span>vez.</span></h1><p className="hero-copy">Respire fundo. Encontre seu espaço.<br/>O resto se encaixa.</p></section>
    <section className="game-layout" aria-label="Jogo Tetris">
      <div className="board-wrap"><div className="board-frame"><div className="board-topline"><span>ÁREA DE JOGO</span><span className="board-level">LVL <b>{String(level).padStart(2, '0')}</b></span></div><div className="board" role="grid" aria-label={`Tabuleiro, pontuação ${score}`}>
        {display.flatMap((row, y) => row.map((color, x) => <div className={`cell ${color ? color === 'ghost' ? 'ghost' : 'filled' : ''}`} style={color && color !== 'ghost' ? { '--cell-color': color } : {}} key={`${y}-${x}`} role="gridcell"/>))}
        {(paused || over) && <div className="board-overlay"><div className="overlay-card"><span className="overlay-icon">{over ? '✦' : 'Ⅱ'}</span><h2>{over ? 'Fim de jogo' : 'Respire.'}</h2><p>{over ? `Você fez ${score.toLocaleString('pt-BR')} pontos.` : 'Seu jogo está pausado.'}</p>{over && !saved ? <form className="score-form" onSubmit={saveScore}><input aria-label="Seu nome" maxLength="16" placeholder="Seu nome" value={player} onChange={e => setPlayer(e.target.value)} required/><button type="submit">Salvar pontuação</button></form> : null}<button className="overlay-action" onClick={over ? restart : () => setPaused(false)}>{over ? <><RotateCcw size={15}/> jogar de novo</> : <><Play size={15}/> continuar</>}</button></div></div>}
      </div><div className="board-caption"><span><i className="caption-dot"/> em jogo</span><span>{lines} LINHAS</span></div></div><div className="board-bottom-note">CADA PEÇA ENCONTRA SEU LUGAR <span>✳</span></div></div>
      <aside className="sidebar"><div className="stats-grid"><div className="stat-card score-card"><span className="stat-label">PONTUAÇÃO</span><strong>{score.toLocaleString('pt-BR')}</strong><span className="stat-foot">seu ritmo, seu jogo</span></div><div className="stat-card best-card"><span className="stat-label">RECORDE</span><strong>{best.toLocaleString('pt-BR')}</strong><span className="stat-foot">melhor de todos</span></div></div>
        <div className="side-card next-card"><div className="card-heading"><span>PRÓXIMA PEÇA</span><span className="tiny-spark">✳</span></div><div className="next-preview">{nextCells.flatMap((row, y) => row.map((color, x) => <div key={`${y}-${x}`} className={`mini-cell ${color ? 'filled' : ''}`} style={color ? { '--cell-color': color } : {}}/>))}</div><div className="next-hint">tudo começa com um encaixe</div></div>
        <div className="side-card controls-card"><div className="card-heading"><span>CONTROLES</span><span className="control-label">TECLADO</span></div><div className="control-row"><div className="key-group"><Key><ArrowLeft size={12}/></Key><Key><ArrowDown size={12}/></Key><Key><ArrowRight size={12}/></Key></div><span>mover peça</span></div><div className="control-row"><div className="key-group"><Key><ArrowUp size={12}/></Key></div><span>girar peça</span></div><div className="control-row"><div className="key-group"><Key>espaço</Key></div><span>queda rápida</span></div><div className="control-row"><div className="key-group"><Key>P</Key></div><span>pausar jogo</span></div><div className="control-footer">Um movimento de cada vez.</div></div>
        <div className="actions"><button className="action-primary" onClick={() => { setPaused(p => { pausedRef.current = !p; return !p }) }} disabled={over}><span>{paused ? <Play size={15}/> : <Pause size={15}/>}</span>{paused ? 'Continuar' : 'Pausar'}<Key>P</Key></button><button className="action-secondary" onClick={restart}><RotateCcw size={15}/><span>Novo jogo</span><Key>R</Key></button></div>
      </aside>
    </section>
    <section className="leaderboard"><div className="leaderboard-head"><div><div className="eyebrow"><span>02</span><span className="eyebrow-line"/> pequenos grandes feitos</div><h2>Placar da <span>pausa.</span></h2></div><span className="leaderboard-note">TOP JOGADORES</span></div><div className="leader-table"><div className="leader-row leader-header"><span>#</span><span>JOGADOR</span><span>PONTOS</span></div>{scores.length ? scores.slice(0, 5).map((s, i) => <div className="leader-row" key={s.id}><span className={`rank rank-${i + 1}`}>{String(i + 1).padStart(2, '0')}</span><span>{s.name}</span><strong>{s.score.toLocaleString('pt-BR')}</strong></div>) : <div className="leader-empty"><span>✳</span><p>O primeiro lugar está esperando por você.</p></div>}</div></section>
    <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><i/><i/><i/><i/></span><span>tetris<span className="brand-dot">.</span></span></a><span>feito para desacelerar <span>✳</span> um bloco de cada vez</span><button className="footer-restart" onClick={restart}><RotateCcw size={13}/> novo jogo</button></footer>
  </main>
}

export default App
