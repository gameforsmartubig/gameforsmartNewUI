import Image from "next/image";

export default function Logo() {
  return (
    <Image
          src="/gameforsmartlogo.png"
          width={100}
          height={40}
          className="w-full size-8"
          alt="gameforsmart logo"
        />
  );
}
