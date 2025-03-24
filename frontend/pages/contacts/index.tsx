import Menu from "@/pages/components/Menu";
import SearchIcon from "@assets/svg/files/icon-search.svg";
import { useCallback, useState } from "react";
import AssetFilter from "./components/ICRC/AssetFilter";
import { useTranslation } from "react-i18next";
import { CustomInput } from "@components/input";
import AddContactModal from "./components/ICRC/AddContactModal";
import ContactList from "./components/contactList";
import Switch from "@components/switch/BasicSwitch";

const Contacts = () => {
  const { t } = useTranslation();
  const [allowanceOnly, setAllowanceOnly] = useState(false);
  const [contactSearchKey, setContactSearchKey] = useState("");
  const [assetFilter, setAssetFilter] = useState<string[]>([]);

  const onContactSearchKeyChange = useCallback((searchKey: string) => {
    setContactSearchKey(searchKey);
  }, []);

  const onAssetFilterChange = useCallback((assetFilter: string[]) => {
    setAssetFilter(assetFilter);
  }, []);

  return (
    <div className="flex flex-col w-full pt-[1rem] px-4 md:px-[2.25rem]">
      <Menu />
      <div className="flex flex-col items-start justify-start w-full gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4 md:gap-0">
          <div className="flex flex-col md:flex-row items-start md:items-center w-full md:w-10/12 gap-3 text-md">
            <div className="w-full md:w-auto">
              <AssetFilter assetFilter={assetFilter} onAssetFilterChange={onAssetFilterChange} />
            </div>

            <div className="w-full md:w-[40%]">
              <CustomInput
                compOutClass="!w-full"
                prefix={<img src={SearchIcon} className="mx-2" alt="search-icon" />}
                intent={"secondary"}
                sizeInput={"medium"}
                placeholder={t("search.contact")}
                value={contactSearchKey}
                onChange={(e) => onContactSearchKeyChange(e.target.value)}
              />
            </div>

            <div className="w-full md:w-auto">
              <AddContactModal />
            </div>
          </div>
          <div className="flex items-center justify-start md:justify-end w-full md:w-2/12">
            <p className="mr-2 text-md text-PrimaryTextColorLight dark:text-PrimaryTextColor">
              {t("allowances.only")}
            </p>
            <Switch checked={allowanceOnly} onChange={() => setAllowanceOnly(!allowanceOnly)} />
          </div>
        </div>
        <ContactList contactSearchKey={contactSearchKey} assetFilter={assetFilter} allowanceOnly={allowanceOnly} />
      </div>
    </div>
  );
};

export default Contacts;
