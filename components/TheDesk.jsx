"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";

/* ═══════════════  TOKENS  ═══════════════ */
const C = {
  bg0:"#0a0d12", bg1:"#0f1319", bg2:"#151b25", raised:"#1b2330",
  line:"#232d3d", lineSoft:"#1a2230",
  txt:"#c9d3e0", dim:"#75839a", faint:"#4a566b",
  amber:"#e0a234", cyan:"#48b5c9", teal:"#3fbf93",
  red:"#e0605a", violet:"#9a8be0", blue:"#5b8def", pink:"#e07aa8",
};
const MONO="ui-monospace,'SF Mono',Menlo,monospace";
const SANS="Inter,system-ui,-apple-system,sans-serif";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=(v,d=2)=>v==null?"—":Number(v).toFixed(d);
const SIG={r:C.red,g:C.teal,a:C.amber,n:C.dim,v:C.violet};
const TYC={ern:C.blue,dat:C.cyan,pol:C.amber,evt:C.violet,geo:C.red,reg:C.pink};
const TYL={ern:"earnings",dat:"data",pol:"policy",evt:"event",geo:"geo",reg:"regulatory"};
const RKC={h:C.red,m:C.amber,l:C.teal};
const ARR={u:["▲",C.teal],d:["▼",C.red],f:["▪",C.dim],a:["▪",C.amber],n:["▪",C.dim],g:["▲",C.teal]};

/* ═══════════════  DATA  ═══════════════ */
const LIQ_SERIES=Array.from({length:27},(_,i)=>({w:`w${i}`,net:+(5.95-i*0.011+Math.sin(i/2.3)*0.03).toFixed(3)}));
const G4_SERIES=Array.from({length:27},(_,i)=>({w:`w${i}`,g4:+(24.8-i*0.03+Math.sin(i/3)*0.08).toFixed(2)}));
const CBS=[["Federal Reserve","$6.62T","QT −$25B/mo","d"],["ECB","€6.41T","APP runoff","d"],["Bank of Japan","¥731T","tapering JGB","d"],["PBoC","$6.18T","targeted RRR cuts","u"]];
const PLUMB=[["SOFR","4.88%","f"],["EFFR","3.62%","f"],["SOFR−EFFR","+126bp","u"],["RRP balance","$0.15T","d"],["MMF assets","$6.94T","u"],["FRA-OIS","24bp","f"],["Discount window","$3.1B","f"],["Bank deposits y/y","+1.8%","u"]];
const FLOWS=[["Technology","XLK",-1.9],["Financials","XLF",2.4],["Health Care","XLV",1.1],["Energy","XLE",3.2],["Industrials","XLI",0.6],["Utilities","XLU",1.8],["Discretionary","XLY",-2.7],["Materials","XLB",0.9],["Staples","XLP",1.4],["Real Estate","XLRE",-0.8]];
const FFLOWS=[["Large Value","IWD",1.8],["Large Growth","IWF",-2.2],["Momentum","MTUM",-1.1],["Low Vol","USMV",2.6],["Small Caps","IWM",-1.4],["Quality","QUAL",0.9],["Dividend","SCHD",1.5],["High Beta","SPHB",-2.0]];
const CURVE=m=>[{t:"3m",y:m.y3m},{t:"2y",y:m.y2},{t:"5y",y:(m.y2+m.y10)/2+0.05},{t:"10y",y:m.y10},{t:"30y",y:m.y30}];
const SOFR_STRIP=[["Sep '26",3.63],["Oct '26",3.66],["Dec '26",3.71],["Jan '27",3.68],["Mar '27",3.58],["Jun '27",3.44],["Dec '27",3.30]];
const FOMC=[["Warsh","Chair","hawk"],["Jefferson","Vice Chair","dove"],["Bowman","Vice Chair · Sup","hawk"],["Powell","Gov","neutral"],["Waller","Gov","neutral"],["Miran","Gov","dove"],["Cook","Gov","dove"],["Williams","NY","neutral"],["Barkin","Richmond","hawk"],["Daly","SF","dove"],["Goolsbee","Chicago","dove"],["Logan","Dallas","hawk"],["Musalem","St.Louis","hawk"]];
const REVISIONS=[{s:"Energy",v:62},{s:"Financials",v:41},{s:"Health Care",v:28},{s:"Industrials",v:12},{s:"Utilities",v:8},{s:"Materials",v:-4},{s:"Staples",v:-9},{s:"Technology",v:-14},{s:"Discretionary",v:-31}];
const EARN_CAL=[["Sep 02","Semi bellwether","AIQ","+18% EPS","watch"],["Sep 04","Defense prime","ITA","backlog","up"],["Sep 09","Money-center bank","XLF","NII, credit","up"],["Sep 11","Large-cap biotech","BBP","Ph3 guide","watch"],["Sep 16","Industrial gas","XME","vol/price","flat"],["Sep 18","Grid / power","GRID","orders","up"]];
const GUIDANCE=[["Raised","Sep",18,C.teal],["Cut",null,11,C.red],["In-line",null,26,C.dim]];
const PREANN=[["Defense prime","ITA","positive","backlog raise"],["Regional bank","KRE","negative","CRE reserve build"],["Semi cap","AIQ","positive","AI demand pull-in"],["Discount retail","XLP","negative","traffic soft"]];
const AGG_EPS={growth:6.8,fwd:268,margin:12.3,beat:74,marginTrend:[11.4,11.6,11.9,12.0,12.1,12.3]};
const BIO={pdufa:[["ONC-338","2L solid tumor","PDUFA","Sep 12","med"],["CNS-114","early Alzheimer's","AdCom","Sep 24","high"],["IMM-90","lupus nephritis","PDUFA","Oct 03","low"],["RARE-7","Duchenne MD","PDUFA","Oct 18","med"]],
readouts:[["CV-221","obesity oral GLP-1","Ph2b","Sep","wt-loss vs inject"],["ONC-401","1L NSCLC ADC","Ph3","Sep","OS interim"],["GENE-05","hemophilia B","Ph3","Oct","durability 24mo"]]};

const DOT_BUCKETS=[2.875,3.125,3.375,3.625,3.875,4.125,4.375];
const DOTS={"2026":{3.625:2,3.875:8,4.125:6,4.375:3},"2027":{3.125:3,3.375:4,3.625:6,3.875:4,4.125:2},"2028":{2.875:4,3.125:7,3.375:5,3.625:3},"LR":{2.875:6,3.125:9,3.375:4}};
const DOT_MEDIAN={"2026":3.875,"2027":3.625,"2028":3.125,"LR":3.125};
const DOT_MARKET={"2026":3.625,"2027":3.375,"2028":3.125,"LR":3.00};

const SURP={"ISM Manufacturing":"d","Nonfarm Payrolls":"d","Core PCE":"u","Sticky CPI":"u","JOLTS Openings":"d","Initial Claims":"u","Retail Sales m/m":"d","NAHB Index":"d","Conf Board LEI":"d","UMich Sentiment":"d","Durable Goods":"d","Atlanta GDPNow":"d","30y Mortgage":"u","Lev Loan Default":"u"};
const MACRO={
"Growth":[["Real GDP q/q",1.4,"%","a"],["Atlanta GDPNow",1.1,"%","a"],["ISM Manufacturing",49.5,"","r"],["ISM Services",51.2,"","n"],["S&P Global PMI",50.8,"","n"],["Industrial Prod",-0.2,"%","r"],["Retail Sales m/m",0.1,"%","a"],["Durable Goods",-0.4,"%","r"],["Capacity Util",77.8,"%","n"],["Conf Board LEI",-0.3,"%","r"],["Chicago Fed NAI",-0.15,"","a"]],
"Labor":[["Nonfarm Payrolls",95,"k","a"],["Unemployment",4.3,"%","n"],["U-6 Underemploy",8.1,"%","a"],["JOLTS Openings",7.2,"M","a"],["Initial Claims",238,"k","n"],["Continuing Claims",1.94,"M","a"],["Avg Hourly Earn",3.6,"%","n"],["Quits Rate",1.9,"%","a"],["Participation",62.5,"%","n"],["Sahm Rule",0.43,"","a"]],
"Inflation":[["CPI y/y",3.1,"%","a"],["Core CPI",3.3,"%","a"],["PCE y/y",3.0,"%","a"],["Core PCE",3.4,"%","r"],["PPI y/y",2.8,"%","n"],["Import Prices",1.9,"%","n"],["5y5y Breakeven",2.42,"%","n"],["UMich 1y Exp",3.4,"%","a"],["Trimmed Mean PCE",3.2,"%","a"],["Sticky CPI",4.0,"%","r"]],
"Housing":[["Housing Starts",1.31,"M","n"],["Building Permits",1.40,"M","n"],["NAHB Index",39,"","r"],["Existing Sales",3.9,"M","a"],["New Home Sales",665,"k","n"],["Case-Shiller y/y",3.1,"%","n"],["30y Mortgage",6.8,"%","a"],["MBA Purchase Apps",-2.1,"%","r"]],
"Consumer":[["Conf Board Conf",98.4,"","a"],["UMich Sentiment",66.2,"","a"],["Personal Income",0.3,"%","n"],["Personal Spending",0.2,"%","a"],["Savings Rate",4.4,"%","n"],["CC Delinquency",3.2,"%","a"],["Real Disp Income",0.1,"%","a"],["Retail Inventories",0.4,"%","n"]],
"Money & Credit":[["M2 y/y",2.8,"%","n"],["Bank Reserves",3.10,"T","n"],["C&I Loans y/y",0.9,"%","a"],["SLOOS Tightening",14,"%","a"],["HY Default Rate",3.1,"%","a"],["Lev Loan Default",4.2,"%","r"],["IG Issuance",42,"$B","n"],["Fed Balance Sheet",6.62,"T","n"]],
};
const RECESS=[["NY Fed (curve, 12m)",38,"a"],["Sahm Rule",0.43,"a"],["Yield-curve (3m10y)",22,"n"],["Conf Board LEI 6m diffusion",45,"r"],["Credit-spread model",19,"n"]];
const NOWCAST=[["Weekly Economic Index",1.6,"% ann"],["Atlanta GDPNow Q3",1.1,"% ann"],["NY Fed Nowcast Q3",1.4,"% ann"],["Citi Surprise Index",-14,"idx"]];

const THEMES={
"Core Sectors (GICS)":[["Tech","XLK",-4],["Financials","XLF",8],["Health","XLV",3],["Discretionary","XLY",-7],["Staples","XLP",2],["Energy","XLE",14],["Industrials","XLI",5],["Materials","XLB",1],["Utilities","XLU",6],["Real Estate","XLRE",-5],["Comm Svcs","XLC",-2]],
"Tech & Innovation":[["AI","AIQ",9],["Semis","SMH",6],["Cybersecurity","CIBR",11],["Cloud","SKYY",-3],["Software","IGV",-6],["Robotics","BOTZ",4],["Fintech","FINX",-8],["Internet","FDN",-5],["Blockchain","BLOK",22],["Quantum","QTUM",13]],
"Energy · Materials · Real Assets":[["Clean Energy","ICLN",-11],["Solar","TAN",-15],["Uranium","URA",19],["Grid","GRID",12],["Battery","LIT",-4],["Oil E&P","XOP",16],["MLP","AMLP",9],["Gold","GLD",21],["Gold Miners","GDX",34],["Silver","SLV",18],["Copper Miners","COPX",7],["Rare Earth","REMX",-2],["Water","PHO",3],["Agriculture","DBA",-6],["Infrastructure","IFRA",8]],
"Health & Bio":[["Biotech","BBP",5],["Genomics","ARKG",-9],["Med Device","IHI",4],["Pharma","PPH",6]],
"Financials & Property":[["Regional Banks","KRE",10],["Insurance","KIE",7],["REITs","VNQ",-5],["Mortgage REIT","REM",-8],["Homebuilders","XHB",-3]],
"Geographic":[["China","MCHI",8],["China Tech","KWEB",12],["Japan","EWJ",-4],["India","INDA",6],["Europe","VGK",3],["EM ex-China","EMXC",5],["LatAm","ILF",11],["Brazil","EWZ",14],["Korea","EWY",-6],["Frontier","FM",2]],
"Factor & Style":[["Momentum","MTUM",-3],["Quality","QUAL",1],["Low Vol","USMV",4],["Small Value","IWN",-2],["Small Growth","IWO",-9],["Large Value","IWD",6],["Large Growth","IWF",-5],["Dividend","SCHD",5],["High Beta","SPHB",-11],["Equal Weight","RSP",2]],
"Alternatives & Crypto":[["Bitcoin","IBIT",28],["Ether","ETHA",15],["Crypto Eq","BLOK",22],["Cannabis","MSOS",-24],["Commodities","DBC",9],["Space","ARKX",7],["Defense","ITA",13],["Volatility","VIXY",-18]],
};
const MOM={}; Object.values(THEMES).flat().forEach(x=>{MOM[x[1]]=x[2];});
const GVAL={"Core Sectors":[18.5,0.3],"Tech & Innovation":[27.4,1.4],"Health & Bio":[16.1,-0.4],"Energy · Materials · Real Assets":[12.2,-0.8],"Financials & Property":[13.0,-0.2],"Geographic":[12.4,-0.6],"Factor & Style":[17.2,0.1],"Alternatives & Crypto":[0,0]};
const GBETA={"Core Sectors":{mkt:1.0,rate:-0.2,oil:0.1,growth:0.4},"Tech & Innovation":{mkt:1.3,rate:-0.9,oil:-0.2,growth:1.1},"Health & Bio":{mkt:0.8,rate:-0.4,oil:-0.1,growth:-0.2},"Energy · Materials · Real Assets":{mkt:1.1,rate:0.2,oil:0.9,growth:0.6},"Financials & Property":{mkt:1.1,rate:0.6,oil:0.0,growth:0.5},"Geographic":{mkt:1.0,rate:-0.5,oil:0.2,growth:0.5},"Factor & Style":{mkt:0.9,rate:-0.1,oil:0.0,growth:0.2},"Alternatives & Crypto":{mkt:1.4,rate:-0.6,oil:0.3,growth:0.7}};

