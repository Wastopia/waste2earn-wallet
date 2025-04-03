import { Principal } from "@dfinity/principal";
import ICRCLedgerActor from "./actor";
import { TransferArg } from "@/candid/icrcLedger/icrcLedgerService";
import { HttpAgent } from "@dfinity/agent";

interface ICRC1TransferArgs extends TransferArg {
  canisterId: string | Principal;
  agent: HttpAgent;
}

export default async function ICRC1Transfer(args: ICRC1TransferArgs) {
  const { canisterId, agent, ...params } = args;
  const actor = ICRCLedgerActor({ agent, canisterId });
  return await actor.icrc1_transfer(params);
}
