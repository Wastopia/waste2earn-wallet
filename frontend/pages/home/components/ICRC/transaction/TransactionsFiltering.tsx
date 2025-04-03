import { chunkTransactions } from "@/pages/home/helpers/mappers";
import { useAppDispatch, useAppSelector } from "@redux/Store";
import { useEffect, useRef } from "react";
import { setTransactions, updateTxWorkerSubAccount } from "@redux/transaction/TransactionReducer";
import { AssetSymbolEnum } from "@/common/const";
import { getAllTransactionsICP, getAllTransactionsICRC1 } from "@/pages/home/helpers/requests";
import { Asset, SubAccount, Transaction, TransactionList } from "@redux/models/AccountModels";
import { hexToUint8Array } from "@/common/utils/hexadecimal";
import { isEqual } from "lodash";
import logger from "@/common/utils/logger";

// INFO: this wrapper is reponsable of filter and refresh the transactions based on the selected asset, sub account and txWorker update.
export default function TransactionsFiltering({ children }: { children: JSX.Element }) {
  const dispatch = useAppDispatch();
  const { txWorker } = useAppSelector((state) => state.transaction.list);
  const { selectedAccount, selectedAsset } = useAppSelector((state) => state.asset.helper);
  const { assets } = useAppSelector((state) => state.asset.list);

  const lastSelectedAccountRef = useRef<SubAccount | undefined>(undefined);
  const lastSelectedAssetRef = useRef<Asset | undefined>(undefined);
  const lastTxWorker = useRef<Array<TransactionList> | undefined>(undefined);

  logger.info("TransactionsFiltering: Component rendered", {
    selectedAsset: selectedAsset?.tokenSymbol,
    selectedAccount: selectedAccount?.sub_account_id,
    txWorkerLength: txWorker.length
  });

  const refreshICRCTxWorker = async () => {
    const currentAsset = assets.find((asset: Asset) => asset.address === selectedAsset?.address);
    const isAssetFull = currentAsset?.index && selectedAccount?.sub_account_id && selectedAsset?.tokenSymbol;
    const isSubAccountSelected = selectedAccount?.sub_account_id;

    logger.info("refreshICRCTxWorker called", {
      currentAsset: currentAsset?.tokenSymbol,
      isAssetFull,
      isSubAccountSelected
    });

    if (currentAsset && isAssetFull && isSubAccountSelected) {
      const canisterId = currentAsset.index || "";
      const assetSymbol = currentAsset.tokenSymbol;
      const canister = currentAsset.address;

      const subaccount_index = hexToUint8Array(selectedAccount?.sub_account_id || "0x0");
      const subNumber = selectedAccount?.sub_account_id;

      logger.info("Fetching ICRC transactions", {
        canisterId,
        assetSymbol,
        subNumber
      });

      const tx: Transaction[] = await getAllTransactionsICRC1({
        canisterId,
        subaccount_index,
        assetSymbol,
        canister,
        subNumber,
      });

      logger.info(`ICRC transactions received: ${tx.length}`);

      dispatch(
        updateTxWorkerSubAccount({
          symbol: assetSymbol,
          tokenSymbol: assetSymbol,
          subaccount: subNumber,
          tx,
        }),
      );
    }
  };

  const refreshICPTxWorker = async () => {
    const isNotSelectedAsset =
      !selectedAccount?.symbol || !selectedAsset?.tokenSymbol || !selectedAccount?.sub_account_id;

    logger.info("refreshICPTxWorker called", {
      isNotSelectedAsset,
      selectedAccountSymbol: selectedAccount?.symbol,
      selectedAssetTokenSymbol: selectedAsset?.tokenSymbol,
      selectedAccountSubId: selectedAccount?.sub_account_id
    });

    if (isNotSelectedAsset) return;

    const subaccount_index = selectedAccount?.sub_account_id || "";
    const isOGY = selectedAccount?.symbol === AssetSymbolEnum.Enum.OGY;

    const tx: Transaction[] = await getAllTransactionsICP({
      subaccount_index,
      isOGY,
    });

    logger.info(`ICP transactions received: ${tx.length}`);

    dispatch(
      updateTxWorkerSubAccount({
        symbol: selectedAsset?.symbol,
        tokenSymbol: selectedAsset?.tokenSymbol,
        subaccount: selectedAccount?.sub_account_id,
        tx,
      }),
    );
  };

  async function refreshCurrentAccountTransactions() {
    const isSelectedICP = selectedAsset?.tokenSymbol === AssetSymbolEnum.Enum.ICP;
    const isSelectedOGY = selectedAsset?.tokenSymbol === AssetSymbolEnum.Enum.OGY;

    logger.info("refreshCurrentAccountTransactions called", {
      isSelectedICP,
      isSelectedOGY,
      selectedAssetTokenSymbol: selectedAsset?.tokenSymbol
    });

    if (isSelectedICP || isSelectedOGY) {
      await refreshICPTxWorker();
    } else {
      await refreshICRCTxWorker();
    }
  }

  function searchCurrentAccountTransactions() {
    const selectedSubAccountId = selectedAccount?.sub_account_id;
    const selectedAssetSymbol = selectedAsset?.tokenSymbol;

    logger.info("searchCurrentAccountTransactions called", {
      selectedSubAccountId,
      selectedAssetSymbol,
      txWorkerLength: txWorker.length
    });

    const transactionsByAccount = txWorker.find((tx) => {
      return selectedAssetSymbol === tx.tokenSymbol && selectedSubAccountId === tx.subaccount;
    });

    const handledTransactions = transactionsByAccount?.tx || [];

    logger.info(`Found ${handledTransactions.length} transactions for current account`);

    const transactionsChunks = chunkTransactions({
      transactions: handledTransactions,
      chunkSize: 20,
    });

    logger.info(`Created ${transactionsChunks.length} transaction chunks`);

    dispatch(setTransactions(transactionsChunks));
  }

  async function onSelectedChange() {
    const isSubAccountChanged = lastSelectedAccountRef.current?.sub_account_id !== selectedAccount?.sub_account_id;
    const isAssetChanged = lastSelectedAssetRef.current?.tokenSymbol !== selectedAsset?.tokenSymbol;

    logger.info("onSelectedChange called", {
      isSubAccountChanged,
      isAssetChanged,
      lastAccount: lastSelectedAccountRef.current?.sub_account_id,
      currentAccount: selectedAccount?.sub_account_id,
      lastAsset: lastSelectedAssetRef.current?.tokenSymbol,
      currentAsset: selectedAsset?.tokenSymbol
    });

    if (isSubAccountChanged || isAssetChanged) {
      lastSelectedAccountRef.current = selectedAccount;
      lastSelectedAssetRef.current = selectedAsset;

      searchCurrentAccountTransactions();
      await refreshCurrentAccountTransactions();
    }
  }

  useEffect(() => {
    const isTxWorkerChanged = !isEqual(lastTxWorker.current, txWorker);

    logger.info("txWorker effect triggered", {
      isTxWorkerChanged,
      txWorkerLength: txWorker.length
    });

    if (isTxWorkerChanged) {
      lastTxWorker.current = txWorker;
      searchCurrentAccountTransactions();
    }
  }, [txWorker]);

  useEffect(() => {
    logger.info("selectedAccount/selectedAsset effect triggered");
    onSelectedChange();
  }, [selectedAccount, selectedAsset]);

  return children;
}
