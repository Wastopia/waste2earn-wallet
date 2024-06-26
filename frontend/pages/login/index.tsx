import HplWalletIcon from "@/assets/svg/files/logo_W2E_dark.svg";
import HplWalletLightIcon from "@/assets/svg/files/logo_W2E.svg";
import { ReactComponent as LoginLogoIcon } from "@/assets/svg/files/login-logo.svg";
import { ReactComponent as CheckIcon } from "@assets/svg/files/edit-check.svg";
import { LoginHook } from "./hooks/loginhook";
import { useTranslation } from "react-i18next";
import { ThemeHook } from "@hooks/themeHook";
import { ChangeEvent, Fragment } from "react";
import { handleAuthenticated, handleSeedAuthenticated } from "@/redux/CheckAuth";
import { AuthNetworkTypeEnum, ThemesEnum } from "@/const";
import { AuthNetwork } from "@redux/models/TokenModels";
import { CustomInput } from "@components/Input";
import { FaHome } from "react-icons/fa";

const Login = () => {
  const { t } = useTranslation();
  const { loginOpts, seedOpen, setSeedOpen, seed, setSeed } = LoginHook();
  const { theme } = ThemeHook();

  return (
    <Fragment>
      <div className="flex flex-row w-full h-full bg-PrimaryColorLight dark:bg-PrimaryColor">
        <div className="flex flex-col h-full justify-center items-center px-[5%] bg-SecondaryColorLight dark:bg-SecondaryColor">
          <img
            src={theme === ThemesEnum.enum.dark ? HplWalletIcon : HplWalletLightIcon}
            alt=""
            className="w-full max-w-[25rem]"
          />

          <LoginLogoIcon className="w-full max-w-[25rem]" />
        </div>
        <div className="relative flex flex-col justify-center items-center w-full h-full mb-5">
          <div className="flex flex-col justify-center items-center w-full h-full">
            <h2 className="text-[2rem] font-bold text-PrimaryTextColorLight dark:text-PrimaryTextColor">
              {t("login.title")}
            </h2>
            <div className="flex flex-col justify-start items-start w-[70%] mt-8">
              <p className="font-light text-PrimaryTextColorLight dark:text-PrimaryTextColor text-left">
                {t("login.choose.msg")}
              </p>
              {loginOpts.map((opt, k) => {
                return (
                  <div className="flex flex-col justify-start items-start w-full" key={k}>
                    <div
                      className="flex flex-row justify-between items-center w-full mt-4 p-3 rounded-[5%] cursor-pointer bg-SecondaryColorLight dark:bg-SecondaryColor"
                      onClick={async () => {
                        handleLogin(opt);
                      }}
                    >
                      <h3 className="font-medium text-PrimaryTextColorLight dark:text-PrimaryTextColor">
                        {opt.name} <span className="text-md opacity-60">{opt.extra ? `(${t(opt.extra)})` : ""}</span>
                      </h3>
                      {opt.icon}
                    </div>
                    {seedOpen && opt.type === AuthNetworkTypeEnum.Enum.NONE && (
                      <CustomInput
                        sizeInput={"medium"}
                        intent={"secondary"}
                        compOutClass=""
                        value={seed}
                        onChange={onSeedChange}
                        sufix={
                          <div className="flex flex-row justify-start items-center gap-2">
                            <CheckIcon
                              onClick={() => {
                                handleSeedAuthenticated(seed);
                              }}
                              className={`w-4 h-4 ${seed.length > 0
                                ? "stroke-BorderSuccessColor"
                                : "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor"
                                } opacity-50 cursor-pointer`}
                            />
                            <p className="text-sm text-PrimaryTextColorLight dark:text-PrimaryTextColor">Max 32</p>
                          </div>
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSeedAuthenticated(seed);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <a
              className="flex items-center justify-center p-5 rounded-md bg-SecondaryColor hover:bg-SecondaryColorActive text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-SecondaryColorActive"
              href="https://waste2earn.xyz"
              target="_blank"
              aria-label="Go to Home page" rel="noreferrer"
            >
              <FaHome className="mr-2 text-xl" />
              <span className="text-base font-medium">Return to Homepage</span>
            </a>
          </div>
          <div className="flex flex-col justify-center items-center text-center pt-6 pb-8">
            <p className="font-light text-lg text-PrimaryTextColorLight dark:text-PrimaryTextColor">
              {t("login.bottom.msg")}
            </p>
            <p className="font-light text-lg text-PrimaryTextColorLight dark:text-PrimaryTextColor">
              <span className="font-bold text-lg">{t("login.bottom.msg.terms")}</span> {t("and")}{" "}
              <span>{t("login.bottom.msg.policy")}</span>
            </p>
          </div>

        </div>
      </div>
    </Fragment>
  );

  async function handleLogin(opt: AuthNetwork) {
    if (opt.type === AuthNetworkTypeEnum.Values.IC || opt.type === AuthNetworkTypeEnum.Values.NFID) {
      setSeedOpen(false);
      localStorage.setItem("network_type", JSON.stringify({ type: opt.type, network: opt.network, name: opt.name }));
      handleAuthenticated(opt);
    } else if (opt.type === AuthNetworkTypeEnum.Enum.NONE) {
      setSeedOpen((prev) => !prev);
      setSeed("");
    }
  }
  function onSeedChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value.length <= 32) setSeed(e.target.value);
  }
};

export default Login;