const U=[
["XLK","Technology","Core Sectors",C.blue,"AI capex + mega-cap earnings vs. rate-sensitive multiples.",[["Mega-cap Q3 earnings","Oct 28","ern","m"],["Semi book-to-bill","Sep 30","dat","l"]],"10y >4.6% or cloud capex guide-down","Real 10y <1.6% + upward revisions"],
["XLF","Financials","Core Sectors",C.blue,"NII + credit costs + curve steepening; deregulation optionality.",[["Big-bank Q3 earnings","Oct 14","ern","m"],["SLOOS survey","Nov 03","dat","l"]],"HY OAS >350 or curve re-inverts","2s10s >+50 with rising loan growth"],
["XLV","Health Care","Core Sectors",C.blue,"Defensive ballast; drug-pricing + election-policy overhang.",[["Election pricing rhetoric","Nov 03","pol","m"],["Pharma Q3","Oct 21","ern","l"]],"Election sweep → pricing reform","Risk-off rotation into defensives"],
["XLY","Consumer Discretionary","Core Sectors",C.blue,"Consumer resilience vs. rising delinquencies; rate-cut leverage.",[["Retail sales","Sep 16","dat","m"],["Holiday guidance","Nov 20","evt","m"]],"CC delinquency >3.5% or claims spike","Dovish pivot + positive real wages"],
["XLP","Consumer Staples","Core Sectors",C.blue,"Defensive; pricing power fading as disinflation squeezes margins.",[["Q3 volume/price","Oct 21","ern","l"]],"Trim on confirmed risk-on","Regime shifts to recession quadrant"],
["XLE","Energy","Core Sectors",C.blue,"Oil-beta + geopolitical premium + buyback yield.",[["OPEC+ meeting","Oct 05","evt","h"],["Q3 earnings","Oct 30","ern","m"]],"WTI <$70 on demand destruction","WTI >$85 + deepening backwardation"],
["XLI","Industrials","Core Sectors",C.blue,"Capex + reshoring + defense; PMI-sensitive.",[["ISM Manufacturing","Sep 02","dat","m"],["Q3 earnings","Oct 22","ern","m"]],"ISM <47 or new orders roll over","ISM >50 + PMI new orders rising"],
["XLB","Materials","Core Sectors",C.blue,"China stimulus + electrification metals vs. global growth drag.",[["China PMI","Sep 30","dat","m"],["China stimulus","Q4","pol","m"]],"China credit impulse negative","Copper breakout + China reflation"],
["XLU","Utilities","Core Sectors",C.blue,"Rate-sensitive bond proxy + datacenter power-demand kicker.",[["Rate path","ongoing","dat","m"],["Power PPA deals","Q4","evt","l"]],"10y >4.6% (duration hit)","Cuts priced + risk-off bid"],
["XLRE","Real Estate","Core Sectors",C.blue,"Duration-heavy; office CMBS stress vs. cut hopes.",[["CMBS delinquency","monthly","dat","h"],["Rate path","ongoing","dat","h"]],"10y >4.6% or office delinq >12%","Cut cycle confirmed"],
["XLC","Communication Services","Core Sectors",C.blue,"Ad-spend cyclicality + mega-cap concentration.",[["Q3 ad revenue","Oct 28","ern","m"]],"Ad-spend guide-down","Growth holds + falling rates"],
["SMH","Semiconductors","Tech & Innovation",C.cyan,"AI + memory upcycle; China export-control tail risk.",[["Semi bellwether earnings","Sep 02","ern","h"],["Export-control review","Q4","pol","h"],["Memory pricing","monthly","dat","m"]],"New China curbs or bookings miss","Book-to-bill >1.1 + memory prices rising"],
["AIQ","Artificial Intelligence","Tech & Innovation",C.cyan,"Hyperscaler capex supercycle vs. monetization doubts.",[["Hyperscaler capex guides","Oct 29","evt","m"]],"Capex plateau signal","Capex re-accel + power buildout"],
["CIBR","Cybersecurity","Tech & Innovation",C.cyan,"Structural spend; breach-driven, recession-resilient.",[["Q3 billings","Nov 18","ern","l"]],"IT-budget freeze signals","Breach cycle + billings beat"],
["IGV","Software / Cloud","Tech & Innovation",C.cyan,"Duration-like multiples; net-retention the swing factor.",[["Cloud growth rates","Oct 28","ern","m"]],"Net-retention <105% or rate spike","Reaccel + rate relief"],
["BOTZ","Robotics & Automation","Tech & Innovation",C.cyan,"Labor-cost offset + reshoring capex.",[["Automation orders","Q4","dat","l"]],"Capex freeze","Reshoring acceleration"],
["FINX","Fintech","Tech & Innovation",C.cyan,"Rate-sensitive; payment volumes track the consumer.",[["Payment volumes","Oct","dat","m"]],"Consumer-credit stress","Cuts + volume growth"],
["BLOK","Blockchain Equities","Tech & Innovation",C.cyan,"Crypto-beta proxy; regulatory-clarity catalyst.",[["Crypto ETF flows","ongoing","dat","h"],["Reg framework","Q4","pol","m"]],"Crypto drawdown >25%","BTC breakout + reg clarity"],
["BBP","Biotech","Health & Bio",C.violet,"Idiosyncratic catalyst book; M&A + rate-cut sensitivity are the swings.",[["ONC-338 PDUFA","Sep 12","reg","m"],["CNS-114 AdCom","Sep 24","reg","h"],["IMM-90 PDUFA","Oct 03","reg","l"]],"Rate spike (long-duration) or FDA CRL cluster","Cut cycle + M&A premium expansion"],
["ARKG","Genomics","Health & Bio",C.violet,"Long-duration; cash-burn sensitive to rates.",[["Ph2/3 readouts","Q4","reg","h"]],"Rate spike / funding freeze","Cut cycle + readout wins"],
["PPH","Pharma","Health & Bio",C.violet,"Defensive cash flows; patent cliffs + pricing policy.",[["Q3 earnings","Oct 21","ern","l"],["Election pricing","Nov 03","pol","m"]],"Pricing-reform sweep","Defensive rotation bid"],
["IHI","Medical Devices","Health & Bio",C.violet,"Procedure-volume recovery; stable demand.",[["Q3 procedure volumes","Oct 25","ern","l"]],"Hospital capex cuts","Volume acceleration"],
["XOP","Oil & Gas E&P","Energy · Materials · Real Assets",C.teal,"High oil-beta; breakeven discipline + buybacks.",[["OPEC+ meeting","Oct 05","evt","h"],["Rig count","weekly","dat","l"]],"WTI <$70","WTI >$85 + capex discipline"],
["URA","Uranium & Nuclear","Energy · Materials · Real Assets",C.teal,"Structural supply deficit + datacenter/SMR demand.",[["Utility contracting","Q4","evt","m"],["SMR approvals","ongoing","reg","l"]],"Spot U3O8 rollover","Contracting cycle + SMR news"],
["TAN","Solar","Energy · Materials · Real Assets",C.teal,"Policy-sensitive; rate + tariff headwinds.",[["ITC / policy review","Nov 03","pol","h"],["Tariff decisions","Q4","pol","m"]],"Subsidy-rollback risk","Rate cuts + demand recovery"],
["GRID","Grid & Electrification","Energy · Materials · Real Assets",C.teal,"Datacenter load + grid capex; cleanest secular story.",[["Orders backlog","Oct 20","ern","l"],["Utility capex plans","Q4","evt","l"]],"Utility capex deferral","Backlog acceleration"],
["LIT","Battery & Lithium","Energy · Materials · Real Assets",C.teal,"EV demand vs. lithium oversupply glut.",[["Lithium spot","monthly","dat","m"],["EV sales","monthly","dat","m"]],"Lithium glut deepens","Supply cuts + EV reaccel"],
["GDX","Gold Miners","Energy · Materials · Real Assets",C.teal,"Real-rate + geopolitical hedge; margin leverage to gold.",[["Real yields","ongoing","dat","m"],["CB gold buying","Q4","dat","l"]],"Real 10y spikes >2.2%","Real yields fall + geo premium"],
["COPX","Copper Miners","Energy · Materials · Real Assets",C.teal,"Electrification demand vs. China growth.",[["China PMI","Sep 30","dat","m"]],"China hard-landing signal","Supply deficit + China reflation"],
["REMX","Rare Earth & Strategic","Energy · Materials · Real Assets",C.teal,"Supply-chain security + China export leverage.",[["China export policy","Q4","pol","h"]],"China floods supply","Export curbs + friend-shoring"],
["DBA","Agriculture","Energy · Materials · Real Assets",C.teal,"Weather + geopolitics; food-inflation hedge.",[["USDA WASDE","Sep 12","dat","m"],["Black Sea corridor","ongoing","geo","m"]],"Bumper harvest","Drought / corridor disruption"],
["IFRA","Infrastructure","Energy · Materials · Real Assets",C.teal,"Fiscal spend + reshoring; real-asset inflation hedge.",[["Fiscal outlays","Q4","pol","l"]],"Fiscal gridlock","Spending acceleration"],
["PHO","Water","Energy · Materials · Real Assets",C.teal,"Defensive real-asset; utility-like stability.",[["Utility rate cases","Q4","reg","l"]],"Rate spike","Defensive rotation bid"],
["KRE","Regional Banks","Financials & Property",C.amber,"CRE exposure + NIM; deposit-cost relief on cuts.",[["Q3 earnings","Oct 16","ern","h"],["CRE marks","Q4","dat","h"]],"CRE loss cluster or deposit flight","Cut cycle + curve steepening"],
["KIE","Insurance","Financials & Property",C.amber,"Higher-for-longer boosts float income; cat-loss risk.",[["Cat-loss season","ongoing","evt","m"]],"Major catastrophe event","Rates stay high + benign losses"],
["XHB","Homebuilders","Financials & Property",C.amber,"Mortgage-rate sensitive; supply-constrained demand.",[["Mortgage rates","weekly","dat","h"],["Housing starts","Sep 17","dat","m"]],"30y mortgage >7.25%","Rate cuts → affordability relief"],
["VNQ","REITs","Financials & Property",C.amber,"Duration-heavy; wide dispersion (data-center vs office).",[["Rate path","ongoing","dat","h"]],"10y >4.6%","Cut cycle confirmed"],
["MCHI","China","Geographic",C.red,"Stimulus-dependent; property drag + geopolitical discount.",[["China stimulus","Q4","pol","h"],["Property data","monthly","dat","h"]],"Stimulus disappoints / property deepens","Big-bazooka stimulus"],
["KWEB","China Tech","Geographic",C.red,"Regulatory thaw + buybacks vs. delisting/geo risk.",[["ADR/delisting review","Q4","pol","h"]],"Delisting escalation","Stimulus + regulatory thaw"],
["EWJ","Japan","Geographic",C.red,"BoJ normalization + yen; governance-reform tailwind.",[["BoJ meeting","Oct 30","evt","h"],["Yen level","ongoing","dat","h"]],"Disorderly yen / carry unwind","Gradual normalization + reform"],
["INDA","India","Geographic",C.red,"Structural growth; valuation-rich; reform momentum.",[["RBI policy","Oct 08","evt","m"]],"Valuation air-pocket","Earnings delivery + inflows"],
["VGK","Europe","Geographic",C.red,"ECB cuts + cheap valuations vs. growth stagnation.",[["ECB meeting","Oct 16","evt","m"]],"Energy shock / recession","ECB easing + fiscal impulse"],
["EMXC","EM ex-China","Geographic",C.red,"Dollar-path dependent; disinflation abroad the offset.",[["Dollar path","ongoing","dat","h"],["EM CB decisions","Q4","evt","m"]],"Dollar surge / hawkish Fed","Weak dollar + EM cut cycle"],
["EWZ","Brazil / LatAm","Geographic",C.red,"High-carry; commodity + rate-cut leverage.",[["Copom decision","Nov 05","evt","m"]],"Fiscal slippage / commodity drop","Cut cycle + commodity strength"],
["MTUM","Momentum","Factor & Style",C.dim,"Trend persistence; crowded-unwind risk at reversals.",[["Semi-annual rebalance","Nov 30","evt","m"]],"Sharp factor reversal","Trend continuation confirmed"],
["QUAL","Quality","Factor & Style",C.dim,"Balance-sheet strength; late-cycle outperformer.",[["Earnings quality","Q3","ern","l"]],"Core hold — rarely cut","Late-cycle / risk-off tilt"],
["USMV","Low Volatility","Factor & Style",C.dim,"Defensive equity; outperforms in drawdowns.",[["Vol regime","ongoing","dat","l"]],"Melt-up leaves it behind","VIX >25 regime"],
["IWD","Value","Factor & Style",C.dim,"Rate + curve leverage; cheap vs. growth.",[["Curve shape","ongoing","dat","m"]],"Growth-scare rotation to duration","Steepening + reflation"],
["IWF","Growth","Factor & Style",C.dim,"Long-duration; rate-sensitive; AI-concentrated.",[["Rate path","ongoing","dat","m"]],"Real yields spike","Rate relief + secular growth"],
["SCHD","Dividend","Factor & Style",C.dim,"Income + quality; bond-competitive yield.",[["Rate path","ongoing","dat","l"]],"Yields >5% (bond competition)","Cut cycle → yield bid"],
["IWM","Small Caps","Factor & Style",C.dim,"Rate + domestic-growth leverage; refinancing wall.",[["Refinancing costs","ongoing","dat","h"],["ISM","Sep 02","dat","m"]],"Credit tightening / recession","Cut cycle + soft landing"],
["IBIT","Bitcoin","Alternatives & Crypto",C.pink,"Liquidity-beta + halving cycle; ETF-flow driven.",[["ETF net flows","daily","dat","h"],["Reg framework","Q4","pol","m"]],"Net liquidity draining / flow reversal","Net-liquidity adding + flow surge"],
["ITA","Aerospace & Defense","Alternatives & Crypto",C.pink,"Structural budget tailwind; backlog visibility high.",[["Defense budget / NDAA","Q4","pol","l"],["Prime earnings","Sep 04","ern","l"]],"Budget-sequestration risk","Conflict escalation + backlog build"],
["ARKX","Space","Alternatives & Crypto",C.pink,"Launch cadence + gov contracts; long-duration.",[["Contract awards","Q4","evt","m"]],"Funding freeze","Launch/contract acceleration"],
["MSOS","Cannabis","Alternatives & Crypto",C.pink,"Rescheduling catalyst; policy binary.",[["DEA rescheduling","Q4","pol","h"],["SAFE banking","Q4","pol","m"]],"Reform stalls again","Rescheduling / SAFE passage"],
["DBC","Broad Commodities","Alternatives & Crypto",C.pink,"Inflation hedge; oil-weighted.",[["Oil + metals complex","ongoing","dat","m"]],"Global demand slump","Reflation + supply tightness"],
["VIXY","Volatility","Alternatives & Crypto",C.pink,"Convex hedge; negative carry — tactical only.",[["Event calendar","ongoing","evt","h"]],"Complacency (VIX <14) bleeds carry","Pre-event / regime-break hedge"],
];
const U_GROUPS=["Core Sectors","Tech & Innovation","Health & Bio","Energy · Materials · Real Assets","Financials & Property","Geographic","Factor & Style","Alternatives & Crypto"];

const TRIGGERS=[
["Sep 02","ISM Manufacturing (Aug)","data","ISM <47 or new orders roll → cut cyclical beta","ISM >50 + orders up → add industrials/materials","Trim XLI/XLB → GSY"],
["Sep 05","Jobs Report (Aug)","data","NFP <50k or unemp >4.5% (Sahm trip) → de-risk","NFP 100–175k soft-landing → hold / add quality","Add QUAL/USMV on weak print"],
["Sep 11","CPI (Aug)","inflation","Core m/m >0.4% → hawkish, de-risk duration","Core <0.2% → cuts back on table, re-risk","Cut XLU/XLRE if hot"],
["Sep 16","FOMC + SEP dots","fed","Hike or hawkish dot shift → de-risk broadly","Dovish hold + cut signal → re-risk, add beta","Raise GSY to 15% if hawkish"],
["Sep 26","Core PCE (Aug)","inflation","Core PCE >3.5% → de-risk, higher-for-longer","<3.2% → re-risk, disinflation resuming","Add IWF on cool print"],
["Oct 03","Jobs Report (Sep)","data","Second weak print confirms → de-risk labor-sensitive","Stabilization → re-risk cyclicals","Trim XLY on labor crack"],
["Oct 05","OPEC+ Meeting","energy","Supply cut → oil spike/inflation → trim broad, add XLE","Supply add → oil down → re-risk duration & consumer","+XLE / XOP on cut"],
["Oct 14","Big-Bank Earnings","earnings","Credit-cost guide-up → de-risk financials/credit","Clean credit + NII beat → add XLF/KRE","Add XLF on clean credit"],
["Oct 15","CPI (Sep)","inflation","Sticky core >0.3% m/m → de-risk","Cooling → re-risk rate-sensitives","+XLU/XLRE on cooling"],
["Oct 28","FOMC","fed","Hawkish hold / no-cut signal → stay defensive","Cut or dovish shift → re-risk cyclicals","Deploy GSY → beta on cut"],
["Oct 31","Core PCE (Sep) + ECI","inflation","ECI hot → wage-price watch → de-risk","Soft ECI + PCE → re-risk","Hold quality tilt"],
["Nov 03","2026 Midterm Elections","political","Unified sweep → policy uncertainty → de-risk","Divided gridlock → market-friendly → re-risk","Add beta on gridlock"],
["Nov 07","Jobs Report (Oct)","data","Trend deterioration → de-risk","Re-acceleration → add beta","Confirm labor trend"],
["Nov 13","CPI (Oct)","inflation","Re-acceleration → de-risk","Downtrend intact → re-risk","Stay the tilt"],
["Nov 26","Core PCE (Oct)","inflation","Above 3.3% → higher-for-longer → de-risk","Sub-3% path → re-risk","+duration on sub-3%"],
["Dec 05","Jobs Report (Nov)","data","Sub-50k or unemp >4.6% → de-risk into year-end","Solid print → hold risk-on","Year-end beta call"],
["Dec 09","FOMC + SEP dots","fed","2027 dots revised up → de-risk","Cut + dovish 2027 path → full re-risk","Full re-risk on dovish 2027"],
];
const PLAYBOOK=[["Goldilocks / Expansion","1.05–1.10","0–5%","Growth, semis, discretionary, small-cap",C.teal],["Overheating","0.95–1.00","5–10%","Energy, materials, value, real assets",C.violet],["Late-cycle · Stagflation","0.80–0.90","12–18%","Energy, staples, healthcare, low-vol, GSY",C.amber],["Slowdown / Recession","0.65–0.80","18–25%","Utilities, staples, long-duration Tsy, quality",C.red]];

const ROTA=[["Energy","XLE",14,{infl:9,oil:12,growth:2,rate:3}],["Financials","XLF",8,{infl:3,oil:1,growth:5,rate:8}],["Health Care","XLV",3,{infl:-2,oil:-1,growth:-3,rate:-4}],["Utilities","XLU",6,{infl:-3,oil:-2,growth:-5,rate:-9}],["Staples","XLP",2,{infl:-1,oil:-3,growth:-6,rate:-3}],["Industrials","XLI",5,{infl:2,oil:1,growth:7,rate:2}],["Materials","XLB",1,{infl:6,oil:5,growth:6,rate:1}],["Technology","XLK",-4,{infl:-4,oil:-2,growth:9,rate:-8}],["Discretionary","XLY",-7,{infl:-5,oil:-6,growth:8,rate:-6}],["Comm Svcs","XLC",-2,{infl:-2,oil:-1,growth:6,rate:-4}],["Real Estate","XLRE",-5,{infl:1,oil:0,growth:-2,rate:-9}]];
const FACTORS=[["Value","IWD",6,{growth:-2,rate:6,infl:4,vol:-1}],["Growth","IWF",-5,{growth:8,rate:-8,infl:-3,vol:2}],["Momentum","MTUM",-3,{growth:4,rate:-2,infl:0,vol:-3}],["Quality","QUAL",1,{growth:1,rate:-1,infl:-1,vol:-2}],["Low Vol","USMV",4,{growth:-3,rate:-2,infl:-1,vol:-6}],["Small Cap","IWM",-6,{growth:7,rate:-7,infl:-2,vol:4}],["High Beta","SPHB",-11,{growth:9,rate:-6,infl:-1,vol:6}],["Dividend","SCHD",5,{growth:-2,rate:-3,infl:0,vol:-3}]];
const ANALOGS=[
{k:"1994 (mid-cycle hikes)",c:C.teal,pts:[0,-2,-4,-3,-6,-8,-5,-3,-1,2,5,4,7,9,8,11,13,12,14,16],week:14,ev:"Soft landing achieved; risk resumed"},
{k:"2018 (QT + hikes)",c:C.amber,pts:[0,1,-1,-3,-2,-5,-4,-7,-6,-9,-8,-6,-4,-2,-5,-9,-14,-18,-13,-6],week:14,ev:"Dec '18 vol crash → Powell pivot"},
{k:"2022 (inflation shock)",c:C.red,pts:[0,-3,-6,-9,-7,-12,-15,-13,-18,-16,-20,-23,-19,-16,-13,-17,-14,-10,-7,-4],week:14,ev:"Bear market, late-year bottom"},
{k:"2026 (current)",c:C.cyan,pts:[0,-1,-2,-4,-3,-5,-6,-4,-7,-8,-6,-9,-7,-8,null,null,null,null,null,null],week:13,ev:"→ next: Sep 16 FOMC"},
];

const GLOBAL=[["Nikkei 225","JP",12,58],["Hang Seng","HK",9,72],["Shanghai Comp","CN",6,64],["KOSPI","KR",-5,55],["Sensex","IN",8,38],["DAX","DE",4,44],["FTSE 100","UK",3,32],["CAC 40","FR",1,41],["S&P/TSX","CA",7,29],["ASX 200","AU",5,34],["Bovespa","BR",14,49],["Euro Stoxx 50","EU",2,46]];
const CONTAGION=[["Japan",0.62,0.9],["Hong Kong / China",0.48,1.1],["Europe",0.81,1.0],["Korea",0.71,1.2],["EM ex-China",0.68,1.1],["LatAm",0.55,1.3],["Canada",0.86,0.95]];
const FX=[["DXY (dollar)","USD",4.2,38],["EUR/USD","EUR",-3.1,34],["USD/JPY","JPY",8.4,66],["USD/CNY","CNY",1.9,52],["GBP/USD","GBP",-1.2,30],["USD/MXN","MXN",6.1,44],["USD/BRL","BRL",-4.8,49],["USD/TRY","TRY",22.0,78],["USD/ZAR","ZAR",5.3,58],["EM FX basket","EM",-2.4,55]];

const GRC=[["GPR Index",148,"g"],["Oil escalation premium","+$6","a"],["Nuclear rhetoric","med","a"],["Cyber threat level","high","r"]];
const SCENARIOS=[["Taiwan blockade / quarantine",12,"+$8","−12%","+9%","+18%"],["Hormuz disruption",18,"+$22","−6%","+7%","+11%"],["Russia–NATO escalation",9,"+$14","−9%","+11%","+14%"],["Red Sea shutdown (persist)",34,"+$5","−2%","+3%","+4%"],["Korea kinetic event",7,"+$6","−7%","+8%","+13%"],["Mideast broadens (Israel–Iran)",22,"+$18","−8%","+8%","+12%"]];
const OSINT=[["Baltic Dry Index","1,842","f","freight steady"],["Tanker rates (VLCC)","+14%","u","Gulf tension bid"],["Pentagon pizza index","74","u","above baseline"],["Gov jet / flight activity","elevated","u","DC after-hours ↑"],["Nat-gas EU storage","82%","f","pre-winter adequate"],["Crude floating storage","+6%","u","builds at chokepoints"]];
const LINKAGE=[["Oil (WTI)","+","risk-on inflation / risk-off supply",C.teal],["Defense (ITA)","+","escalation → backlog + budget",C.amber],["Gold (GLD)","+","safe-haven + real-rate hedge",C.amber],["Treasuries (TLT)","+","flight-to-quality bid",C.blue],["Dollar (DXY)","+","haven + funding demand",C.cyan],["Cyclicals / EM","−","risk-off + dollar drag",C.red]];

const PREDICT={
"Fed Path":[["Sep FOMC: hold",71,-4,"CME"],["Sep FOMC: hike 25bp",22,6,"CME"],["Cut by Dec 2026",34,-9,"Kalshi"],["≥1 hike by Q1'27",41,11,"Polymarket"]],
"Recession & Growth":[["US recession by mid-2026",33,3,"Kalshi"],["2 neg GDP qtrs '26",27,4,"Polymarket"],["Unemployment >5% '26",29,5,"Kalshi"]],
"Market & Crash":[["S&P −10% by year-end",38,7,"Polymarket"],["S&P −20% by year-end",14,4,"Kalshi"],["VIX >30 this quarter",31,8,"Polymarket"],["10y yield >4.5%",44,6,"Kalshi"],["WTI >$90 this quarter",36,9,"Polymarket"]],
};
const VENUE=[["Sep FOMC hike","Kalshi 24","Poly 21","CME 22","3pt"],["Recession by mid-'26","Kalshi 33","Poly 30","— —","3pt"],["S&P −10% EOY","Kalshi 36","Poly 38","— —","2pt"],["Cut by Dec","Kalshi 34","Poly 31","CME 33","3pt"]];
const CALIB=[["Fed path","0.09",92],["Macro data","0.14",84],["Market / crash","0.21",73],["Geopolitical","0.28",64]];

const GEX={net:-2.4,flip:5480,spot:5612,pc:0.94,vix:[["VIX",17.8],["VIX3M",19.6],["VIX6M",21.1]]};
const FMS={cash:4.8,tilt:"Equity OW, bond UW",crowded:"Long Mag-7 / AI",tail:"Sticky inflation → hawkish Fed",naaim:58,aaii:[38,34]};
const SHORTINT=[["Discretionary","XLY",6.1,4.2],["Regional Banks","KRE",8.4,5.1],["Solar","TAN",14.2,6.8],["Cannabis","MSOS",11.0,5.5],["Biotech","BBP",7.3,3.9]];
const BREADTH=[["Advance/Decline line","rolling over","d"],["% above 50-DMA","44%","d"],["% above 200-DMA","58%","f"],["New highs − new lows","−38","d"],["McClellan Oscillator","−62","d"],["Up vs down volume","0.8x","d"]];
const CONCEN=[["Top-10 weight (S&P)","38.4%","u"],["Mag-7 weight","31.2%","u"],["Equal-wt vs cap-wt (YTD)","−7.1%","d"],["% of gains from top 10","61%","u"]];
const DISPERS=[["Implied correlation (COR)","0.31","f"],["Sector dispersion","elevated","u"],["Single-stock vol / index vol","1.6x","u"],["Factor crowding score","72/100","u"]];

const VAL_METRICS=[["Shiller CAPE",34.2,94],["Forward P/E",21.4,86],["Buffett Indicator",192,97],["Price/Sales",2.9,91],["EV/EBITDA",15.8,88],["Price/Book",4.6,90]];
const ERP={val:2.9,note:"vs 10y ~4.3% → thin cushion; 20y avg ~3.4%"};
const SENT=[["AAII Bull","38%","f"],["AAII Bear","34%","u"],["Investors Intelligence","1.9x bull ratio","d"],["Put/Call (equity)","0.94","u"],["NAAIM exposure","58","d"],["Fear & Greed","41 (Fear)","d"]];

