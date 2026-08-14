import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmail = process.env.ALLOWED_EMAIL?.toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ profile }) {
      return Boolean(profile?.email && allowedEmail && profile.email.toLowerCase() === allowedEmail);
    }
  }
});
