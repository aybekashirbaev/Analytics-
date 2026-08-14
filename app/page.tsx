import { auth, signIn, signOut } from "@/auth";
import Dashboard from "./dashboard";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.email) {
    return <main className="login"><div className="login-card"><span className="eyebrow">Private dashboard</span><h1>Threads to Income<br />Analytics</h1><p>Sign in with the Google account approved for this dashboard.</p><form action={async () => { "use server"; await signIn("google"); }}><button>Sign in with Google</button></form></div></main>;
  }
  return <Dashboard email={session.user.email} signOutAction={async () => { "use server"; await signOut(); }} />;
}