/* ═══════════════  PRIMITIVES  ═══════════════ */
const Panel=({title,tag,accent=C.dim,children,sub})=>(
  <div style={{background:C.bg1,border:`1px solid ${C.line}`,borderRadius:6,display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderBottom:`1px solid ${C.lineSoft}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8}}>
        <span style={{width:6,height:6,borderRadius:1,background:accent,transform:"translateY(-1px)"}}/>
        <span style={{font:`600 12px ${SANS}`,color:C.txt,letterSpacing:.2}}>{title}</span>
        {sub&&<span style={{font:`400 10px ${MONO}`,color:C.faint}}>{sub}</span>}
      </div>
      {tag&&<span style={{font:`500 9px ${MONO}`,color:C.faint,border:`1px solid ${C.line}`,borderRadius:3,padding:"2px 5px"}}>{tag}</span>}
    </div>
    <div style={{padding:12,minHeight:0}}>{children}</div>
  </div>
);
const Stat=({k,v,u,tone=C.txt,sub})=>(
  <div style={{display:"flex",flexDirection:"column",gap:3}}>
    <span style={{font:`500 10px ${SANS}`,color:C.dim}}>{k}</span>
    <span style={{font:`600 20px ${MONO}`,color:tone,lineHeight:1}}>{v}<span style={{font:`500 11px ${MONO}`,color:C.faint,marginLeft:3}}>{u}</span></span>
    {sub&&<span style={{font:`400 10px ${MONO}`,color:C.faint}}>{sub}</span>}
  </div>
);
const Chip=({label,tone})=>(<span style={{font:`600 10px ${MONO}`,color:tone,background:`${tone}18`,border:`1px solid ${tone}44`,borderRadius:4,padding:"3px 8px",whiteSpace:"nowrap"}}>{label}</span>);
const btnStep={width:22,height:22,borderRadius:4,border:`1px solid ${C.line}`,background:C.bg2,color:C.dim,font:`600 13px ${MONO}`,cursor:"pointer",lineHeight:1};
const Step=({label,val,u,onDown,onUp})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    <span style={{font:`500 10px ${SANS}`,color:C.dim}}>{label}</span>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button onClick={onDown} style={btnStep}>–</button>
      <span style={{font:`600 14px ${MONO}`,color:C.txt,minWidth:52,textAlign:"center"}}>{val}<span style={{color:C.faint,fontSize:10,marginLeft:2}}>{u}</span></span>
      <button onClick={onUp} style={btnStep}>+</button>
    </div>
  </div>
);
const chartAxis={stroke:C.faint,fontSize:9,fontFamily:MONO,tickLine:false,axisLine:{stroke:C.lineSoft}};
const TT=({active,payload,label})=>active&&payload&&payload.length?(
  <div style={{background:C.bg2,border:`1px solid ${C.line}`,borderRadius:4,padding:"5px 8px",font:`500 11px ${MONO}`,color:C.txt}}>
    <div style={{color:C.dim,fontSize:9}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||C.txt}}>{fmt(p.value,2)}</div>)}
  </div>):null;
const Gauge=({value,color,cap})=>(
  <svg viewBox="0 0 120 68" style={{width:170}}>
    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={C.bg2} strokeWidth="9" strokeLinecap="round"/>
    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(value/100)*157} 157`}/>
    <text x="60" y="50" fill={color} fontSize="21" fontFamily={MONO} fontWeight="600" textAnchor="middle">{cap||fmt(value,0)}</text>
  </svg>
);
const ProbBar=({q,prob,chg,src,tone})=>(
  <div style={{display:"grid",gridTemplateColumns:"1fr 46px",gap:8,alignItems:"center",padding:"7px 0"}}>
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{q}</span>
        <span style={{font:`400 9px ${MONO}`,color:C.faint}}>{src} · {chg>=0?"+":""}{chg}pt</span>
      </div>
      <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${prob}%`,background:tone,opacity:.82,borderRadius:3}}/></div>
    </div>
    <span style={{font:`600 15px ${MONO}`,color:tone,textAlign:"right"}}>{prob}<span style={{fontSize:9,color:C.faint}}>%</span></span>
  </div>
);
const Row=({items,i,n})=>(
  <div style={{display:"grid",gridTemplateColumns:items.cols,gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<n-1?`1px solid ${C.lineSoft}`:"none"}}>{items.cells}</div>
);
const KV=({k,v,tone=C.txt,arrow,i,n})=>(
  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<n-1?`1px solid ${C.lineSoft}`:"none"}}>
    <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{k}</span>
    <span style={{display:"flex",alignItems:"center",gap:5}}>{arrow&&<span style={{font:`600 9px ${MONO}`,color:ARR[arrow][1]}}>{ARR[arrow][0]}</span>}<span style={{font:`600 12px ${MONO}`,color:tone}}>{v}</span></span>
  </div>
);
const grid2={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12};

/* ═══════════════  ENGINES  ═══════════════ */
function Liquidity({m}){
  const net=m.fedBS-m.tga-m.rrp, chg13=net-(LIQ_SERIES[LIQ_SERIES.length-14]?.net??net);
  const g4chg=G4_SERIES[G4_SERIES.length-1].g4-G4_SERIES[G4_SERIES.length-14].g4;
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="US Net Liquidity" tag="FRED · live" accent={C.cyan} sub="Fed BS − TGA − RRP">
      <div style={{display:"flex",gap:22,marginBottom:12,flexWrap:"wrap"}}>
        <Stat k="Net liquidity" v={`$${fmt(net,2)}T`} tone={C.cyan} sub={`13w ${chg13>=0?"+":""}${fmt(chg13,2)}T`}/>
        <Stat k="Bank reserves" v={`$${fmt(m.reserves,2)}T`} sub="floor ~$3.0T"/>
        <Stat k="13w trend" v={chg13<0?"Draining":"Adding"} tone={chg13<0?C.red:C.teal} sub="risk headwind"/>
      </div>
      <div style={{height:120,width:"100%"}}><ResponsiveContainer>
        <AreaChart data={LIQ_SERIES} margin={{top:4,right:6,left:-18,bottom:0}}>
          <defs><linearGradient id="lq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={.35}/><stop offset="100%" stopColor={C.cyan} stopOpacity={0}/></linearGradient></defs>
          <XAxis dataKey="w" {...chartAxis} interval={5}/><YAxis {...chartAxis} domain={["dataMin-0.05","dataMax+0.05"]} width={40}/>
          <Tooltip content={<TT/>}/><Area type="monotone" dataKey="net" stroke={C.cyan} strokeWidth={1.6} fill="url(#lq)"/>
        </AreaChart></ResponsiveContainer></div>
    </Panel>
    <Panel title="Global CB Liquidity (G4)" tag="FRED+ECB+BoJ+PBoC" accent={C.violet} sub="USD-equiv, $T">
      <div style={{display:"flex",gap:16,marginBottom:10,flexWrap:"wrap"}}>
        <Stat k="G4 aggregate" v="$24.5T" tone={C.violet} sub={`13w ${g4chg>=0?"+":""}${fmt(g4chg,2)}T`}/>
        <Stat k="Net impulse" v={g4chg<0?"Contracting":"Expanding"} tone={g4chg<0?C.red:C.teal} sub="global risk driver"/>
      </div>
      {CBS.map((r,i)=>(<div key={r[0]} style={{display:"grid",gridTemplateColumns:"1fr auto auto 12px",gap:8,alignItems:"center",padding:"6px 0",borderBottom:i<CBS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span><span style={{font:`600 11px ${MONO}`,color:C.dim}}>{r[1]}</span>
        <span style={{font:`400 9px ${MONO}`,color:C.faint}}>{r[2]}</span><span style={{font:`600 9px ${MONO}`,color:ARR[r[3]][1]}}>{ARR[r[3]][0]}</span></div>))}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Money-Market Plumbing" tag="funding stress" accent={C.amber}>
      {PLUMB.map((r,i)=><KV key={r[0]} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={PLUMB.length}/>)}
    </Panel>
    <Panel title="Sector Fund Flows" tag="sample · 4w Σ $B" accent={C.teal}>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[...FLOWS].sort((a,b)=>b[2]-a[2]).map(r=>{const w=clamp(Math.abs(r[2])/3.5*100,4,100),pos=r[2]>=0;return(
          <div key={r[1]} style={{display:"grid",gridTemplateColumns:"104px 1fr 48px",alignItems:"center",gap:8}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,marginLeft:4,fontFamily:MONO,fontSize:9}}>{r[1]}</span></span>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:pos?C.teal:C.red,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 11px ${MONO}`,color:pos?C.teal:C.red,textAlign:"right"}}>{pos?"+":""}{fmt(r[2],1)}</span>
          </div>);})}
      </div>
    </Panel>
    <Panel title="Factor Flows" tag="sample · 4w Σ $B" accent={C.blue}>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[...FFLOWS].sort((a,b)=>b[2]-a[2]).map(r=>{const w=clamp(Math.abs(r[2])/2.8*100,4,100),pos=r[2]>=0;return(
          <div key={r[1]} style={{display:"grid",gridTemplateColumns:"104px 1fr 48px",alignItems:"center",gap:8}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,marginLeft:4,fontFamily:MONO,fontSize:9}}>{r[1]}</span></span>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:pos?C.teal:C.red,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 11px ${MONO}`,color:pos?C.teal:C.red,textAlign:"right"}}>{pos?"+":""}{fmt(r[2],1)}</span>
          </div>);})}
      </div>
    </Panel>
   </div>
  </div>);
}

function FedDots({m}){
  const s2s10=(m.y10-m.y2)*100;const YRS=["2026","2027","2028","LR"];
  const rMin=2.75,rMax=4.5,H=200,W=300,padL=34,padB=26,padT=10;
  const xOf=i=>padL+i*((W-padL-8)/(YRS.length-1));
  const yOf=r=>padT+(1-(r-rMin)/(rMax-rMin))*(H-padT-padB);
  const taylor=+(1.0+m.corePCE+0.5*(m.corePCE-2)+0.5*(-2*(m.unemp-4.2))).toFixed(2);
  const gap=+(taylor-m.funds).toFixed(2);
  const hawks=FOMC.filter(f=>f[2]==="hawk").length, doves=FOMC.filter(f=>f[2]==="dove").length;
  const stripMax=Math.max(...SOFR_STRIP.map(s=>s[1])),stripMin=Math.min(...SOFR_STRIP.map(s=>s[1]));
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="SEP Dot Plot" tag="19 participants · median" accent={C.amber} sub="dots vs market path">
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H}}>
        {[3.0,3.5,4.0,4.5].map(r=>(<g key={r}><line x1={padL} y1={yOf(r)} x2={W-8} y2={yOf(r)} stroke={C.lineSoft}/><text x={4} y={yOf(r)+3} fill={C.faint} fontSize="8" fontFamily={MONO}>{r.toFixed(1)}</text></g>))}
        {YRS.map((yr,i)=>(<text key={yr} x={xOf(i)} y={H-8} fill={C.dim} fontSize="9" fontFamily={MONO} textAnchor="middle">{yr}</text>))}
        {YRS.map((yr,i)=>DOT_BUCKETS.map(b=>{const n=DOTS[yr][b]||0;return Array.from({length:n}).map((_,k)=>(
          <circle key={yr+b+k} cx={xOf(i)-((n-1)*4)/2+k*4} cy={yOf(b)} r="2.1" fill={C.dim} opacity=".7"/>));}))}
        <polyline points={YRS.map((yr,i)=>`${xOf(i)},${yOf(DOT_MEDIAN[yr])}`).join(" ")} fill="none" stroke={C.amber} strokeWidth="1.8"/>
        {YRS.map((yr,i)=><circle key={"m"+yr} cx={xOf(i)} cy={yOf(DOT_MEDIAN[yr])} r="3.2" fill={C.amber}/>)}
        <polyline points={YRS.map((yr,i)=>`${xOf(i)},${yOf(DOT_MARKET[yr])}`).join(" ")} fill="none" stroke={C.cyan} strokeWidth="1.6" strokeDasharray="4 3"/>
      </svg>
      <div style={{display:"flex",gap:14,marginTop:4,justifyContent:"center"}}>
        <span style={{font:`500 10px ${MONO}`,color:C.amber}}>● Fed median</span><span style={{font:`500 10px ${MONO}`,color:C.cyan}}>— — market</span>
      </div>
    </Panel>
    <Panel title="SOFR Futures Strip" tag="terminal-rate pricing" accent={C.cyan} sub="implied by meeting">
      <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:2}}>
        {SOFR_STRIP.map((s,i)=>{const w=((s[1]-stripMin)/(stripMax-stripMin||1))*100;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"58px 1fr 42px",alignItems:"center",gap:8}}>
            <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{s[0]}</span>
            <div style={{height:7,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${20+w*.8}%`,background:C.cyan,opacity:.75,borderRadius:3}}/></div>
            <span style={{font:`600 11px ${MONO}`,color:C.txt,textAlign:"right"}}>{fmt(s[1],2)}</span>
          </div>);})}
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Peak priced Dec '26 at {fmt(stripMax,2)}%, then ~40bp of cuts into '27 — market sees a hike-then-cut.</div>
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Fed Speaker Scorecard" tag="hawk–dove lean" accent={C.amber}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <Chip label={`${hawks} hawk`} tone={C.red}/><Chip label={`${FOMC.length-hawks-doves} neutral`} tone={C.dim}/><Chip label={`${doves} dove`} tone={C.teal}/>
        <span style={{font:`600 11px ${MONO}`,color:hawks>doves?C.red:doves>hawks?C.teal:C.amber,marginLeft:"auto"}}>{hawks>doves?"net hawkish":doves>hawks?"net dovish":"chair-led hawkish"}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
        {FOMC.map((f,i)=>{const c=f[2]==="hawk"?C.red:f[2]==="dove"?C.teal:C.dim;return(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{f[0]}<span style={{color:C.faint,fontSize:9,marginLeft:4}}>{f[1]}</span></span>
            <span style={{width:7,height:7,borderRadius:"50%",background:c,alignSelf:"center"}}/>
          </div>);})}
      </div>
    </Panel>
    <Panel title="Taylor Rule & Curve" tag="policy gap" accent={C.amber}>
      <div style={{display:"flex",gap:18,marginBottom:12,flexWrap:"wrap"}}>
        <Stat k="Taylor estimate" v={fmt(taylor,2)} u="%" tone={C.amber}/>
        <Stat k="Actual funds" v={fmt(m.funds,2)} u="%"/>
        <Stat k="Policy gap" v={`${gap>=0?"+":""}${fmt(gap,2)}`} u="%" tone={gap>0?C.red:C.teal} sub={gap>0?"behind → hawkish":"restrictive enough"}/>
        <Stat k="2s10s" v={`${s2s10>=0?"+":""}${fmt(s2s10,0)}`} u="bp" tone={s2s10>=0?C.teal:C.red}/>
      </div>
      <div style={{height:120,width:"100%"}}><ResponsiveContainer>
        <LineChart data={CURVE(m)} margin={{top:6,right:8,left:-20,bottom:0}}>
          <XAxis dataKey="t" {...chartAxis}/><YAxis {...chartAxis} domain={[3.4,4.8]} width={40}/>
          <Tooltip content={<TT/>}/><Line type="monotone" dataKey="y" stroke={C.amber} strokeWidth={1.8} dot={{r:2.5,fill:C.amber}}/>
        </LineChart></ResponsiveContainer></div>
    </Panel>
   </div>
  </div>);
}

