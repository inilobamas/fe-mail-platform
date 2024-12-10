"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleX, Reply, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import FooterNav from "@/components/FooterNav";
import axios from "axios";
import { saveAs } from 'file-saver';
import LoadingDownloadPage from "@/components/DownloadLoading";
import { theme } from "@/app/theme";
import LoadingPage from "@/components/Loading";

interface EmailDetail {
  ID: number;
  SenderEmail: string;
  SenderName: string;
  Subject: string;
  Body: string;
  BodyEml: string;
  RelativeTime: string;
  ListAttachments: { Filename: string; URL: string }[];
}

const EmailDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  // Move the token check to useEffect
  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }
  }, [router]);

  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false); // State for loading indicator
  const [iframeHeight, setIframeHeight] = useState('0px');

  useEffect(() => {
    const storedToken = useAuthStore.getState().getStoredToken();
    if (!storedToken) {
      router.replace("/");
      return;
    }

    // Fetch email details immediately after token check
    const fetchEmailDetail = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/detail/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch email");
        }

        const data = await response.json();
        setEmail(data);
      } catch (err) {
        console.error("Failed to fetch email:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailDetail();
  }, [params.id, router]);

  // Show loading state while checking auth and fetching data
  if (isLoading) {
    return <LoadingPage />
  }

  // Function to handle file download
  const handleDownload = async (url: string, filename: string) => {
    if (!token) return;

    setIsDownloading(true);
    try {
      const payload = {
        email_id: params.id,
        file_url: url,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email/by_user/download/file`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Important to handle binary data
        }
      );

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      saveAs(blob, filename);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReply = () => {
    if (!email) return;

    // const replyParams = new URLSearchParams({
    //   to: email.SenderEmail,
    //   subject: `Re: ${email.Subject}`,
    // }).toString();

    router.push(`/inbox/send?emailId=${params.id}`);
  };

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;
  // if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!email) return <div className="p-4 text-center">Email not found</div>;

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.target as HTMLIFrameElement;
    if (iframe.contentWindow) {
      // Add padding for better appearance
      const height = iframe.contentWindow.document.body.scrollHeight + 32;
      setIframeHeight(`${height}px`);
  
      // Apply styles to iframe content
      const style = document.createElement('style');
      style.textContent = `
        body {
          margin: 0;
          padding: 16px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: ${theme.colors.textPrimary};
          width: 100%;
          box-sizing: border-box;
          overflow: hidden !important; /* Prevent scroll */
        }
        img, table {
          max-width: 100%;
          height: auto;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow: hidden !important; /* Prevent scroll */
        }
      `;
      iframe.contentWindow.document.head.appendChild(style);
    }
  };

  return (

    <div className="flex h-[100dvh] flex-col " style={{ backgroundColor: theme.colors.background }}>
      {isDownloading && (
        <LoadingDownloadPage />
      )}
      <header className="flex justify-between items-center p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 [&_svg]:size-5 hover:bg-gray-100"
          onClick={() => router.push("/inbox")}
        >
          <CircleX className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 [&_svg]:size-5 hover:bg-gray-100"
          onClick={handleReply}
        >
          <Reply className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          <div className="border space-y-2 text-xs" style={{ borderColor: theme.colors.border, borderRadius: theme.borders.radius, boxShadow: theme.shadows.card }}>
            <div className="grid grid-cols-[50px_1fr] pl-1 pr-4">
              <span className="text-gray-500">From</span>
              <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                {email.SenderName} - {email.SenderEmail}
              </span>
            </div>
            <div className="grid grid-cols-[50px_1fr] pl-1 pr-4">
              <span className="text-gray-500">Subject</span>
              <span className="font-medium" style={{ color: theme.colors.textPrimary }}>{email.Subject}</span>
            </div>
            <div className="pl-1 pr-1">
              <span className="font-medium" style={{ color: theme.colors.textSecondary }}>{email.RelativeTime}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pl-4 pr-4">
          <div className="border bg-white shadow-sm" style={{ borderColor: theme.colors.border, borderRadius: theme.borders.radius, boxShadow: theme.shadows.card }}>
            <iframe
              srcDoc={email.Body}
              className="w-full"
              style={{
                height: iframeHeight,
                border: 'none',
                display: 'block'
              }}
              onLoad={handleIframeLoad}
              title="Email content"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Attachments Section */}
        {email.ListAttachments && email.ListAttachments.length > 0 && (
          <div className="pl-5 pr-5 pt-4">
            {/* <h5 className="font-medium">Attachments:</h5> */}
            <div className="space-y-1">
              {email.ListAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center"
                >
                  <span className="text-sm text-gray-700 pr-4">
                    {attachment.Filename.split('_').pop()}
                  </span>
                  <button
                    onClick={() => handleDownload(attachment.URL, attachment.Filename.split('_').pop()!)}
                    aria-label={`Download ${attachment.Filename.split('_').pop()}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* End of Attachments Section */}
      </main>
      <FooterNav />
    </div>
  );
};

export default EmailDetailPage;