/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  Activity, 
  Users, 
  BookOpen, 
  Trophy, 
  AlertTriangle, 
  Info,
  TrendingDown,
  LayoutDashboard,
  ClipboardList,
  Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { DATA } from './data';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

// --- Constants & Types ---
const P = {
  bg0: '#0F1115', bg1: '#161B22', bg2: '#1D2430', bg3: '#262F3D',
  line1: '#1E293B', line2: '#334155',
  t1: '#F8FAFC', t2: '#CBD5E1', t3: '#94A3B8', t4: '#64748B',
  acc: '#6366F1', pos: '#10B981', warn: '#F59E0B', neg: '#F43F5E'
};

const SERIES = ['#7CC4FF', '#5CC9A1', '#E3B341', '#E5694E', '#B891F5', '#F08CAB', '#74D5C5', '#D4A574'];

const DISC_LABELS: Record<string, string> = { 
  MAT:'Matemática', PORT:'Português', ING:'Inglês', HIST:'História', 
  GEO:'Geografia', CIE:'Ciências', FILO:'Filosofia', SOC:'Sociologia', 
  BIO:'Biologia', FIS:'Física', QUI:'Química', FIN:'Ed. Financeira', TEC:'Tecnologia' 
};

const DISC_KEYS = ['MAT','PORT','ING','HIST','GEO','CIE','FILO','SOC','BIO','FIS','QUI','FIN','TEC'];

const PAGE_NAMES = { 
  panorama: 'Panorama', 
  turmas: 'Turmas', 
  disciplinas: 'Disciplinas', 
  diagnostico: 'Diagnóstico', 
  alunos: 'Alunos', 
  insights: 'Apuração' 
};

// --- Helpers ---
const fmtPct = (v: number | null) => v == null ? '—' : (v <= 1 ? (v*100).toFixed(1) : v.toFixed(1)) + '%';
const turmaShort = (t: string) => t ? t.replace(/INTEGRAL 9H ANUAL/g,'').replace(/°/g,'º').trim() : '—';
const colorByPct = (v: number) => v >= 70 ? P.pos : v >= 50 ? P.warn : P.neg;

// --- Sub-components ---

const Badge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="badge gray">—</span>;
  if (status === 'Proficiente') return <span className="badge pos">Proficiente</span>;
  if (status === 'Básico') return <span className="badge warn">Básico</span>;
  if (status === 'Abaixo do Básico' || status === 'Abaixo') return <span className="badge neg">Abaixo</span>;
  return <span className="badge gray">{status}</span>;
};

const SectionHeader = ({ id, title, lede }: { id: string, title: string, lede: string }) => (
  <div className="page-head">
    <div className="page-id"><span className="dot">●</span> {id}</div>
    <h1 className="page-title">{title}</h1>
    <p className="page-lede">{lede}</p>
  </div>
);