function Macro({live={}}){
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={{display:"flex",alignItems:"center",gap:14,font:`500 10px ${SANS}`,color:C.faint,padding:"0 2px"}}>
     <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:C.cyan}}/>live · FRED</span>
     <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:C.dim}}/>sample</span>
   </div>
   <div style={grid2}>
    {Object.entries(MACRO).map(([grp,rows])=>(
      <Panel key={grp} title={grp} tag={`${rows.length} series`} accent={C.blue}>
        <div style={{display:"flex",flexDirection:"column"}}>
          {rows.map((r,i)=>{const s=SURP[r[0]];const lv=live[r[0]];const val=lv!=null?lv:r[1];const ad=Math.abs(val);return(
            <div key={r[0]} style={{display:"grid",gridTemplateColumns:"1fr auto auto 10px",gap:7,alignItems:"center",padding:"6px 0",borderBottom:i<rows.length-1?`1px solid ${C.lineSoft}`:"none"}}>
              <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{r[0]}</span>
              <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{fmt(val,ad%1===0?0:ad>=100?0:2)}<span style={{color:C.faint,fontSize:9,marginLeft:2}}>{r[2]}</span></span>
              <span style={{font:`600 9px ${MONO}`,color:s?ARR[s][1]:C.faint,minWidth:10,textAlign:"center"}}>{s?ARR[s][0]:""}</span>
              <span style={{width:7,height:7,borderRadius:"50%",background:lv!=null?C.cyan:SIG[r[3]]}}/>
            </div>);})}
        </div>
      </Panel>))}
   </div>
   <div style={grid2}>
    <Panel title="Recession Probability" tag="model dashboard" accent={C.red} sub="12-month, %">
      {RECESS.map((r,i)=>{const c=r[1]>40?C.red:r[1]>25?C.amber:C.teal;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 34px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<RECESS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[1]}%`,background:c,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 11px ${MONO}`,color:c,textAlign:"right"}}>{r[1]}</span>
        </div>);})}
    </Panel>
    <Panel title="Growth Nowcast & Surprise" tag="live trackers" accent={C.cyan}>
      {NOWCAST.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<NOWCAST.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 14px ${MONO}`,color:r[1]<0?C.red:r[1]<1.8?C.amber:C.teal}}>{r[1]>=0&&r[2]!=="idx"?"+":""}{fmt(r[1],1)}<span style={{color:C.faint,fontSize:9,marginLeft:3}}>{r[2]}</span></span>
      </div>))}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Nowcasts clustered ~1.1–1.6% ann. with a negative Citi surprise trend — growth undershooting consensus.</div>
    </Panel>
   </div>
  </div>);
}

function Earnings(){
  const raiseRatio=Math.round(GUIDANCE[0][2]/(GUIDANCE[0][2]+GUIDANCE[1][2])*100);
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Earnings Calendar" tag="sample · your sleeves" accent={C.blue} sub="next 3 weeks">
      {EARN_CAL.map((e,i)=>{const tc=e[4]==="up"?C.teal:e[4]==="watch"?C.amber:C.dim;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:10,alignItems:"center",padding:"9px 0",borderBottom:i<EARN_CAL.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`600 11px ${MONO}`,color:C.dim}}>{e[0]}</span>
          <div><div style={{font:`500 12px ${SANS}`,color:C.txt}}>{e[1]}</div><div style={{font:`400 10px ${MONO}`,color:C.faint}}>{e[3]} · <span style={{color:C.violet}}>{e[2]}</span></div></div>
          <span style={{width:7,height:7,borderRadius:"50%",background:tc}}/>
        </div>);})}
    </Panel>
    <Panel title="Aggregate S&P Earnings" tag="blended" accent={C.teal}>
      <div style={{display:"flex",gap:18,marginBottom:12,flexWrap:"wrap"}}>
        <Stat k="EPS growth y/y" v={`+${fmt(AGG_EPS.growth,1)}`} u="%" tone={C.teal}/>
        <Stat k="Fwd 12m EPS" v={`$${AGG_EPS.fwd}`} sub="rising"/>
        <Stat k="Net margin" v={fmt(AGG_EPS.margin,1)} u="%" tone={C.teal} sub="record-ish"/>
        <Stat k="% beating" v={AGG_EPS.beat} u="%" sub="vs 5y avg 77%"/>
      </div>
      <div style={{height:90,width:"100%"}}><ResponsiveContainer>
        <LineChart data={AGG_EPS.marginTrend.map((v,i)=>({q:`Q${i+1}`,v}))} margin={{top:6,right:8,left:-24,bottom:0}}>
          <XAxis dataKey="q" {...chartAxis}/><YAxis {...chartAxis} domain={[11,12.6]} width={38}/>
          <Tooltip content={<TT/>}/><Line type="monotone" dataKey="v" stroke={C.teal} strokeWidth={1.8} dot={{r:2,fill:C.teal}}/>
        </LineChart></ResponsiveContainer></div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:4}}>Margin expansion is carrying EPS — the durability question for '27.</div>
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Guidance Tracker" tag="raise / cut ratio" accent={C.violet}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><Gauge value={raiseRatio} color={raiseRatio>55?C.teal:C.amber} cap={`${raiseRatio}%`}/><span style={{font:`400 10px ${SANS}`,color:C.faint}}>raise share</span></div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          {GUIDANCE.map((gd,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{gd[0]}</span><span style={{font:`600 15px ${MONO}`,color:gd[3]}}>{gd[2]}</span></div>))}
        </div>
      </div>
    </Panel>
    <Panel title="Pre-Announcement Flow" tag="sample · guidance pre-prints" accent={C.blue}>
      {PREANN.map((r,i)=>{const c=r[2]==="positive"?C.teal:C.red;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<PREANN.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <div><span style={{font:`500 12px ${SANS}`,color:C.txt}}>{r[0]}</span><span style={{color:C.faint,fontFamily:MONO,fontSize:9,marginLeft:6}}>{r[1]}</span><div style={{font:`400 10px ${SANS}`,color:C.faint}}>{r[3]}</div></div>
          <Chip label={r[2]} tone={c}/>
        </div>);})}
    </Panel>
   </div>
  </div>);
}

function SectorsThemes({bio,quotes={}}){
  const [sel,setSel]=useState("XLK");
  const e=U.find(x=>x[0]===sel)||U[0];
  const [code,name,grp,a,thesis,cats,dr,rr]=e;
  const mo=MOM[code]??0, rs=clamp(Math.round(50+mo*1.6),1,99);
  const gv=GVAL[grp]||[0,0], gb=GBETA[grp]||{mkt:1,rate:0,oil:0,growth:0};
  const qN=Object.keys(quotes).length;
  const heat=v=>{const al=clamp(Math.abs(v)/22,.08,.85);return v>=0?`rgba(63,191,147,${al})`:`rgba(224,96,90,${al})`;};
  const betaRow=(lbl,val)=>{const w=clamp(50+val*22,4,96);return(
    <div style={{display:"grid",gridTemplateColumns:"58px 1fr 34px",alignItems:"center",gap:8,padding:"4px 0"}}>
      <span style={{font:`500 10px ${SANS}`,color:C.dim}}>{lbl}</span>
      <div style={{height:6,background:C.bg2,borderRadius:3,position:"relative"}}><div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.faint}}/><div style={{position:"absolute",left:val>=0?"50%":`${w}%`,width:`${Math.abs(w-50)}%`,top:0,height:"100%",background:val>=0?C.teal:C.red,opacity:.75,borderRadius:2}}/></div>
      <span style={{font:`600 10px ${MONO}`,color:val>=0?C.teal:C.red,textAlign:"right"}}>{val>=0?"+":""}{fmt(val,1)}</span>
    </div>);};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <Panel title="Sector & Thematic Heatmap" tag={qN?`${qN} live · Finnhub`:"90+ classes · mom %"} accent={C.cyan} sub="live day % (Finnhub) where available · else 12-week momentum · tap to load">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {Object.entries(THEMES).map(([g,items])=>(
          <div key={g}>
            <div style={{font:`600 10px ${SANS}`,color:C.dim,marginBottom:6}}>{g}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {items.map(it=>{const q=quotes[it[1]];const isLive=q&&typeof q.dp==="number";const shown=isLive?q.dp:it[2];return(
                <div key={it[1]} onClick={()=>{if(U.find(x=>x[0]===it[1]))setSel(it[1]);}} style={{background:heat(shown),border:`1px solid ${isLive?C.cyan+"55":C.lineSoft}`,borderRadius:4,padding:"6px 8px",minWidth:70,cursor:U.find(x=>x[0]===it[1])?"pointer":"default"}}>
                  <div style={{font:`600 10px ${SANS}`,color:C.txt}}>{it[0]}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:6}}>
                    <span style={{font:`400 8px ${MONO}`,color:isLive?C.cyan:C.faint}}>{it[1]}</span>
                    <span style={{font:`600 10px ${MONO}`,color:shown>=0?C.teal:C.red}}>{shown>=0?"+":""}{fmt(shown,isLive?2:0)}{isLive?"%":""}</span>
                  </div>
                </div>);})}
            </div>
          </div>))}
      </div>
    </Panel>

    <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:12}}>
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:600,overflowY:"auto",paddingRight:4}}>
        {U_GROUPS.map(g=>(
          <div key={g}>
            <div style={{font:`600 9px ${SANS}`,color:C.faint,margin:"2px 0 5px"}}>{g}</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {U.filter(x=>x[2]===g).map(x=>{const on=x[0]===sel;return(
                <button key={x[0]} onClick={()=>setSel(x[0])} style={{textAlign:"left",background:on?C.bg2:"transparent",border:`1px solid ${on?x[3]+"66":"transparent"}`,borderLeft:`3px solid ${on?x[3]:C.lineSoft}`,borderRadius:4,padding:"6px 9px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}>
                  <span style={{font:`500 11px ${SANS}`,color:on?C.txt:C.dim,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x[1]}</span>
                  <span style={{font:`500 8px ${MONO}`,color:x[3]}}>{x[0]}</span>
                </button>);})}
            </div>
          </div>))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12,minWidth:0}}>
        <Panel title={`${name} · ${code}`} tag={grp} accent={a}><p style={{font:`400 12px ${SANS}`,color:C.dim,lineHeight:1.55,margin:0}}>{thesis}</p></Panel>
        <div style={grid2}>
          <Panel title="Name Profile" tag="RS · valuation · factor" accent={a}>
            <div style={{display:"flex",gap:20,marginBottom:12,flexWrap:"wrap"}}>
              <Stat k="RS-rating vs S&P" v={rs} tone={rs>60?C.teal:rs<40?C.red:C.dim} sub="1–99 percentile"/>
              <Stat k="Fwd P/E" v={gv[0]?fmt(gv[0],1):"—"} sub={gv[0]?`z ${gv[1]>=0?"+":""}${fmt(gv[1],1)}σ`:"n/a"} tone={gv[1]>1?C.red:C.txt}/>
              <Stat k="12w mom" v={`${mo>=0?"+":""}${mo}`} u="%" tone={mo>=0?C.teal:C.red}/>
            </div>
            <div style={{font:`500 10px ${SANS}`,color:C.dim,marginBottom:4}}>Factor betas</div>
            {betaRow("Market",gb.mkt)}{betaRow("Rates",gb.rate)}{betaRow("Oil",gb.oil)}{betaRow("Growth",gb.growth)}
          </Panel>
          <Panel title="Catalyst Calendar" tag="dated events" accent={a}>
            {cats.map((c,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<cats.length-1?`1px solid ${C.lineSoft}`:"none"}}>
                <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{c[0]}</span>
                <Chip label={TYL[c[2]]} tone={TYC[c[2]]}/>
                <span style={{font:`600 10px ${MONO}`,color:RKC[c[3]],minWidth:48,textAlign:"right"}}>{c[1]}</span>
              </div>))}
          </Panel>
        </div>
        <Panel title="De-Risk / Re-Risk" tag="trigger logic" accent={a}>
          <div style={grid2}>
            <div style={{background:`${C.red}0e`,border:`1px solid ${C.red}33`,borderRadius:5,padding:"10px 11px"}}>
              <div style={{font:`600 10px ${SANS}`,color:C.red,marginBottom:4}}>▼ De-risk if</div>
              <div style={{font:`400 12px ${SANS}`,color:C.txt,lineHeight:1.45}}>{dr}</div>
            </div>
            <div style={{background:`${C.teal}0e`,border:`1px solid ${C.teal}33`,borderRadius:5,padding:"10px 11px"}}>
              <div style={{font:`600 10px ${SANS}`,color:C.teal,marginBottom:4}}>▲ Re-risk if</div>
              <div style={{font:`400 12px ${SANS}`,color:C.txt,lineHeight:1.45}}>{rr}</div>
            </div>
          </div>
        </Panel>
        {code==="BBP"&&(<div style={grid2}>
          <Panel title="Regulatory Calendar" tag="sample · openFDA" accent={C.violet}>
            {BIO.pdufa.map((r,i)=>{const rc=r[4]==="high"?C.red:r[4]==="med"?C.amber:C.teal;return(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<BIO.pdufa.length-1?`1px solid ${C.lineSoft}`:"none"}}>
                <div><span style={{font:`600 11px ${MONO}`,color:C.txt}}>{r[0]}</span><div style={{font:`400 10px ${SANS}`,color:C.faint}}>{r[1]}</div></div>
                <Chip label={r[2]} tone={C.violet}/><span style={{font:`600 10px ${MONO}`,color:rc,minWidth:40,textAlign:"right"}}>{r[3]}</span>
              </div>);})}
          </Panel>
          <Panel title="Clinical Readouts" tag="sample · ClinicalTrials" accent={C.blue}>
            {BIO.readouts.map((r,i)=>(
              <div key={i} style={{padding:"9px 0",borderBottom:i<BIO.readouts.length-1?`1px solid ${C.lineSoft}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{font:`600 11px ${MONO}`,color:C.txt}}>{r[0]}</span><Chip label={`${r[2]} · ${r[3]}`} tone={C.blue}/></div>
                <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:3}}>{r[1]} — {r[4]}</div>
              </div>))}
          </Panel>
        </div>)}
      </div>
    </div>
  </div>);
}

