import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminContext } from "./admin-context";
import { useApp } from "./useApp";
import { getAdminMe } from "@/services/admin";
import { demoMode } from "@/services/auth";
import { ROLES } from "@/constants/routes";

export default function AdminProvider({ children }) {
  const { state } = useApp();
  const isAdmin = state.role === ROLES.ADMIN;
  const [status, setStatus] = useState({ me: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!isAdmin || demoMode()) {
      setStatus({ me: null, loading: false, error: null });
      return undefined;
    }
    setStatus((s) => ({ ...s, loading: true, error: null }));
    getAdminMe()
      .then((me) => alive && setStatus({ me, loading: false, error: null }))
      .catch((error) => alive && setStatus({ me: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, [isAdmin, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const value = useMemo(
    () => ({
      me: status.me,
      loading: status.loading,
      error: status.error,
      reload,
      isSuperAdmin: status.me?.isSuperAdmin === true,
      hasScope: (key) => status.me?.isSuperAdmin === true || (status.me?.permissions ?? []).includes(key),
    }),
    [status, reload],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
