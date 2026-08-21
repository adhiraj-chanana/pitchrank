import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i), l.slice(i+1)];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const email = `boss.test.${Date.now()}@gmail.com`;
const password = "smoke-test-password-123";
const { data, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true, user_metadata: { name: "Boss Tester" },
});
if (error) { console.error(error.message); process.exit(1); }
console.log(JSON.stringify({ email, password, userId: data.user.id }));
