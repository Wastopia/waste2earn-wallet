// svgs
import { ReactComponent as ChevronIcon } from "@/assets/svg/files/chevron-right.svg";
import { ReactComponent as UsaFlagIcon } from "@/assets/svg/files/usa.svg";
import { ReactComponent as PhilFlagIcon } from "@/assets/svg/files/flag-phil.svg";
import { ReactComponent as ItalyFlagIcon } from "@/assets/svg/files/italia.svg";
import { ReactComponent as BrazilFlagIcon } from "@/assets/svg/files/brazil.svg";
import { ReactComponent as ICRC1Logo } from "@/assets/svg/files/logo-light.svg";
import { ReactComponent as ICRC1LogoDark } from "@/assets/svg/files/logo-dark.svg";
import { ReactComponent as SunIcon } from "@/assets/svg/files/sun-icon.svg";
import { ReactComponent as RefreshIcon } from "@/assets/svg/files/refresh-ccw.svg";
import icUrl from "@/assets/img/icp-logo.png";
import ethUrl from "@assets/svg/files/ethereum-icon.svg";
//
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { ThemeHook } from "@/pages/hooks/themeHook";
import { LanguageHook } from "@/pages/hooks/languageHook";
import { clsx } from "clsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AccountHook } from "@/pages/hooks/accountHook";
import { logout } from "@redux/CheckAuth";
import { BasicModal } from "@components/modal";
import ThemeModal from "./themeModal";
import { ThemesEnum } from "@/common/const";
import { CustomCopy } from "@components/tooltip";
import { useAppSelector, useAppDispatch } from "@redux/Store";
import { db } from "@/database/db";
import DbLocationModal from "./dbLocationModal";
import { useSiweIdentity } from "ic-use-siwe-identity";
import { useAccount } from "wagmi";
import Pill from "./Pill";
import getTotalAmountInCurrency from "@/pages/helpers/getTotalAmountInCurrency";
import reloadBallance from "@/pages/helpers/reloadBalance";
import WatchOnlyPill from "./WatchOnlyPill";
import { setCurrency, Currency } from "@redux/common/CommonReducer";

