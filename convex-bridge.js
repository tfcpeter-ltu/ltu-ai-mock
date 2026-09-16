import React, { useEffect } from "https://esm.sh/react@19.1.1";
import { createRoot } from "https://esm.sh/react-dom@19.1.1/client?deps=react@19.1.1";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "https://esm.sh/convex@1.28.0/react?deps=react@19.1.1";
import { anyApi } from "https://esm.sh/convex@1.28.0/server";
import { ConvexAuthProvider, useAuthActions } from "https://esm.sh/@convex-dev/auth@0.0.91/react?deps=react@19.1.1,convex@1.28.0";

const CONVEX_URL = "https://dashing-quail-760.convex.cloud";
const client = new ConvexReactClient(CONVEX_URL);
let syncTimer = null;

window.LTUConvexAuth = {
  ready: false,
  authenticated: false,
  loading: true,
  dashboard: null,
  async submitAccount() { throw new Error("雲端帳號服務仍在初始化，請稍後再試。"); },
  async signOut() {},
  syncState() {},
};

function Bridge() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const ensureProfile = useMutation(anyApi.student.ensureProfile);
  const saveCloudState = useMutation(anyApi.student.saveCloudState);
  const cloudState = useQuery(anyApi.student.getCloudState, isAuthenticated ? {} : "skip");
  const dashboard = useQuery(anyApi.student.dashboard, isAuthenticated ? {} : "skip");

  useEffect(() => {
    window.LTUConvexAuth.ready = true;
    window.LTUConvexAuth.loading = isLoading;
    window.LTUConvexAuth.authenticated = isAuthenticated;
    document.documentElement.dataset.convex = isAuthenticated ? "connected" : (isLoading ? "loading" : "ready");
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    ensureProfile({}).catch(console.error);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !dashboard) return;
    window.LTUConvexAuth.dashboard = dashboard;
    if (typeof window.__LTU_APPLY_DASHBOARD === "function") {
      window.__LTU_APPLY_DASHBOARD(dashboard);
    }
  }, [isAuthenticated, dashboard]);

  useEffect(() => {
    if (!isAuthenticated || cloudState === undefined) return;
    if (cloudState?.stateJson && typeof window.__LTU_IMPORT_CLOUD_STATE === "function") {
      try {
        const parsed = JSON.parse(cloudState.stateJson);
        window.__LTU_IMPORT_CLOUD_STATE(parsed, cloudState.updatedAt || 0);
      } catch (e) {
        console.error("Cloud state parse failed", e);
      }
    } else if (!cloudState && typeof window.__LTU_GET_STATE === "function") {
      const current = window.__LTU_GET_STATE();
      if (current) saveCloudState({ stateJson: JSON.stringify(current) }).catch(console.error);
    }
  }, [isAuthenticated, cloudState]);

  window.LTUConvexAuth.submitAccount = async ({ mode, email, password, nickname }) => {
    const flow = mode === "create" ? "signUp" : "signIn";
    const payload = { email, password, flow };
    if (nickname) payload.name = nickname;
    await signIn("password", payload);
    try { await ensureProfile({ displayName: nickname || undefined }); } catch {}
    return true;
  };

  window.LTUConvexAuth.signOut = async () => {
    await signOut();
    window.LTUConvexAuth.authenticated = false;
    localStorage.removeItem("ltuEPTAccount");
    location.reload();
  };

  window.LTUConvexAuth.syncState = (nextState) => {
    if (!isAuthenticated || !nextState) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const copy = structuredClone(nextState);
      copy.sync = { ...(copy.sync || {}), mode: "convex", lastSync: new Date().toISOString() };
      saveCloudState({ stateJson: JSON.stringify(copy) }).catch((e) => console.error("Cloud save failed", e));
    }, 700);
  };

  return null;
}

const root = document.createElement("div");
root.id = "convex-auth-root";
root.style.display = "none";
document.body.appendChild(root);
createRoot(root).render(
  React.createElement(ConvexAuthProvider, { client }, React.createElement(Bridge))
);