function Positioning(){
  const stripMax=Math.max(...GEX.vix.map(v=>v[1])),stripMin=Math.min(...GEX.vix.map(v=>v[1]));
  const contango=GEX.vix[2][1]>GEX.vix[0][1];
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Dealer Gamma (GEX)" tag="sample · positioning" accent={C.violet}>
      <div style={{display:"flex",gap:18,marginBottom:10,flexWrap:"wrap"}}>
        <Stat k="Net GEX" v={`${GEX.net}`} u="$bn" tone={GEX.net<0?C.red:C.teal} sub={GEX.net<0?"short gamma → moves amplify":"long gamma → pinned"}/>
        <Stat k="Gamma flip" v={GEX.flip} sub="below = unstable"/>
        <Stat k="Spot" v={GEX.spot} tone={GEX.spot>GEX.flip?C.teal:C.red} sub={GEX.spot>GEX.flip?"above flip":"below flip"}/>
      </div>
      <div style={{background:`${C.red}0e`,border:`1px solid ${C.red}33`,borderRadius:5,padding:"9px 11px",font:`400 11px ${SANS}`,color:C.txt,lineHeight:1.5}}>Negative net gamma with spot near the flip = dealers sell into weakness. Downside gets convex below {GEX.flip}.</div>
    </Panel>
    <Panel title="Vol Term Structure" tag="VIX complex" accent={C.blue}>
      <div style={{display:"flex",gap:16,marginBottom:10}}>
        <Stat k="Put/Call (eq)" v={GEX.pc} tone={GEX.pc>1?C.teal:C.amber} sub={GEX.pc>1?"hedged / fearful":"complacent"}/>
        <Stat k="Structure" v={contango?"Contango":"Backward."} tone={contango?C.teal:C.red} sub={contango?"calm regime":"stress bid"}/>
      </div>
      {GEX.vix.map((v,i)=>{const w=((v[1]-stripMin)/(stripMax-stripMin||1))*100;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"52px 1fr 42px",alignItems:"center",gap:8,padding:"4px 0"}}>
          <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{v[0]}</span>
          <div style={{height:7,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${30+w*.7}%`,background:C.blue,opacity:.75,borderRadius:3}}/></div>
          <span style={{font:`600 11px ${MONO}`,color:C.txt,textAlign:"right"}}>{fmt(v[1],1)}</span>
        </div>);})}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Fund Manager Survey" tag="sample · monthly" accent={C.amber}>
      <div style={{display:"flex",gap:18,marginBottom:12,flexWrap:"wrap"}}>
        <Stat k="Cash level" v={fmt(FMS.cash,1)} u="%" tone={FMS.cash>5?C.teal:C.amber} sub={FMS.cash>5?"buy signal >5%":"below trigger"}/>
        <Stat k="NAAIM exposure" v={FMS.naaim} sub="active mgr net long"/>
        <Stat k="AAII bull/bear" v={`${FMS.aaii[0]}/${FMS.aaii[1]}`} sub="% survey"/>
      </div>
      <KV k="Positioning" v={FMS.tilt} i={0} n={3}/><KV k="Most-crowded trade" v={FMS.crowded} tone={C.violet} i={1} n={3}/><KV k="Biggest tail risk" v={FMS.tail} tone={C.amber} i={2} n={3}/>
    </Panel>
    <Panel title="Short Interest" tag="sample · squeeze radar" accent={C.red} sub="% float · days-to-cover">
      {SHORTINT.map((r,i)=>{const c=r[2]>10?C.red:r[2]>7?C.amber:C.dim;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 60px 60px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<SHORTINT.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,fontFamily:MONO,fontSize:9,marginLeft:5}}>{r[1]}</span></span>
          <span style={{font:`600 11px ${MONO}`,color:c,textAlign:"right"}}>{fmt(r[2],1)}%</span>
          <span style={{font:`500 10px ${MONO}`,color:C.dim,textAlign:"right"}}>{fmt(r[3],1)}d</span>
        </div>);})}
    </Panel>
   </div>
  </div>);
}

function Internals(){
  return(<div style={grid2}>
    <Panel title="Market Breadth" tag="internals" accent={C.cyan}>
      {BREADTH.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={r[2]==="d"?C.red:C.txt} i={i} n={BREADTH.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Breadth deteriorating under the surface — index held up by a narrow top.</div>
    </Panel>
    <Panel title="Concentration" tag="narrowness" accent={C.amber}>
      {CONCEN.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={r[2]==="u"?C.amber:C.red} i={i} n={CONCEN.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Top-heavy tape: fragility if the mega-cap complex wobbles.</div>
    </Panel>
    <Panel title="Dispersion & Correlation" tag="regime texture" accent={C.violet}>
      {DISPERS.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={DISPERS.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Low index correlation + high dispersion = a stock-picker's / rotation tape.</div>
    </Panel>
  </div>);
}

function Valuation(){
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Valuation Dashboard" tag="percentile vs history" accent={C.red}>
      {VAL_METRICS.map((r,i)=>{const c=r[2]>85?C.red:r[2]>60?C.amber:C.teal;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"120px 60px 1fr 34px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<VAL_METRICS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{fmt(r[1],r[1]>50?0:1)}</span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[2]}%`,background:c,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 10px ${MONO}`,color:c,textAlign:"right"}}>{r[2]}%</span>
        </div>);})}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Nearly every gauge in the 85th+ percentile — rich, but rich isn't a timing signal on its own.</div>
    </Panel>
    <Panel title="Equity Risk Premium" tag="the cushion" accent={C.amber}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"8px 0"}}>
        <Gauge value={clamp(ERP.val/6*100,0,100)} color={ERP.val<3?C.red:C.teal} cap={`${fmt(ERP.val,1)}%`}/>
        <Chip label={ERP.val<3?"Thin cushion":"Adequate"} tone={ERP.val<3?C.red:C.teal}/>
      </div>
      <div style={{font:`400 11px ${SANS}`,color:C.faint,marginTop:6,lineHeight:1.5}}>{ERP.note}. When ERP compresses like this, equities are pricing perfection — small growth shocks hit harder.</div>
    </Panel>
   </div>
   <Panel title="Sentiment Tape" tag="contrarian read" accent={C.violet}>
     <div style={grid2}>
       {SENT.map((r,i)=>(<div key={i} style={{background:C.bg2,border:`1px solid ${C.lineSoft}`,borderRadius:5,padding:"9px 11px"}}>
         <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
           <span style={{font:`500 10px ${SANS}`,color:C.dim}}>{r[0]}</span>
           <span style={{font:`600 9px ${MONO}`,color:ARR[r[2]][1]}}>{ARR[r[2]][0]}</span>
         </div>
         <div style={{font:`600 15px ${MONO}`,color:C.txt,marginTop:3}}>{r[1]}</div>
       </div>))}
     </div>
     <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:10}}>Fear & Greed in fear + rising put/call = crowd defensive; contrarian-constructive at the margin, but breadth must confirm.</div>
   </Panel>
  </div>);
}

function Triggers({posture,pc}){
  const CC={fed:C.amber,inflation:C.red,data:C.blue,energy:C.teal,earnings:C.violet,political:C.pink};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <Panel title="Beta-Target Playbook" tag="sizing by regime" accent={C.amber} sub="target beta · cash (GSY) · tilt">
      {PLAYBOOK.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"170px 66px 60px 1fr",gap:10,alignItems:"center",padding:"9px 0",borderBottom:i<PLAYBOOK.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`600 11px ${SANS}`,color:r[4]}}>{r[0]}</span>
          <span style={{font:`600 11px ${MONO}`,color:C.txt}}>β {r[1]}</span>
          <span style={{font:`600 11px ${MONO}`,color:C.cyan}}>{r[2]}</span>
          <span style={{font:`400 10px ${SANS}`,color:C.dim}}>{r[3]}</span>
        </div>))}
    </Panel>
    <Panel title="De-Risk / Re-Risk Calendar" tag="Sep–Dec 2026 · auto-sync on deploy" accent={C.amber} sub="the dated trigger map">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.dim}}>Current posture</span><Chip label={posture} tone={pc}/>
        <span style={{font:`400 10px ${MONO}`,color:C.faint}}>next · {TRIGGERS[0][0]} {TRIGGERS[0][1]}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {TRIGGERS.map((t,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"58px 1fr",gap:10,padding:"10px 0",borderBottom:i<TRIGGERS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-start"}}>
              <span style={{font:`700 12px ${MONO}`,color:C.txt}}>{t[0]}</span><span style={{width:8,height:8,borderRadius:2,background:CC[t[2]]}}/>
            </div>
            <div>
              <div style={{font:`600 12px ${SANS}`,color:C.txt,marginBottom:6}}>{t[1]}<span style={{font:`500 9px ${MONO}`,color:CC[t[2]],marginLeft:8}}>{t[2]}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}>
                <div style={{display:"flex",gap:7,alignItems:"flex-start"}}><span style={{font:`700 11px ${MONO}`,color:C.red,marginTop:1}}>▼</span><span style={{font:`400 11px ${SANS}`,color:C.dim,lineHeight:1.4}}>{t[3]}</span></div>
                <div style={{display:"flex",gap:7,alignItems:"flex-start"}}><span style={{font:`700 11px ${MONO}`,color:C.teal,marginTop:1}}>▲</span><span style={{font:`400 11px ${SANS}`,color:C.dim,lineHeight:1.4}}>{t[4]}</span></div>
              </div>
              <div style={{marginTop:6,font:`500 10px ${MONO}`,color:C.amber}}>play · {t[5]}</div>
            </div>
          </div>))}
      </div>
    </Panel>
  </div>);
}

function Regime({m}){
  const g=clamp(.4*((m.ism-50)/6)+.4*((m.gdpnow-2)/2)-.2*((m.unemp-4)/1),-1,1);
  const inf=clamp(.6*((m.corePCE-2)/2)+.4*((m.oil-70)/25),-1,1);
  const name=inf>.15?(g>=0?"Overheating":"Late-cycle · Stagflation risk"):(g>=0?"Goldilocks / Expansion":"Slowdown / Recession risk");
  const rc=name.includes("Stagflation")?C.amber:name.includes("Recession")?C.red:name.includes("Goldilocks")?C.teal:C.violet;
  const scored=useMemo(()=>ROTA.map(r=>{const oilF=(m.oil-70)/25,rateF=(m.funds-3.5)/.5;const score=50+r[2]*.35+r[3].oil*oilF+r[3].infl*inf+r[3].growth*g-r[3].rate*rateF*.4;return{s:r[0],etf:r[1],score};}).sort((a,b)=>b.score-a.score),[m,g,inf]);
  const mx=Math.max(...scored.map(s=>s.score)),mn=Math.min(...scored.map(s=>s.score));
  const fscored=useMemo(()=>FACTORS.map(r=>{const rateF=(m.funds-3.5)/.5,volF=(m.hyOAS-260)/100;const score=50+r[2]*.4+r[3].growth*g+r[3].infl*inf-r[3].rate*rateF*.5-r[3].vol*volF;return{s:r[0],etf:r[1],score};}).sort((a,b)=>b.score-a.score),[m,g,inf]);
  const fmx=Math.max(...fscored.map(s=>s.score)),fmn=Math.min(...fscored.map(s=>s.score));
  const px=50+g*46,py=50-inf*46;
  const hiInf=inf>.15, qx=g>=0?100:0, qy=hiInf?0:100;
  const activeQ=hiInf?(g>=0?"Overheating":"Stagflation"):(g>=0?"Goldilocks":"Recession");
  const trans=(()=>{const dg=(m.gdpnow<1.5?-1:1),di=(m.oil>84||m.corePCE>3.3?1:-1);
    return[["Goldilocks",clamp(30-inf*30+g*20,4,80)],["Overheating",clamp(30+inf*25+g*15,4,85)],["Stagflation",clamp(35+inf*30-g*20,4,88)],["Recession",clamp(30-g*30+(dg<0?12:0),4,82)]];})();
  const ALEN=ANALOGS[0].pts.length;
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Regime Classifier" tag="growth × inflation" accent={rc}>
      <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:10}}><Chip label={name} tone={rc}/><span style={{font:`400 10px ${MONO}`,color:C.faint}}>g {fmt(g,2)} · infl {fmt(inf,2)}</span></div>
      <svg viewBox="0 0 200 200" style={{width:"100%",height:200}}>
        <defs>
          <filter id="rglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="rgrad" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor={rc} stopOpacity=".38"/><stop offset="100%" stopColor={rc} stopOpacity=".08"/></radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={C.amber} opacity=".04"/><rect x="100" y="0" width="100" height="100" fill={C.violet} opacity=".04"/>
        <rect x="0" y="100" width="100" height="100" fill={C.red} opacity=".04"/><rect x="100" y="100" width="100" height="100" fill={C.teal} opacity=".04"/>
        <rect x={qx} y={qy} width="100" height="100" fill="url(#rgrad)"/>
        <rect x={qx+2} y={qy+2} width="96" height="96" rx="3" fill="none" stroke={rc} strokeWidth="1.8" opacity=".95" filter="url(#rglow)"/>
        <line x1="100" y1="6" x2="100" y2="194" stroke={C.line}/><line x1="6" y1="100" x2="194" y2="100" stroke={C.line}/>
        {[["Overheating",150,26],["Goldilocks",150,178],["Stagflation",50,26],["Recession",50,178]].map((q,i)=>{const on=q[0]===activeQ;return <text key={i} x={q[1]} y={q[2]} fill={on?rc:C.faint} fontSize={on?"8.5":"7.5"} fontWeight={on?"700":"400"} fontFamily={MONO} textAnchor="middle" filter={on?"url(#rglow)":undefined}>{q[0]}</text>;})}
        <text x="196" y="97" fill={C.dim} fontSize="7" fontFamily={MONO} textAnchor="end">growth →</text><text x="103" y="12" fill={C.dim} fontSize="7" fontFamily={MONO}>↑ inflation</text>
        <circle cx={px*2} cy={py*2} r="11" fill={rc} opacity=".2"/><circle cx={px*2} cy={py*2} r="4.6" fill={rc} filter="url(#rglow)"/><circle cx={px*2} cy={py*2} r="1.8" fill="#fff" opacity=".92"/>
      </svg>
    </Panel>
    <Panel title="Regime Transition Odds" tag="next-quarter" accent={C.violet} sub="heuristic">
      <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:4}}>
        {trans.map((r,i)=>{const c=r[0]==="Stagflation"?C.amber:r[0]==="Recession"?C.red:r[0]==="Goldilocks"?C.teal:C.violet;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"90px 1fr 34px",alignItems:"center",gap:8}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
            <div style={{height:7,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[1]}%`,background:c,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 11px ${MONO}`,color:c,textAlign:"right"}}>{Math.round(r[1])}%</span>
          </div>);})}
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:10}}>Confidence band widens with oil & credit volatility — the two variables most likely to force a quadrant change.</div>
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Sector Rotation" tag="factor-scored · 11 GICS" accent={C.cyan}>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {scored.map((r,i)=>{const w=((r.score-mn)/(mx-mn||1))*100,c=i<3?C.teal:i>7?C.red:C.dim;return(
          <div key={r.etf} style={{display:"grid",gridTemplateColumns:"16px 96px 1fr 34px",alignItems:"center",gap:8}}>
            <span style={{font:`600 10px ${MONO}`,color:C.faint}}>{i+1}</span>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r.s}<span style={{color:C.faint,marginLeft:4,fontSize:9,fontFamily:MONO}}>{r.etf}</span></span>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:c,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 10px ${MONO}`,color:c,textAlign:"right"}}>{fmt(r.score,0)}</span>
          </div>);})}
      </div>
    </Panel>
    <Panel title="Factor Rotation" tag="style-scored" accent={C.blue}>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {fscored.map((r,i)=>{const w=((r.score-fmn)/(fmx-fmn||1))*100,c=i<3?C.teal:i>5?C.red:C.dim;return(
          <div key={r.etf} style={{display:"grid",gridTemplateColumns:"16px 96px 1fr 34px",alignItems:"center",gap:8}}>
            <span style={{font:`600 10px ${MONO}`,color:C.faint}}>{i+1}</span>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r.s}<span style={{color:C.faint,marginLeft:4,fontSize:9,fontFamily:MONO}}>{r.etf}</span></span>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:c,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 10px ${MONO}`,color:c,textAlign:"right"}}>{fmt(r.score,0)}</span>
          </div>);})}
      </div>
    </Panel>
   </div>
   <Panel title="Living Cycle Analog" tag="1994 · 2018 · 2022 vs now" accent={C.cyan} sub="normalized index, week 0 = cycle start">
     <div style={{height:210,width:"100%"}}><ResponsiveContainer>
       <LineChart margin={{top:6,right:10,left:-18,bottom:0}} data={Array.from({length:ALEN},(_,i)=>{const o={w:i};ANALOGS.forEach(a=>{o[a.k]=a.pts[i];});return o;})}>
         <XAxis dataKey="w" {...chartAxis}/><YAxis {...chartAxis} width={38}/>
         <ReferenceLine x={13} stroke={C.cyan} strokeDasharray="3 3"/>
         <Tooltip content={<TT/>}/>
         {ANALOGS.map(a=><Line key={a.k} type="monotone" dataKey={a.k} stroke={a.c} strokeWidth={a.k.includes("current")?2.2:1.3} dot={false} connectNulls={false} strokeDasharray={a.k.includes("current")?"":"4 3"}/>)}
       </LineChart></ResponsiveContainer></div>
     <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:6}}>
       {ANALOGS.map(a=>(<div key={a.k} style={{display:"flex",flexDirection:"column"}}>
         <span style={{font:`600 10px ${MONO}`,color:a.c}}>{a.k}</span>
         <span style={{font:`400 9px ${SANS}`,color:C.faint}}>wk {a.week} · {a.ev}</span>
       </div>))}
     </div>
     <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>We're at week 13 — the marker advances and the "current" line extends as each catalyst prints. Path is tracking between the '18 and '22 analogs.</div>
   </Panel>
  </div>);
}

function Global(){
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Foreign Markets · Crash Risk" tag="sample · 12 indices" accent={C.red} sub="YTD % · risk 0–100">
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[...GLOBAL].sort((a,b)=>b[3]-a[3]).map(r=>{const rc=r[3]>60?C.red:r[3]>45?C.amber:C.teal;return(
          <div key={r[0]} style={{display:"grid",gridTemplateColumns:"118px 44px 1fr 28px",alignItems:"center",gap:8}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,marginLeft:4,fontSize:9,fontFamily:MONO}}>{r[1]}</span></span>
            <span style={{font:`600 10px ${MONO}`,color:r[2]>=0?C.teal:C.red,textAlign:"right"}}>{r[2]>=0?"+":""}{r[2]}%</span>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[3]}%`,background:rc,opacity:.8,borderRadius:3}}/></div>
            <span style={{font:`600 10px ${MONO}`,color:rc,textAlign:"right"}}>{r[3]}</span>
          </div>);})}
      </div>
    </Panel>
    <Panel title="Contagion Map" tag="correlation back to US" accent={C.violet} sub="ρ to S&P · beta">
      {CONTAGION.map((r,i)=>{const c=r[0]>0.75?C.red:r[0]>0.6?C.amber:C.teal;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"140px 1fr 66px",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<CONTAGION.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[0]*100}%`,background:c,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 10px ${MONO}`,color:C.dim,textAlign:"right"}}>ρ{fmt(r[0],2)} β{fmt(r[1],1)}</span>
        </div>);})}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>High-ρ regions (Europe, Canada) transmit US shocks 1:1; low-ρ (China/HK) offer diversification but carry own tails.</div>
    </Panel>
   </div>
   <Panel title="Currency Crash / FX Stress" tag="sample" accent={C.amber} sub="YTD % vs USD · crash-risk 0–100">
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"6px 20px"}}>
       {FX.map((r,i)=>{const rc=r[3]>60?C.red:r[3]>45?C.amber:C.teal;return(
         <div key={i} style={{display:"grid",gridTemplateColumns:"110px 52px 1fr 28px",alignItems:"center",gap:8,padding:"6px 0"}}>
           <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
           <span style={{font:`600 10px ${MONO}`,color:r[2]>=0?C.teal:C.red,textAlign:"right"}}>{r[2]>=0?"+":""}{fmt(r[2],1)}</span>
           <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[3]}%`,background:rc,opacity:.8,borderRadius:3}}/></div>
           <span style={{font:`600 10px ${MONO}`,color:rc,textAlign:"right"}}>{r[3]}</span>
         </div>);})}
     </div>
     <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:10}}>JPY (carry unwind) and TRY/ZAR (high-beta EM) carry the tail; a dollar surge is the shared contagion trigger.</div>
   </Panel>
  </div>);
}

function Geo(){
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={grid2}>
      <Panel title="Global Risk Condition" tag="composite · GRC" accent={C.amber}>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><Gauge value={62} color={C.amber} cap="GRC 3"/><Chip label="Elevated" tone={C.amber}/></div>
          <div style={{flex:1,minWidth:150,display:"flex",flexDirection:"column",gap:6}}>
            {GRC.map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",font:`500 11px ${SANS}`,color:C.dim}}><span>{r[0]}</span><span style={{fontFamily:MONO,fontSize:11,color:SIG[r[2]]}}>{r[1]}</span></div>))}
          </div>
        </div>
      </Panel>
      <Panel title="OSINT Signals" tag="alt-data · sample" accent={C.pink}>
        {OSINT.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 12px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<OSINT.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <div><span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span><div style={{font:`400 9px ${MONO}`,color:C.faint}}>{r[3]}</div></div>
          <span style={{font:`600 11px ${MONO}`,color:C.dim}}>{r[1]}</span><span style={{font:`600 9px ${MONO}`,color:ARR[r[2]][1]}}>{ARR[r[2]][0]}</span></div>))}
      </Panel>
    </div>
    <Panel title="Scenario Odds → Asset Impact" tag="sample · tail map" accent={C.red}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 44px 52px 52px 52px 60px",gap:8,alignItems:"center",padding:"0 0 7px",borderBottom:`1px solid ${C.line}`}}>
        <span style={{font:`600 9px ${SANS}`,color:C.faint}}>scenario</span>
        <span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>prob</span>
        <span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>oil</span>
        <span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>S&P</span>
        <span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>gold</span>
        <span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>defense</span>
      </div>
      {SCENARIOS.map((r,i)=>{const pc=r[1]>25?C.red:r[1]>12?C.amber:C.dim;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 44px 52px 52px 52px 60px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<SCENARIOS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <span style={{font:`600 11px ${MONO}`,color:pc,textAlign:"right"}}>{r[1]}%</span>
          <span style={{font:`600 10px ${MONO}`,color:C.teal,textAlign:"right"}}>{r[2]}</span>
          <span style={{font:`600 10px ${MONO}`,color:C.red,textAlign:"right"}}>{r[3]}</span>
          <span style={{font:`600 10px ${MONO}`,color:C.amber,textAlign:"right"}}>{r[4]}</span>
          <span style={{font:`600 10px ${MONO}`,color:C.amber,textAlign:"right"}}>{r[5]}</span>
        </div>);})}
    </Panel>
    <div style={grid2}>
      <Panel title="Safe-Haven Linkage Model" tag="if geo escalates →" accent={C.blue}>
        {LINKAGE.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"120px 20px 1fr",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<LINKAGE.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:r[3]}}>{r[0]}</span>
          <span style={{font:`700 13px ${MONO}`,color:r[1]==="+"?C.teal:C.red}}>{r[1]}</span>
          <span style={{font:`400 10px ${SANS}`,color:C.dim}}>{r[2]}</span></div>))}
      </Panel>
      <Panel title="Maritime Chokepoints" tag="supply-chain tails" accent={C.cyan}>
        {[["Strait of Hormuz","elevated"],["Taiwan Strait","watch"],["Red Sea / Bab-el-Mandeb","elevated"],["Suez Canal","watch"],["Panama Canal","clear"],["Black Sea / Ukraine","elevated"]].map((r,i,arr)=>{const rc=r[1]==="elevated"?C.amber:r[1]==="watch"?C.blue:C.teal;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span><Chip label={r[1]} tone={rc}/></div>);})}
      </Panel>
    </div>
  </div>);
}

function Predict(){
  const tone=g=>g==="Fed Path"?C.amber:g==="Market & Crash"?C.red:C.violet;
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    {Object.entries(PREDICT).map(([grp,rows])=>(
      <Panel key={grp} title={grp} tag="sample · live via API" accent={tone(grp)} sub="implied probability">
        {rows.map((r,i)=><ProbBar key={i} q={r[0]} prob={r[1]} chg={r[2]} src={r[3]} tone={tone(grp)}/>)}
      </Panel>))}
   </div>
   <div style={grid2}>
    <Panel title="Multi-Venue Arbitrage" tag="Kalshi vs Poly vs CME" accent={C.cyan} sub="cross-venue spread">
      {VENUE.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto 40px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<VENUE.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{r[1]}</span>
        <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{r[2]}</span>
        <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{r[3]}</span>
        <Chip label={r[4]} tone={r[4].startsWith("3")?C.amber:C.teal}/>
      </div>))}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Wider cross-venue spreads = disagreement / potential edge; tight spreads = consensus-priced.</div>
    </Panel>
    <Panel title="Calibration Track Record" tag="accuracy by class" accent={C.blue} sub="Brier · hit-rate">
      {CALIB.map((r,i)=>{const c=r[2]>85?C.teal:r[2]>72?C.amber:C.red;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"120px 54px 1fr 34px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<CALIB.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <span style={{font:`500 10px ${MONO}`,color:C.dim}}>Brier {r[1]}</span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[2]}%`,background:c,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 10px ${MONO}`,color:c,textAlign:"right"}}>{r[2]}%</span>
        </div>);})}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Fed-path markets are best-calibrated; geopolitical binaries the least — weight them accordingly.</div>
    </Panel>
   </div>
  </div>);
}

/* ═══════════════  SHELL  ═══════════════ */
const ENGINES=[
  {id:"HOME",label:"Overview",c:C.teal},
  {id:"RSK",label:"Master Risk",c:C.red},{id:"XAS",label:"Cross-Asset",c:C.cyan},
  {id:"LIQ",label:"Liquidity",c:C.cyan},{id:"FED",label:"Fed & Dots",c:C.amber},
  {id:"MAC",label:"Macro Board",c:C.blue},{id:"CAL",label:"Econ Calendar",c:C.pink},
  {id:"RTS",label:"Rates & Curve",c:C.amber},{id:"CRD",label:"Credit & Funding",c:C.red},
  {id:"CMD",label:"Commodities",c:C.teal},{id:"FXC",label:"FX & Carry",c:C.cyan},
  {id:"VOL",label:"Volatility",c:C.violet},
  {id:"ERN",label:"Earnings",c:C.blue},{id:"SEC",label:"Sectors & Themes",c:C.violet},
  {id:"POS",label:"Positioning",c:C.violet},{id:"INT",label:"Internals",c:C.cyan},
  {id:"VAL",label:"Valuation",c:C.red},
  {id:"TRG",label:"De-Risk Calendar",c:C.amber},{id:"REG",label:"Regime",c:C.teal},
  {id:"GMC",label:"Global Macro",c:C.blue},{id:"GLB",label:"Global Risk",c:C.red},
  {id:"GEO",label:"Geopolitical",c:C.pink},{id:"PRD",label:"Prediction Mkts",c:C.violet},
];

export default function TheDesk(){
  const [eng,setEng]=useState("HOME");
  const [m,setM]=useState({fedBS:6.62,tga:0.80,rrp:0.15,reserves:3.10,funds:3.63,y3m:3.70,y2:3.95,y10:4.30,y30:4.58,real10:1.88,hyOAS:288,igOAS:96,bbbOAS:132,ism:49.5,gdpnow:1.1,corePCE:3.4,unemp:4.3,oil:82});
  const set=(k,d)=>setM(p=>({...p,[k]:+(p[k]+d).toFixed(2)}));
  const [live,setLive]=useState(null);
  const [status,setStatus]=useState("loading");
  useEffect(()=>{let on=true;
    const load=()=>fetch("/api/data").then(r=>r.json()).then(d=>{if(!on)return;
      if(d&&d.ok){ if(d.m&&Object.keys(d.m).length)setM(p=>({...p,...d.m}));
        setLive({board:d.board||{},meta:d.meta||{},z:d.z||{}}); setStatus("live"); }
      else setStatus("sample");
    }).catch(()=>{on&&setStatus("error");});
    load(); const id=setInterval(load,1800000); return()=>{on=false;clearInterval(id);};
  },[]);
  const [bio,setBio]=useState(null);
  useEffect(()=>{let on=true;
    Promise.all([fetch("/api/fda").then(r=>r.json()).catch(()=>({rows:[]})),fetch("/api/trials").then(r=>r.json()).catch(()=>({rows:[]}))])
      .then(([f,t])=>{if(on)setBio({fda:f.rows||[],trials:t.rows||[]});});
    return()=>{on=false;};
  },[]);
  const [quotes,setQuotes]=useState({});
  useEffect(()=>{let on=true;
    const load=()=>fetch("/api/finnhub").then(r=>r.json()).then(d=>{if(on&&d&&d.quotes)setQuotes(d.quotes);}).catch(()=>{});
    load(); const id=setInterval(load,300000); return()=>{on=false;clearInterval(id);};
  },[]);
  const [eia,setEia]=useState({});
  useEffect(()=>{let on=true;
    fetch("/api/eia").then(r=>r.json()).then(d=>{if(on&&d&&d.series)setEia(d.series);}).catch(()=>{});
    return()=>{on=false;};
  },[]);
  const net=m.fedBS-m.tga-m.rrp, chg13=net-(LIQ_SERIES[LIQ_SERIES.length-14]?.net??net);
  const g=.4*((m.ism-50)/6)+.4*((m.gdpnow-2)/2)-.2*((m.unemp-4)/1);
  const inf=.6*((m.corePCE-2)/2)+.4*((m.oil-70)/25);
  const defensive=(inf>.15&&g<0)||m.hyOAS>320||chg13<-.15;
  const posture=defensive?"Reduce beta · up-in-quality":g>.1&&inf<.2?"Add beta · pro-cyclical":"Neutral · selective";
  const pc=defensive?C.amber:posture.startsWith("Add")?C.teal:C.dim;
  const tape=[["Net Liq",`$${fmt(net,2)}T`,chg13<0?C.red:C.teal],["2s10s",`${(m.y10-m.y2)*100>=0?"+":""}${fmt((m.y10-m.y2)*100,0)}bp`,C.txt],["Funds",`${fmt(m.funds,2)}%`,C.amber],["Core PCE",`${fmt(m.corePCE,1)}%`,m.corePCE>3?C.red:C.teal],["WTI",`$${fmt(m.oil,0)}`,m.oil>85?C.red:C.txt],["HY OAS",`${fmt(m.hyOAS,0)}bp`,m.hyOAS>300?C.red:C.teal],["GDPNow",`${fmt(m.gdpnow,1)}%`,m.gdpnow<1.5?C.amber:C.teal]];
  let View;
  if(eng==="LIQ")View=<Liquidity m={m}/>;else if(eng==="FED")View=<FedDots m={m}/>;else if(eng==="MAC")View=<Macro live={live?.board||{}}/>;
  else if(eng==="ERN")View=<Earnings/>;else if(eng==="SEC")View=<SectorsThemes bio={bio} quotes={quotes}/>;else if(eng==="POS")View=<Positioning/>;
  else if(eng==="INT")View=<Internals/>;else if(eng==="VAL")View=<Valuation/>;else if(eng==="TRG")View=<Triggers posture={posture} pc={pc}/>;
  else if(eng==="REG")View=<Regime m={m}/>;else if(eng==="GLB")View=<Global/>;else if(eng==="GEO")View=<Geo/>;else if(eng==="PRD")View=<Predict/>;
  else if(eng==="RTS")View=<Rates m={m}/>;else if(eng==="CRD")View=<Credit m={m}/>;else if(eng==="CMD")View=<Commodities m={m} eia={eia}/>;else if(eng==="FXC")View=<FXDesk/>;else if(eng==="VOL")View=<Volatility/>;
  else if(eng==="GMC")View=<GlobalMacro/>;else if(eng==="CAL")View=<Calendar/>;else if(eng==="XAS")View=<CrossAsset m={m}/>;else if(eng==="RSK")View=<MasterRisk m={m}/>;else View=<Cockpit m={m} posture={posture} pc={pc} go={setEng} quotes={quotes} zdata={live?.z||{}}/>;
  return(
    <div style={{background:C.bg0,minHeight:"100vh",color:C.txt,fontFamily:SANS,padding:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10}}><span style={{font:`700 17px ${SANS}`,letterSpacing:-.3,color:C.txt}}>THE DESK</span><span style={{font:`600 10px ${MONO}`,color:C.faint}}>2.0 · macro/sector engine</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{font:`500 10px ${MONO}`,color:C.faint}}>posture</span><Chip label={posture} tone={pc}/><Chip label={status==="live"?"● LIVE · FRED":status==="loading"?"○ loading…":status==="error"?"● offline · sample":"● sample"} tone={status==="live"?C.teal:status==="error"?C.red:C.dim}/>{Object.keys(quotes).length>0&&<Chip label={`● ${Object.keys(quotes).length} quotes · Finnhub`} tone={C.cyan}/>}<span style={{font:`500 10px ${MONO}`,color:C.faint}}>{live?.meta?.fetchedAt?new Date(live.meta.fetchedAt).toLocaleString():"as of 30 Aug 2026"}</span></div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",background:C.bg1,border:`1px solid ${C.line}`,borderRadius:6,overflow:"hidden",marginBottom:12}}>
        {tape.map((t,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",gap:2,padding:"8px 15px",borderRight:i<tape.length-1?`1px solid ${C.lineSoft}`:"none",flex:"1 1 auto"}}><span style={{font:`500 9px ${SANS}`,color:C.dim}}>{t[0]}</span><span style={{font:`600 14px ${MONO}`,color:t[2]}}>{t[1]}</span></div>))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {ENGINES.map(e=>{const on=e.id===eng;return(<button key={e.id} onClick={()=>setEng(e.id)} style={{font:`600 11px ${SANS}`,color:on?C.bg0:C.dim,background:on?e.c:C.bg1,border:`1px solid ${on?e.c:C.line}`,borderRadius:5,padding:"7px 13px",cursor:"pointer"}}>{e.label}</button>);})}
      </div>
      <div style={{marginBottom:12}}>{View}</div>
      <Panel title="Assumptions" tag="drives every engine live" accent={C.dim} sub="nudge to re-rank rotation, shift regime & posture">
        <div style={{display:"flex",gap:22,flexWrap:"wrap"}}>
          <Step label="WTI crude" val={fmt(m.oil,0)} u="$" onDown={()=>set("oil",-2)} onUp={()=>set("oil",2)}/>
          <Step label="Core PCE" val={fmt(m.corePCE,1)} u="%" onDown={()=>set("corePCE",-.1)} onUp={()=>set("corePCE",.1)}/>
          <Step label="ISM" val={fmt(m.ism,1)} u="" onDown={()=>set("ism",-.5)} onUp={()=>set("ism",.5)}/>
          <Step label="GDPNow" val={fmt(m.gdpnow,1)} u="%" onDown={()=>set("gdpnow",-.2)} onUp={()=>set("gdpnow",.2)}/>
          <Step label="Fed funds" val={fmt(m.funds,2)} u="%" onDown={()=>set("funds",-.25)} onUp={()=>set("funds",.25)}/>
          <Step label="HY OAS" val={fmt(m.hyOAS,0)} u="bp" onDown={()=>set("hyOAS",-10)} onUp={()=>set("hyOAS",10)}/>
        </div>
      </Panel>
      <div style={{font:`400 10px ${MONO}`,color:C.faint,marginTop:12,textAlign:"center"}}>seeded with representative Aug-2026 values · panels tagged “sample” populate from live APIs on deploy · not investment advice</div>
    </div>
  );
}

/* ═══════════════  PHASE-2 DATA  ═══════════════ */
const RCURVE=[["1m",4.05,4.02],["3m",3.70,3.75],["6m",3.62,3.70],["1y",3.72,3.85],["2y",3.95,4.05],["3y",3.98,4.06],["5y",4.05,4.10],["7y",4.15,4.18],["10y",4.30,4.28],["20y",4.55,4.50],["30y",4.58,4.52]];
const RSPREADS=[["2s10s","+35","bp","steepening"],["3m10s","+60","bp","dis-inverted"],["5s30s","+53","bp","steep"],["2s5s10s fly","−9","bp","cheap belly"]];
const RREAL=[["10y real (TIPS)","1.88%","u"],["5y5y breakeven","2.42%","f"],["10y breakeven","2.35%","f"],["Term premium (ACM)","0.42%","u"]];
const GSOV=[["US 10y",4.30,2],["Germany 10y",2.55,-3],["Japan 10y",1.42,4],["UK 10y",4.18,1],["France 10y",3.10,2],["Italy 10y",3.75,-1],["Spain 10y",3.28,0],["China 10y",1.72,-2]];
const MOVEIDX=98;

const CSPREADS=[["IG (BAML OAS)",96,45],["BBB",132,52],["HY (BAML OAS)",288,38],["CCC & lower",760,55],["EM $ sovereign",312,48],["Muni (AAA)",68,30]];
const CDX=[["CDX IG",58,"bp","f"],["CDX HY",342,"bp","f"],["iTraxx Main",62,"bp","f"],["iTraxx XO",298,"bp","f"]];
const CREDITCYCLE=[["HY default rate","3.1%","a"],["Distress ratio","5.8%","a"],["Downgrade / upgrade","1.4x","a"],["IG net issuance","$42B","n"],["HY issuance (YTD)","$210B","u"],["Fallen angels","$14B","f"]];
const FUNDING=[["SOFR","4.88%","f"],["FRA-OIS","24bp","f"],["EUR x-ccy basis","−18bp","f"],["JPY x-ccy basis","−42bp","a"],["CP spread","12bp","f"],["Bank CDS (avg)","62bp","f"]];

const ENERGY=[["WTI crude","82.0","$/bbl"],["Brent","86.0","$/bbl"],["WTI–Brent","−4.0","$"],["Nat gas (HH)","2.90","$/mmBtu"],["TTF (EU gas)","34.0","€/MWh"],["3-2-1 crack","24.0","$/bbl"],["Gasoline (RBOB)","2.35","$/gal"]];
const EINV=[["Crude inventory","−2.1M","d","draw"],["Gasoline","+0.8M","u","build"],["Cushing hub","−1.2M","d","tightening"],["SPR","+0.3M","u","refill"]];
const METALS=[["Gold","2680","$/oz"],["Silver","31.2","$/oz"],["Copper","4.35","$/lb"],["Platinum","985","$/oz"],["Gold/Silver","85.9","x"],["Gold/Copper","616","x"]];
const AGS=[["Wheat","5.85","$/bu"],["Corn","4.12","$/bu"],["Soybeans","10.40","$/bu"],["Sugar","0.19","$/lb"],["Coffee","2.42","$/lb"]];
const CMDCURVE=[["Crude (WTI)","backwardation","g","tight prompt"],["Nat gas","contango","a","winter premium"],["Gold","contango","n","positive carry"],["Copper","backwardation","g","spot tightness"]];
const CMDCOT=[["Crude","net long","+","specs building"],["Gold","net long","+","haven demand"],["Copper","net short","−","growth doubt"],["Nat gas","net short","−","oversupply"]];

const FXG10=[["EUR/USD","1.085",-3.1,-1.75],["USD/JPY","148.2",8.4,2.90],["GBP/USD","1.272",-1.2,-0.15],["USD/CHF","0.885",2.1,3.10],["USD/CAD","1.362",3.0,1.50],["AUD/USD","0.658",-2.4,-0.60],["NZD/USD","0.598",-3.0,-0.55]];
const FXEM=[["USD/CNY","7.18",1.9],["USD/MXN","18.9",6.1],["USD/BRL","5.42",-4.8],["USD/INR","83.6",1.2],["USD/ZAR","18.3",5.3],["USD/TRY","34.2",22.0]];
const FXVAL=[["USD (DXY)","+8% vs PPP","rich"],["JPY","−22% vs PPP","cheap"],["EUR","−4% vs PPP","fair"],["GBP","−6% vs PPP","cheap"],["CNY","−9% vs PPP","cheap"]];
const FXVOL=[["JPM G7 vol","8.4","f"],["EUR/USD 1m","6.9","f"],["USD/JPY 1m","10.2","u"],["EM FX vol","9.8","u"],["25Δ RR (JPY calls)","−1.8","a"]];

const VTERM=[["VIX9D",16.2],["VIX",17.8],["VIX3M",19.6],["VIX6M",21.1],["VIX1Y",22.0]];
const XVOL=[["VIX · equity",17.8,"f"],["MOVE · rates",98,"f"],["CVIX · FX",7.8,"f"],["OVX · oil",31,"u"],["GVZ · gold",16,"f"],["VVIX · vol-of-vol",95,"f"]];
const VSKEW=[["CBOE SKEW","142","elevated tail bid"],["Put/Call · equity","0.94","defensive"],["Put/Call · index","1.28","hedged"],["Vol risk premium","+4.2","implied > realized"],["Implied corr (COR)","0.31","low → dispersion"],["Gamma flip vs spot","−132","short-gamma zone"]];

const COUNTRIES=[["United States","US",1.4,3.1,3.63,4.3,49.5],["Euro Area","EU",0.6,2.4,3.15,6.4,47.8],["China","CN",4.7,0.4,3.10,5.1,50.4],["Japan","JP",0.9,2.8,0.50,2.5,49.1],["United Kingdom","UK",0.8,2.9,4.00,4.4,48.3],["India","IN",6.8,4.9,6.50,7.8,56.2],["Brazil","BR",2.3,4.2,10.50,7.6,50.8]];
const CBTRACK=[["Fed","3.63%","hawk","Sep 16","hold"],["ECB","3.15%","neutral","Oct 16","−25"],["BoE","4.00%","neutral","Sep 18","−25"],["BoJ","0.50%","hawk","Oct 30","+25"],["PBoC","3.10%","dove","Q4","−25 RRR"],["SNB","1.00%","dove","Sep 25","−25"],["BoC","3.25%","neutral","Oct 22","hold"],["RBA","3.85%","hawk","Oct 07","hold"],["RBI","6.50%","neutral","Oct 08","hold"],["Copom (BR)","10.50%","hawk","Nov 05","+25"]];
const GPMI=[["United States",49.5,51.2],["Euro Area",47.8,50.1],["China",50.4,51.8],["Japan",49.1,52.0],["UK",48.3,52.5],["India",56.2,58.1],["Germany",45.2,49.8],["Global",50.1,52.2]];

const UPCOMING=[["Sep 02","ISM Manufacturing","49.8","49.5","h"],["Sep 05","Nonfarm Payrolls","110k","95k","h"],["Sep 05","Unemployment rate","4.3%","4.3%","h"],["Sep 11","CPI m/m","0.3%","0.2%","h"],["Sep 11","Core CPI y/y","3.2%","3.3%","h"],["Sep 16","FOMC decision","hold","—","h"],["Sep 16","SEP / dot plot","—","—","h"],["Sep 17","Retail sales m/m","0.2%","0.1%","m"],["Sep 26","Core PCE y/y","3.3%","3.4%","h"],["Oct 03","Jobs report","—","—","h"]];
const RECENT=[["Aug 28","GDP Q2 (2nd est)","1.4%","1.2%","+"],["Aug 27","Consumer confidence","98.4","100.1","−"],["Aug 26","Durable goods","−0.4%","0.1%","−"],["Aug 22","Initial claims","238k","232k","−"],["Aug 15","Retail sales","0.1%","0.3%","−"],["Aug 14","CPI y/y","3.1%","3.0%","−"]];
const CITI_HIST=[-2,-5,-3,-8,-6,-11,-9,-14,-12,-16,-14,-13,-14];
const COUNTDOWN=[["Next jobs","Sep 05","5d",C.blue],["Next CPI","Sep 11","11d",C.red],["Next FOMC","Sep 16","16d",C.amber],["Next Core PCE","Sep 26","26d",C.red]];

const XASSETS=["SPX","UST 10y","HY cr","Gold","Oil","USD","BTC","VIX"];
const CORR=[
[1.00,-0.32,0.68,0.14,0.28,-0.24,0.46,-0.82],
[-0.32,1.00,-0.18,0.34,-0.12,-0.08,-0.05,0.30],
[0.68,-0.18,1.00,0.06,0.30,-0.20,0.38,-0.60],
[0.14,0.34,0.06,1.00,0.22,-0.44,0.26,0.10],
[0.28,-0.12,0.30,0.22,1.00,-0.10,0.18,-0.16],
[-0.24,-0.08,-0.20,-0.44,-0.10,1.00,-0.22,0.20],
[0.46,-0.05,0.38,0.26,0.18,-0.22,1.00,-0.34],
[-0.82,0.30,-0.60,0.10,-0.16,0.20,-0.34,1.00],
];
const QUILT=[["US Equity",-0.8,1.2,4.1,11.2],["Dev ex-US",0.3,0.9,3.2,8.1],["EM Equity",1.1,2.4,5.8,9.4],["US Agg Bond",0.4,-0.6,1.1,3.2],["HY Credit",0.2,0.4,2.1,5.6],["Gold",1.4,3.1,8.2,21.0],["Commodities",0.9,-1.2,2.4,9.1],["USD (DXY)",-0.3,1.1,2.0,4.2],["Bitcoin",2.1,-4.8,12.0,28.0],["US REITs",-1.2,-0.8,1.4,3.1]];
const QCOLS=["1w","1m","3m","YTD"];
const FCI_HIST=[-0.20,-0.15,-0.10,-0.05,0.02,0.05,0.10,0.08,0.14,0.18,0.22,0.20,0.26,0.24,0.30,0.28,0.34,0.32,0.36,0.33,0.38,0.35,0.40,0.37,0.42,0.44];

/* ═══════════════  PHASE-2 HELPERS  ═══════════════ */
function ScoreBar({k,val,tone,note}){
  return(<div style={{display:"grid",gridTemplateColumns:"128px 1fr 34px",alignItems:"center",gap:8,padding:"7px 0"}}>
    <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{k}{note&&<span style={{color:C.faint,fontSize:9,marginLeft:5,fontFamily:MONO}}>{note}</span>}</span>
    <div style={{height:7,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${clamp(val,0,100)}%`,background:tone,opacity:.82,borderRadius:3}}/></div>
    <span style={{font:`600 12px ${MONO}`,color:tone,textAlign:"right"}}>{Math.round(val)}</span>
  </div>);
}
const heatRet=v=>{const al=clamp(Math.abs(v)/8,.08,.8);return v>=0?`rgba(63,191,147,${al})`:`rgba(224,96,90,${al})`;};
const heatCorr=v=>{if(v>=0){const al=clamp(v,.05,.85);return `rgba(224,96,90,${al})`;}const al=clamp(-v,.05,.85);return `rgba(75,140,220,${al})`;};

