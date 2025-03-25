import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CustomButton } from "@components/button";
import { clsx } from "clsx";
import "./style.scss";
import AssetsList from "./components/ICRC/asset";
import DetailList from "./components/ICRC/transaction";
import KYCRegistration from "./components/KYCRegistration";
import UserDataGrid from './components/UserDataGrid';
import PeopleIcon from '@mui/icons-material/People';
import { useAppSelector } from '@redux/Store';

const Home = () => {
  const { t } = useTranslation();
  const [showKYCRegistration, setShowKYCRegistration] = useState(false);
  const [userDataGridOpen, setUserDataGridOpen] = useState(false);
  const { userPrincipal } = useAppSelector((state) => state.auth);
  const [firstName, setFirstName] = useState("User");
  const [isValidator, setIsValidator] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userResponse = await fetch(`/api/users/${userPrincipal}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user details');
        const userData = await userResponse.json();
        setFirstName(userData.firstName || "User");
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    if (userPrincipal) {
      fetchUserDetails();
    }
  }, [userPrincipal]);

  useEffect(() => {
    const checkValidatorStatus = async () => {
      try {
        const validatorResponse = await fetch(`/api/validators/${userPrincipal}`);
        if (!validatorResponse.ok) {
          throw new Error('Failed to check validator status');
        }
        const validatorData = await validatorResponse.json();
        setIsValidator(validatorData.isActive);
      } catch (error) {
        console.error('Error checking validator status:', error);
        setIsValidator(false);
      }
    };

    if (userPrincipal) {
      checkValidatorStatus();
    }
  }, [userPrincipal]);

  return (
    <div className="flex flex-col w-full space-y-3">
      <div className="flex justify-center px-4 py-4">
        <div className="flex items-center gap-4 justify-between w-full">
        <div className="flex justify-start w-full space-x-4">
          <PeopleIcon className="text-slate-color-success" />
          <span className="text-lg text-SecondaryTextColorLight dark:text-PrimaryTextColor sm:text-sm">
            {t("Hi, I'm")} {firstName}, {t(isValidator ? "validator" : "regular user")}
          </span>
        </div>
          
          <CustomButton
            className={clsx(
              "bg-slate-color-success text-white px-6 py-2 text-sm sm:px-1 sm:py-1",
              "hover:bg-slate-color-success/90 transition-colors duration-200"
            )}
            onClick={() => setShowKYCRegistration(true)}
          >
            {t("Complete your KYC Registration")}
          </CustomButton>
          
        </div>
      </div>
      
      <DetailList />
      <AssetsList />
      {showKYCRegistration && (
        <KYCRegistration onClose={() => setShowKYCRegistration(false)} />
      )}
      {isValidator && (
        <CustomButton
          className={clsx(
            "bg-slate-color-success text-white px-6 py-2",
            "hover:bg-slate-color-success/90 transition-colors duration-200"
          )}
          onClick={() => setUserDataGridOpen(true)}
        >
          {t('user.viewAll')}
        </CustomButton>
      )}
      <UserDataGrid
        open={userDataGridOpen}
        onClose={() => setUserDataGridOpen(false)}
      />
    </div>
  );
};

export default Home;
