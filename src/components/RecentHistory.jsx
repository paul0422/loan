function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  if (m < 1)  return '방금'
  if (m < 60) return `${m}분 전`
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function RecentHistory({ history, onLoad, onClear }) {
  if (!history || history.length === 0) return null

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div>
          <div style={S.title}>🕓 최근 계산 기록</div>
          <div style={S.sub}>최근 {history.length}개 자동 저장</div>
        </div>
        <button style={S.clearBtn} onClick={onClear}>전체 삭제</button>
      </div>

      <div style={S.list}>
        {history.map(entry => {
          const { inputs, results } = entry
          const loan     = results?.loan
          const didimdol = results?.didimdol
          return (
            <div key={entry.id} style={S.item}>
              <div style={S.itemTop}>
                <span style={S.price}>매매가 {Math.round(inputs.salePrice / 1_000_000).toLocaleString()}백만</span>
                <span style={S.time}>{timeAgo(entry.timestamp)}</span>
              </div>
              <div style={S.results}>
                {loan && !loan.blocked && (
                  <div style={S.resultRow}>
                    <span style={S.badge}>주담대</span>
                    <span style={S.amt}>{formatKRW(loan.finalAmount)}</span>
                  </div>
                )}
                {didimdol && !didimdol.ineligible && (
                  <div style={S.resultRow}>
                    <span style={{ ...S.badge, background: '#e0f2fe', color: '#0369a1' }}>디딤돌</span>
                    <span style={S.amt}>{formatKRW(didimdol.loanAmount)}</span>
                  </div>
                )}
                {(!loan || loan.blocked) && (!didimdol || didimdol.ineligible) && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>결과 없음</div>
                )}
              </div>
              <button style={S.loadBtn} onClick={() => onLoad(entry)}>이 조건 불러오기</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const S = {
  card: {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    padding: '20px 16px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingBottom: 12, borderBottom: '2px solid #f1f5f9', marginBottom: 14,
  },
  title:    { fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 2 },
  sub:      { fontSize: 11, color: '#94a3b8' },
  clearBtn: {
    fontSize: 10, fontWeight: 600, color: '#94a3b8',
    background: '#f1f5f9', border: 'none', borderRadius: 6,
    padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    padding: '10px 12px', background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 10,
  },
  itemTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  price:  { fontSize: 12, fontWeight: 700, color: '#1a202c' },
  time:   { fontSize: 10, color: '#94a3b8' },
  results: { display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 },
  resultRow: { display: 'flex', alignItems: 'center', gap: 6 },
  badge: {
    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
    background: '#dbeafe', color: '#1d4ed8', flexShrink: 0,
  },
  amt:  { fontSize: 11, fontWeight: 700, color: '#1a202c' },
  loadBtn: {
    width: '100%', padding: '6px 0', fontSize: 11, fontWeight: 600,
    background: '#eff6ff', color: '#1e40af',
    border: '1px solid #bfdbfe', borderRadius: 7,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
