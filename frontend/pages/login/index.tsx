// svgs
import LoginLogoIcon from "@assets/background.jpg";
//
import { Fragment, useEffect } from "react";
import AuthMethods from "./components/AuthMethods";
import { DB_LOCATION_AUTH } from "../components/topbar/dbLocationModal";
import { db, DB_Type } from "@database/db";
import { useAppDispatch } from "@redux/Store";
import { setDbLocation } from "@redux/auth/AuthReducer";

const Login = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const lastUserSync = localStorage.getItem(DB_LOCATION_AUTH);
    const toStoreValue = lastUserSync === DB_Type.CANISTER ? DB_Type.CANISTER : DB_Type.LOCAL;
    db().setDbLocation(toStoreValue);
    dispatch(setDbLocation(toStoreValue));
  }, []);

  return (
    <Fragment>
      <div className="flex flex-col sm:flex-col w-full h-full bg-PrimaryColorLight dark:bg-PrimaryColor">
        <div className="relative flex flex-col h-[100%] justify-center items-center bg-SecondaryColorLight dark:bg-SecondaryColor bg-center overflow-hidden">
          <div className="w-full h-full">
            <img
              src={LoginLogoIcon}
              alt="Login Logo"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
        <AuthMethods />
      </div>
    </Fragment>
  );
};

export default Login;