const TopBarComponent = ({ isLoginPage }: { isLoginPage: boolean }) => {
  const { t } = useTranslation();
  const { onLanguageChange } = LanguageHook();
  const { watchOnlyMode } = useAppSelector((state) => state.auth);
  const { isAppDataFreshing, selectedCurrency } = useAppSelector((state) => state.common);
  const dispatch = useAppDispatch();
  const { theme, themeOpen, setThemeOpen } = ThemeHook();
  const { authClient } = AccountHook();

  const [langOpen, setLangOpen] = useState(false);
  const [dbLocationOpen, setDbLocationOpen] = useState(false);
  const { identity, clear: clearSiweIdentity } = useSiweIdentity();
  const { address } = useAccount();

  const langOpts = [
    { abrev: "en", name: "english", flag: <UsaFlagIcon className={flag} /> },
    { abrev: "phil", name: "filipino", flag: <PhilFlagIcon className={flag} /> },
    { abrev: "it", name: "italian", flag: <ItalyFlagIcon className={flag} /> },
    { abrev: "pt", name: "portuguese", flag: <BrazilFlagIcon className={flag} /> },
  ];

  const currencyOpts = [
    { code: Currency.USD, name: "USD", symbol: "$" },
    { code: Currency.PHP, name: "PHP", symbol: "₱" },
  ];

  return (
    <Fragment>
      <div className="flex flex-row justify-around px-5 items-center min-h-[8rem] w-full bg-PrimaryColorLight dark:bg-PrimaryColor text-PrimaryTextColorLight dark:text-PrimaryTextColor border-b border-BorderColorFourthLight dark:border-BorderColorFourth">
        <div className="flex flex-col items-center justify-start space-y-2 py-2">
        {theme === ThemesEnum.enum.dark ? (
            <ICRC1LogoDark className="max-w-[20rem] sm:max-w-[10rem] h-auto" />
          ) : (
            <ICRC1Logo className="max-w-[20rem] sm:max-w-[10rem] h-auto" />
          )}
        </div>
        <div className="flex flex-col justify-between gap-2 text-md">
          {!isLoginPage && (
            <div className="flex flex-row items-center justify-start gap-1">
              {identity && <Pill text={(address as string) || ""} start={6} end={4} icon={ethUrl} />}
              {!watchOnlyMode && <Pill text={authClient} start={12} end={10} icon={icUrl} />}
              {watchOnlyMode && <WatchOnlyPill text={authClient} icon={icUrl} />}
              <CustomCopy size={"small"} copyText={authClient} />
              <RefreshIcon
                className={`h-5 w-5 cursor-pointer fill-PrimaryTextColorLight dark:fill-PrimaryTextColor ${
                  isAppDataFreshing ? "do-spin" : ""
                }`}
                onClick={handleReloadButton}
              />
              {watchOnlyMode && <p className="opacity-50">{t("watchOnlyMode.title")}</p>}
            </div>
          )}
            <div className="flex flex-row items-center justify-start pr-2 space-x-5">
              {!isLoginPage && (
                <div className="flex flex-row items-center justify-start py-3 px-0 gap-2 text-md">
                  <p className="opacity-70">{t("total.balance")}:</p>
                  <p className="font-medium">{`${currencyOpts.find(c => c.code === selectedCurrency)?.symbol}${getTotalAmountInCurrency().toFixed(2)}`}</p>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-0 outline-none">
                        <p className="opacity-70">{selectedCurrency}</p>
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="text-lg bg-PrimaryColorLight rounded-lg dark:bg-SecondaryColor mr-4 z-[999] text-PrimaryTextColorLight dark:text-PrimaryTextColor shadow-sm shadow-BorderColorTwoLight dark:shadow-BorderColorTwo"
                        sideOffset={5}
                      >
                        {currencyOpts.map((currency) => (
                          <DropdownMenu.Item
                            key={currency.code}
                            className={clsx(gearPopItem)}
                            onSelect={() => {
                              dispatch(setCurrency(currency.code));
                            }}
                          >
                            <p>{currency.name}</p>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              )}
              <DropdownMenu.Root
                modal={false}
                onOpenChange={() => {
                  setLangOpen(false);
                }}
              >
                <DropdownMenu.Trigger asChild>
                  <button className="p-0 outline-none">
                    <SunIcon className="fill-SvgColor dark:fill-SvgColor max-w-[2rem] h-auto"></SunIcon>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="text-lg bg-PrimaryColorLight rounded-lg dark:bg-SecondaryColor mr-4 z-[999] text-PrimaryTextColorLight dark:text-PrimaryTextColor shadow-sm shadow-BorderColorTwoLight dark:shadow-BorderColorTwo"
                    sideOffset={5}
                  >
                    {!isLoginPage && (
                      <DropdownMenu.Item
                        className={clsx(gearPopItem, "!justify-between", "rounded-t-lg")}
                        onSelect={(e: Event) => {
                          e.preventDefault();
                          setLangOpen(!langOpen);
                        }}
                      >
                        <p>{t("language.word")}</p>
                        <ChevronIcon className={`fill-SvgColor dark:fill-SvgColor ${langOpen ? "" : "-rotate-90"}`} />
                      </DropdownMenu.Item>
                    )}
                    {!isLoginPage &&
                      langOpen &&
                      langOpts.map((lOpt, k) => {
                        return (
                          <DropdownMenu.Item
                            key={k}
                            className={clsx(gearPopItem)}
                            onSelect={() => {
                              setLangOpen(false);
                              changeLanguage(lOpt.abrev);
                            }}
                          >
                            {lOpt.flag}
                            <p>{t(lOpt.name)}</p>
                          </DropdownMenu.Item>
                        );
                      })}
                    <DropdownMenu.Item
                      className={clsx(gearPopItem, "!justify-between")}
                      onSelect={() => {
                        setThemeOpen(true);
                      }}
                    >
                      <p>{t("themes")}</p>
                    </DropdownMenu.Item>
                    {isLoginPage && (
                      <DropdownMenu.Item
                        className={clsx(gearPopItem, "!justify-between", "rounded-b-lg")}
                        onSelect={() => {
                          setDbLocationOpen(true);
                        }}
                      >
                        <p>{t("database.location")}</p>
                      </DropdownMenu.Item>
                    )}
                    {!isLoginPage && (
                      <DropdownMenu.Item
                        className={clsx(gearPopItem, "!justify-between", "rounded-b-lg")}
                        onSelect={() => {
                          clearSiweIdentity();
                          logout();
                        }}
                      >
                        <p className="text-LockColor">{t("Log-out")}</p>
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
      </div>
      <BasicModal open={themeOpen} top="top-[35%]" border="dark:border-2 dark:border-gray-color-6">
        <ThemeModal setOpen={setThemeOpen} />
      </BasicModal>
      <BasicModal open={dbLocationOpen} top="top-[35%]" border="dark:border-2 dark:border-gray-color-6">
        <DbLocationModal setOpen={setDbLocationOpen} />
      </BasicModal>
    </Fragment>
  );

  async function handleReloadButton() {
    await reloadBallance();
  }

  function changeLanguage(lang: string) {
    onLanguageChange(lang);
    i18n.changeLanguage(lang, () => {
      db().setLanguage(lang);
    });
  }
};

export default TopBarComponent;

// Tailwind CSS constants
const flag = clsx("mr-1", "max-h-[1.5rem]");
const gearPopItem = clsx(
  "flex",
  "flex-row",
  "justify-start",
  "items-center",
  "py-2",
  "px-4",
  "bg-none",
  "w-full",
  "min-w-[13rem]",
  "cursor-pointer",
  "outline-none",
  "hover:bg-PopSelectColorLight",
  "dark:hover:bg-PopSelectColor",
);
