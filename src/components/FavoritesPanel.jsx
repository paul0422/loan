import { useState } from 'react'

function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export default function FavoritesPanel({
  favorites,
  onLoadFavorite,
  onRemoveFavorite,
  onSaveFavorite,
  salePriceNum,
  isMobile = false,
}) {
  const [saveName, setSaveName] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  // 모바일에서는 기본 접힘 상태
  const [isExpanded, setIsExpanded] = useState(!isMobile)

  const handleSave = () => {
    if (!saveName.trim()) return
    if (salePriceNum <= 0) return
    onSaveFavorite(saveName.trim())
    setSaveName('')
  }

  const toggleCompare = (id) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== id))
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, id])
    }
  }

  const selectedFavorites = favorites.filter(f => selectedForCompare.includes(f.id))

  const canSave = saveName.trim().length > 0 && salePriceNum > 0

  const panelStyle = isMobile
    ? {
        ...S.panel,
        width: '100%',
        maxHeight: 'none',
        borderLeft: 'none',
        borderTop: '1px solid #e2e8f0',
        padding: '14px 12px',
      }
    : S.panel

  return (
    <div style={panelStyle}>
      {/* 헤더 — 모바일에서는 클릭 시 접기/펼치기 */}
      <div
        style={{
          ...S.header,
          ...(isMobile ? { cursor: 'pointer', marginBottom: isExpanded ? 16 : 0, paddingBottom: isExpanded ? 16 : 0, borderBottom: isExpanded ? '2px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : {}),
        }}
        onClick={() => isMobile && setIsExpanded(v => !v)}
      >
        <div>
          <div style={S.headerTitle}>⭐ 즐겨찾기</div>
          <div style={S.headerSub}>{favorites.length}개 저장됨</div>
        </div>
        {isMobile && (
          <span style={{ fontSize: 18, color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
        )}
      </div>

      {isMobile && !isExpanded ? null : (
      <>
      {/* 본문 시작 */}

      {/* 저장 섹션 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>현재 정보 저장</div>
        {salePriceNum <= 0 ? (
          <div style={S.disabledHint}>매매가를 입력해주세요</div>
        ) : (
          <>
            <input
              style={S.input}
              type="text"
              placeholder="아파트 이름 입력"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button
              style={{ ...S.btn, ...(canSave ? S.btnPrimary : S.btnDisabled) }}
              onClick={handleSave}
              disabled={!canSave}>
              💾 저장
            </button>
          </>
        )}
      </div>

      {/* 비교 모드 토글 */}
      {favorites.length > 0 && (
        <label style={S.compareToggle}>
          <input
            type="checkbox"
            checked={compareMode}
            onChange={e => {
              setCompareMode(e.target.checked)
              if (!e.target.checked) setSelectedForCompare([])
            }}
            style={{ marginRight: 6 }}
          />
          <span>비교 모드</span>
        </label>
      )}

      {/* 비교 모드 */}
      {compareMode && selectedFavorites.length > 0 && (
        <div style={S.compareSection}>
          <div style={S.compareSectionTitle}>
            아파트 비교 ({selectedFavorites.length}개)
          </div>
          <div style={S.compareTable}>
            <div style={S.compareRow}>
              <div style={S.compareCol1}>지표</div>
              {selectedFavorites.map(fav => (
                <div key={fav.id} style={S.compareCol}>
                  <div style={S.compareName}>{fav.name}</div>
                </div>
              ))}
            </div>
            <div style={S.compareRow}>
              <div style={S.compareCol1}>매매가</div>
              {selectedFavorites.map(fav => (
                <div key={fav.id} style={S.compareCol}>
                  {formatKRW(fav.inputs.salePrice / 1_000_000)}M
                </div>
              ))}
            </div>
            {selectedFavorites.some(f => f.results?.finalAmount) && (
              <div style={S.compareRow}>
                <div style={S.compareCol1}>대출한도</div>
                {selectedFavorites.map(fav => (
                  <div key={fav.id} style={S.compareCol}>
                    {fav.results?.finalAmount
                      ? formatKRW(fav.results.finalAmount / 1_000_000) + 'M'
                      : '-'}
                  </div>
                ))}
              </div>
            )}
            {selectedFavorites.some(f => f.results?.monthlyPayment) && (
              <div style={S.compareRow}>
                <div style={S.compareCol1}>월상환액</div>
                {selectedFavorites.map(fav => (
                  <div key={fav.id} style={S.compareCol}>
                    {fav.results?.monthlyPayment
                      ? formatKRW(fav.results.monthlyPayment)
                      : '-'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 즐겨찾기 리스트 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>저장된 아파트</div>
        {favorites.length === 0 ? (
          <div style={S.emptyState}>저장된 아파트가 없습니다</div>
        ) : (
          <div style={S.list}>
            {favorites.map(fav => (
              <div key={fav.id} style={S.item}>
                <div style={S.itemHeader}>
                  <div style={S.itemName}>{fav.name}</div>
                  <div style={S.itemDate}>{formatDate(fav.createdAt)}</div>
                </div>
                <div style={S.itemInfo}>
                  <div style={S.infoRow}>
                    <span style={S.label}>매매가</span>
                    <span style={S.value}>{formatKRW(fav.inputs.salePrice / 1_000_000)}M</span>
                  </div>
                  {fav.results?.finalAmount && (
                    <div style={S.infoRow}>
                      <span style={S.label}>대출한도</span>
                      <span style={S.value}>{formatKRW(fav.results.finalAmount / 1_000_000)}M</span>
                    </div>
                  )}
                  {fav.results?.monthlyPayment && (
                    <div style={S.infoRow}>
                      <span style={S.label}>월상환액</span>
                      <span style={S.value}>{formatKRW(fav.results.monthlyPayment)}</span>
                    </div>
                  )}
                </div>
                <div style={S.itemActions}>
                  <button style={S.actionBtn} onClick={() => onLoadFavorite(fav)}>
                    로드
                  </button>
                  {compareMode && (
                    <label style={S.compareCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedForCompare.includes(fav.id)}
                        onChange={() => toggleCompare(fav.id)}
                      />
                      비교
                    </label>
                  )}
                  <button style={S.actionBtnDanger} onClick={() => onRemoveFavorite(fav.id)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

const S = {
  panel: {
    width: 320,
    background: '#fff',
    borderLeft: '1px solid #e2e8f0',
    overflowY: 'auto',
    maxHeight: '100vh',
    padding: '20px 16px',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  header: {
    paddingBottom: 16,
    borderBottom: '2px solid #f1f5f9',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #f1f5f9',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 12,
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    outline: 'none',
    marginBottom: 8,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: '#3b82f6',
    color: '#fff',
  },
  btnDisabled: {
    background: '#f1f5f9',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },
  disabledHint: {
    padding: '8px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 11,
    color: '#991b1b',
  },
  compareToggle: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    fontSize: 12,
    color: '#374151',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: 12,
    userSelect: 'none',
  },
  compareSection: {
    marginBottom: 16,
    padding: '12px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
  },
  compareSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 10,
  },
  compareTable: {
    fontSize: 11,
  },
  compareRow: {
    display: 'flex',
    marginBottom: 8,
  },
  compareCol1: {
    flex: '0 0 50px',
    fontWeight: 600,
    color: '#64748b',
    paddingRight: 6,
  },
  compareCol: {
    flex: 1,
    color: '#1a202c',
    fontSize: 10,
    lineHeight: 1.4,
  },
  compareName: {
    fontWeight: 600,
    fontSize: 10,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  item: {
    padding: 10,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontWeight: 600,
    color: '#1a202c',
    flex: 1,
    fontSize: 12,
  },
  itemDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 6,
    flexShrink: 0,
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px dashed #e2e8f0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11,
  },
  label: {
    color: '#64748b',
  },
  value: {
    fontWeight: 700,
    color: '#1a202c',
  },
  itemActions: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    padding: '6px 8px',
    fontSize: 10,
    fontWeight: 600,
    background: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  actionBtnDanger: {
    padding: '6px 8px',
    fontSize: 10,
    fontWeight: 600,
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  compareCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    fontSize: 10,
    color: '#374151',
  },
  emptyState: {
    padding: '20px 12px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    background: '#f8fafc',
    borderRadius: 8,
  },
}
