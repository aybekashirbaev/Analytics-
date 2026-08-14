import { auth } from "@/auth";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const apiBase = "https://analyticsdata.googleapis.com/v1beta";

function serviceAccountCredentials() {
  const value = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!value) throw new Error("Missing Google service account credentials.");

  // Vercel accepts both the Base64 value described in the setup guide and
  // the original JSON pasted directly as a protected environment variable.
  // Supporting both avoids accidental corruption caused by clipboard tools.
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error("The Google service-account credential is not valid JSON.");
    }
  }
}

async function report(body: object) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("Missing GA4 property ID.");
  const googleAuth = new GoogleAuth({
    credentials: serviceAccountCredentials(),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
  });
  const client = await googleAuth.getClient();
  const token = await client.getAccessToken();
  const response = await fetch(`${apiBase}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Analytics request failed (${response.status}): ${details}`);
  }
  return response.json();
}

function metricValue(response: any) {
  return Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
}

function rows(response: any) {
  return (response.rows || []).map((row: any) => ({
    dimensions: (row.dimensionValues || []).map((item: any) => item.value),
    metrics: (row.metricValues || []).map((item: any) => Number(item.value || 0))
  }));
}

export async function GET() {
  const session = await auth();
  if (session?.user?.email?.toLowerCase() !== process.env.ALLOWED_EMAIL?.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [overview, checkouts, sources, trend] = await Promise.all([
      report({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }] }),
      report({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "begin_checkout" } } } }),
      report({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 6 }),
      report({ dateRanges: [{ startDate: "14daysAgo", endDate: "today" }], dimensions: [{ name: "date" }], metrics: [{ name: "totalUsers" }, { name: "sessions" }], orderBys: [{ dimension: { dimensionName: "date" } }] })
    ]);

    const values = overview.rows?.[0]?.metricValues || [];
    return NextResponse.json({
      summary: { users: Number(values[0]?.value || 0), sessions: Number(values[1]?.value || 0), pageViews: Number(values[2]?.value || 0), checkouts: metricValue(checkouts) },
      sources: rows(sources),
      trend: rows(trend),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Analytics dashboard request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load analytics." }, { status: 500 });
  }
}
