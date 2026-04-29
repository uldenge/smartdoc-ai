import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "36px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 10h14v2H9zm0 4h10v2H9zm0 4h12v2H9z" fill="white" opacity="0.9"/>
          <circle cx="23" cy="21" r="5" fill="#fbbf24"/>
          <path d="M23 18.5v5m-2.5-2.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
