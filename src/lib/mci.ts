/**
 * WorkWorld Matrix City Index (MCI v7.0) Calculation Engine.
 * Direct implementation of the master formula (see /mci page for full spec).
 */

export interface MciMetrics {
  N: number;              // population
  G: number;              // GDP per capita (USD)
  F: number;              // active firms
  U: number;              // universities
  S: number;              // industrial zones
  T: number;              // tech parks / R&D centers
  P_search: number;       // 1-10
  M_loc: number;          // density
  H: number;              // 1-10
  T_flow: number;         // 1-10
  AI_index: number;       // 1-10
  ESG_score: number;      // 1-10
  Exp: number;            // exports (bn USD)
  Imp: number;            // imports (bn USD)
  Y_ratio: number;        // 18-40 active population ratio
  E_ratio: number;        // 65+ dependency ratio
  B_rate: number;         // fertility rate
  sigma: number;          // volatility (-0.10 .. +0.05)
  delta_pulse?: number;   // default 1.0
  net_syn?: number;       // default 1.0
}

export interface MciResult {
  cp_base: number;
  cp_final: number;
  seat_quota: number;
  I_trade: number;
  D_dyn: number;
}

export const CP_MAX = 600;
export const K_MIN = 3;
export const K_MAX = 65;

export function calculateMCI(m: MciMetrics): MciResult {
  const delta_pulse = m.delta_pulse ?? 1.0;
  const net_syn = m.net_syn ?? 1.0;

  const I_trade = ((m.Exp + m.Imp) / 10) * (m.Exp / (m.Imp || 1));

  let D_dyn = (m.Y_ratio / (m.E_ratio || 1)) * (m.B_rate / 2.1);
  D_dyn = Math.max(0.7, Math.min(1.3, D_dyn));

  const cp_base =
    10 * Math.log10(Math.max(m.N, 1)) +
    m.G / 1000 +
    m.F / 10000 +
    m.U * 1.5 +
    m.S +
    m.T * 3 +
    m.P_search * 2.5 +
    m.M_loc / 50 +
    m.H * 2 +
    m.T_flow * 1.5 +
    m.AI_index * 2 +
    m.ESG_score * 1.2 +
    I_trade;

  const cp_final = cp_base * (1 + m.sigma) * delta_pulse * net_syn * D_dyn;

  let K = K_MIN + Math.floor(62 * (cp_final / CP_MAX));
  if (cp_final > CP_MAX || K > K_MAX) K = K_MAX;
  if (K < K_MIN) K = K_MIN;

  return {
    cp_base: Number(cp_base.toFixed(2)),
    cp_final: Number(cp_final.toFixed(2)),
    seat_quota: K,
    I_trade: Number(I_trade.toFixed(2)),
    D_dyn: Number(D_dyn.toFixed(3)),
  };
}

/** Extract metrics from a mci_cities row. */
export function rowToMetrics(row: any): MciMetrics {
  return {
    N: Number(row.n_population),
    G: Number(row.g_gdp_per_capita),
    F: Number(row.f_firms),
    U: Number(row.u_universities),
    S: Number(row.s_industrial_zones),
    T: Number(row.t_tech_parks),
    P_search: Number(row.p_search),
    M_loc: Number(row.m_loc),
    H: Number(row.h_vc_access),
    T_flow: Number(row.t_flow),
    AI_index: Number(row.ai_index),
    ESG_score: Number(row.esg_score),
    Exp: Number(row.exp_billion_usd),
    Imp: Number(row.imp_billion_usd),
    Y_ratio: Number(row.y_ratio),
    E_ratio: Number(row.e_ratio),
    B_rate: Number(row.b_rate),
    sigma: Number(row.sigma),
    delta_pulse: Number(row.delta_pulse ?? 1),
    net_syn: Number(row.net_syn ?? 1),
  };
}

