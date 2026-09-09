import { UserProfile } from "../app/context/AppContext";

export interface PharmacyFieldStatus {
  key: string;
  label: string;
  isFilled: boolean;
  value: string;
}

export interface PharmacyEligibilityResult {
  isEmailVerified: boolean;
  isCredentialsComplete: boolean;
  isEligible: boolean;
  fields: PharmacyFieldStatus[];
  missingFields: string[];
}

export function evaluatePharmacyEligibility(user: UserProfile | null | undefined): PharmacyEligibilityResult {
  if (!user) {
    return {
      isEmailVerified: false,
      isCredentialsComplete: false,
      isEligible: false,
      fields: [],
      missingFields: ["User not loaded"],
    };
  }

  const fields: PharmacyFieldStatus[] = [
    { key: "name", label: "Store Business Name", isFilled: !!user.name?.trim(), value: user.name || "" },
    { key: "medical_license", label: "Drug License Number", isFilled: !!user.medical_license?.trim(), value: user.medical_license || "" },
    { key: "phone", label: "Store Contact Phone", isFilled: !!user.phone?.trim(), value: user.phone || "" },
    { key: "email", label: "Official Email Address", isFilled: !!user.email?.trim(), value: user.email || "" },
    { key: "address", label: "Physical Store Address", isFilled: !!user.address?.trim(), value: user.address || "" },
    { key: "bankBeneficiaryName", label: "Beneficiary Name", isFilled: !!user.bankBeneficiaryName?.trim(), value: user.bankBeneficiaryName || "" },
    { key: "bankName", label: "Bank Name", isFilled: !!user.bankName?.trim(), value: user.bankName || "" },
    { key: "bankAccountNumber", label: "Bank Account Number", isFilled: !!user.bankAccountNumber?.trim(), value: user.bankAccountNumber || "" },
    { key: "bankIfscCode", label: "Bank IFSC Code", isFilled: !!user.bankIfscCode?.trim() && user.bankIfscCode.trim().length === 11, value: user.bankIfscCode || "" },
    { key: "upiId", label: "Settlement UPI ID", isFilled: !!user.upiId?.trim(), value: user.upiId || "" },
  ];

  const missingFields = fields.filter((f) => !f.isFilled).map((f) => f.label);
  const isEmailVerified = !!user.is_email_verified;
  const isCredentialsComplete = missingFields.length === 0;
  const isEligible = isEmailVerified && isCredentialsComplete;

  return {
    isEmailVerified,
    isCredentialsComplete,
    isEligible,
    fields,
    missingFields,
  };
}
