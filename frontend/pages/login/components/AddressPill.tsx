<<<<<<< Updated upstream


=======
>>>>>>> Stashed changes
type AddressPillProps = {
  address?: string;
  className?: string;
};

export default function AddressPill({ address, className = "" }: AddressPillProps) {
  if (!address) return null;

<<<<<<< Updated upstream
  return (
    <div className="px-3 py-1 rounded-full bg-GrayColor/50 w-36 sm:w-8 sm:p-1 sm:text-xs">
      <div className="flex items-center justify-center w-full gap-2 whitespace-nowrap">
      {address?.slice(0, 6) + "..." + address?.slice(-4)}
=======
  // Format the address as xxxxx-...-xxxxx-xxx
  const formattedAddress = address.length > 13
    ? `${address.slice(0, 5)}-...-${address.slice(-8, -3)}-${address.slice(-3)}`
    : address;

  return (
    <div className={`px-3 py-1 rounded-full bg-GrayColor/50 w-auto sm:text-xs ${className}`}>
      <div className="flex items-center justify-center w-full gap-2 whitespace-nowrap">
        {formattedAddress}
>>>>>>> Stashed changes
      </div>
    </div>
  );
}