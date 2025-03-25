// import React from 'react';
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";
import toast from "react-hot-toast"; // Using already installed package
import { kycService, KYCSubmission } from "../../../services/kyc"; // Correct relative path


interface KYCRegistrationProps {
  onClose: () => void;
}

type UserType = 'validator' | 'collector' | 'regular';

interface RegistrationForm {
  principalId: string;
  userType: UserType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  nationality: string;
  gender: string;
  occupation: string;
  photo?: File;
  bankDetails?: {
    gcash?: string;
    paymaya?: string;
    bpi?: {
      accountNumber?: string;
      accountName?: string;
    };
  };
}

interface UserTypeOption {
  value: UserType;
  label: string;
}

// Add ValidatorInfo component
const ValidatorInfo = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();

  return (
    <>
    <BasicModal
      open={isOpen}
      width="w-[30rem] sm:w-[25rem]"
      padding="p-5 sm:p-7"
      background="bg-slate-200 dark:bg-gray-800"
      border="border border-BorderColorTwoLight dark:border-BorderColorTwo overflow-y-auto"
    >
      <div className="relative flex flex-col gap-6">
        <CloseIcon
          className={clsx(
            "absolute cursor-pointer top-2 right-2",
            "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor",
            "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
          )}
          onClick={onClose}
        />

        <div className="flex flex-col gap-4 mt-10">
          <h2 className="text-xl font-semibold text-slate-color-success">
            {t("Important Notice: Validator Payment System Trial")}
          </h2>

          <div className="flex flex-col gap-6">
            <section>
              <h3 className="font-medium mb-2">{t("About This System")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("The Validator payment feature you are currently using is in trial mode. While our platform is built on decentralized technology, we recognize that many users in the Philippines and other regions face challenges with stablecoin adoption and cryptocurrency integration.")}
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">{t("Why We're Using Validators")}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {t("This validator-assisted payment system is our interim solution to:")}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                <li>{t("Bridge the gap between traditional financial systems and blockchain technology")}</li>
                <li>{t("Provide accessible payment options for users without direct stablecoin access")}</li>
                <li>{t("Support regions where cryptocurrency infrastructure is still developing")}</li>
                <li>{t("Ensure reliable transaction processing while our fully decentralized solution matures")}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium mb-2">{t("What This Means For You")}</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                <li>{t("Validators are verified third parties who facilitate transactions between fiat currency and tokens")}</li>
                <li>{t("All validators undergo thorough verification and are held to strict performance standards")}</li>
                <li>{t("Your payment information is handled with the highest security standards")}</li>
                <li>{t("Transaction fees are kept minimal and transparent")}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium mb-2">{t("Our Commitment")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("We are committed to building a fully decentralized payment system. This validator approach is temporary as we work toward implementing complete blockchain-based solutions that serve all users regardless of location or technical expertise.")}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {t("We appreciate your participation in this trial phase and welcome your feedback to help us improve the system.")}
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">{t("Questions or Concerns?")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("If you have any questions about the validator payment system or need assistance with a transaction, please contact our support team through the in-app chat or at support@waste2earn.xyz.")}
              </p>
            </section>
          </div>

          <CustomButton
            onClick={onClose}
            className="bg-slate-color-success text-white self-end px-6 py-2 mt-4"
          >
            {t("I Understand")}
          </CustomButton>
        </div>
      </div>
    </BasicModal>
    </>
  );
};

