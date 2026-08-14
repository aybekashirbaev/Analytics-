"use client";

import { useEffect, useState } from "react";

type Row = { dimensions: string[]; metrics: number[] };
type Data = { summary: { users: number; sessions: number; pageViews: number; checkouts: number }; sources: Row[]; countries: Row[]; trend: Row[]; updatedAt: string; error?: string };
const number = new Intl.NumberFormat("en-US");

function LineChart({ trend }: { trend: Row[] }) {
  const width = 620, height = 220, pad = { top: 20, right: 12, bottom: 32, left: 34 };
  const max = Math.max(1, ...trend.flatMap((day) => day.metrics));
  const point = (value: number, index: number) => {
    const x = trend.length > 1 ? pad.left + (index / (trend.length - 1)) * (width - pad.left - pad.right) : width / 2;
    const y = height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
    return `${x},${y}`;
  };
  const line = (metric: number) => trend.map((day, index) => point(day.metrics[metric], index)).join(" ");
  const formatDate = (date: string) => date.length === 8 ? `${date.slice(4, 6)}/${date.slice(6)}` : date;
  return <div className="chart-wrap"><div className="legend"><span><i className="users" />Visitors</span><span><i className="sessions" />Sessions</span></div><svg viewBox={`0 0 ${width} ${height}`}><line className="grid-line" x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} /><line className="grid-line" x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} /><text x="2" y={pad.top + 4}>{max}</text><text x="8" y={height - pad.bottom}>0</text>{trend.length > 0 && <><polyline className="line users" points={line(0)} /><polyline className="line sessions" points={line(1)} />{trend.map((day, index) => { const [ux, uy] = point(day.metrics[0], index).split(","); const [sx, sy] = point(day.metrics[1], index).split(","); return <g key={day.dimensions[0]}><circle className="dot users" cx={ux} cy={uy} r="3" /><circle className="dot sessions" cx={sx} cy={sy} r="3" />{(index === 0 || index === trend.length - 1 || index % 4 === 0) && <text className="date" x={ux} y={height - 8} textAnchor="middle">{formatDate(day.dimensions[0])}</text>}</g>; })}</>}</svg></div>;
}

export default function Dashboard({ email, signOutAction }: { email: string; signOutAction: () => Promise<void> }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics");
      const payload = await response.json();
      setData(payload);
    } catch {
      setData({ summary: { users: 0, sessions: 0, pageViews: 0, checkouts: 0 }, sources: [], countries: [], trend: [], updatedAt: new Date().toISOString(), error: "The dashboard could not reach its analytics endpoint. Please refresh once." });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const cards = data ? [["Visitors", data.summary.users], ["Sessions", data.summary.sessions], ["Page views", data.summary.pageViews], ["Checkout starts", data.summary.checkouts]] : [];

  return <main className="dashboard"><header><div><span className="eyebrow">Last 30 days</span><h1>Analytics overview</h1></div><div className="actions"><span>{email}</span><button className="secondary" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button><form action={signOutAction}><button className="secondary">Sign out</button></form></div></header>
    {data?.error ? <div className="error"><b>Connection needs attention.</b><br />{data.error}</div> : <>
      <section className="cards">{cards.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{number.format(Number(value))}</strong></article>)}</section>
      <section className="grid"><article className="panel"><h2>Traffic sources</h2><div className="table">{data?.sources.map((source) => <div key={source.dimensions[0]}><span>{source.dimensions[0] || "Unassigned"}</span><b>{number.format(source.metrics[0])} sessions</b></div>)}</div></article><article className="panel"><h2>Top countries</h2><div className="table">{data?.countries.map((country) => <div key={country.dimensions[0]}><span>{country.dimensions[0] || "Unknown"}</span><b>{number.format(country.metrics[0])} visitors</b></div>)}</div></article></section>
      <section className="panel chart-panel"><h2>Daily activity</h2><LineChart trend={data?.trend || []} /></section>
      <p className="updated">Updated {data ? new Date(data.updatedAt).toLocaleTimeString() : ""}. Data is provided by Google Analytics 4.</p>
    </>}
  </main>;
}
