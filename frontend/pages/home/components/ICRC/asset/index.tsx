import { Fragment, useState } from "react";
import Menu from "@/pages/components/Menu";
import SearchAsset from "@/pages/home/components/ICRC/asset/SearchAsset";
import AssetAccordion from "@/pages/home/components/ICRC/asset/AssetAccordion";
import AssetMutate from "@/pages/home/components/ICRC/asset/AssetMutate";
import { UseAsset } from "@/pages/home/hooks/useAsset";
import { Button, Drawer, Box } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

import { clsx } from "clsx";

export default function AssetsList() {
  UseAsset();
  const [searchKey, setSearchKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Fragment>
      {/* Toggle Button */}
      <Button
        onClick={toggleDrawer}
        variant="contained"
        startIcon={isOpen && <CloseIcon />}
        className={clsx(
          "fixed z-50",
          "bg-slate-color-success hover:bg-slate-color-success/90",
          "text-white shadow-lg",
          "dark:"
        )}
        size="medium"
      >
        {isOpen ? "Close" : "Asset List"}
      </Button>

      {/* Assets Drawer */}
      <Drawer
        anchor="bottom"
        open={isOpen}
        onClose={toggleDrawer}
        variant="temporary"
        PaperProps={{
          sx: {
            width: '100%',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          }
        }}
      >
        <Box className="flex flex-col justify-center items-start w-full h-full p-3 pr-4 pt-[2rem] dark:bg-PrimaryColor bg-PrimaryColorLight">
          <Menu />
          <div className="flex flex-row items-center justify-center w-full gap-3 pr-5 mb-4">
            <SearchAsset searchKey={searchKey} setSearchKey={setSearchKey} />
            <AssetMutate />
          </div>
          <AssetAccordion searchKey={searchKey} />
        </Box>
      </Drawer>
    </Fragment>
  );
}
