import { generateMeta } from "@/lib/utils";
import LoginForm from "./login-form";

export function generateMetadata() {
  return generateMeta({
    title: "Login",
    description:
      "A login form with email and password. There's an option to login with Google and a link to sign up if you don't have an account.",
    canonical: "/login/v2"
  });
}

export default function Page() {
  return <LoginForm />;
}
