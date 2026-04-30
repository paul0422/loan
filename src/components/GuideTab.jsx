export default function GuideTab({ isMobile = false }) {
  const cardStyle = isMobile
    ? { ...S.card, borderRadius: 14, padding: '18px 16px' }
    : S.card

  return (
    <div style={S.wrap}>
      {/* 인트로 */}
      <section style={cardStyle}>
        <h2 style={S.h2}>📖 주담대 계산기 사용 가이드</h2>
        <p style={S.lead}>
          이 계산기는 주택을 구매할 때 받을 수 있는 <strong>최대 대출 금액</strong>과
          {' '}<strong>구매 시 들어가는 부대비용</strong>을 한눈에 보여줍니다.
          LTV/DSR 규제, 정책 혜택(생애최초·신혼부부·청년), 취득세·중개수수료까지
          최신 정책을 반영해 자동으로 계산해 드려요.
        </p>
      </section>

      {/* 대출 계산 사용법 */}
      <section style={cardStyle}>
        <h3 style={S.h3}>🏦 대출 계산 사용법</h3>
        <ol style={S.ol}>
          <li>
            <strong>개인 정보 입력</strong>
            <ul style={S.ul}>
              <li><b>연소득</b>: 세전 연봉 (단위: 백만원). 예: 6000만원 → <code>60</code></li>
              <li><b>기존 대출 월 상환액</b>: 매달 갚고 있는 다른 대출의 원리금 합계 (단위: 백만원).
                예: 월 150만원 → <code>1.5</code></li>
            </ul>
          </li>
          <li>
            <strong>주택 정보 입력</strong>
            <ul style={S.ul}>
              <li><b>매매가/KB시세/감정가</b> 중 가지고 있는 값을 입력합니다. 셋 중
                <strong> 가장 낮은 값이 담보가액</strong>으로 적용됩니다 (실제 은행 방식).</li>
              <li><b>지역</b>: 규제지역(투기과열·조정대상)인지 비규제지역인지 선택.</li>
              <li><b>주택 보유 수</b>: 본 주택 취득 후가 아닌 <strong>현재 보유 중</strong>인 주택 수.</li>
            </ul>
          </li>
          <li>
            <strong>정책 혜택 선택</strong>
            <ul style={S.ul}>
              <li><b>생애최초</b>: 본인·배우자 모두 생애 첫 주택구입이면 LTV 80% 적용.</li>
              <li><b>신혼부부 / 청년</b>: 해당 시 금리 우대 자동 반영.</li>
            </ul>
          </li>
          <li>
            <strong>대출 조건 입력</strong>
            <ul style={S.ul}>
              <li><b>기본 금리</b>: 은행 제시 금리 (소수점 입력 가능, 예: <code>4.5</code>).</li>
              <li><b>대출 기간</b>: 보통 30년이 일반적.</li>
            </ul>
          </li>
        </ol>
      </section>

      {/* 구매 비용 계산 사용법 */}
      <section style={cardStyle}>
        <h3 style={S.h3}>🧾 구매 비용 계산 사용법</h3>
        <p style={S.p}>
          매매가만 입력해도 <strong>취득세·농어촌특별세·지방교육세·중개수수료</strong>가
          한 번에 계산됩니다. 추가로:
        </p>
        <ul style={S.ul}>
          <li><b>주택 종류</b>: 아파트·빌라(주택 세율) vs 오피스텔(4% 단일 세율) 구분</li>
          <li><b>전용면적</b>: 85㎡ 이하 주택은 농어촌특별세 비과세</li>
          <li><b>생애최초 체크</b>: 12억 이하 주택일 때 취득세 200만원 자동 감면</li>
        </ul>
      </section>

      {/* 용어 설명 */}
      <section style={cardStyle}>
        <h3 style={S.h3}>📚 자주 쓰는 용어</h3>
        <dl style={S.dl}>
          <Term k="LTV (담보인정비율)">
            담보가액 대비 받을 수 있는 대출 비율. 비규제지역 무주택자 70%, 규제지역
            무주택자 50%, 생애최초는 80%. 예: 5억 담보가액 × LTV 70% = 최대 3.5억 대출.
          </Term>
          <Term k="DSR (총부채원리금상환비율)">
            연소득 대비 모든 대출의 연간 원리금 상환액 비율. 일반적으로
            <strong> 40% 이하</strong>로 규제. 기존 대출이 많으면 신규 대출 한도가 줄어듭니다.
          </Term>
          <Term k="담보가액">
            은행이 인정하는 주택의 가치. <strong>매매가/KB시세/감정가 중 가장 낮은 값</strong>을
            기준으로 합니다. KB시세는 KB부동산에서, 감정가는 감정평가사가 산정.
          </Term>
          <Term k="취득세">
            주택 구매 시 내는 지방세. 6억 이하 1%, 6~9억 누진(1~3%), 9억 초과 3%.
            다주택자는 8~12% 중과세율 적용.
          </Term>
          <Term k="농어촌특별세">
            취득세에 부가되는 세금(0.2%). 단, <strong>전용면적 85㎡ 이하의 주택은 비과세</strong>.
            오피스텔은 면적 무관 부과.
          </Term>
          <Term k="지방교육세">
            취득세의 10%만큼 추가로 부과되는 지방세.
          </Term>
          <Term k="원리금균등 상환">
            매달 같은 금액을 갚는 방식. 초반엔 이자 비중이 크고, 후반엔 원금 비중이 큽니다.
            본 계산기의 월 상환액은 원리금균등 기준입니다.
          </Term>
        </dl>
      </section>

      {/* FAQ */}
      <section style={cardStyle}>
        <h3 style={S.h3}>❓ 자주 묻는 질문</h3>
        <Faq q="결과가 실제 은행 한도와 다를 수 있나요?">
          네, 다를 수 있어요. 본 계산기는 LTV·DSR·금리 우대 등 <strong>주요 변수만 반영</strong>합니다.
          실제 은행은 신용점수, 소득증빙 방식, 부채 상세, 보증금 형태 등 추가 요소를 평가합니다.
          참고용으로만 활용하시고 정확한 한도는 은행 상담을 권장합니다.
        </Faq>
        <Faq q="저장한 즐겨찾기는 어디에 저장되나요?">
          현재 사용 중인 브라우저의 <code>localStorage</code>에 저장됩니다. 같은 브라우저에서만
          확인 가능하며, 시크릿 모드·브라우저 데이터 삭제 시 함께 사라집니다.
          서버로 전송되는 정보는 없으며, 모든 계산은 브라우저 내에서만 수행됩니다.
        </Faq>
        <Faq q="기존 대출 월 상환액에 어떤 걸 넣어야 하나요?">
          신용대출, 자동차할부, 학자금대출 등 <strong>매달 정기적으로 갚고 있는 모든 대출</strong>의
          원리금 합계를 입력하세요. 신용카드 할부는 보통 제외됩니다.
        </Faq>
        <Faq q="생애최초 적용 조건이 어떻게 되나요?">
          본인과 배우자가 <strong>생애 단 한 번도 주택을 소유한 적이 없어야</strong> 합니다.
          분양권·입주권도 주택 소유로 간주될 수 있으니 정확한 자격 여부는 금융기관 또는 HUG에
          확인하세요. 취득세 200만원 감면 적용 시 3년 실거주 의무가 있습니다.
        </Faq>
        <Faq q="규제지역인지 어떻게 알 수 있나요?">
          국토교통부 또는 LH의 <strong>"부동산 규제지역 지정 현황"</strong>에서 확인할 수 있습니다.
          서울 강남3구·용산 등 일부 지역만 규제지역으로 남아있고, 대부분 지역은 비규제지역입니다.
        </Faq>
        <Faq q="모바일에서 즐겨찾기는 어디에 있나요?">
          페이지 맨 아래 <strong>"⭐ 즐겨찾기"</strong> 헤더를 누르면 펼쳐집니다.
          저장하려면 매매가를 먼저 입력해야 활성화돼요.
        </Faq>
      </section>

      {/* 주의사항 */}
      <section style={cardStyle}>
        <h3 style={S.h3}>⚠️ 주의사항</h3>
        <ul style={S.ul}>
          <li>본 계산기는 <strong>참고용</strong>이며, 실제 대출 가능 금액과 차이가 있을 수 있습니다.</li>
          <li>세율·정책은 <strong>2025년 기준</strong>이며 향후 정책 변경 시 결과가 달라질 수 있습니다.</li>
          <li>법무사비·기타비용은 <strong>일반적인 예상치</strong>이며 실제 지출과 다를 수 있습니다.</li>
          <li>정확한 세액·대출 한도는 반드시 <strong>세무사·은행 상담</strong>을 통해 확인하세요.</li>
        </ul>
      </section>
    </div>
  )
}

