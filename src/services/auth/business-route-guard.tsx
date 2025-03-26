"use client";
import { PropsWithChildren, useEffect } from "react";
import useAuth from "./use-auth";
import { useRouter } from "next/navigation";
import { RoleEnum } from "@/services/api/types/role";
import useGlobalLoading from "../loading/use-global-loading";

function BusinessRouteGuard({ children }: PropsWithChildren<{}>) {
  const { user, isLoaded } = useAuth();
  const router = useRouter();
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }
    setLoading(false);

    // Fix: Modified to handle role ID as string
    const hasBusinessRole =
      user &&
      user.role?.id &&
      (user.role.id === RoleEnum.BUSINESS ||
        user.role.id === String(RoleEnum.BUSINESS));

    if (!hasBusinessRole) {
      router.replace("/sign-in");
    }
  }, [user, isLoaded, router, setLoading]);

  // Fix: Same correction here
  const hasBusinessRole =
    user &&
    user.role?.id &&
    (user.role.id === RoleEnum.BUSINESS ||
      user.role.id === String(RoleEnum.BUSINESS));

  return isLoaded && hasBusinessRole ? <>{children}</> : null;
}

export default BusinessRouteGuard;
