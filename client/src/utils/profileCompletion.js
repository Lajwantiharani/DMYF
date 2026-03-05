const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

export const getDisplayNameForRole = (user) => {
  if (!user) return "";
  if (user.role === "organization") return user.organizationName || "";
  if (user.role === "hospital") return user.hospitalName || "";
  return user.name || "";
};

export const isProfileComplete = (user) => {
  if (!user) return false;

  const requiredFields = [
    getDisplayNameForRole(user),
    user.email,
    user.phone,
    user.city,
    user.address,
    user.bloodGroup,
    user.nukh,
    user.akaah,
  ];

  return requiredFields.every(hasValue);
};

export const isProfileVerificationApproved = (user) =>
  user?.role === "admin" || user?.profileVerificationStatus === "approved";