/* ═══════════════  PHASE-2 ENGINES  ═══════════════ */
function Rates({m}){
  const rmin=1.2,rmax=4.8;
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="US Treasury Curve" tag="FRED · live" accent={C.amber} sub="now vs 1-month ago">
      <div style={{height:150,width:"100%"}}><ResponsiveContainer>
        <LineChart data={RCURVE.map(r=>({t:r[0],now:r[1],prior:r[2]}))} margin={{top:6,right:10,left:-20,bottom:0}}>
          <XAxis dataKey="t" {...chartAxis}/><YAxis {...chartAxis} domain={[3.4,4.8]} width={38}/>
          <Tooltip content={<TT/>}/>
          <Line type="monotone" dataKey="prior" stroke={C.faint} strokeWidth={1.2} strokeDasharray="4 3" dot={false}/>
          <Line type="monotone" dataKey="now" stroke={C.amber} strokeWidth={1.9} dot={{r:2,fill:C.amber}}/>
        </LineChart></ResponsiveContainer></div>
      <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:2}}><span style={{font:`500 10px ${MONO}`,color:C.amber}}>— now</span><span style={{font:`500 10px ${MONO}`,color:C.faint}}>— — 1m ago</span></div>
    </Panel>
    <Panel title="Curve Spreads" tag="shape & trades" accent={C.amber}>
      {RSPREADS.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<RSPREADS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 13px ${MONO}`,color:r[0].includes("2s10s")||r[0].includes("3m10s")?C.teal:C.txt}}>{r[1]}<span style={{color:C.faint,fontSize:9,marginLeft:2}}>{r[2]}</span></span>
        <Chip label={r[3]} tone={C.dim}/></div>))}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Real Yields & Inflation" tag="TIPS · breakevens" accent={C.cyan}>
      {RREAL.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={RREAL.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Positive real 10y ~1.9% + anchored breakevens = restrictive but not disorderly; the term-premium rebuild is the story to watch.</div>
    </Panel>
    <Panel title="Global Sovereigns" tag="10y · Δ1m bp" accent={C.blue}>
      {GSOV.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<GSOV.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{fmt(r[1],2)}%</span>
        <span style={{font:`600 10px ${MONO}`,color:r[2]>=0?C.red:C.teal,minWidth:34,textAlign:"right"}}>{r[2]>=0?"+":""}{r[2]}</span></div>))}
    </Panel>
    <Panel title="Rate Volatility" tag="MOVE index" accent={C.violet}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"6px 0"}}>
        <Gauge value={clamp((MOVEIDX-50)/1.5,0,100)} color={MOVEIDX>120?C.red:MOVEIDX>90?C.amber:C.teal} cap={`${MOVEIDX}`}/>
        <Chip label={MOVEIDX>120?"stressed":MOVEIDX>90?"elevated":"calm"} tone={MOVEIDX>120?C.red:MOVEIDX>90?C.amber:C.teal}/>
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:6}}>MOVE ~98 — rate vol above the calm-regime line; a leading tell for risk assets when it breaks higher.</div>
    </Panel>
   </div>
  </div>);
}

function Credit({m}){
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Credit Spreads" tag="OAS · percentile vs 10y" accent={C.red} sub="live where FRED-backed">
      {CSPREADS.map((r,i)=>{const c=r[2]>70?C.red:r[2]>45?C.amber:C.teal;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"140px 62px 1fr 34px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<CSPREADS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{r[1]}<span style={{color:C.faint,fontSize:9,marginLeft:2}}>bp</span></span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${r[2]}%`,background:c,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 10px ${MONO}`,color:c,textAlign:"right"}}>{r[2]}%</span>
        </div>);})}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>HY at the ~38th percentile — still complacent vs history; the widening, not the level, is the signal.</div>
    </Panel>
    <Panel title="Credit Derivatives" tag="CDX · iTraxx" accent={C.amber}>
      {CDX.map((r,i)=><KV key={i} k={r[0]} v={`${r[1]} ${r[2]}`} arrow={r[3]} tone={C.txt} i={i} n={CDX.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Index CDS calm and tracking cash spreads — no basis stress signalling forced selling yet.</div>
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Credit Cycle" tag="defaults · issuance" accent={C.red}>
      {CREDITCYCLE.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={CREDITCYCLE.length}/>)}
    </Panel>
    <Panel title="Funding & Plumbing" tag="dollar / basis stress" accent={C.cyan}>
      {FUNDING.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={FUNDING.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>FRA-OIS contained; JPY cross-currency basis is the one to watch into any risk-off dollar squeeze.</div>
    </Panel>
   </div>
  </div>);
}

function Commodities({m,eia={}}){
  const E=eia||{}, hasE=Object.keys(E).length>0;
  const eKey={"WTI crude":"wti","Brent":"brent","Nat gas (HH)":"henryhub"};
  const eVal=(r)=>{ if(r[0]==="WTI–Brent"&&E.wti&&E.brent)return {v:fmt(E.wti.value-E.brent.value,1),live:true};
    const k=eKey[r[0]]; if(k&&E[k])return {v:fmt(E[k].value,2),live:true}; return {v:r[1],live:false}; };
  const INV=[["Crude oil","crude"],["Cushing hub","cushing"],["Gasoline","gasoline"],["Distillate","distillate"],["SPR","spr"]];
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Energy Complex" tag={hasE?"live · EIA + FRED":"WTI · FRED live"} accent={C.teal}>
      {ENERGY.map((r,i)=>{const e=eVal(r);return(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 10px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<ENERGY.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{e.v}<span style={{color:C.faint,fontSize:9,marginLeft:3}}>{r[2]}</span></span>
        <span style={{width:6,height:6,borderRadius:"50%",background:e.live?C.cyan:"transparent"}}/></div>);})}
    </Panel>
    <Panel title="Petroleum Status (EIA)" tag={hasE?`live · wk ${E.crude?.period||""}`:"sample · weekly Δ"} accent={C.cyan}>
      {hasE?(<>
        {INV.map((r,i)=>{const s=E[r[1]];if(!s)return null;const v=s.value/1000,chg=s.change!=null?s.change/1000:null,draw=chg!=null&&chg<0;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto 60px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.lineSoft}`}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
            <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{fmt(v,1)}<span style={{color:C.faint,fontSize:9,marginLeft:2}}>Mbbl</span></span>
            <span style={{font:`600 11px ${MONO}`,color:chg==null?C.faint:draw?C.teal:C.amber}}>{chg==null?"—":`${chg>=0?"+":""}${fmt(chg,1)}`}</span>
            <Chip label={chg==null?"—":draw?"draw":"build"} tone={draw?C.teal:C.amber}/></div>);})}
        {E.refutil&&<KV k="Refinery utilization" v={`${fmt(E.refutil.value,1)}%`} tone={C.txt} i={0} n={3}/>}
        {E.production&&<KV k="Crude production" v={`${fmt(E.production.value/1000,1)} Mbbl/d`} tone={C.txt} i={1} n={3}/>}
        {E.natgasstorage&&<KV k="Nat-gas storage" v={`${fmt(E.natgasstorage.value,0)} Bcf${E.natgasstorage.change!=null?`  (${E.natgasstorage.change>=0?"+":""}${fmt(E.natgasstorage.change,0)})`:""}`} tone={C.txt} i={2} n={3}/>}
      </>):(EINV.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto 12px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<EINV.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{r[1]}</span>
        <Chip label={r[3]} tone={r[3]==="draw"||r[3]==="tightening"?C.teal:C.amber}/>
        <span style={{font:`600 9px ${MONO}`,color:ARR[r[2]][1]}}>{ARR[r[2]][0]}</span></div>)))}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Metals & Ratios" tag="growth / haven reads" accent={C.amber}>
      {METALS.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<METALS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:r[0].includes("Gold")?C.amber:C.txt}}>{r[1]}<span style={{color:C.faint,fontSize:9,marginLeft:3}}>{r[2]}</span></span></div>))}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:6}}>Gold/copper elevated = market pricing haven over growth; watch Dr. Copper for the turn.</div>
    </Panel>
    <Panel title="Agriculture" tag="food complex" accent={C.teal}>
      {AGS.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<AGS.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.dim}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{r[1]}<span style={{color:C.faint,fontSize:9,marginLeft:3}}>{r[2]}</span></span></div>))}
    </Panel>
    <Panel title="Curve & Positioning" tag="term structure · COT" accent={C.violet}>
      {CMDCURVE.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 12px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<CMDCURVE.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <Chip label={r[1]} tone={r[1]==="backwardation"?C.teal:r[1]==="contango"?C.amber:C.dim}/>
        <span style={{font:`600 9px ${MONO}`,color:ARR[r[2]][1]}}>{ARR[r[2]][0]}</span></div>))}
      <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:6}}>
        {CMDCOT.map((r,i)=><Chip key={i} label={`${r[0]}: ${r[1]}`} tone={r[2]==="+"?C.teal:C.red}/>)}
      </div>
    </Panel>
   </div>
  </div>);
}

