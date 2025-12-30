import { generateMeta } from "@/lib/utils";
import RegisterForm from "./register-form";

export async function generateMetadata() {
  return generateMeta({
    title: "Register Page v2",
    description:
      "A login form with email and password. There's an option to login with Google and a link to sign up if you don't have an account.",
    canonical: "/register/v2"
  });
}

export default function Page() {
  return (
    <RegisterForm />
  );
}
