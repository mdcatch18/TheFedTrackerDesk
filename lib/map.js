// Maps the front-end model + macro-board rows to FRED series IDs.
// method: last | yoy | mom | chg   (sc = scale applied after)

// ── model object `m` overrides (drives liquidity, fed, curve, regime, rotation, posture) ──
export const M_MAP = {
  fedBS:   { id: "WALCL",       m: "last", sc: 1e-6 },  // millions → $T
  rrp:     { id: "RRPONTSYD",   m: "last", sc: 1e-3 },  // $B → $T
  tga:     { id: "WTREGEN",     m: "last", sc: 1e-3 },  // $B → $T
  reserves:{ id: "WRESBAL",     m: "last", sc: 1e-3 },  // $B → $T
  funds:   { id: "DFF",         m: "last" },
  y3m:     { id: "DGS3MO",      m: "last" },
  y2:      { id: "DGS2",        m: "last" },
  y10:     { id: "DGS10",       m: "last" },
  y30:     { id: "DGS30",       m: "last" },
  real10:  { id: "DFII10",      m: "last" },
  hyOAS:   { id: "BAMLH0A0HYM2",m: "last", sc: 100 },   // % → bp
  igOAS:   { id: "BAMLC0A0CM",  m: "last", sc: 100 },
  bbbOAS:  { id: "BAMLC0A4CBBB",m: "last", sc: 100 },
  corePCE: { id: "PCEPILFE",    m: "yoy" },
  unemp:   { id: "UNRATE",      m: "last" },
  gdpnow:  { id: "GDPNOW",      m: "last" },
  oil:     { id: "DCOILWTICO",  m: "last" },
  // ISM is proprietary + delisted from FRED — left to the seeded value.
};

// ── macro-board rows (label must match MACRO labels in the component exactly) ──
export const BOARD_MAP = {
  "Real GDP q/q":     { id: "A191RL1Q225SBEA", m: "last" },
  "Atlanta GDPNow":   { id: "GDPNOW", m: "last" },
  "Industrial Prod":  { id: "INDPRO", m: "yoy" },
  "Retail Sales m/m": { id: "RSAFS", m: "mom" },
  "Durable Goods":    { id: "DGORDER", m: "mom" },
  "Capacity Util":    { id: "TCU", m: "last" },
  "Chicago Fed NAI":  { id: "CFNAI", m: "last" },
  "Nonfarm Payrolls": { id: "PAYEMS", m: "chg" },        // Δ thousands
  "Unemployment":     { id: "UNRATE", m: "last" },
  "U-6 Underemploy":  { id: "U6RATE", m: "last" },
  "JOLTS Openings":   { id: "JTSJOL", m: "last", sc: 1e-3 }, // k → M
  "Initial Claims":   { id: "ICSA", m: "last", sc: 1e-3 },   // → k
  "Continuing Claims":{ id: "CCSA", m: "last", sc: 1e-6 },   // → M
  "Avg Hourly Earn":  { id: "CES0500000003", m: "yoy" },
  "Quits Rate":       { id: "JTSQUR", m: "last" },
  "Participation":    { id: "CIVPART", m: "last" },
  "CPI y/y":          { id: "CPIAUCSL", m: "yoy" },
  "Core CPI":         { id: "CPILFESL", m: "yoy" },
  "PCE y/y":          { id: "PCEPI", m: "yoy" },
  "Core PCE":         { id: "PCEPILFE", m: "yoy" },
  "PPI y/y":          { id: "PPIACO", m: "yoy" },
  "5y5y Breakeven":   { id: "T5YIFR", m: "last" },
  "UMich 1y Exp":     { id: "MICH", m: "last" },
  "Housing Starts":   { id: "HOUST", m: "last", sc: 1e-3 },  // k → M
  "Building Permits": { id: "PERMIT", m: "last", sc: 1e-3 },
  "Existing Sales":   { id: "EXHOSLUSM495S", m: "last", sc: 1e-6 },
  "New Home Sales":   { id: "HSN1F", m: "last" },
  "Case-Shiller y/y": { id: "CSUSHPINSA", m: "yoy" },
  "30y Mortgage":     { id: "MORTGAGE30US", m: "last" },
  "UMich Sentiment":  { id: "UMCSENT", m: "last" },
  "Savings Rate":     { id: "PSAVERT", m: "last" },
  "M2 y/y":           { id: "M2SL", m: "yoy" },
  "Bank Reserves":    { id: "WRESBAL", m: "last", sc: 1e-3 },
  "Fed Balance Sheet":{ id: "WALCL", m: "last", sc: 1e-6 },
};
