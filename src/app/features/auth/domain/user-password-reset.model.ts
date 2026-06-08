export interface ResetUserPasswordRequest {
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetUserPasswordResponse {
  applicationUserId: string;
  passwordChanged: boolean;
  mustChangePasswordOnNextLogin: boolean;
  passwordChangedOnUtc: string;
}

export interface ResetUserPasswordApiResponse {
  applicationUserId?: string | number;
  passwordChanged?: boolean;
  mustChangePasswordOnNextLogin?: boolean;
  passwordChangedOnUtc?: string | null;
}
