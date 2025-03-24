// svg
import { ReactComponent as MoneyHandIcon } from "@assets/svg/files/money-hand.svg";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
//
import { useTranslation } from "react-i18next";
import ContactMainDetails from "./ContactMainDetails";
import { clsx } from "clsx";
import { LoadingLoader } from "@components/loader";
import { CustomButton } from "@components/button";
import ContactAssetDetails from "@/pages/contacts/components/ICRC/AddContact/ContactAssetDetails";
import { useCreateContact } from "@/pages/contacts/hooks/useCreateContact";
import { useContactError } from "@/pages/contacts/contexts/ContactErrorProvider";
import { useState } from "react";
import { useAppSelector } from "@redux/Store";

interface AddContactProps {
  onClose(): void;
}

export default function AddContact({ onClose }: AddContactProps) {
  const { t } = useTranslation();
  const assets = useAppSelector((state) => state.asset.list.assets);
  const [contactAssetSelected, setContactAssetSelected] = useState("");
  const { newContactErrors, subAccountError } = useContactError();
  const { newContact, onAddContact, onCheckAccountsAllowances, isAllowancesChecking, isCreating } =
    useCreateContact(onClose);

  const isNetworkSupported = assets
    .find((asset) => asset.tokenSymbol === contactAssetSelected)
    ?.supportedStandards.includes("ICRC-2");

  const enableAllowanceTest = newContact.accounts.length > 0 && isNetworkSupported;

  return (
    <div className="relative flex flex-col items-start justify-start w-full gap-4 text-md">
      <CloseIcon className={getCloseIconStyles(isCreating)} onClick={onClose} />
      <p className="text-lg sm:text-xl font-medium">{t("add.contact")}</p>

      <ContactMainDetails />
      <ContactAssetDetails
        contactAssetSelected={contactAssetSelected}
        setContactAssetSelected={setContactAssetSelected}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end w-full gap-3 mt-4">
        <p className="text-TextErrorColor text-sm sm:text-md">{newContactErrors?.message || subAccountError?.message}</p>
        <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
          {(isAllowancesChecking || isCreating) && (
            <LoadingLoader color="dark:border-secondary-color-1-light border-black-color" />
          )}

          {enableAllowanceTest && (
            <CustomButton
              className="bg-slate-color-success min-w-[5rem] flex justify-between items-center w-full sm:w-auto"
              onClick={onCheckAccountsAllowances}
              disabled={isAllowancesChecking || isCreating}
            >
              <MoneyHandIcon className="fill-PrimaryColorLight" /> {t("test")}
            </CustomButton>
          )}

          <CustomButton 
            className="min-w-[5rem] w-full sm:w-auto" 
            onClick={onAddContact} 
            disabled={isCreating || isAllowancesChecking}
          >
            <p>{t("add.contact")}</p>
          </CustomButton>
        </div>
      </div>
    </div>
  );
}

function getCloseIconStyles(isCreating: boolean) {
  return clsx(
    "absolute cursor-pointer top-2 right-2 sm:top-5 sm:right-5 stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor",
    isCreating && "opacity-50 pointer-events-none",
  );
}
