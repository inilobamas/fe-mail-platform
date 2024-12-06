"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { Email } from "@/types/email";
import FooterNav from "@/components/FooterNav";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";

const InboxPageContent: React.FC = () => {
  const [sentEmails, setSentEmails] = useState(0);
  const [email, setEmailLocal] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sentStatus = searchParams.get('sent');

  const { setEmail } = useAuthStore();

  useEffect(() => {
    let isSubscribed = true;
    const controller = new AbortController();

    if (sentStatus === 'success') {
      toast({
        description: "Send email successful!",
        variant: "default",
      });
      // Remove the query parameter from the URL
      router.replace('/inbox');
    }

    const fetchCountSentEmails = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/sent/by_user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data) {
          setSentEmails(response.data.SentEmails);
          setEmail(response.data.Email);
          setEmailLocal(response.data.Email);
        }
      } catch (err) {
        console.error("Failed to fetch sent emails count:", err);
      }
    };

    const fetchEmails = async () => {
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (isSubscribed) {
          setEmails(response.data);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Failed to fetch emails:", err);
          setError("Failed to load emails");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchCountSentEmails();
    fetchEmails();

    // const interval = setInterval(() => {
    //   console.log("Fetching emails...");
    //   fetchEmails(); // Fetch emails every 5 seconds
    // }, 20000);

    return () => {
      isSubscribed = false;
      controller.abort();
      // clearInterval(interval);
    };
  }, [sentStatus, token, router, setEmail]);

  return (
    <div className="space-y-2">
      <div className="flex-1 overflow-auto pb-20">
        <div className="space-y-0.5">
          <div className="flex justify-between items-center p-2 bg-[#ffeeac]">
            <h1 className="text-xl font-semibold tracking-tight">
              {email}
            </h1>
            <h1 className="text-sm font-semibold tracking-tight">
              Daily Send {sentEmails}/3
            </h1>
          </div>
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center">{error}</div>
          ) : emails.length > 0 ? (
            <div className="divide-y">
              {emails.map((email) => (
                <div
                  key={email.ID}
                  className={`p-4 hover:bg-gray-100 cursor-pointer ${!email.IsRead ? 'bg-[#F2F6FC]' : ''}`}
                  onClick={() => router.push(`/inbox/${email.ID}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{email.SenderName}</h3>
                      <span className="text-sm text-gray-500">
                        {email.RelativeTime}
                      </span>
                    </div>
                    <h4 className="font-medium truncate">{email.Subject}</h4>
                    <p className="text-sm text-gray-500 truncate">{email.Preview}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-4 text-center cursor-pointer text-blue-500 underline"
              onClick={() => window.location.reload()}
            >
              No emails found, Please Refresh your browser.
            </div>
          )}
        </div>
      </div>
      <FooterNav />
      <Toaster />
    </div>
  );
};

const InboxPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboxPageContent />
    </Suspense>
  );
};

export default InboxPage;