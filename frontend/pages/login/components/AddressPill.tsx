type AddressPillProps = {
  address?: string;
  className?: string;
};

export default function AddressPill({ address, className = "" }: AddressPillProps) {
  if (!address) return null;

  // Format the address as xxxxx-...-xxxxx-xxx
  const formattedAddress = address.length > 13
    ? `${address.slice(0, 5)}-...-${address.slice(-8, -3)}-${address.slice(-3)}`
    : address;

  return (
    <div className={`px-3 py-1 rounded-full bg-GrayColor/50 w-auto sm:text-xs ${className}`}>
      <div className="flex items-center justify-center w-full gap-2 whitespace-nowrap">
        {formattedAddress}
      </div>
    </div>
  );
}