const Block = ({ idx, title, meta, children, dense, nopad }: { idx: string, title: string, meta: string, children: React.ReactNode, dense?: boolean, nopad?: boolean }) => (
  <div className="block">
    <div className="block-head">
      <div className="block-title"><span className="idx">{idx}</span>{title}</div>
      <div className="block-meta">{meta}</div>
    </div>
    <div className={`block-body ${dense ? 'dense' : ''} ${nopad ? 'nopad' : ''}`}>
      {children}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activePage, setActivePage] = useState<keyof typeof PAGE_NAMES>('panorama');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  // Filters for Students Page
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, dir: number }>({ key: 'pct_geral', dir: -1 });

  // --- Processed Data ---
  const filteredStudents = useMemo(() => {
    return DATA.alunos.filter(a => {
      if (filterTurma && a.turma !== filterTurma) return false;
      if (filterStatus && a.status1 !== filterStatus && a.status2 !== filterStatus) return false;
      if (searchQuery && !(a.nome || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a: any, b: any) => {
      let va = a[sortConfig.key], vb = b[sortConfig.key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') return va.localeCompare(vb) * sortConfig.dir;
      return (va - vb) * sortConfig.dir;
    });
  }, [filterTurma, filterStatus, searchQuery, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key ? -prev.dir : (key === 'nome' || key === 'turma' ? 1 : -1)
    }));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: P.bg2,
        titleColor: P.t1,
        bodyColor: P.t2,
        borderColor: P.line2,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        titleFont: { weight: 'bold' as const, family: "'Geist Mono', monospace", size: 10 },
        bodyFont: { family: "'Geist Mono', monospace", size: 11 }
      }
    }
  };

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">U</div>
          <div className="brand-info">
            <div className="brand-title">Pedagógico v2.4</div>
            <div className="brand-sub">EE Uacury Ribeiro</div>
          </div>
        </div>

        <div className="nav-label">Análise</div>
        <div className="nav-group">
          <button className={`nav-item ${activePage === 'panorama' ? 'active' : ''}`} onClick={() => setActivePage('panorama')}>
            {activePage === 'panorama' && <div className="nav-indicator" />}
            <LayoutDashboard size={16} /> Panorama <span className="nav-num">01</span>
          </button>
          <button className={`nav-item ${activePage === 'turmas' ? 'active' : ''}`} onClick={() => setActivePage('turmas')}>
            {activePage === 'turmas' && <div className="nav-indicator" />}
            <Users size={16} /> Turmas <span className="nav-num">02</span>
          </button>
          <button className={`nav-item ${activePage === 'disciplinas' ? 'active' : ''}`} onClick={() => setActivePage('disciplinas')}>
            {activePage === 'disciplinas' && <div className="nav-indicator" />}
            <BookOpen size={16} /> Disciplinas <span className="nav-num">03</span>
          </button>
          <button className={`nav-item ${activePage === 'diagnostico' ? 'active' : ''}`} onClick={() => setActivePage('diagnostico')}>
            {activePage === 'diagnostico' && <div className="nav-indicator" />}
            <Target size={16} /> Diagnóstico <span className="nav-num">04</span>
          </button>
          <button className={`nav-item ${activePage === 'alunos' ? 'active' : ''}`} onClick={() => setActivePage('alunos')}>
            {activePage === 'alunos' && <div className="nav-indicator" />}
            <Activity size={16} /> Alunos <span className="nav-num">{DATA.alunos.length}</span>
          </button>
        </div>

        <div className="nav-label">Relatórios</div>
        <div className="nav-group">
          <button className={`nav-item ${activePage === 'insights' ? 'active' : ''}`} onClick={() => setActivePage('insights')}>
            {activePage === 'insights' && <div className="nav-indicator" />}
            <ClipboardList size={16} /> Apuração <span className="nav-num">06</span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar text-white">CP</div>
          <div className="user-info">
            <div className="user-name">Coordenação</div>
            <div className="user-role">Admin Nível 4</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-area">
        <header className="header-compact">
          <div className="header-title">
            <h1>{PAGE_NAMES[activePage]}</h1>
            <p>Sincronizado há 2 minutos · Ensino Fundamental II</p>
          </div>
          <div className="header-actions">
            <div className="btn-outline">Últimos 30 Dias</div>
            <button className="btn-primary">Exportar PDF</button>
          </div>
        </header>

        <div className="main-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activePage === 'panorama' && (
                <section id="page-panorama">
                  <SectionHeader 
                    id="VISÃO GERAL" 
                    title="Panorama Escolar" 
                    lede="Indicadores macro resultantes do cruzamento de 12 planilhas-fonte. Cada métrica representa um vetor de decisão para a coordenação pedagógica." 
                  />

                  <div className="kpi-row">
                    <div className="kpi primary">
                      <div className="kpi-l">Acertos médios <span className="tag">TOTAL</span></div>
                      <div className="kpi-v">{DATA.escola.media_geral.toFixed(1).replace('.', ',')}<span className="unit">%</span></div>
                      <div className="kpi-bar"><div className="kpi-bar-in" style={{ width: `${DATA.escola.media_geral}%` }}></div></div>
                      <div className="kpi-sub">Média ponderada ponderada</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-l">Participação <span className="tag">DIAG</span></div>
                      <div className="kpi-v">{DATA.escola.participacao_disc}<span className="unit">%</span></div>
                      <div className="kpi-bar"><div className="kpi-bar-in" style={{ width: `${DATA.escola.participacao_disc}%`, backgroundColor: P.pos }}></div></div>
                      <div className="kpi-sub">Cruzamento disciplinar</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-l">Destaque <span className="tag">NÍVEL</span></div>
                      <div className="kpi-v">{DATA.escola.status_av1.proficiente}<span className="unit">alunos</span></div>
                      <div className="kpi-bar"><div className="kpi-bar-in" style={{ width: `${(DATA.escola.status_av1.proficiente / DATA.escola.total_alunos)*100}%`, backgroundColor: P.acc }}></div></div>
                      <div className="kpi-sub">Alunos proficientes</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-l">Prioridade <span className="tag">RISCO</span></div>
                      <div className="kpi-v">{DATA.escola.status_av1.abaixo}<span className="unit">alunos</span></div>
                      <div className="kpi-bar"><div className="kpi-bar-in" style={{ width: `${(DATA.escola.status_av1.abaixo / DATA.escola.total_alunos)*100}%`, backgroundColor: P.neg }}></div></div>
                      <div className="kpi-sub">Abaixo do básico</div>
                    </div>
                  </div>

                <div className="grid-3">
                  <Block idx="A1" title="Distribuição diagnóstica" meta="Avaliação 1">
                    <div className="chart-box-sm">
                      <Doughnut 
                        data={{
                          labels: ['Proficiente','Básico','Abaixo'],
                          datasets: [{
                            data: [DATA.escola.status_av1.proficiente, DATA.escola.status_av1.basico, DATA.escola.status_av1.abaixo],
                            backgroundColor: [P.pos, P.warn, P.neg],
                            borderColor: P.bg1,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          cutout: '65%',
                          plugins: {
                            ...chartOptions.plugins,
                            legend: { display: true, position: 'bottom', labels: { color: P.t2, boxWidth: 10 } }
                          }
                        }}
                      />
                    </div>
                  </Block>
                  <Block idx="A2" title="Distribuição diagnóstica" meta="Avaliação 2">
                    <div className="chart-box-sm">
                      <Doughnut 
                        data={{
                          labels: ['Proficiente','Básico','Abaixo'],
                          datasets: [{
                            data: [DATA.escola.status_av2.proficiente, DATA.escola.status_av2.basico, DATA.escola.status_av2.abaixo],
                            backgroundColor: [P.pos, P.warn, P.neg],
                            borderColor: P.bg1,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          cutout: '65%',
                          plugins: {
                            ...chartOptions.plugins,
                            legend: { display: true, position: 'bottom', labels: { color: P.t2, boxWidth: 10 } }
                          }
                        }}
                      />
                    </div>
                  </Block>
                  <Block idx="RNK" title="Ranking disciplinar" meta="acertos %">
                    <div className="rank-list">
                      {Object.entries(DATA.escola.medias_disciplinas)
                        .sort((a,b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([key, val], i) => (
                          <div key={key} className="rank-item">
                            <div className="rank-i">0{i+1}</div>
                            <div className="rank-n">{DISC_LABELS[key] || key}</div>
                            <div className="rank-v font-mono">{val.toFixed(1)}%</div>
                            <div className="rank-bar"><div className={`rank-bar-in ${val >= 70 ? 'pos' : val >= 50 ? 'warn' : 'neg'}`} style={{ width: `${val}%` }}></div></div>
                          </div>
                        ))}
                    </div>
                  </Block>
                </div>

                <Block idx="DISC" title="Desempenho por disciplina · escala completa" meta="% de acertos">
                  <div className="chart-box-lg">
                    <Bar 
                      data={{
                        labels: Object.keys(DATA.escola.medias_disciplinas).map(k => DISC_LABELS[k] || k),
                        datasets: [{
                          data: Object.values(DATA.escola.medias_disciplinas),
                          backgroundColor: Object.values(DATA.escola.medias_disciplinas).map(colorByPct),
                          borderRadius: 2
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        scales: {
                          x: { grid: { display: false }, ticks: { color: P.t2 } },
                          y: { min: 0, max: 100, ticks: { color: P.t3, callback: (v) => v + '%' } }
                        }
                      }}
                    />
                  </div>
                </Block>
              </section>
            )}

            {activePage === 'turmas' && (
              <section id="page-turmas">
                <SectionHeader 
                  id="02 / TURMAS" 
                  title="Comparativo entre turmas" 
                  lede="Posição de cada turma frente às demais. A leitura cruzada (média geral × composição diagnóstica × defasagem) identifica turmas com prioridade pedagógica." 
                />
                
                <div className="grid-2">
                  <Block idx="T1" title="Acertos médios por turma" meta="%">
                    <div className="chart-box">
                      <Bar 
                        data={{
                          labels: DATA.turmas.map(t => turmaShort(t.turma)),
                          datasets: [{
                            data: DATA.turmas.map(t => t.media_geral),
                            backgroundColor: DATA.turmas.map(t => colorByPct(t.media_geral)),
                            borderRadius: 3
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            x: { grid: { display: false }, ticks: { color: P.t2 } },
                            y: { min: 0, max: 100, ticks: { color: P.t3, callback: (v) => v + '%' } }
                          }
                        }}
                      />
                    </div>
                  </Block>
                  <Block idx="T2" title="Composição por nível" meta="contagem absoluta">
                    <div className="chart-box">
                      <Bar 
                        data={{
                          labels: DATA.turmas.map(t => turmaShort(t.turma)),
                          datasets: [
                            { label: 'Proficiente', data: DATA.turmas.map(t=>t.status_av1.proficiente), backgroundColor: P.pos },
                            { label: 'Básico', data: DATA.turmas.map(t=>t.status_av1.basico), backgroundColor: P.warn },
                            { label: 'Abaixo', data: DATA.turmas.map(t=>t.status_av1.abaixo), backgroundColor: P.neg }
                          ]
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            x: { stacked: true, grid: { display: false }, ticks: { color: P.t2 } },
                            y: { stacked: true, ticks: { color: P.t3 } }
                          },
                          plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: P.t2 } } }
                        }}
                      />
                    </div>
                  </Block>
                </div>

                <Block idx="HT" title="Mapa térmico turma × disciplina" meta="% de acertos">
                   <div style={{ overflowX: 'auto' }}>
                    <table className="heatmap">
                      <thead>
                        <tr>
                          <th className="left">TURMA</th>
                          {DISC_KEYS.filter(k => DATA.escola.medias_disciplinas[k as keyof typeof DATA.escola.medias_disciplinas] !== undefined).map(k => (
                             <th key={k}>{(DISC_LABELS[k] || k).toUpperCase().slice(0, 3)}</th>
                          ))}
                          <th>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DATA.turmas.map(t => (
                          <tr key={t.turma}>
                            <td className="left label text-xs">{turmaShort(t.turma)}</td>
                            {DISC_KEYS.filter(k => DATA.escola.medias_disciplinas[k as keyof typeof DATA.escola.medias_disciplinas] !== undefined).map(d => {
                              const v = (t.medias_disciplinas as any)[d];
                              let bgColor = P.bg3;
                              if (v != null) {
                                if (v >= 60) {
                                  let r = (v - 60) / 40;
                                  bgColor = `rgba(${92 + (227 - 92) * (1-r)}, ${201 + (179 - 201) * (1-r)}, ${161 + (65 - 161) * (1-r)}, ${0.18 + 0.4 * r})`;
                                } else {
                                  let r = v / 60;
                                  bgColor = `rgba(${229 + (227 - 229) * r}, ${105 + (179 - 105) * r}, ${78 + (65 - 78) * r}, ${0.5 - 0.3 * r})`;
                                }
                              }
                              return <td key={d} className="cell" style={{ backgroundColor: bgColor }}>{v ? v.toFixed(0) : '—'}</td>;
                            })}
                            <td className="tot text-white font-bold">{t.media_geral.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="heat-legend mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                    <span>BAIXO</span><div className="heat-grad flex-1 h-2 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 max-w-[180px]"></div><span>ALTO</span>
                  </div>
                </Block>
              </section>
            )}

            {activePage === 'disciplinas' && (
              <section id="page-disciplinas">
                <SectionHeader 
                  id="03 / DISCIPLINAS" 
                  title="Análise por área do conhecimento" 
                  lede="Comportamento de cada disciplina entre as turmas. Permite distinguir gargalos sistêmicos da escola de problemas pontuais de turma." 
                />

                <Block idx="RAD" title="Perfil disciplinar por turma" meta="% médio">
                  <div className="chart-box-lg">
                    <Radar 
                      data={{
                        labels: DISC_KEYS.filter(k => DATA.escola.medias_disciplinas[k as keyof typeof DATA.escola.medias_disciplinas] !== undefined).map(k => DISC_LABELS[k] || k),
                        datasets: DATA.turmas.map((t, i) => ({
                          label: turmaShort(t.turma),
                          data: DISC_KEYS.filter(k => DATA.escola.medias_disciplinas[k as keyof typeof DATA.escola.medias_disciplinas] !== undefined).map(d => (t.medias_disciplinas as any)[d] || 0),
                          borderColor: SERIES[i % SERIES.length],
                          backgroundColor: SERIES[i % SERIES.length] + '22',
                          borderWidth: 2,
                          pointRadius: 3
                        }))
                      }}
                      options={{
                        ...chartOptions,
                        scales: {
                          r: {
                            angleLines: { color: P.line1 },
                            grid: { color: P.line1 },
                            pointLabels: { color: P.t2, font: { size: 10 } },
                            ticks: { display: false, stepSize: 20 },
                            min: 0, max: 100
                          }
                        },
                        plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: P.t2, boxWidth: 10 } } }
                      }}
                    />
                  </div>
                </Block>

                <div className="grid-2">
                  <Block idx="AMP" title="Amplitude entre turmas" meta="pontos percentuais">
                    <div className="rank-list">
                      {DISC_KEYS.filter(k => DATA.escola.medias_disciplinas[k as keyof typeof DATA.escola.medias_disciplinas] !== undefined)
                        .map(d => {
                          const vals = DATA.turmas.map(t => (t.medias_disciplinas as any)[d]).filter(v => v != null);
                          return { disc: d, range: Math.max(...vals) - Math.min(...vals) };
                        })
                        .sort((a,b) => b.range - a.range)
                        .slice(0, 8)
                        .map((a, i) => (
                          <div key={a.disc} className="rank-item">
                            <div className="rank-i">0{i+1}</div>
                            <div className="rank-n">{DISC_LABELS[a.disc]}</div>
                            <div className="rank-v font-mono">{a.range.toFixed(1)} pp</div>
                            <div className="rank-bar">
                              <div className="rank-bar-in" style={{ width: `${Math.min(a.range * 1.5, 100)}%`, backgroundColor: P.warn }}></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Block>
                  <Block idx="CRIT" title="Disciplinas críticas" meta="média < 60%">
                    <div className="rank-list">
                      {Object.entries(DATA.escola.medias_disciplinas)
                        .filter(([_,v]) => (v as number) < 60)
                        .sort((a,b) => (a[1] as number) - (b[1] as number))
                        .map(([key, val], i) => (
                          <div key={key} className="rank-item">
                            <div className="rank-i">0{i+1}</div>
                            <div className="rank-n">{DISC_LABELS[key]}</div>
                            <div className="rank-v font-mono">{(val as number).toFixed(1)}%</div>
                            <div className="rank-bar">
                              <div className="rank-bar-in neg" style={{ width: `${val as number}%` }}></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Block>
                </div>
              </section>
            )}

            {activePage === 'diagnostico' && (
              <section id="page-diagnostico">
                <SectionHeader 
                  id="04 / DIAGNÓSTICO" 
                  title="Avaliação de aprendizagem equivalente" 
                  lede="Em qual ano de escolaridade os alunos efetivamente estão. Indicador-base para o planejamento de programas de recuperação e aceleração da aprendizagem." 
                />

                <div className="grid-2">
                  <Block idx="H1" title="Distribuição de defasagem" meta="Av. 1 · anos">
                    <div className="chart-box">
                      <Bar 
                        data={{
                          labels: ['-6','-5','-4','-3','-2','-1','0'],
                          datasets: [{
                            data: [-6,-5,-4,-3,-2,-1,0].map(yr => DATA.alunos.filter(a => Math.round(a.def1 || 0) === yr).length),
                            backgroundColor: [-6,-5,-4,-3,-2,-1,0].map(v => v <= -3 ? P.neg : v < 0 ? P.warn : P.pos),
                            borderRadius: 3
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            x: { grid: { display: false }, ticks: { color: P.t2 } },
                            y: { ticks: { color: P.t3 } }
                          }
                        }}
                      />
                    </div>
                  </Block>
                  <Block idx="H2" title="Distribuição de defasagem" meta="Av. 2 · anos">
                    <div className="chart-box">
                      <Bar 
                        data={{
                          labels: ['-6','-5','-4','-3','-2','-1','0'],
                          datasets: [{
                            data: [-6,-5,-4,-3,-2,-1,0].map(yr => DATA.alunos.filter(a => Math.round(a.def2 || 0) === yr).length),
                            backgroundColor: [-6,-5,-4,-3,-2,-1,0].map(v => v <= -3 ? P.neg : v < 0 ? P.warn : P.pos),
                            borderRadius: 3
                          }]
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            x: { grid: { display: false }, ticks: { color: P.t2 } },
                            y: { ticks: { color: P.t3 } }
                          }
                        }}
                      />
                    </div>
                  </Block>
                </div>

                <Block idx="NIV" title="Composição percentual por turma" meta="Av. 1 · % de alunos">
                  <div className="chart-box-lg">
                    <Bar 
                      data={{
                        labels: DATA.turmas.map(t => turmaShort(t.turma)),
                        datasets: [
                          { label: 'Proficiente', data: DATA.turmas.map(t => (t.status_av1.proficiente / t.n_alunos)*100), backgroundColor: P.pos },
                          { label: 'Básico', data: DATA.turmas.map(t => (t.status_av1.basico / t.n_alunos)*100), backgroundColor: P.warn },
                          { label: 'Abaixo do básico', data: DATA.turmas.map(t => (t.status_av1.abaixo / t.n_alunos)*100), backgroundColor: P.neg }
                        ]
                      }}
                      options={{
                        ...chartOptions,
                        indexAxis: 'y',
                        scales: {
                          x: { stacked: true, min: 0, max: 100, ticks: { color: P.t3, callback: v => v + '%' } },
                          y: { stacked: true, grid: { display: false }, ticks: { color: P.t2 } }
                        },
                        plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: P.t2 } } }
                      }}
                    />
                  </div>
                </Block>
              </section>
            )}

            {activePage === 'alunos' && (
              <section id="page-alunos">
                <SectionHeader 
                  id="05 / ALUNOS" 
                  title="Base nominal de estudantes" 
                  lede="Registro completo com todas as métricas individuais. Clique em qualquer linha para abrir o perfil detalhado." 
                />

                <div className="controls mb-6 flex flex-wrap gap-4 items-center">
                  <select className="select" onChange={e => setFilterTurma(e.target.value)} value={filterTurma}>
                    <option value="">Todas as turmas</option>
                    {[...new Set(DATA.alunos.map(a => a.turma))].sort().map(t => (
                      <option key={t} value={t}>{turmaShort(t)}</option>
                    ))}
                  </select>
                  <select className="select" onChange={e => setFilterStatus(e.target.value)} value={filterStatus}>
                    <option value="">Todos os níveis</option>
                    <option value="Proficiente">Proficiente</option>
                    <option value="Básico">Básico</option>
                    <option value="Abaixo do Básico">Abaixo do básico</option>
                  </select>
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      className="input pl-10 w-full" 
                      placeholder="Buscar por nome..." 
                      onChange={e => setSearchQuery(e.target.value)} 
                    />
                  </div>
                  <span className="counter text-[10px] text-gray-500 font-mono uppercase tracking-wider ml-auto">
                    EXIBINDO <b className="text-white">{filteredStudents.length} / {DATA.alunos.length}</b>
                  </span>
                </div>

                <div className="tbl-host">
                  <div className="tbl-scroll">
                    <table className="data w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="cursor-pointer" onClick={() => handleSort('nome')}>Estudante</th>
                          <th className="cursor-pointer" onClick={() => handleSort('turma')}>Turma</th>
                          <th className="cursor-pointer num" onClick={() => handleSort('pct_geral')}>% Geral</th>
                          <th className="cursor-pointer" onClick={() => handleSort('status1')}>Status 1</th>
                          <th className="cursor-pointer" onClick={() => handleSort('status2')}>Status 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((a, i) => (
                          <tr key={a.nome + i} onClick={() => setSelectedStudent(a)}>
                            <td className="p-3 border-b border-gray-800">
                              <div className="s-name font-medium text-white">{a.nome}</div>
                              <div className="s-ra text-[10px] text-gray-500 font-mono">RA {a.ra || '—'}</div>
                            </td>
                            <td className="p-3 border-b border-gray-800 text-sm text-gray-400">{turmaShort(a.turma)}</td>
                            <td className="p-3 border-b border-gray-800 num font-mono font-bold text-white">{fmtPct(a.pct_geral)}</td>
                            <td className="p-3 border-b border-gray-800"><Badge status={a.status1} /></td>
                            <td className="p-3 border-b border-gray-800"><Badge status={a.status2} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activePage === 'insights' && (
              <section id="page-insights">
                <SectionHeader 
                  id="06 / APURAÇÃO" 
                  title="Pontos de atenção" 
                  lede="Observações derivadas da análise quantitativa. Destinam-se a apoiar a tomada de decisão e o planejamento de ações de intervenção pedagógica." 
                />

                <div className="insight-grid">
                  <div className="insight neg border-l-4">
                    <div className="in-tag">Ponto crítico</div>
                    <div className="in-title">Matemática apresenta o menor desempenho</div>
                    <div className="in-text text-sm text-gray-400">Média escolar de <b className="text-white">53,5%</b>. Faltam 46 pontos percentuais para a proficiência plena.</div>
                  </div>
                  <div className="insight pos border-l-4">
                    <div className="in-tag">Destaque</div>
                    <div className="in-title">Inglês lidera o desempenho da escola</div>
                    <div className="in-text text-sm text-gray-400">Média de <b className="text-white">79,6%</b>. Componente mais bem dominado entre as turmas.</div>
                  </div>
                   <div className="insight warn border-l-4">
                    <div className="in-tag">Risco de aprendizagem</div>
                    <div className="in-title">40 alunos abaixo do nível básico</div>
                    <div className="in-text text-sm text-gray-400">Equivale a <b className="text-white">26%</b> do total na primeira avaliação.</div>
                  </div>
                  <div className="insight info border-l-4">
                    <div className="in-tag">Defasagem escolar</div>
                    <div className="in-title">Defasagem média de 2,6 anos</div>
                    <div className="in-text text-sm text-gray-400">Grupo prioritário para plano de recuperação intensivo.</div>
                  </div>
                </div>

                <Block idx="RSK" title="Alunos em risco crítico" meta="% geral < 40">
                   <div className="rank-list">
                    {DATA.alunos
                      .filter(a => a.pct_geral != null && a.pct_geral < 0.4)
                      .sort((a,b) => (a.pct_geral || 0) - (b.pct_geral || 0))
                      .slice(0, 10)
                      .map((a, i) => (
                        <div key={a.nome + i} className="rank-item cursor-pointer" onClick={() => setSelectedStudent(a)}>
                          <div className="rank-i">{String(i+1).padStart(2,'0')}</div>
                          <div>
                            <div className="rank-n">{a.nome}</div>
                            <div className="text-[10px] text-gray-500 font-mono tracking-tight">{turmaShort(a.turma)}</div>
                          </div>
                          <div className="rank-v neg font-mono text-red-400 font-bold">{fmtPct(a.pct_geral)}</div>
                        </div>
                      ))}
                  </div>
                </Block>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Student Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="ovl" onClick={(e) => e.target === e.currentTarget && setSelectedStudent(null)}>
            <motion.div 
              className="modal bg-[#10141C] border border-gray-800 rounded-lg max-w-4xl w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="m-head p-8 pb-4 border-b border-gray-800 flex justify-between items-start">
                <div>
                  <div className="m-tag text-[#7CC4FF] font-mono text-[10px] uppercase tracking-widest mb-1">Perfil do Estudante</div>
                  <h2 className="m-name text-2xl font-medium text-white">{selectedStudent.nome}</h2>
                  <div className="m-meta text-xs text-gray-500 font-mono mt-1">{turmaShort(selectedStudent.turma)} · RA {selectedStudent.ra || '—'}</div>
                </div>
                <button className="m-close w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-red-500/20 hover:text-red-500 transition-colors rounded" onClick={() => setSelectedStudent(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="m-body p-8 pt-6">
                <div className="m-stats grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-800 border border-gray-800 rounded overflow-hidden mb-6">
                  <div className="m-stat bg-[#161C26] p-4">
                    <div className="l text-[9px] font-mono uppercase text-gray-500">% Geral</div>
                    <div className="v text-lg font-medium text-white mt-1">{fmtPct(selectedStudent.pct_geral)}</div>
                  </div>
                  <div className="m-stat bg-[#161C26] p-4">
                    <div className="l text-[9px] font-mono uppercase text-gray-500">Participação</div>
                    <div className="v text-lg font-medium text-white mt-1">{fmtPct(selectedStudent.part_diag)}</div>
                  </div>
                  <div className="m-stat bg-[#161C26] p-4">
                    <div className="l text-[9px] font-mono uppercase text-gray-500">Avaliação 1</div>
                    <div className="v text-lg font-medium text-white mt-1">{selectedStudent.aval1 || '—'}</div>
                    <div className="sub text-[10px] text-gray-500 mt-1 uppercase font-mono">{selectedStudent.status1 || '—'}</div>
                  </div>
                  <div className="m-stat bg-[#161C26] p-4">
                    <div className="l text-[9px] font-mono uppercase text-gray-500">Avaliação 2</div>
                    <div className="v text-lg font-medium text-white mt-1">{selectedStudent.aval2 || '—'}</div>
                    <div className="sub text-[10px] text-gray-500 mt-1 uppercase font-mono">{selectedStudent.status2 || '—'}</div>
                  </div>
                </div>
                <div className="sec-div text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 mt-6">Desempenho por disciplina</div>
                <div className="chart-box h-[300px]">
                  <Bar 
                    data={{
                      labels: DISC_KEYS.filter(d => (selectedStudent as any)[d] != null).map(k => DISC_LABELS[k]),
                      datasets: [{
                        data: DISC_KEYS.filter(d => (selectedStudent as any)[d] != null).map(d => (selectedStudent as any)[d] * 100),
                        backgroundColor: DISC_KEYS.filter(d => (selectedStudent as any)[d] != null).map(d => colorByPct((selectedStudent as any)[d] * 100)),
                        borderRadius: 2
                      }]
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: { grid: { display: false }, ticks: { color: P.t2 } },
                        y: { min: 0, max: 100, ticks: { color: P.t3, callback: v => v + '%' } }
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    
    </div>
  );
}
