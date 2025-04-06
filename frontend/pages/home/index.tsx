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
import { Chip } from "@mui/material";
import { useSnackbar } from "notistack";
import { LoadingLoader } from "@components/loader";

const Home = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [showKYCRegistration, setShowKYCRegistration] = useState(false);
  const [userDataGridOpen, setUserDataGridOpen] = useState(false);
  const { userPrincipal } = useAppSelector((state) => state.auth);
  const [firstName, setFirstName] = useState("User");
  const [userType, setUserType] = useState<string>("regular");
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        if (!userPrincipal) return;
        
        setIsLoading(true);
        const db = LocalRxdbDatabase.instance;
        const kycDetails = await db.getKYCDetails(userPrincipal.toString());
        
        if (kycDetails) {
          setUserType(kycDetails.userType);
          setKycStatus(kycDetails.status);
          setFirstName(kycDetails.personalInfo?.firstName || "User");
        } else {
          setKycStatus("not_started");
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
        enqueueSnackbar(t('Failed to fetch KYC status'), { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    if (userPrincipal) {
      fetchKYCStatus();
    }
  }, [userPrincipal]);

  const getKycStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'not_started':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleUserDataGridOpen = () => {
    if (!userPrincipal) {
      enqueueSnackbar(t('Please login to view user data'), { variant: 'warning' });
      return;
    }
    if (userType !== 'validator' || kycStatus !== 'approved') {
      enqueueSnackbar(t('Only approved validators can view user data'), { variant: 'warning' });
      return;
    }
    setUserDataGridOpen(true);
  };

  return (
    <div className="flex flex-col w-full space-y-3">
      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <LoadingLoader />
        </div>
      ) : (
        <div className="flex justify-center px-4 py-4">
          <div className="flex items-center gap-4 justify-between w-full">
            <div className="flex justify-start w-full space-x-4 items-center">
              <PeopleIcon className="text-slate-color-success" />
              <span className="text-lg text-SecondaryTextColorLight dark:text-PrimaryTextColor sm:text-sm">
                {t("Hi, I'm")} {firstName}
              </span>
              <Chip 
                label={t(userType)}
                color="primary"
                size="small"
                className="capitalize"
              />
              <Chip 
                label={t(kycStatus)}
                color={getKycStatusColor(kycStatus)}
                size="small"
                className="capitalize"
              />
            </div>
            
            {kycStatus !== 'approved' && (
              <CustomButton
                className={clsx(
                  "bg-slate-color-success text-white px-6 py-2 text-sm sm:px-1 sm:py-1",
                  "hover:bg-slate-color-success/90 transition-colors duration-200"
                )}
                onClick={() => setShowKYCRegistration(true)}
              >
                {kycStatus === 'not_started' 
                  ? t("Start KYC Registration")
                  : t("Complete your KYC Registration")}
              </CustomButton>
            )}
          </div>
        </div>
      )}
      
      <DetailList />
      <AssetsList />
      {showKYCRegistration && (
        <KYCRegistration onClose={() => setShowKYCRegistration(false)} />
      )}
      
      {/* Validator Data Grid Button */}
      {userType === 'validator' && (
        <CustomButton
          className={clsx(
            "bg-slate-color-success text-white px-6 py-2",
            "hover:bg-slate-color-success/90 transition-colors duration-200",
            (userType !== 'validator' || kycStatus !== 'approved') && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleUserDataGridOpen}
        >
          {t('View User Data')}
        </CustomButton>
      )}
      
      <UserDataGrid
        open={userDataGridOpen}
        onClose={() => setUserDataGridOpen(false)}
        userPrincipal={userPrincipal?.toString()}
      />
      
      <DisclaimerModal isLoginPage={false} />
    </div>
  );
};

export default Home;
