import { ImageResponse } from "next/og";

export const alt = "SmartDoc AI — AI 知识库问答系统";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <svg width="80" height="80" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 10h14v2H9zm0 4h10v2H9zm0 4h12v2H9z" fill="white" opacity="0.9"/>
            <circle cx="23" cy="21" r="5" fill="#fbbf24"/>
            <path d="M23 18.5v5m-2.5-2.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            SmartDoc AI
          </span>
        </div>
        <p
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.8)",
            marginTop: 0,
          }}
        >
          上传文档，构建知识库，AI 精准回答
        </p>
      </div>
    ),
    { ...size }
  );
}
