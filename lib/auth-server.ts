import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "@neondatabase/serverless";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  plugins: [
    emailOTP({
      disableSignUp: false,
      sendVerificationOTP: async ({ email, otp, type }) => {
        // In production, wire this to Resend / Postmark / SES etc.
        // For development, the OTP is logged to the server console.
        if (process.env.NODE_ENV === "development") {
          console.log(`\n=============================`);
          console.log(`  Email OTP for: ${email}`);
          console.log(`  Code: ${otp}`);
          console.log(`  Type: ${type}`);
          console.log(`=============================\n`);
        }
      },
    }),
  ],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "client",
        input: false, // not settable by user directly
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