function FXDesk(){
  const carry=[...FXG10].sort((a,b)=>Math.abs(b[3])-Math.abs(a[3]));
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="G10 FX" tag="spot · YTD% · 2y diff vs US" accent={C.cyan}>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.line}`}}>
        <span style={{font:`600 9px ${SANS}`,color:C.faint}}>pair</span><span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>spot</span><span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>YTD</span><span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>2y diff</span>
      </div>
      {FXG10.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<FXG10.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 11px ${MONO}`,color:C.txt,textAlign:"right"}}>{r[1]}</span>
        <span style={{font:`600 10px ${MONO}`,color:r[2]>=0?C.teal:C.red,textAlign:"right"}}>{r[2]>=0?"+":""}{fmt(r[2],1)}</span>
        <span style={{font:`600 10px ${MONO}`,color:r[3]>=0?C.teal:C.red,textAlign:"right"}}>{r[3]>=0?"+":""}{fmt(r[3],2)}</span></div>))}
    </Panel>
    <Panel title="EM FX" tag="spot · YTD%" accent={C.red}>
      {FXEM.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<FXEM.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`600 12px ${MONO}`,color:C.txt}}>{r[1]}</span>
        <span style={{font:`600 10px ${MONO}`,color:r[2]<=0?C.teal:C.red,minWidth:44,textAlign:"right"}}>{r[2]>=0?"+":""}{fmt(r[2],1)}%</span></div>))}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>TRY & MXN carry the depreciation tail; a firm dollar is the shared pressure point.</div>
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Carry Ranking" tag="by 2y rate differential" accent={C.teal}>
      {carry.map((r,i)=>{const w=clamp(Math.abs(r[3])/3.2*100,6,100);return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"88px 1fr 46px",alignItems:"center",gap:8,padding:"6px 0"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:r[3]>=0?C.teal:C.red,opacity:.8,borderRadius:3}}/></div>
          <span style={{font:`600 11px ${MONO}`,color:r[3]>=0?C.teal:C.red,textAlign:"right"}}>{r[3]>=0?"+":""}{fmt(r[3],2)}</span></div>);})}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:6}}>USD/JPY & USD/CHF the funding-carry extremes; carry works until FX vol spikes.</div>
    </Panel>
    <Panel title="Valuation & Vol" tag="PPP · implied vol" accent={C.violet}>
      <div style={{font:`600 10px ${SANS}`,color:C.dim,marginBottom:4}}>PPP valuation</div>
      {FXVAL.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"64px 1fr auto",gap:8,alignItems:"center",padding:"5px 0"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <span style={{font:`500 10px ${MONO}`,color:C.dim}}>{r[1]}</span>
        <Chip label={r[2]} tone={r[2]==="cheap"?C.teal:r[2]==="rich"?C.red:C.dim}/></div>))}
      <div style={{font:`600 10px ${SANS}`,color:C.dim,margin:"8px 0 4px"}}>Implied vol</div>
      {FXVOL.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={FXVOL.length}/>)}
    </Panel>
   </div>
  </div>);
}

function Volatility(){
  const tmax=Math.max(...VTERM.map(v=>v[1])),tmin=Math.min(...VTERM.map(v=>v[1]));
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Equity Vol Term Structure" tag="VIX complex" accent={C.violet} sub="contango = calm">
      <div style={{height:140,width:"100%"}}><ResponsiveContainer>
        <LineChart data={VTERM.map(v=>({t:v[0],v:v[1]}))} margin={{top:6,right:10,left:-22,bottom:0}}>
          <XAxis dataKey="t" {...chartAxis}/><YAxis {...chartAxis} domain={[14,24]} width={36}/>
          <Tooltip content={<TT/>}/><Line type="monotone" dataKey="v" stroke={C.violet} strokeWidth={1.9} dot={{r:2.5,fill:C.violet}}/>
        </LineChart></ResponsiveContainer></div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:4}}>Upward-sloping (contango) — no near-term panic priced; a flip to backwardation is the stress tell.</div>
    </Panel>
    <Panel title="Cross-Asset Vol" tag="equity · rates · FX · commod" accent={C.blue}>
      {XVOL.map((r,i)=><KV key={i} k={r[0]} v={r[1]} arrow={r[2]} tone={C.txt} i={i} n={XVOL.length}/>)}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Oil vol (OVX) the outlier bid — geopolitical premium bleeding into the vol surface.</div>
    </Panel>
   </div>
   <Panel title="Skew, Premium & Dealer Positioning" tag="the tails" accent={C.red}>
     <div style={grid2}>
       {VSKEW.map((r,i)=>(<div key={i} style={{background:C.bg2,border:`1px solid ${C.lineSoft}`,borderRadius:5,padding:"9px 11px"}}>
         <div style={{font:`500 10px ${SANS}`,color:C.dim}}>{r[0]}</div>
         <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:3}}>
           <span style={{font:`600 15px ${MONO}`,color:C.txt}}>{r[1]}</span>
           <span style={{font:`400 9px ${SANS}`,color:C.faint,textAlign:"right",maxWidth:120}}>{r[2]}</span>
         </div>
       </div>))}
     </div>
   </Panel>
  </div>);
}

function GlobalMacro(){
  const pmiHeat=v=>{const al=clamp(Math.abs(v-50)/8,.08,.7);return v>=50?`rgba(63,191,147,${al})`:`rgba(224,96,90,${al})`;};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <Panel title="Country Scorecards" tag="growth · inflation · policy" accent={C.blue} sub="GDP% · CPI% · policy% · U% · mfg PMI">
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr 1fr 1fr",gap:8,padding:"0 0 7px",borderBottom:`1px solid ${C.line}`}}>
        {["Country","GDP","CPI","Policy","Unemp","PMI"].map((h,i)=><span key={i} style={{font:`600 9px ${SANS}`,color:C.faint,textAlign:i?"right":"left"}}>{h}</span>)}
      </div>
      {COUNTRIES.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr 1fr 1fr",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<COUNTRIES.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,fontFamily:MONO,fontSize:9,marginLeft:5}}>{r[1]}</span></span>
        <span style={{font:`600 11px ${MONO}`,color:r[2]<1?C.amber:C.teal,textAlign:"right"}}>{fmt(r[2],1)}</span>
        <span style={{font:`600 11px ${MONO}`,color:r[3]>3?C.red:C.txt,textAlign:"right"}}>{fmt(r[3],1)}</span>
        <span style={{font:`600 11px ${MONO}`,color:C.txt,textAlign:"right"}}>{fmt(r[4],2)}</span>
        <span style={{font:`600 11px ${MONO}`,color:C.dim,textAlign:"right"}}>{fmt(r[5],1)}</span>
        <span style={{font:`600 11px ${MONO}`,color:r[6]<50?C.red:C.teal,textAlign:"right"}}>{fmt(r[6],1)}</span></div>))}
    </Panel>
    <div style={grid2}>
    <Panel title="Global PMI Heatmap" tag="mfg · services" accent={C.cyan} sub="50 = expansion line">
      <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr 1fr",gap:6,padding:"0 0 6px",borderBottom:`1px solid ${C.line}`}}>
        <span style={{font:`600 9px ${SANS}`,color:C.faint}}>region</span><span style={{font:`600 9px ${SANS}`,color:C.faint,textAlign:"center"}}>mfg</span><span style={{font:`600 9px ${SANS}`,color:C.faint,textAlign:"center"}}>svcs</span>
      </div>
      {GPMI.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1.3fr 1fr 1fr",gap:6,alignItems:"center",padding:"5px 0"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <div style={{background:pmiHeat(r[1]),borderRadius:3,textAlign:"center",padding:"4px 0",font:`600 11px ${MONO}`,color:C.txt}}>{fmt(r[1],1)}</div>
        <div style={{background:pmiHeat(r[2]),borderRadius:3,textAlign:"center",padding:"4px 0",font:`600 11px ${MONO}`,color:C.txt}}>{fmt(r[2],1)}</div></div>))}
    </Panel>
    <Panel title="Central Bank Tracker" tag="policy · bias · next" accent={C.amber}>
      {CBTRACK.map((r,i)=>{const bc=r[2]==="hawk"?C.red:r[2]==="dove"?C.teal:C.dim;return(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<CBTRACK.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
          <span style={{font:`600 11px ${MONO}`,color:C.txt}}>{r[1]}</span>
          <span style={{width:7,height:7,borderRadius:"50%",background:bc}}/>
          <span style={{font:`500 9px ${MONO}`,color:C.dim,minWidth:74,textAlign:"right"}}>{r[3]} · {r[4]}</span></div>);})}
    </Panel>
    </div>
  </div>);
}

function Calendar(){
  const IC={h:C.red,m:C.amber,l:C.dim};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      {COUNTDOWN.map((r,i)=>(<div key={i} style={{flex:"1 1 150px",background:C.bg1,border:`1px solid ${C.line}`,borderLeft:`3px solid ${r[3]}`,borderRadius:6,padding:"10px 13px"}}>
        <div style={{font:`500 10px ${SANS}`,color:C.dim}}>{r[0]}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:3}}><span style={{font:`600 14px ${MONO}`,color:C.txt}}>{r[1]}</span><span style={{font:`600 13px ${MONO}`,color:r[3]}}>{r[2]}</span></div>
      </div>))}
    </div>
    <div style={grid2}>
    <Panel title="Upcoming Releases" tag="consensus vs prior" accent={C.pink} sub="next 5 weeks">
      <div style={{display:"grid",gridTemplateColumns:"48px 1fr auto auto 10px",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.line}`}}>
        {["","release","cons.","prior",""].map((h,i)=><span key={i} style={{font:`600 9px ${SANS}`,color:C.faint,textAlign:i>1&&i<4?"right":"left"}}>{h}</span>)}
      </div>
      {UPCOMING.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"48px 1fr auto auto 10px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<UPCOMING.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`600 10px ${MONO}`,color:C.dim}}>{r[0]}</span>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[1]}</span>
        <span style={{font:`600 10px ${MONO}`,color:C.dim,textAlign:"right"}}>{r[2]}</span>
        <span style={{font:`500 10px ${MONO}`,color:C.faint,textAlign:"right"}}>{r[3]}</span>
        <span style={{width:6,height:6,borderRadius:"50%",background:IC[r[4]]}}/></div>))}
    </Panel>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <Panel title="Recent Surprises" tag="actual vs consensus" accent={C.cyan}>
      {RECENT.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"48px 1fr auto auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<RECENT.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`600 10px ${MONO}`,color:C.dim}}>{r[0]}</span>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[1]}</span>
        <span style={{font:`600 11px ${MONO}`,color:C.txt}}>{r[2]}<span style={{color:C.faint,fontSize:9}}> /{r[3]}</span></span>
        <span style={{font:`700 12px ${MONO}`,color:r[4]==="+"?C.teal:C.red}}>{r[4]}</span></div>))}
    </Panel>
    <Panel title="Surprise Index" tag="Citi-style trend" accent={C.amber}>
      <div style={{height:96,width:"100%"}}><ResponsiveContainer>
        <AreaChart data={CITI_HIST.map((v,i)=>({w:`w${i}`,v}))} margin={{top:6,right:8,left:-24,bottom:0}}>
          <defs><linearGradient id="citi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={.3}/><stop offset="100%" stopColor={C.red} stopOpacity={0}/></linearGradient></defs>
          <XAxis dataKey="w" {...chartAxis} interval={3}/><YAxis {...chartAxis} width={30}/>
          <ReferenceLine y={0} stroke={C.faint}/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="v" stroke={C.red} strokeWidth={1.6} fill="url(#citi)"/>
        </AreaChart></ResponsiveContainer></div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:2}}>Data undershooting consensus for weeks — a soft-data drift that pressures growth-sensitive assets.</div>
    </Panel>
    </div>
    </div>
  </div>);
}

function CrossAsset({m}){
  const fciNow=+((m.real10-1.5)*0.6+(m.hyOAS-260)/100*0.8+(m.funds-3.5)*0.4-(m.gdpnow-2)*0.2).toFixed(2);
  const fciSeries=[...FCI_HIST,fciNow].map((v,i)=>({w:`w${i}`,v}));
  const riskApp=clamp(50-fciNow*30-((m.hyOAS-288)/6)+((m.gdpnow-1.1)*8),2,98);
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={grid2}>
    <Panel title="Cross-Asset Correlation" tag="rolling 60d" accent={C.cyan} sub="red +  ·  blue −">
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:`58px repeat(${XASSETS.length},1fr)`,gap:2,minWidth:420}}>
          <span/>
          {XASSETS.map(a=><span key={a} style={{font:`600 8px ${MONO}`,color:C.dim,textAlign:"center",transform:"rotate(-0deg)"}}>{a}</span>)}
          {CORR.map((row,i)=>(<React.Fragment key={i}>
            <span style={{font:`600 9px ${MONO}`,color:C.dim,display:"flex",alignItems:"center"}}>{XASSETS[i]}</span>
            {row.map((v,j)=>(<div key={j} title={`${XASSETS[i]}/${XASSETS[j]} ${fmt(v,2)}`} style={{background:i===j?C.bg2:heatCorr(v),borderRadius:2,textAlign:"center",padding:"6px 0",font:`600 8px ${MONO}`,color:i===j?C.faint:C.txt}}>{i===j?"—":fmt(v,2).replace("0.",".")}</div>))}
          </React.Fragment>))}
        </div>
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>SPX–VIX deeply inverse (−.82) as expected; SPX–Gold slightly positive = liquidity-driven tape, not classic haven behavior.</div>
    </Panel>
    <Panel title="Returns Quilt" tag="asset-class · % return" accent={C.violet} sub="heat by magnitude">
      <div style={{display:"grid",gridTemplateColumns:"1.4fr repeat(4,1fr)",gap:4,padding:"0 0 5px",borderBottom:`1px solid ${C.line}`}}>
        <span style={{font:`600 9px ${SANS}`,color:C.faint}}>asset</span>
        {QCOLS.map(c=><span key={c} style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"center"}}>{c}</span>)}
      </div>
      {QUILT.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1.4fr repeat(4,1fr)",gap:4,alignItems:"center",padding:"3px 0"}}>
        <span style={{font:`500 10px ${SANS}`,color:C.txt}}>{r[0]}</span>
        {r.slice(1).map((v,j)=>(<div key={j} style={{background:heatRet(v),borderRadius:3,textAlign:"center",padding:"4px 0",font:`600 10px ${MONO}`,color:C.txt}}>{v>=0?"+":""}{fmt(v,1)}</div>))}
      </div>))}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Financial Conditions Index" tag="home-built composite" accent={C.amber} sub="higher = tighter · live from assumptions">
      <div style={{display:"flex",gap:18,marginBottom:8,flexWrap:"wrap"}}>
        <Stat k="FCI now" v={`${fciNow>=0?"+":""}${fmt(fciNow,2)}`} tone={fciNow>0.3?C.red:fciNow>0?C.amber:C.teal} sub={fciNow>0.3?"tight":fciNow>0?"mildly tight":"loose"}/>
        <Stat k="Direction" v={fciNow>FCI_HIST[FCI_HIST.length-1]?"Tightening":"Easing"} tone={fciNow>FCI_HIST[FCI_HIST.length-1]?C.red:C.teal}/>
      </div>
      <div style={{height:110,width:"100%"}}><ResponsiveContainer>
        <AreaChart data={fciSeries} margin={{top:4,right:8,left:-24,bottom:0}}>
          <defs><linearGradient id="fci" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.amber} stopOpacity={.32}/><stop offset="100%" stopColor={C.amber} stopOpacity={0}/></linearGradient></defs>
          <XAxis dataKey="w" {...chartAxis} interval={5}/><YAxis {...chartAxis} width={30}/>
          <ReferenceLine y={0} stroke={C.faint} strokeDasharray="3 3"/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="v" stroke={C.amber} strokeWidth={1.7} fill="url(#fci)"/>
        </AreaChart></ResponsiveContainer></div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:2}}>Blends real yields, credit spreads, funds rate and growth. Nudge the assumptions drawer to move it live.</div>
    </Panel>
    <Panel title="Risk-Appetite Index" tag="risk-on / risk-off" accent={C.teal}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"6px 0"}}>
        <Gauge value={riskApp} color={riskApp>60?C.teal:riskApp>40?C.amber:C.red} cap={fmt(riskApp,0)}/>
        <Chip label={riskApp>60?"Risk-on":riskApp>40?"Neutral":"Risk-off"} tone={riskApp>60?C.teal:riskApp>40?C.amber:C.red}/>
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:6,lineHeight:1.5}}>Composite of conditions, credit and growth momentum. Sits in the cautious band — the tape is defensive-leaning, not panicked.</div>
    </Panel>
   </div>
  </div>);
}

function MasterRisk({m}){
  const macro=clamp(50-(m.ism-50)*4-(m.gdpnow-2)*8+(m.unemp-4)*10,0,100);
  const rates=clamp(40+(m.real10-1.5)*18+(m.funds-3.5)*10-((m.y10-m.y2)*100)*0.3,0,100);
  const credit=clamp((m.hyOAS-250)/4+30,0,100);
  const vol=clamp((17.8-12)*4+(MOVEIDX-90)*0.6,0,100);
  const positioning=58, valuation=88, breadth=62, geo=60;
  const comps=[["Macro",macro],["Rates",rates],["Credit",credit],["Volatility",vol],["Positioning",positioning],["Valuation",valuation],["Breadth",breadth],["Geopolitical",geo]];
  const wts=[.18,.14,.16,.12,.10,.12,.10,.08];
  const composite=Math.round(comps.reduce((s,c,i)=>s+c[1]*wts[i],0));
  const band=composite>62?["Elevated risk",C.red]:composite>45?["Cautious",C.amber]:["Constructive",C.teal];
  const spark=[52,54,53,56,58,57,60,composite].map((v,i)=>({w:i,v}));
  const g=.4*((m.ism-50)/6)+.4*((m.gdpnow-2)/2)-.2*((m.unemp-4)/1);
  const inf=.6*((m.corePCE-2)/2)+.4*((m.oil-70)/25);
  const regName=inf>.15?(g>=0?"Overheating":"Late-cycle · Stagflation risk"):(g>=0?"Goldilocks / Expansion":"Slowdown / Recession risk");
  const FAV={"Overheating":[["Energy","Materials","Value","Real assets","Financials"],["Long-duration growth","Rate-sensitive REITs","Low-yield defensives"]],
    "Late-cycle · Stagflation risk":[["Energy","Staples","Healthcare","Gold","Low-vol / quality"],["Discretionary","Small-caps","High-beta growth","Long-duration credit"]],
    "Goldilocks / Expansion":[["Growth","Semis","Discretionary","Small-caps","High-beta"],["Cash drag","Defensives","Long vol"]],
    "Slowdown / Recession risk":[["Utilities","Staples","Quality","Long-duration Treasuries","Gold"],["Cyclicals","High-beta","HY credit","Small-caps"]]};
  const fav=FAV[regName]||FAV["Late-cycle · Stagflation risk"];
  const checklist=[["Net liquidity draining",(m.fedBS-m.tga-m.rrp)-5.66<-.15],["Credit spreads widening",m.hyOAS>310],["Curve re-inverting",(m.y10-m.y2)<0],["Growth undershoot (ISM<48 / GDPNow<1.2)",m.ism<48||m.gdpnow<1.2],["Rate vol elevated (MOVE>110)",MOVEIDX>110],["Inflation sticky (Core PCE>3.3)",m.corePCE>3.3]];
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
   <div style={{display:"grid",gridTemplateColumns:"minmax(280px,1fr) 1.3fr",gap:12}}>
    <Panel title="Composite Risk Score" tag="live · weighted blend" accent={band[1]} sub="0 calm → 100 risk-off">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"6px 0"}}>
        <svg viewBox="0 0 120 68" style={{width:210}}>
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={C.bg2} strokeWidth="10" strokeLinecap="round"/>
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={band[1]} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(composite/100)*157} 157`}/>
          <text x="60" y="48" fill={band[1]} fontSize="26" fontFamily={MONO} fontWeight="700" textAnchor="middle">{composite}</text>
        </svg>
        <Chip label={band[0]} tone={band[1]}/>
        <div style={{height:70,width:"100%"}}><ResponsiveContainer>
          <AreaChart data={spark} margin={{top:6,right:6,left:-30,bottom:0}}>
            <defs><linearGradient id="rsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={band[1]} stopOpacity={.3}/><stop offset="100%" stopColor={band[1]} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="w" hide/><YAxis {...chartAxis} domain={[40,80]} width={26}/>
            <Area type="monotone" dataKey="v" stroke={band[1]} strokeWidth={1.6} fill="url(#rsk)"/>
          </AreaChart></ResponsiveContainer></div>
        <span style={{font:`400 10px ${SANS}`,color:C.faint}}>trend rising — risk building at the margin</span>
      </div>
    </Panel>
    <Panel title="Component Scores" tag="what's driving it" accent={C.dim} sub="higher = more risk contribution">
      {comps.map((c,i)=>{const t=c[1]>65?C.red:c[1]>45?C.amber:C.teal;return <ScoreBar key={i} k={c[0]} val={c[1]} tone={t} note={`w ${Math.round(wts[i]*100)}%`}/>;})}
    </Panel>
   </div>
   <div style={grid2}>
    <Panel title="Regime-Conditioned Positioning" tag="what to favor · avoid" accent={C.violet}>
      <div style={{marginBottom:10}}><Chip label={regName} tone={regName.includes("Stagflation")?C.amber:regName.includes("Recession")?C.red:regName.includes("Goldilocks")?C.teal:C.violet}/></div>
      <div style={grid2}>
        <div style={{background:`${C.teal}0e`,border:`1px solid ${C.teal}33`,borderRadius:5,padding:"10px 12px"}}>
          <div style={{font:`600 10px ${SANS}`,color:C.teal,marginBottom:6}}>▲ Favor</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{fav[0].map((x,i)=><Chip key={i} label={x} tone={C.teal}/>)}</div>
        </div>
        <div style={{background:`${C.red}0e`,border:`1px solid ${C.red}33`,borderRadius:5,padding:"10px 12px"}}>
          <div style={{font:`600 10px ${SANS}`,color:C.red,marginBottom:6}}>▼ Avoid / underweight</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{fav[1].map((x,i)=><Chip key={i} label={x} tone={C.red}/>)}</div>
        </div>
      </div>
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:10}}>Derived live from the growth × inflation regime — nudge the assumptions and the tilt re-maps.</div>
    </Panel>
    <Panel title="Signal Checklist" tag="binary risk flags" accent={C.amber}>
      {checklist.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:i<checklist.length-1?`1px solid ${C.lineSoft}`:"none"}}>
        <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}</span>
        <Chip label={r[1]?"● tripped":"○ clear"} tone={r[1]?C.red:C.teal}/></div>))}
      <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>{checklist.filter(c=>c[1]).length} of {checklist.length} flags tripped — {checklist.filter(c=>c[1]).length>=3?"corroborates the defensive lean":"mixed, not yet a red regime"}.</div>
    </Panel>
   </div>
  </div>);
}