const KYCRegistration = ({ onClose }: KYCRegistrationProps) => {
  const { t } = useTranslation();
  const { userPrincipal } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showValidatorInfo, setShowValidatorInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  
  const [form, setForm] = useState<RegistrationForm>({
    principalId: userPrincipal?.toString() || '',
    userType: 'regular',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Philippines',
      postalCode: ''
    },
    nationality: '',
    gender: '',
    occupation: '',
    bankDetails: undefined  // Initialize as undefined for non-validator users
  });

  // Check if user already has KYC on mount
  useEffect(() => {
    const checkExistingKYC = async () => {
      if (userPrincipal) {
        const hasKYC = await kycService.hasCompletedKYC(userPrincipal.toString());
        if (hasKYC) {
          toast.success(t('You have already completed KYC registration'));
          onClose();
        }
      }
    };
    
    checkExistingKYC();
  }, [userPrincipal, onClose, t]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'userType' && value === 'validator') {
      setShowValidatorInfo(true);
    }
    
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.');
      if (grandchild && parent === 'bankDetails' && child === 'bpi') {
        // Handle BPI account details
        setForm(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            bpi: {
              ...(prev.bankDetails?.bpi || {}),
              [grandchild]: value
            }
          }
        }));
      } else if (parent === 'address') {
        // Handle address fields
        setForm(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      } else if (parent === 'bankDetails') {
        // Handle other bank details (gcash, paymaya)
        setForm(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            [child]: value
          }
        }));
      }
    } else if (field === 'userType') {
      // Handle user type changes
      const userType = value as UserType;
      setForm(prev => ({
        ...prev,
        userType,
        // Reset bank details when switching user types
        bankDetails: userType === 'validator' ? {
          gcash: '',
          paymaya: '',
          bpi: {
            accountName: '',
            accountNumber: ''
          }
        } : undefined
      }));
    } else {
      // Handle top-level fields
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Add validation functions
  const validateForm = (): boolean => {
    // Check required fields
    if (!form.firstName || !form.lastName || !form.email || !form.phone || 
        !form.birthday || !form.address.street || !form.address.city || 
        !form.address.state || !form.address.postalCode || !form.nationality) {
      toast.error(t('Please fill in all required fields'));
      return false;
    }

    // Validate email format
    if (!kycService.validateEmail(form.email)) {
      toast.error(t('Please enter a valid email address'));
      return false;
    }

    // Validate phone format
    if (!kycService.validatePhone(form.phone)) {
      toast.error(t('Please enter a valid phone number (e.g., +639XXXXXXXXX or 09XXXXXXXXX)'));
      return false;
    }

    // Validate date format
    if (!kycService.validateDate(form.birthday)) {
      toast.error(t('Please enter a valid date of birth (not in the future)'));
      return false;
    }

    // Validate bank details for validators
    if (form.userType === 'validator') {
      if (!form.bankDetails?.bpi?.accountName || !form.bankDetails?.bpi?.accountNumber) {
        toast.error(t('Please fill in BPI account details'));
        return false;
      }
    }

    // Validate photo
    if (!photoPreview) {
      toast.error(t('Please upload a profile photo'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true); // Start loading state
      
      // Compress the image if available
      let compressedPhotoUrl = photoPreview;
      if (photoPreview) {
        compressedPhotoUrl = await kycService.compressImage(photoPreview);
      }

      // Prepare submission data
      const kycSubmission: KYCSubmission = {
        userId: form.principalId,
        personalInfo: {
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.birthday,
          nationality: form.nationality,
          phoneNumber: form.phone,
          email: form.email,
          gender: form.gender || '',
          occupation: form.occupation || ''
        },
        address: {
          street: form.address.street,
          city: form.address.city,
          state: form.address.state,
          country: form.address.country,
          postalCode: form.address.postalCode
        },
        profilePhoto: compressedPhotoUrl || '',
        bankDetails: form.userType === 'validator' && form.bankDetails?.bpi?.accountName && form.bankDetails?.bpi?.accountNumber ? {
          gcash: form.bankDetails.gcash || '',
          paymaya: form.bankDetails.paymaya || '',
          bpi: {
            accountName: form.bankDetails.bpi.accountName,
            accountNumber: form.bankDetails.bpi.accountNumber
          }
        } : undefined,
        userType: form.userType
      };

      // Submit KYC data using service
      await kycService.submitKYC(kycSubmission);
      
      toast.success(t('Thank you for registering! Your details have been saved.'));
      onClose();
    } catch (error) {
      console.error('Failed to save KYC details:', error);
      if (error instanceof Error) {
        toast.error(t('Failed to save your details: ') + error.message);
      } else {
        toast.error(t('Failed to save your details. Please try again.'));
      }
    } finally {
      setIsSubmitting(false); // End loading state
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const UserTypeSelector = ({ form, handleInputChange }: { form: any; handleInputChange: (field: string, value: string) => void }) => {
    const { t } = useTranslation();
  
    const userTypeOptions: UserTypeOption[] = [
      { value: 'validator', label: t('Validator') },
      { value: 'collector', label: t('Collector') },
      { value: 'regular', label: t('Regular') },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {userTypeOptions.map((option) => (
          <label
            key={option.value}
            className={clsx(
              "px-4 py-2 rounded-lg border transition-all cursor-pointer",
              form.userType === option.value
                ? "border-slate-color-success bg-slate-color-success/5"
                : "border-BorderColorTwoLight dark:border-BorderColorTwo"
            )}
          >
            <input
              type="radio"
              name="userType"
              value={option.value}
              checked={form.userType === option.value}
              onChange={() => handleInputChange('userType', option.value)}
              className="hidden"
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  };

  return (
    <>
      <BasicModal
        open={true}
        width="w-[30rem] sm:w-[25rem]"
        padding="p-5 sm:p-7"
        background="bg-blue-100 dark:bg-gray-800"
        border="border border-BorderColorTwoLight dark:border-BorderColorTwo overflow-y-auto"
      >
        <div className="relative flex flex-col w-full h-[80vh] sm:h-auto overflow-y-auto gap-4 sm:gap-6">
          <CloseIcon
            className={clsx(
              "absolute cursor-pointer top-0 right-0 p-2",
              "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor",
              "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            )}
            onClick={onClose}
          />

          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold pr-8">{t("KYC Registration")}</h2>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("Account Identity")}
              </h3>
              <p className="text-base sm:text-lg font-mono mt-1 break-all">{form.principalId}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
              {/* User Type Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Register as")}</label>
                <UserTypeSelector form={form} handleInputChange={handleInputChange} />
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("First Name")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Last Name")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              {/* New Fields: Nationality, Gender, Occupation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-200 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-SecondaryTextColorLight dark:text-PrimaryTextColor">{t("Nationality")}</label>
                  <select
                    value={form.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="border border-BorderColorTwoLight dark:border-BorderColorTwo rounded px-2 py-1"
                  >
                    <option className="text-SecondaryTextColorLight dark:text-PrimaryTextColor">{t("Select Nationality")}</option>
                    <option value="Filipino">Filipino</option>
                    <option value="American">American</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Gender")}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={form.gender === 'male'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      />
                      {t("Male")}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={form.gender === 'female'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      />
                      {t("Female")}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Occupation")}</label>
                <CustomInput
                  type="text"
                  value={form.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Email")}</label>
                  <CustomInput
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Phone")}</label>
                  <CustomInput
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+63"
                  />
                </div>
              </div>

              {/* Birthday and Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Birthday")}</label>
                  <CustomInput
                    required
                    type="date"
                    value={form.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Street Address")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("City")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("State/Province")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("Postal Code")}</label>
                  <CustomInput
                    required
                    type="text"
                    value={form.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("Profile Photo")}</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-24 h-24">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setForm(prev => ({ ...prev, photo: undefined }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg flex items-center justify-center hover:border-slate-color-success"
                    >
                      <span className="text-3xl text-gray-400">+</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>

              {/* Bank Details for Validators */}
              {form.userType === 'validator' && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-base sm:text-lg font-medium">{t("Payment Details")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">{t("GCash")}</label>
                      <CustomInput
                        type="text"
                        value={form.bankDetails?.gcash || ''}
                        onChange={(e) => handleInputChange('bankDetails.gcash', e.target.value)}
                        placeholder="+63"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">{t("PayMaya")}</label>
                      <CustomInput
                        type="text"
                        value={form.bankDetails?.paymaya || ''}
                        onChange={(e) => handleInputChange('bankDetails.paymaya', e.target.value)}
                        placeholder="+63"
                      />
                    </div>
                  </div>
                  
                  {/* BPI Account Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">{t("BPI Account Name")}</label>
                      <CustomInput
                        type="text"
                        value={form.bankDetails?.bpi?.accountName}
                        onChange={(e) => handleInputChange('bankDetails.bpi.accountName', e.target.value)}
                        placeholder="Account Name"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">{t("BPI Account Number")}</label>
                      <CustomInput
                        type="number"
                        value={form.bankDetails?.bpi?.accountNumber}
                        onChange={(e) => handleInputChange('bankDetails.bpi.accountNumber', e.target.value)}
                        placeholder="Account Number"
                      />
                    </div>
                  </div>
                </div>
              )}

              <CustomButton
                type="submit"
                disabled={isSubmitting}
                className={clsx(
                  "bg-slate-color-success text-white mt-2 sm:mt-4 w-full sm:w-auto sm:self-end px-6",
                  "hover:bg-slate-color-success/90 transition-colors duration-200",
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? t("Submitting...") : t("Submit")}
              </CustomButton>
            </form>
          </div>
        </div>
      </BasicModal>

      <ValidatorInfo 
        isOpen={showValidatorInfo} 
        onClose={() => setShowValidatorInfo(false)} 
      />
    </>
  );
};

export default KYCRegistration;