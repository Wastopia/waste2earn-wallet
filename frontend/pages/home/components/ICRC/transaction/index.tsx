import { Fragment, useState } from "react";
import ICRCSubaccountAction from "@/pages/home/components/ICRC/transaction/TransactionActionBanner";
import SendReceiveDrawer from "@/pages/home/components/ICRC/transaction/SendReceiveDrawer";
import TransactionInspectDrawer from "@/pages/home/components/ICRC/transaction/TransactionInpectDrawer";
import TransactionsFiltering from "@/pages/home/components/ICRC/transaction/TransactionsFiltering";
import TransactionsScroll from "@/pages/home/components/ICRC/transaction/TransactionsScroll";
import { useAppSelector } from "@redux/Store";
import { SupportedStandardEnum } from "@/@types/icrc";
import TablesTab from "@/pages/home/components/ICRC/transaction/TablesTab";
import AllowancesTable from "@/pages/home/components/ICRC/transaction/AllowancesTable";

export enum TabOption {
  TRANSACTIONS = "Transactions",
  ALLOWANCES = "Allowances",
}

const DetailList = () => {
  const { selectedAsset } = useAppSelector((state) => state.asset.helper);
  const [openTab, setOpeTab] = useState<TabOption>(TabOption.TRANSACTIONS);

  const allowanceTabAllowed =
    selectedAsset?.supportedStandards?.includes(SupportedStandardEnum.Values["ICRC-2"]) || false;

  return (
    <Fragment>
      <TransactionsFiltering>
        <div className="relative flex flex-col items-center justify-center w-full gap-2 pt-5 bg-SecondaryColorLight dark:bg-SecondaryColor p-2">
          <ICRCSubaccountAction />
          <TablesTab toggle={toggleTab} openTab={openTab} allowanceTabAllowed={allowanceTabAllowed} />
          {openTab === TabOption.TRANSACTIONS && <TransactionsScroll />}
          {openTab === TabOption.ALLOWANCES && allowanceTabAllowed && <AllowancesTable />}
        </div>
      </TransactionsFiltering>
      <SendReceiveDrawer />
      <TransactionInspectDrawer />
    </Fragment>
  );

  function toggleTab() {
    if (openTab === TabOption.TRANSACTIONS) setOpeTab(TabOption.ALLOWANCES);
    else setOpeTab(TabOption.TRANSACTIONS);
  }
};

export default DetailList;
