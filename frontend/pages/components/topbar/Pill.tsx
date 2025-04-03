import { shortAddress } from "@/common/utils/icrc";

interface PillProps {
  text: string;
  start: number;
  end: number;
  icon?: string;
  isAddress?: boolean;
}

export default function Pill({ text, start, end, icon, isAddress = false }: PillProps) {
  const formatAddress = (address: string) => {
    if (address.length > 13) {
      return `${address.slice(0, 5)}-...-${address.slice(-8, -3)}-${address.slice(-3)}`;
    }
    return address;
  };

  const displayText = isAddress 
    ? formatAddress(text)
    : text.length > 20 ? shortAddress(text, start, end) : text;

  return (
    <div className="relative w-[10rem]">
      <div className="px-2 py-3 rounded-full bg-GrayColor/50">
        <div className="flex items-center justify-center w-full gap-1 whitespace-nowrap">
          {icon && <img src={icon} alt="icon" className="w-7" />}
          {displayText}
        </div>
      </div>
    </div>
  );
}
