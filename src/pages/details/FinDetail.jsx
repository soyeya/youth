import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatValue, formatDate } from '../../utils/formatUtils';

/* ── 공통 소형 컴포넌트 ── */

const Section = ({ title, children }) => (
  <div className="fin-section">
    <h4 className="fin-section-title">{title}</h4>
    <div className="fin-section-body">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="fin-info-row">
    <span className="fin-label">{label}</span>
    <span className="fin-value">{formatValue(value)}</span>
  </div>
);

const fmt = (v, suffix = '') =>
  v ? `${parseFloat(v).toFixed(2)}${suffix}` : null;

/* ── 메인 컴포넌트 ── */

const FinDetail = ({ productType, data, title, onClick, isWishlisted }) => {
  const navigate = useNavigate();

  const renderBack = () => (
    <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>
  );

  if (!data || !data.baseData) {
    return (
      <div className="detail fin-detail">
        {renderBack()}
        <div className="fin-empty">상품 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const { baseData: b, options } = data;

  /* 공시 기간 푸터 */
  const Period = () => (
    <div className="fin-period">
      공시 기간: {formatDate(b.start)} ~ {b.expire ? formatDate(b.expire) : '현재 공시 중'}
    </div>
  );

  /* 찜하기 버튼 */
  const Wishlist = () => (
    <div className={`fin-wishlist${isWishlisted ? ' active' : ''}`} onClick={onClick}>
      {isWishlisted ? '♥ 찜 해제하기' : '♡ 찜하기'}
    </div>
  );

  /* 헤더 (배지 + 은행명 + 상품명) */
  const Header = () => (
    <>
      <div className="fin-header">
        <span className="fin-badge">{productType}</span>
        <span className="fin-bank">{b.banknm}</span>
      </div>
      <h3 className="fin-title">{title}</h3>
    </>
  );

  /* ════════════════════════════════
     ① 정기예금 / 적금
     ════════════════════════════════ */
  if (productType === '정기예금' || productType === '적금') {
    const maxRate = options.reduce(
      (m, o) => Math.max(m, parseFloat(o.intr_rate2 || 0)), 0
    );

    return (
      <div className="detail fin-detail">
        {renderBack()}
        <Header />

        {/* 하이라이트: 최고 우대금리 */}
        {maxRate > 0 && (
          <div className="fin-highlight">
            <span className="fin-hl-label">최고 우대금리</span>
            <span className="fin-hl-rate saving">연 {maxRate.toFixed(2)}%</span>
            <span className="fin-hl-note">우대 조건 충족 시</span>
          </div>
        )}

        {/* 기간별 금리표 */}
        <Section title="기간별 금리">
          {options.length > 0 ? (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>저축 기간</th>
                    <th>금리 유형</th>
                    {productType === '적금' && <th>적립 유형</th>}
                    <th>기본 금리</th>
                    <th>최고 우대금리</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((o, i) => (
                    <tr key={i}>
                      <td>{o.save_trm ? `${o.save_trm}개월` : '정보없음'}</td>
                      <td>{formatValue(o.intr_rate_type_nm)}</td>
                      {productType === '적금' && <td>{formatValue(o.rsrv_type_nm)}</td>}
                      <td className="rate-cell">
                        {fmt(o.intr_rate, '%') || '정보없음'}
                      </td>
                      <td className="rate-cell best">
                        {fmt(o.intr_rate2, '%') || '정보없음'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fin-no-data">금리 정보를 불러올 수 없습니다.</p>
          )}
          {b.mtrtInt && (
            <div className="fin-sub-note">
              만기 후 이자율: <strong>{b.mtrtInt}</strong>
            </div>
          )}
        </Section>

        {/* 가입 조건 */}
        <Section title="가입 조건">
          <InfoRow label="가입 대상" value={b.joinMember} />
          <InfoRow label="가입 방법" value={b.joinWay} />
          <InfoRow label="가입 제한" value={b.joinDeny} />
          {b.maxLimit && <InfoRow label="최고 한도" value={b.maxLimit} />}
        </Section>

        {/* 우대 조건 */}
        {b.spcl && (
          <Section title="우대 조건">
            <p className="fin-long-text">{b.spcl}</p>
          </Section>
        )}

        {/* 기타 유의사항 */}
        {b.etcNote && (
          <Section title="기타 유의사항">
            <p className="fin-long-text">{b.etcNote}</p>
          </Section>
        )}

        <Period />
        <Wishlist />
      </div>
    );
  }

  /* ════════════════════════════════
     ② 주택담보대출 / 전세자금대출
     ════════════════════════════════ */
  if (productType === '주택담보대출' || productType === '전세자금대출') {
    const minRates = options
      .map((o) => parseFloat(o.lend_rate_min || 0))
      .filter((r) => r > 0);
    const lowestRate = minRates.length > 0 ? Math.min(...minRates) : null;

    return (
      <div className="detail fin-detail">
        {renderBack()}
        <Header />

        {/* 하이라이트: 최저 대출금리 */}
        {lowestRate && (
          <div className="fin-highlight loan">
            <span className="fin-hl-label">최저 대출금리</span>
            <span className="fin-hl-rate loan">연 {lowestRate.toFixed(2)}%~</span>
            <span className="fin-hl-note">조건에 따라 금리 상이</span>
          </div>
        )}

        {/* 대출 금리표 */}
        <Section title="대출 금리">
          {options.length > 0 ? (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    {productType === '주택담보대출' && <th>담보 유형</th>}
                    <th>상환 방식</th>
                    <th>금리 유형</th>
                    <th>최저</th>
                    <th>최고</th>
                    <th>평균</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((o, i) => (
                    <tr key={i}>
                      {productType === '주택담보대출' && (
                        <td>{formatValue(o.mrtg_type_nm)}</td>
                      )}
                      <td>{formatValue(o.rpay_type_nm)}</td>
                      <td>{formatValue(o.lend_rate_type_nm)}</td>
                      <td className="rate-cell">
                        {fmt(o.lend_rate_min, '%') || '정보없음'}
                      </td>
                      <td className="rate-cell">
                        {fmt(o.lend_rate_max, '%') || '정보없음'}
                      </td>
                      <td className="rate-cell avg">
                        {fmt(o.lend_rate_avg, '%') || '정보없음'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fin-no-data">금리 정보를 불러올 수 없습니다.</p>
          )}
          {b.dlyRate && (
            <div className="fin-sub-note warn">
              연체 이자율: <strong>{b.dlyRate}</strong>
              <em> (연체 시 적용되는 가산금리)</em>
            </div>
          )}
        </Section>

        {/* 대출 조건 */}
        <Section title="대출 조건">
          <InfoRow label="대출 한도" value={b.loanLmt} />
          <InfoRow label="가입 방법" value={b.joinWay} />
          <InfoRow label="가입 제한" value={b.joinDeny} />
          <InfoRow label="중도 상환 수수료" value={b.erlyFee} />
        </Section>

        {/* 부대 비용 */}
        {b.loanInciExpn && (
          <Section title="부대 비용">
            <p className="fin-long-text">{b.loanInciExpn}</p>
          </Section>
        )}

        {/* 우대 조건 */}
        {b.spcl && (
          <Section title="우대 조건">
            <p className="fin-long-text">{b.spcl}</p>
          </Section>
        )}

        <Period />
        <Wishlist />
      </div>
    );
  }

  /* ════════════════════════════════
     ③ 개인신용대출
     ════════════════════════════════ */
  if (productType === '개인신용대출') {
    const GRADE_LABELS = [
      '1등급', '2등급', '3등급', '4등급', '5등급',
      '6등급', '7등급', '8등급', '9등급', '10등급',
    ];
    const gradeClass = (g) =>
      g <= 3 ? 'grade-good' : g <= 6 ? 'grade-mid' : 'grade-low';

    return (
      <div className="detail fin-detail">
        {renderBack()}
        <Header />

        {/* 신용등급별 금리 */}
        <Section title="신용등급별 대출 금리">
          <p className="fin-grade-desc">
            내 신용등급에 해당하는 금리를 확인하세요.
            <br />
            <em>신용등급이 높을수록(1등급에 가까울수록) 낮은 금리가 적용됩니다.</em>
          </p>
          {options.length > 0 ? (
            options.map((opt, oi) => {
              const cells = [];
              for (let g = 1; g <= 10; g++) {
                const rate = opt[`crdt_grad_${g}`];
                if (rate) cells.push({ g, rate: parseFloat(rate) });
              }
              return (
                <div key={oi} className="fin-grade-group">
                  {opt.crdt_prdt_type_nm && (
                    <div className="fin-grade-type-label">
                      {opt.crdt_prdt_type_nm}
                      {opt.crdt_lend_rate_type_nm && ` · ${opt.crdt_lend_rate_type_nm}`}
                    </div>
                  )}
                  {cells.length > 0 ? (
                    <div className="fin-grade-grid">
                      {cells.map(({ g, rate }) => (
                        <div key={g} className={`fin-grade-cell ${gradeClass(g)}`}>
                          <span className="grade-label">{GRADE_LABELS[g - 1]}</span>
                          <span className="grade-rate">{rate.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="fin-no-data">등급별 금리 정보가 없습니다.</p>
                  )}
                  {opt.crdt_grad_avg && (
                    <div className="fin-sub-note">
                      평균 금리: <strong>{parseFloat(opt.crdt_grad_avg).toFixed(2)}%</strong>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="fin-no-data">금리 정보를 불러올 수 없습니다.</p>
          )}
          {b.dlyRate && (
            <div className="fin-sub-note warn">
              연체 이자율: <strong>{b.dlyRate}</strong>
              <em> (연체 시 적용되는 가산금리)</em>
            </div>
          )}
        </Section>

        {/* 대출 조건 */}
        <Section title="대출 조건">
          <InfoRow label="대출 한도" value={b.loanLmt} />
          <InfoRow label="가입 방법" value={b.joinWay} />
          <InfoRow label="가입 제한" value={b.joinDeny} />
          <InfoRow label="중도 상환 수수료" value={b.erlyFee} />
          {b.cbName && <InfoRow label="신용 조회 기관" value={b.cbName} />}
        </Section>

        {/* 우대 조건 */}
        {b.spcl && (
          <Section title="우대 조건">
            <p className="fin-long-text">{b.spcl}</p>
          </Section>
        )}

        <Period />
        <Wishlist />
      </div>
    );
  }

  /* ════════════════════════════════
     ④ 연금저축
     ════════════════════════════════ */
  if (productType === '연금저축') {
    // 연금저축은 옵션 조합이 많으므로 20개만 표시
    const displayOptions = options.slice(0, 20);

    return (
      <div className="detail fin-detail">
        {renderBack()}
        <Header />

        {/* 상품 유형 배지 */}
        {(b.pnsnKindNm || b.prdtTypeNm) && (
          <div className="fin-pension-badges">
            {b.pnsnKindNm && <span className="fin-badge-sub">{b.pnsnKindNm}</span>}
            {b.prdtTypeNm && <span className="fin-badge-sub">{b.prdtTypeNm}</span>}
          </div>
        )}

        {/* 예상 연금 수령 정보 */}
        <Section title="납입 조건별 예상 연금액">
          <p className="fin-grade-desc">
            납입 조건에 따른 예상 연금 수령액입니다. 실제 금액은 운용 실적에 따라 달라질 수 있습니다.
          </p>
          {displayOptions.length > 0 ? (
            <div className="fin-table-wrap">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>납입 기간</th>
                    <th>월 납입액</th>
                    <th>연금 수령 기간</th>
                    <th>연금 개시 나이</th>
                    <th>예상 월 수령액</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOptions.map((o, i) => (
                    <tr key={i}>
                      <td>{formatValue(o.paym_prd_nm)}</td>
                      <td>{formatValue(o.mon_paym_atm_nm)}</td>
                      <td>{formatValue(o.pnsn_recp_trm_nm)}</td>
                      <td>{o.pnsn_strt_age ? `${o.pnsn_strt_age}세` : '정보없음'}</td>
                      <td className="rate-cell">
                        {o.pnsn_recp_amt
                          ? `${parseInt(o.pnsn_recp_amt).toLocaleString()}원`
                          : '정보없음'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fin-no-data">예상 연금 정보를 불러올 수 없습니다.</p>
          )}
          {options.length > 20 && (
            <p className="fin-sub-note">
              외 {options.length - 20}개 조합 — 전체 조건은 해당 금융회사에 문의하세요.
            </p>
          )}
        </Section>

        {/* 가입 조건 */}
        <Section title="가입 조건">
          <InfoRow label="가입 방법" value={b.joinWay} />
          <InfoRow label="가입 제한" value={b.joinDeny} />
          {b.saleCo && <InfoRow label="판매사" value={b.saleCo} />}
        </Section>

        {/* 우대 조건 */}
        {b.spcl && (
          <Section title="우대 조건">
            <p className="fin-long-text">{b.spcl}</p>
          </Section>
        )}

        <Period />
        <Wishlist />
      </div>
    );
  }

  /* fallback */
  return (
    <div className="detail fin-detail">
      {renderBack()}
      <div className="fin-empty">지원하지 않는 상품 유형입니다.</div>
    </div>
  );
};

export default FinDetail;