/* ═══════════════  COCKPIT DATA  ═══════════════ */
const H_RISK=[52,53,54,53,55,57,56,58,60,59,61,60,62,61,63,62,61,61];
const H_LIQ=[6.05,6.02,5.99,5.98,5.95,5.93,5.90,5.88,5.85,5.83,5.80,5.78,5.75,5.72,5.70,5.68,5.67,5.67];
const H_FCI=[-0.05,0,0.05,0.08,0.12,0.15,0.20,0.22,0.26,0.28,0.32,0.30,0.36,0.34,0.38,0.40,0.42,0.44];
const H_2S10=[-25,-20,-15,-10,-5,0,5,8,12,15,18,22,25,28,30,32,34,35];
const H_HY=[250,255,258,262,260,265,270,268,272,275,278,280,282,285,286,288,290,288];
const H_PCE=[3.9,3.85,3.8,3.75,3.7,3.65,3.6,3.55,3.5,3.48,3.46,3.44,3.42,3.4,3.4,3.4,3.4,3.4];
const H_WTI=[78,80,79,82,84,83,81,82,85,86,84,82,80,81,83,82,82,82];
const H_VIX=[14,15,14,16,15,17,16,18,17,19,18,16,17,18,17,18,17,17.8];
const H_GOLD=[2400,2420,2450,2480,2500,2530,2560,2580,2600,2620,2610,2640,2650,2660,2670,2680,2675,2680];
const H_DXY=[100,100.5,101,101.5,102,102.5,103,103.5,103,104,104.5,104,103.5,104,104.5,104,104,104.2];
const H_GDP=[2.4,2.3,2.2,2.1,2.0,1.9,1.8,1.7,1.6,1.5,1.4,1.4,1.3,1.3,1.2,1.2,1.1,1.1];
const H_ISM=[52,51.5,51,50.5,50.2,50,49.8,49.5,49.6,49.4,49.5,49.3,49.5,49.6,49.4,49.5,49.5,49.5];
const MOVERS=[["Gold","GLD",1.4,3.1],["Bitcoin","BTC",2.1,-4.8],["VIX","VIX",3.8,8.2],["Nat gas","NG",4.2,9.1],["Copper","HG",-1.8,-3.2],["Oil (WTI)","CL",-1.2,2.4],["10y yield","UST",0.8,6.0],["HY OAS","HY",0.9,4.1],["EM FX","EM",-0.6,-2.4],["USD (DXY)","DXY",-0.3,1.1]];
const ANOM=[["Gold (real terms)","$2,680",2.6],["CAPE valuation","34.2",2.4],["Oil vol (OVX)","31",2.2],["Copper/Gold ratio","depressed",-2.1],["USD/JPY","148.2",2.1],["Equity breadth","44% >50d",-1.9],["Equity put/call","0.94",1.4],["MOVE (rate vol)","98",0.8]];

/* ═══════════════  COCKPIT HELPERS  ═══════════════ */
function Spark({data,color,w=92,h=30}){
  const mn=Math.min(...data),mx=Math.max(...data),rng=(mx-mn)||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-2-((v-mn)/rng)*(h-4)}`).join(" ");
  const lx=w,ly=h-2-((data[data.length-1]-mn)/rng)*(h-4);
  return(<svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" opacity=".9"/>
    <circle cx={lx} cy={ly} r="1.9" fill={color}/>
  </svg>);
}
function Tile({k,v,u,tone,hist,cur}){
  const series=cur!=null?[...hist,cur]:hist;
  return(<div style={{background:C.bg1,border:`1px solid ${C.line}`,borderRadius:6,padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
    <span style={{font:`500 10px ${SANS}`,color:C.dim}}>{k}</span>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:8}}>
      <span style={{font:`600 18px ${MONO}`,color:tone,lineHeight:1}}>{v}<span style={{font:`500 10px ${MONO}`,color:C.faint,marginLeft:2}}>{u}</span></span>
      <Spark data={series} color={tone}/>
    </div>
  </div>);
}

/* ═══════════════  COCKPIT ENGINE  ═══════════════ */
const LIVE_TAPE=[["S&P 500","SPY"],["Nasdaq 100","QQQ"],["Russell 2000","IWM"],["Dow 30","DIA"],["Dev ex-US","EFA"],["Vol (VIXY)","VIXY"],["20y Treasury","TLT"],["IG Credit","LQD"],["HY Credit","HYG"],["Gold","GLD"],["Silver","SLV"],["Oil (USO)","USO"],["Commodities","DBC"],["US Dollar","UUP"],["Bitcoin","BITO"],["Ether","ETHA"]];
function Cockpit({m,posture,pc,go,quotes={},zdata={}}){
  const qN=Object.keys(quotes).length, zN=Object.keys(zdata).length;
  const netliq=m.fedBS-m.tga-m.rrp, s2s10=(m.y10-m.y2)*100;
  const vixLive=m.vix!=null?m.vix:17.8;
  const fci=+((m.real10-1.5)*0.6+(m.hyOAS-260)/100*0.8+(m.funds-3.5)*0.4-(m.gdpnow-2)*0.2).toFixed(2);
  const macro=clamp(50-(m.ism-50)*4-(m.gdpnow-2)*8+(m.unemp-4)*10,0,100);
  const rates=clamp(40+(m.real10-1.5)*18+(m.funds-3.5)*10-s2s10*0.3,0,100);
  const credit=clamp((m.hyOAS-250)/4+30,0,100);
  const vol=clamp((vixLive-12)*4+(MOVEIDX-90)*0.6,0,100);
  const comps=[["Macro",macro,.18],["Rates",rates,.14],["Credit",credit,.16],["Volatility",vol,.12],["Positioning",58,.10],["Valuation",88,.12],["Breadth",62,.10],["Geopolitical",60,.08]];
  const composite=Math.round(comps.reduce((s,c)=>s+c[1]*c[2],0));
  const band=composite>62?["Elevated risk",C.red]:composite>45?["Cautious",C.amber]:["Constructive",C.teal];
  const drivers=[...comps].sort((a,b)=>b[1]*b[2]-a[1]*a[2]).slice(0,2).map(c=>c[0]);
  const riskDir=composite>=H_RISK[H_RISK.length-1]?"rising":"easing";
  const g=.4*((m.ism-50)/6)+.4*((m.gdpnow-2)/2)-.2*((m.unemp-4)/1);
  const inf=.6*((m.corePCE-2)/2)+.4*((m.oil-70)/25);
  const regName=inf>.15?(g>=0?"Overheating":"Late-cycle · Stagflation risk"):(g>=0?"Goldilocks / Expansion":"Slowdown / Recession risk");
  const rc=regName.includes("Stagflation")?C.amber:regName.includes("Recession")?C.red:regName.includes("Goldilocks")?C.teal:C.violet;
  const fciWord=fci>0.3?"tight":fci>0?"mildly tight":"loose", fciDir=fci>H_FCI[H_FCI.length-1]?"tightening":"easing";
  const tiles=[
    ["Composite Risk",`${composite}`,"",band[1],H_RISK,composite,"RSK"],
    ["Net Liquidity",`$${fmt(netliq,2)}T`,"",netliq<5.67?C.red:C.teal,H_LIQ,netliq,"LIQ"],
    ["Fin. Conditions",`${fci>=0?"+":""}${fmt(fci,2)}`,"",fci>0.3?C.red:fci>0?C.amber:C.teal,H_FCI,fci,"XAS"],
    ["2s10s",`${s2s10>=0?"+":""}${fmt(s2s10,0)}`,"bp",s2s10>=0?C.teal:C.red,H_2S10,s2s10,"RTS"],
    ["HY OAS",`${fmt(m.hyOAS,0)}`,"bp",m.hyOAS>320?C.red:C.teal,H_HY,m.hyOAS,"CRD"],
    ["Core PCE",`${fmt(m.corePCE,1)}`,"%",m.corePCE>3?C.red:C.teal,H_PCE,m.corePCE,"MAC"],
    ["WTI Crude",`$${fmt(m.oil,0)}`,"",m.oil>85?C.red:C.txt,H_WTI,m.oil,"CMD"],
    ["VIX",m.vix!=null?fmt(m.vix,1):"17.8","",m.vix>25?C.red:C.dim,H_VIX,vixLive,"VOL"],
    ["Gold","2,680","",C.amber,H_GOLD,2680,"CMD"],
    ["USD (broad)",m.dollar!=null?fmt(m.dollar,1):"104.2","",C.cyan,H_DXY,m.dollar??104.2,"FXC"],
    ["GDPNow",`${fmt(m.gdpnow,1)}`,"%",m.gdpnow<1.5?C.amber:C.teal,H_GDP,m.gdpnow,"MAC"],
    ["ISM Mfg",`${fmt(m.ism,1)}`,"",m.ism<50?C.red:C.teal,H_ISM,m.ism,"MAC"],
  ];
  const MOVER_SET=[["S&P 500","SPY"],["Nasdaq 100","QQQ"],["Russell 2000","IWM"],["Gold","GLD"],["Silver","SLV"],["Oil","USO"],["Copper","COPX"],["Bitcoin","BITO"],["Ether","ETHA"],["US Dollar","UUP"],["20y Tsy","TLT"],["HY Credit","HYG"],["Vol","VIXY"],["Commodities","DBC"]];
  const liveMovers=MOVER_SET.filter(x=>quotes[x[1]]&&typeof quotes[x[1]].dp==="number").map(x=>({name:x[0],sym:x[1],dp:quotes[x[1]].dp})).sort((a,b)=>Math.abs(b.dp)-Math.abs(a.dp)).slice(0,10);
  const useMovers=liveMovers.length>=4;
  const movers=[...MOVERS].sort((a,b)=>Math.abs(b[3])-Math.abs(a[3]));
  const liveAnoms=zN?Object.keys(zdata).map(k=>({name:k,z:zdata[k].z,val:zdata[k].value})).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z)):null;
  const anoms=[...ANOM].sort((a,b)=>Math.abs(b[2])-Math.abs(a[2]));
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    {qN>0&&(<Panel title="Live Tape" tag={`${qN} live · Finnhub · 5-min`} accent={C.cyan} sub="cross-asset ETF proxies · price + day change">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(132px,1fr))",gap:8}}>
        {LIVE_TAPE.map((t,i)=>{const q=quotes[t[1]];if(!q)return null;const up=q.dp>=0;return(
          <div key={i} style={{background:C.bg1,border:`1px solid ${C.line}`,borderRadius:6,padding:"8px 10px"}}>
            <div style={{font:`500 9px ${SANS}`,color:C.dim}}>{t[0]}<span style={{color:C.faint,fontFamily:MONO,marginLeft:4}}>{t[1]}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:3}}>
              <span style={{font:`600 14px ${MONO}`,color:C.txt}}>{fmt(q.c,2)}</span>
              <span style={{font:`600 11px ${MONO}`,color:up?C.teal:C.red}}>{up?"▲":"▼"}{Math.abs(q.dp).toFixed(2)}%</span>
            </div>
          </div>);})}
      </div>
    </Panel>)}
    <Panel title="Market State" tag="synthesized read" accent={rc} sub="generated from live signals">
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:10}}>
        <Chip label={`Regime · ${regName}`} tone={rc}/>
        <Chip label={`Risk ${composite} · ${band[0]}`} tone={band[1]}/>
        <Chip label={`Conditions · ${fciWord}`} tone={fci>0.3?C.red:C.amber}/>
        <Chip label={`Posture · ${posture}`} tone={pc}/>
      </div>
      <p style={{font:`400 13px ${SANS}`,color:C.txt,lineHeight:1.6,margin:0}}>
        The board reads <b style={{color:rc}}>{regName.toLowerCase()}</b>. Composite risk sits at <b style={{color:band[1]}}>{composite}</b> ({band[0].toLowerCase()}) and is <b>{riskDir}</b>, with the heaviest pressure from <b>{drivers[0].toLowerCase()}</b> and <b>{drivers[1].toLowerCase()}</b>. Financial conditions are <b>{fciWord}</b> and <b>{fciDir}</b>; the curve is {s2s10>=0?`dis-inverted (+${fmt(s2s10,0)}bp)`:`inverted (${fmt(s2s10,0)}bp)`} and HY credit at {fmt(m.hyOAS,0)}bp. Nearest catalyst is <b>{TRIGGERS[0][0]} — {TRIGGERS[0][1]}</b>: {TRIGGERS[0][3].toLowerCase()}.
      </p>
    </Panel>

    <Panel title="What Matters Now" tag="one tile per desk · 18w trend" accent={C.cyan} sub="tap a tile to open its desk">
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(158px,1fr))",gap:8}}>
        {tiles.map((t,i)=>(<div key={i} onClick={()=>go&&go(t[6])} style={{cursor:go?"pointer":"default"}}>
          <Tile k={t[0]} v={t[1]} u={t[2]} tone={t[3]} hist={t[4]} cur={t[5]}/>
        </div>))}
      </div>
    </Panel>

    <div style={grid2}>
      <Panel title="Anomaly Monitor" tag={zN?`${zN} live · FRED z`:"z-score vs own history"} accent={C.red} sub="|z| ≥ 2σ flagged">
        {liveAnoms?liveAnoms.map((r,i)=>{const ex=Math.abs(r.z)>=2,c=ex?(r.z>0?C.red:C.blue):C.dim;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 58px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<liveAnoms.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`500 11px ${SANS}`,color:ex?C.txt:C.dim}}>{r.name}{ex&&<span style={{font:`600 8px ${MONO}`,color:c,marginLeft:6}}>●</span>}</span>
            <span style={{font:`600 11px ${MONO}`,color:C.dim}}>{fmt(r.val,2)}</span>
            <span style={{font:`600 12px ${MONO}`,color:c,textAlign:"right"}}>{r.z>=0?"+":""}{fmt(r.z,1)}σ</span>
          </div>);}):anoms.map((r,i)=>{const ex=Math.abs(r[2])>=2,c=ex?(r[2]>0?C.red:C.blue):C.dim;return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 58px",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<anoms.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`500 11px ${SANS}`,color:ex?C.txt:C.dim}}>{r[0]}{ex&&<span style={{font:`600 8px ${MONO}`,color:c,marginLeft:6}}>●</span>}</span>
            <span style={{font:`600 11px ${MONO}`,color:C.dim}}>{r[1]}</span>
            <span style={{font:`600 12px ${MONO}`,color:c,textAlign:"right"}}>{r[2]>=0?"+":""}{fmt(r[2],1)}σ</span>
          </div>);})}
        <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>{liveAnoms?"Live z-scores vs each series' own trailing history — flagged names are 2σ+ stretched.":"Gold, CAPE and oil-vol are the stretched tails."}</div>
      </Panel>
      <Panel title="Biggest Movers" tag={useMovers?"live · day %":"1-day · 1-week %"} accent={C.amber} sub={useMovers?"cross-asset · sorted by move":"sorted by weekly move"}>
        {useMovers?(<>
          {liveMovers.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<liveMovers.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r.name}<span style={{color:C.faint,fontFamily:MONO,fontSize:9,marginLeft:5}}>{r.sym}</span></span>
            <span style={{font:`600 12px ${MONO}`,color:r.dp>=0?C.teal:C.red,textAlign:"right"}}>{r.dp>=0?"▲":"▼"}{Math.abs(r.dp).toFixed(2)}%</span>
          </div>))}
        </>):(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,padding:"0 0 6px",borderBottom:`1px solid ${C.line}`}}>
            <span style={{font:`600 9px ${SANS}`,color:C.faint}}>asset</span><span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>1d</span><span style={{font:`600 9px ${MONO}`,color:C.faint,textAlign:"right"}}>1w</span>
          </div>
          {movers.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<movers.length-1?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[0]}<span style={{color:C.faint,fontFamily:MONO,fontSize:9,marginLeft:5}}>{r[1]}</span></span>
            <span style={{font:`600 11px ${MONO}`,color:r[2]>=0?C.teal:C.red,textAlign:"right"}}>{r[2]>=0?"+":""}{fmt(r[2],1)}</span>
            <span style={{font:`600 11px ${MONO}`,color:r[3]>=0?C.teal:C.red,textAlign:"right"}}>{r[3]>=0?"+":""}{fmt(r[3],1)}</span>
          </div>))}
        </>)}
      </Panel>
    </div>

    <div style={grid2}>
      <Panel title="Next Catalysts" tag="dated triggers" accent={C.violet}>
        {TRIGGERS.slice(0,4).map((t,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"52px 1fr",gap:10,padding:"9px 0",borderBottom:i<3?`1px solid ${C.lineSoft}`:"none"}}>
            <span style={{font:`700 12px ${MONO}`,color:C.txt}}>{t[0]}</span>
            <div>
              <div style={{font:`600 12px ${SANS}`,color:C.txt}}>{t[1]}</div>
              <div style={{display:"flex",gap:12,marginTop:4}}>
                <span style={{font:`400 10px ${SANS}`,color:C.red}}>▼ {t[3]}</span>
              </div>
              <div style={{font:`500 10px ${MONO}`,color:C.amber,marginTop:3}}>play · {t[5]}</div>
            </div>
          </div>))}
      </Panel>
      <Panel title="Recent Surprises" tag="actual vs consensus" accent={C.cyan}>
        {RECENT.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"48px 1fr auto auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:i<RECENT.length-1?`1px solid ${C.lineSoft}`:"none"}}>
          <span style={{font:`600 10px ${MONO}`,color:C.dim}}>{r[0]}</span>
          <span style={{font:`500 11px ${SANS}`,color:C.txt}}>{r[1]}</span>
          <span style={{font:`600 11px ${MONO}`,color:C.txt}}>{r[2]}<span style={{color:C.faint,fontSize:9}}> /{r[3]}</span></span>
          <span style={{font:`700 12px ${MONO}`,color:r[4]==="+"?C.teal:C.red}}>{r[4]}</span></div>))}
        <div style={{font:`400 10px ${SANS}`,color:C.faint,marginTop:8}}>Recent prints skew below consensus — the soft-data drift behind the rising risk score.</div>
      </Panel>
    </div>
  </div>);
}
