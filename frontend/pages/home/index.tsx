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
import { LocalRxdbDatabase } from "@/database/local-rxdb";
import DisclaimerModal from "@components/DisclaimerModal";

const Home = () => {
  const { t } = useTranslation();
  const [showKYCRegistration, setShowKYCRegistration] = useState(false);
  const [userDataGridOpen, setUserDataGridOpen] = useState(false);
  const { userPrincipal } = useAppSelector((state) => state.auth);
  const [firstName, setFirstName] = useState("User");
  const [userType, setUserType] = useState<string>("regular");
  const [kycStatus, setKycStatus] = useState<string>("pending");

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
    const fetchKYCStatus = async () => {
      try {
        if (!userPrincipal) return;
        
        const db = LocalRxdbDatabase.instance;
        const kycDetails = await db.getKYCDetails(userPrincipal.toString());
        
        if (kycDetails) {
          setUserType(kycDetails.userType);
          setKycStatus(kycDetails.status);
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      }
    };

    if (userPrincipal) {
      fetchKYCStatus();
    }
  }, [userPrincipal]);

  return (
    <div className="flex flex-col w-full space-y-3">
      <div className="flex justify-center px-4 py-4">
        <div className="flex items-center gap-4 justify-between w-full">
          <div className="flex justify-start w-full space-x-4">
            <PeopleIcon className="text-slate-color-success" />
            <span className="text-lg text-SecondaryTextColorLight dark:text-PrimaryTextColor sm:text-sm">
              {t("Hi, I'm")} {firstName}, {t(userType)} ({t(kycStatus)})
            </span>
          </div>
          
          {kycStatus !== 'approved' && (
            <CustomButton
              className={clsx(
                "bg-slate-color-success text-white px-6 py-2 text-sm sm:px-1 sm:py-1",
                "hover:bg-slate-color-success/90 transition-colors duration-200"
              )}
              onClick={() => setShowKYCRegistration(true)}
            >
              {t("Complete your KYC Registration")}
            </CustomButton>
          )}
        </div>
      </div>
      
      <DetailList />
      <AssetsList />
      {showKYCRegistration && (
        <KYCRegistration onClose={() => setShowKYCRegistration(false)} />
      )}
      {userType === 'validator' && kycStatus === 'approved' && (
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
      
      <DisclaimerModal isLoginPage={false} />
    </div>
  );
};

export default Home;
