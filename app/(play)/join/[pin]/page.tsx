import Join from "../component/join";

// In Next.js 15, params is a Promise
interface JoinPinPageProps {
  params: Promise<{
    pin: string;
  }>;
}

export default async function JoinPinPage({ params }: JoinPinPageProps) {
  const resolvedParams = await params;
  return <Join initialPin={resolvedParams.pin} />;
}
