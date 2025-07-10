import React, { useState } from "react";
import { Instagram, Facebook, Linkedin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SocialProfiles {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

interface Post {
  id: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
  type: "image"; // Only allow image posts
}

interface ContactSocialMediaFeedProps {
  socialProfiles: SocialProfiles;
  onConnect?: (platform: string, value: string) => void;
}

const MOCK_POSTS: Record<string, Post[]> = {
  instagram: [
    {
      id: "ig1",
      mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      caption: "Enjoying the mountains!",
      timestamp: "2024-06-01T12:00:00Z",
      type: "image",
    },
    {
      id: "ig2",
      mediaUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
      caption: "Coffee with friends ☕️",
      timestamp: "2024-05-28T09:30:00Z",
      type: "image",
    },
  ],
  facebook: [
    {
      id: "fb1",
      mediaUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
      caption: "Had a great time at the reunion!",
      timestamp: "2024-05-20T18:45:00Z",
      type: "image",
    },
  ],
  linkedin: [
    {
      id: "li1",
      mediaUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
      caption: "Excited to start my new role at Tech Solutions Inc.!",
      timestamp: "2024-05-15T08:00:00Z",
      type: "image",
    },
  ],
};

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: <Instagram className="w-5 h-5 text-pink-500" /> },
  { key: "facebook", label: "Facebook", icon: <Facebook className="w-5 h-5 text-blue-600" /> },
  { key: "linkedin", label: "LinkedIn", icon: <Linkedin className="w-5 h-5 text-blue-700" /> },
];

export default function ContactSocialMediaFeed({ socialProfiles, onConnect }: ContactSocialMediaFeedProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const connected = PLATFORMS.filter(p => socialProfiles[p.key]);
  const notConnected = PLATFORMS.filter(p => !socialProfiles[p.key]);

  if (connected.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        <div className="mb-4">No social media profiles connected.</div>
        <div className="flex flex-col gap-3">
          {notConnected.map(platform => (
            <div key={platform.key} className="flex items-center gap-2">
              {platform.icon}
              <span className="font-medium">{platform.label}</span>
              {connecting === platform.key ? (
                <form
                  className="flex items-center gap-2 ml-2"
                  onSubmit={e => {
                    e.preventDefault();
                    if (onConnect && inputValue.trim()) {
                      onConnect(platform.key, inputValue.trim());
                      setConnecting(null);
                      setInputValue("");
                    }
                  }}
                >
                  <Input
                    className="h-8 text-xs w-40"
                    placeholder={`Enter ${platform.label} username or URL`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-8 px-3">Save</Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setConnecting(null); setInputValue(""); }}>Cancel</Button>
                </form>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-8 px-3"
                  onClick={() => { setConnecting(platform.key); setInputValue(""); }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // (For now, if any are connected, just show a placeholder for their feed)
  return (
    <div className="space-y-6 mt-6">
      {connected.map(platform => (
        <div key={platform.key}>
          <div className="flex items-center gap-2 mb-2">
            {platform.icon}
            <span className="font-semibold text-base">{platform.label}</span>
          </div>
          <div className="text-muted-foreground text-xs mb-4">(Social media feed will appear here.)</div>
        </div>
      ))}
      {notConnected.length > 0 && (
        <div className="mt-4">
          <div className="font-medium mb-2">Connect more social media:</div>
          <div className="flex flex-col gap-3">
            {notConnected.map(platform => (
              <div key={platform.key} className="flex items-center gap-2">
                {platform.icon}
                <span className="font-medium">{platform.label}</span>
                {connecting === platform.key ? (
                  <form
                    className="flex items-center gap-2 ml-2"
                    onSubmit={e => {
                      e.preventDefault();
                      if (onConnect && inputValue.trim()) {
                        onConnect(platform.key, inputValue.trim());
                        setConnecting(null);
                        setInputValue("");
                      }
                    }}
                  >
                    <Input
                      className="h-8 text-xs w-40"
                      placeholder={`Enter ${platform.label} username or URL`}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-8 px-3">Save</Button>
                    <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setConnecting(null); setInputValue(""); }}>Cancel</Button>
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8 px-3"
                    onClick={() => { setConnecting(platform.key); setInputValue(""); }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 