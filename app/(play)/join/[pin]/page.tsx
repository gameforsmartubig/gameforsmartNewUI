import Join from "../component/join";

interface JoinPinPageProps {
  params: {
    pin: string;
  };
}

export default function JoinPinPage({ params }: JoinPinPageProps) {
  return <Join initialPin={params.pin} />;
}
