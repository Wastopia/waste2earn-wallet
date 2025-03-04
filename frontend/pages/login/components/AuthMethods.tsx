import { useTranslation } from "react-i18next";
import AuthMethodRender from "@/pages/login/components/AuthMethodRender";
import LanguageSwitcher from "@/pages/login/components/LanguageSwitcher";

export default function AuthMethods() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-start w-full h-full bg-PrimaryColorLight dark:bg-PrimaryColor">
      <LanguageSwitcher />
      <div className="flex flex-col items-center justify-center w-full h-full">
        <h2 className="text-[2rem] font-bold text-PrimaryTextColorLight dark:text-PrimaryTextColor">
          {t("login.title")}
        </h2>
        <AuthMethodRender />
        <div className="flex flex-col items-center justify-center text-center p-10">
          <p className="text-lg font-light text-PrimaryTextColorLight dark:text-PrimaryTextColor">
            {t("login.bottom.msg")}
          </p>
          <p className="text-lg font-light text-PrimaryTextColorLight dark:text-PrimaryTextColor">
            <span className="text-lg font-bold">{t("login.bottom.msg.terms")}</span> {t("and")}{" "}
            <span>{t("login.bottom.msg.policy")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
