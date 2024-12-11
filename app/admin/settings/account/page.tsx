"use client";
import React, { useEffect } from 'react';
import FooterAdminNav from '@/components/FooterAdminNav';
import Settings from '@/components/Settings';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from "next/navigation";
import { theme } from '@/app/theme';

const AccountPage: React.FC = () => {
  const router = useRouter();

  // Move the token check to useEffect
  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }

    const storedRoleID = useAuthStore.getState().getStoredRoleID();
    // Redirect based on role
    if (storedRoleID === 1) {
      router.push("/not-found");
    }
  }, [router]);

  const handleLogout = () => {
    // Clear token and redirect to login page
    useAuthStore.getState().setToken(null);
    router.push('/');
  }

  return (
    <div className="flex h-[100dvh] flex-col" style={{ backgroundColor: theme.colors.background }}>
      <div className="flex-1 overflow-y-auto">
        <Settings />
      </div>
      <div className="w-full bg-white px-4 flex justify-center">
        <div className="w-full max-w-md flex justify-center">
          <div className="w-3/4 py-3 pb-20">
            <Button
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <footer className="w-full z-10">
        <FooterAdminNav />
      </footer>
    </div>
  );
};

export default AccountPage;