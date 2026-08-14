"use client";

import { useEffect, useState } from "react";

type Data = { summary: { users: number; sessions: number; pageViews: number; checkouts: number }; sources: { dimensions: string[]; metrics: number[] }[]; trend: { dimensions: string[]; metrics: number[] }[]; updatedAt: string; error?: string };
const number = new Intl.NumberFormat("en-US");

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
      setData({ summary: { users: 0, sessions: 0, pageViews: 0, checkouts: 0 }, sources: [], trend: [], updatedAt: new Date().toISOString(), error: "The dashboard could not reach its analytics endpoint. Please refresh once." });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const cards = data ? [["Visitors", data.summary.users], ["Sessions", data.summary.sessions], ["Page views", data.summary.pageViews], ["Checkout starts", data.summary.checkouts]] : [];

  return <main className="dashboard"><header><div><span className="eyebrow">Last 30 days</span><h1>Analytics overview</h1></div><div className="actions"><span>{email}</span><button className="secondary" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button><form action={signOutAction}><button className="secondary">Sign out</button></form></div></header>
    {data?.error ? <div className="error"><b>Connection needs attention.</b><br />{data.error}</div> : <>
      <section className="cards">{cards.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{number.format(Number(value))}</strong></article>)}</section>
      <section className="grid"><article className="panel"><h2>Traffic sources</h2><div className="table">{data?.sources.map((source) => <div key={source.dimensions[0]}><span>{source.dimensions[0] || "Unassigned"}</span><b>{number.format(source.metrics[0])} sessions</b></div>)}</div></article><article className="panel"><h2>Daily activity</h2><div className="bars">{data?.trend.map((day) => { const height = Math.max(5, Math.min(100, day.metrics[0] * 12)); return <div key={day.dimensions[0]} title={`${day.dimensions[0]}: ${day.metrics[0]} visitors`}><i style={{ height: `${height}%` }} /><span>{day.dimensions[0].slice(4)}</span></div>; })}</div></article></section>
      <p className="updated">Updated {data ? new Date(data.updatedAt).toLocaleTimeString() : ""}. Data is provided by Google Analytics 4.</p>
    </>}
  </main>;
}
