export interface CreatedByUser {
  nameEn: string;
  nameAr: string | null;
}

export interface CreatedByUserApiResponse {
  nameEn?: string | null;
  nameAr?: string | null;
}

export function toCreatedByUser(
  response: CreatedByUserApiResponse | null | undefined,
): CreatedByUser | null {
  if (!response) {
    return null;
  }

  const nameEn = response.nameEn ?? '';
  const nameAr = response.nameAr ?? null;

  if (nameEn.length === 0 && (!nameAr || nameAr.length === 0)) {
    return null;
  }

  return { nameEn, nameAr };
}