function Term({ k, children }) {
  return (
    <>
      <dt style={S.dt}>{k}</dt>
      <dd style={S.dd}>{children}</dd>
    </>
  )
}

function Faq({ q, children }) {
  return (
    <details style={S.faqItem}>
      <summary style={S.faqQ}>{q}</summary>
      <div style={S.faqA}>{children}</div>
    </details>
  )
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 20,
    padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  h2: {
    fontSize: 20, fontWeight: 700, color: '#1a202c',
    marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #f1f5f9',
  },
  h3: {
    fontSize: 17, fontWeight: 700, color: '#1a202c',
    marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #f1f5f9',
  },
  lead: { fontSize: 14, lineHeight: 1.7, color: '#374151' },
  p:    { fontSize: 13, lineHeight: 1.7, color: '#374151', marginBottom: 8 },
  ol: { fontSize: 13, lineHeight: 1.8, color: '#374151', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  ul: { fontSize: 13, lineHeight: 1.8, color: '#374151', paddingLeft: 20, marginTop: 6 },
  dl: { fontSize: 13, lineHeight: 1.7 },
  dt: { fontWeight: 700, color: '#1d4ed8', marginTop: 12, marginBottom: 4 },
  dd: { color: '#374151', marginLeft: 0, marginBottom: 4 },
  faqItem: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '12px 14px', marginBottom: 8,
  },
  faqQ: {
    fontSize: 13, fontWeight: 600, color: '#1a202c',
    cursor: 'pointer', listStyle: 'none', userSelect: 'none',
  },
  faqA: { fontSize: 13, lineHeight: 1.7, color: '#475569', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #cbd5e1' },
}