export const MCI_FIELD_DEFS: Array<{
  key: keyof MciMetrics;
  column: string;
  label: string;
  hint: string;
  step?: number;
  min?: number;
  max?: number;
}> = [
  { key: 'N', column: 'n_population', label: 'N — Nüfus', hint: 'Metropol toplam nüfusu', step: 1, min: 0 },
  { key: 'G', column: 'g_gdp_per_capita', label: 'G — Kişi başı GSYH (USD)', hint: 'Nominal USD', step: 100, min: 0 },
  { key: 'F', column: 'f_firms', label: 'F — Aktif firma sayısı', hint: 'Kayıtlı işletmeler', step: 1, min: 0 },
  { key: 'U', column: 'u_universities', label: 'U — Üniversite sayısı', hint: 'Aktif üniversiteler', step: 1, min: 0 },
  { key: 'S', column: 's_industrial_zones', label: 'S — OSB / sanayi merkezi', hint: 'Organize sanayi bölgeleri', step: 1, min: 0 },
  { key: 'T', column: 't_tech_parks', label: 'T — Teknokent / Ar-Ge merkezi', hint: 'Teknoparklar', step: 1, min: 0 },
  { key: 'P_search', column: 'p_search', label: 'P_search — Arama ivmesi (1-10)', hint: 'Google arama ivmesi', step: 0.1, min: 0, max: 10 },
  { key: 'M_loc', column: 'm_loc', label: 'M_loc — Harita yoğunluğu', hint: '10 km² başına lokasyon', step: 1, min: 0 },
  { key: 'H', column: 'h_vc_access', label: 'H — VC / hibe erişimi (1-10)', hint: 'Risk sermayesi erişim skoru', step: 0.1, min: 0, max: 10 },
  { key: 'T_flow', column: 't_flow', label: 'T_flow — Yetenek akışı (1-10)', hint: 'Beyin göçü / expat çekim gücü', step: 0.1, min: 0, max: 10 },
  { key: 'AI_index', column: 'ai_index', label: 'AI_index — Yapay zeka (1-10)', hint: 'Akıllı şehir + otomasyon', step: 0.1, min: 0, max: 10 },
  { key: 'ESG_score', column: 'esg_score', label: 'ESG — Sürdürülebilirlik (1-10)', hint: 'Ekolojik direnç skoru', step: 0.1, min: 0, max: 10 },
  { key: 'Exp', column: 'exp_billion_usd', label: 'Exp — İhracat (Milyar USD)', hint: 'Yıllık ihracat hacmi', step: 0.1, min: 0 },
  { key: 'Imp', column: 'imp_billion_usd', label: 'Imp — İthalat (Milyar USD)', hint: 'Yıllık ithalat hacmi', step: 0.1, min: 0.1 },
  { key: 'Y_ratio', column: 'y_ratio', label: 'Y_ratio — Genç nüfus oranı', hint: '18-40 yaş oranı', step: 0.01, min: 0, max: 1 },
  { key: 'E_ratio', column: 'e_ratio', label: 'E_ratio — Yaşlı bağımlılık', hint: '65+ oranı', step: 0.01, min: 0.01, max: 1 },
  { key: 'B_rate', column: 'b_rate', label: 'B_rate — Doğurganlık hızı', hint: 'Kadın başına, yenilenme 2.1', step: 0.1, min: 0 },
  { key: 'sigma', column: 'sigma', label: 'σ — Volatilite', hint: '-0.10 ile +0.05', step: 0.01, min: -0.1, max: 0.05 },
  { key: 'delta_pulse', column: 'delta_pulse', label: 'ΔPulse — Nabız çarpanı', hint: 'Varsayılan 1.0', step: 0.05, min: 0.1 },
  { key: 'net_syn', column: 'net_syn', label: 'Net_syn — Nodal sinerji', hint: 'Ağ efekti, varsayılan 1.0', step: 0.05, min: 0.1 },
];

export const MCI_FORMULA_CODE = `// WorkWorld MCI v7.0 — see /mci for full spec
export function calculateMCI(m) {
  const I_trade = ((m.Exp + m.Imp) / 10) * (m.Exp / (m.Imp || 1));
  let D_dyn = (m.Y_ratio / (m.E_ratio || 1)) * (m.B_rate / 2.1);
  D_dyn = Math.max(0.7, Math.min(1.3, D_dyn)); // clamp

  const CP_base =
    10 * Math.log10(m.N) + m.G/1000 + m.F/10000 +
    m.U*1.5 + m.S + m.T*3 +
    m.P_search*2.5 + m.M_loc/50 +
    m.H*2 + m.T_flow*1.5 +
    m.AI_index*2 + m.ESG_score*1.2 + I_trade;

  const CP_final = CP_base * (1 + m.sigma) * (m.delta_pulse ?? 1) * (m.net_syn ?? 1) * D_dyn;

  let K = 3 + Math.floor(62 * (CP_final / 600));
  if (CP_final > 600 || K > 65) K = 65;
  if (K < 3) K = 3;

  return { cityScore: +CP_final.toFixed(2), finalQuota: K };
}`;
