import { Fragment, useState } from "react";
import Menu from "@/pages/components/Menu";
import SearchAsset from "@/pages/home/components/ICRC/asset/SearchAsset";
import AssetAccordion from "@/pages/home/components/ICRC/asset/AssetAccordion";
import AssetMutate from "@/pages/home/components/ICRC/asset/AssetMutate";
import { UseAsset } from "@/pages/home/hooks/useAsset";

export default function AssetsList() {
  UseAsset();
  const [searchKey, setSearchKey] = useState("");

  return (
    <Fragment>
      <div className="flex flex-col justify-center items-start w-[100%] h-full pl-3 pr-4 pt-[2rem] dark:bg-PrimaryColor bg-PrimaryColorLight">
        <Menu />
        <div className="flex flex-row items-center justify-center w-full gap-3 pr-5 mb-4">
          <SearchAsset searchKey={searchKey} setSearchKey={setSearchKey} />
          <AssetMutate />
        </div>
        <AssetAccordion searchKey={searchKey} />
      </div>
    </Fragment>
  );
}
